from decimal import Decimal

from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from nexo_backend.Clientes.models import Cliente

from .models import Consulta, JornadaEncomienda, Local, Reserva, SolicitudEncomienda, Viaje
from .services import EncomiendaService, ViajeService


class RegistroClienteSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=100)
    apellido = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    direccion = serializers.CharField(max_length=200, required=False, allow_blank=True)
    codigo_postal = serializers.CharField(max_length=20)

    def validate_email(self, value):
        email = value.strip().lower()
        user_model = get_user_model()
        if Cliente.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('Ya existe una cuenta con ese email.')
        if user_model.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError('Ya existe una cuenta con ese email.')
        return email

    def validate(self, attrs):
        user_model = get_user_model()
        candidate = user_model(username=attrs['email'], email=attrs['email'])
        try:
            password_validation.validate_password(attrs['password'], user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': error.messages}) from error
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user_model = get_user_model()
        email = validated_data['email']
        user = user_model.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
        )
        return Cliente.objects.create(
            usuario=user,
            nombre=validated_data['nombre'],
            apellido=validated_data['apellido'],
            email=email,
            telefono=validated_data.get('telefono', ''),
            direccion=validated_data.get('direccion', ''),
            codigo_postal=validated_data['codigo_postal'],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return value.strip().lower()


class LocalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Local
        fields = ('id', 'nombre', 'direccion', 'telefono', 'catalogo_pdf')


class ViajeSerializer(serializers.ModelSerializer):
    horario_salida = serializers.TimeField(format='%H:%M')
    asientos_ocupados = serializers.SerializerMethodField()

    class Meta:
        model = Viaje
        fields = (
            'id',
            'origen',
            'destino',
            'fecha_salida',
            'horario_salida',
            'capacidad_total',
            'precio',
            'asientos_ocupados',
        )
        read_only_fields = ('id', 'asientos_ocupados')

    def get_asientos_ocupados(self, viaje):
        return sorted(
            reserva.numero_asiento for reserva in viaje.reservas.all()
        )


class ReservaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reserva
        fields = ('id', 'viaje', 'numero_asiento', 'fecha_reserva')
        read_only_fields = ('id', 'fecha_reserva')

    def validate(self, attrs):
        viaje = attrs['viaje']
        numero_asiento = attrs['numero_asiento']

        if viaje.fecha_salida < timezone.localdate():
            raise serializers.ValidationError({
                'viaje': 'No se puede reservar un viaje que ya pasó.'
            })
        if numero_asiento > viaje.capacidad_total:
            raise serializers.ValidationError({
                'numero_asiento': 'El número de asiento supera la capacidad del viaje.'
            })
        if Reserva.objects.filter(viaje=viaje, numero_asiento=numero_asiento).exists():
            raise serializers.ValidationError({
                'numero_asiento': 'El asiento seleccionado ya está ocupado.'
            })

        return attrs

    def create(self, validated_data):
        try:
            return ViajeService.crear_reserva(
                cliente=validated_data['cliente'],
                viaje_id=validated_data['viaje'].id,
                numero_asiento=validated_data['numero_asiento'],
            )
        except DjangoValidationError as error:
            raise serializers.ValidationError({'detail': error.messages}) from error


class SolicitudEncomiendaSerializer(serializers.ModelSerializer):
    local = serializers.PrimaryKeyRelatedField(queryset=Local.objects.all())
    tamano = serializers.ChoiceField(choices=('Pequeño', 'Mediano', 'Grande'))
    cliente_nombre = serializers.SerializerMethodField()
    local_nombre = serializers.CharField(source='local.nombre', read_only=True)
    jornada_encomienda = serializers.PrimaryKeyRelatedField(read_only=True)
    localidad_destino = serializers.CharField(max_length=100)
    codigo_postal_destino = serializers.CharField(max_length=20)

    class Meta:
        model = SolicitudEncomienda
        fields = (
            'id',
            'local',
            'local_nombre',
            'cliente_nombre',
            'jornada_encomienda',
            'origen',
            'destino',
            'localidad_destino',
            'codigo_postal_destino',
            'nombre_destinatario',
            'telefono_destinatario',
            'peso_kg',
            'tamano',
            'estado',
            'fecha_solicitud',
        )
        read_only_fields = ('id', 'estado', 'fecha_solicitud')

    def create(self, validated_data):
        cliente = validated_data.pop('cliente')
        try:
            return EncomiendaService.solicitar_encomienda(cliente, validated_data)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'peso_kg': error.messages}) from error

    def get_cliente_nombre(self, solicitud):
        return solicitud.cliente.get_full_name() or solicitud.cliente.get_username()


class JornadaEncomiendaSerializer(serializers.ModelSerializer):
    horario = serializers.TimeField(format='%H:%M')
    peso_asignado = serializers.SerializerMethodField()
    solicitudes = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = JornadaEncomienda
        fields = (
            'id',
            'fecha',
            'horario',
            'origen',
            'destino',
            'capacidad_kg',
            'peso_asignado',
            'solicitudes',
        )
        read_only_fields = ('id', 'peso_asignado', 'solicitudes')

    def get_peso_asignado(self, jornada):
        return jornada.solicitudes.aggregate(total=Sum('peso_kg'))['total'] or Decimal('0.00')


class ConsultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = ('id', 'nombre', 'email', 'celular', 'mensaje', 'fecha_creacion')
        read_only_fields = ('id', 'fecha_creacion')