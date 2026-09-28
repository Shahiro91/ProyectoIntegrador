from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from .models import Reserva, Viaje
from .services import ViajeService


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