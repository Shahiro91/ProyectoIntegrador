from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import mixins, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from nexo_backend.Clientes.models import Cliente

from .models import Consulta, JornadaEncomienda, Local, Reserva, SolicitudEncomienda, Viaje
from .serializers import (
    ConsultaSerializer,
    JornadaEncomiendaSerializer,
    LoginSerializer,
    LocalSerializer,
    RegistroClienteSerializer,
    ReservaSerializer,
    SolicitudEncomiendaSerializer,
    ViajeSerializer,
)
from .services import EncomiendaService


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(request):
    return Response({'detail': 'Token CSRF listo.'})


def usuario_response(user):
    try:
        perfil = user.perfil_cliente
    except Cliente.DoesNotExist:
        perfil = None

    return {
        'email': perfil.email if perfil else (user.email or user.username),
        'name': (
            f'{perfil.nombre} {perfil.apellido}'.strip()
            if perfil
            else (user.get_full_name() or user.username)
        ),
        'role': 'admin' if user.is_staff else 'cliente',
        'direccion': perfil.direccion if perfil else '',
        'codigo_postal': perfil.codigo_postal if perfil else '',
    }


@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
@csrf_protect
def registrar_cliente(request):
    serializer = RegistroClienteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    cliente = serializer.save()
    auth_login(request, cliente.usuario)
    return Response(usuario_response(cliente.usuario), status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
@csrf_protect
def iniciar_sesion(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(
        request,
        username=serializer.validated_data['email'],
        password=serializer.validated_data['password'],
    )
    if user is None:
        raise AuthenticationFailed('Email o contraseña incorrectos.')

    auth_login(request, user)
    return Response(usuario_response(user))


@api_view(['GET'])
@permission_classes([AllowAny])
def usuario_actual(request):
    if not request.user.is_authenticated:
        return Response({'user': None})
    return Response({'user': usuario_response(request.user)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cerrar_sesion(request):
    auth_logout(request)
    return Response({'detail': 'Sesión cerrada.'})


@method_decorator(ensure_csrf_cookie, name='dispatch')
class LocalViewSet(viewsets.ModelViewSet):
    queryset = Local.objects.all().order_by('nombre')
    serializer_class = LocalSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminUser()]


@method_decorator(ensure_csrf_cookie, name='dispatch')
class ViajeViewSet(viewsets.ModelViewSet):
    serializer_class = ViajeSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        return Viaje.objects.filter(
            fecha_salida__gte=timezone.localdate(),
        ).prefetch_related('reservas').order_by('fecha_salida', 'horario_salida')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminUser()]


@method_decorator(ensure_csrf_cookie, name='dispatch')
class ReservaViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reserva.objects.filter(cliente=self.request.user).select_related('viaje')

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class SolicitudEncomiendaViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = SolicitudEncomiendaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        solicitudes = SolicitudEncomienda.objects.select_related(
            'local', 'cliente', 'jornada_encomienda',
        ).order_by('-fecha_solicitud')
        if self.request.user.is_staff:
            return solicitudes
        return solicitudes.filter(cliente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)

    def get_permissions(self):
        if self.action == 'asignar':
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['patch'], url_path='asignar')
    def asignar(self, request, pk=None):
        jornada_id = request.data.get('jornada_encomienda')
        if jornada_id == '':
            return Response(
                {'jornada_encomienda': ['El identificador de jornada no es válido.']},
                status=400,
            )
        if jornada_id is not None:
            get_object_or_404(JornadaEncomienda, pk=jornada_id)

        try:
            solicitud = EncomiendaService.asignar_a_jornada(pk, jornada_id)
        except DjangoValidationError as error:
            return Response({'detail': error.messages}, status=400)

        return Response(self.get_serializer(solicitud).data)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class JornadaEncomiendaViewSet(viewsets.ModelViewSet):
    queryset = JornadaEncomienda.objects.prefetch_related('solicitudes').all()
    serializer_class = JornadaEncomiendaSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']


@api_view(['GET'])
@permission_classes([AllowAny])
def proximos_viajes(request):
    """Viajes de pasajeros y jornadas de encomienda futuras, sin datos de clientes."""
    hoy = timezone.localdate()
    viajes = [
        {
            'tipo': 'pasajeros',
            'fecha': viaje.fecha_salida,
            'horario': viaje.horario_salida.strftime('%H:%M'),
            'origen': viaje.origen,
            'destino': viaje.destino,
        }
        for viaje in Viaje.objects.filter(fecha_salida__gte=hoy)
    ]
    viajes += [
        {
            'tipo': 'encomiendas',
            'fecha': jornada.fecha,
            'horario': jornada.horario.strftime('%H:%M'),
            'origen': jornada.origen,
            'destino': jornada.destino,
        }
        for jornada in JornadaEncomienda.objects.filter(fecha__gte=hoy)
    ]
    viajes.sort(key=lambda item: (item['fecha'], item['horario']))
    return Response(viajes[:6])


class ConsultaViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ConsultaSerializer
    queryset = Consulta.objects.all().order_by('estado', 'fecha_creacion', 'id')
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]
