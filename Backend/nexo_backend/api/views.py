from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import mixins, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from nexo_backend.Clientes.models import Cliente

from .models import Consulta, Local, Reserva, SolicitudEncomienda, Viaje
from .serializers import (
    ConsultaSerializer,
    LoginSerializer,
    LocalSerializer,
    RegistroClienteSerializer,
    ReservaSerializer,
    SolicitudEncomiendaSerializer,
    ViajeSerializer,
)


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
class LocalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Local.objects.all().order_by('nombre')
    serializer_class = LocalSerializer
    permission_classes = [AllowAny]


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
        return SolicitudEncomienda.objects.filter(
            cliente=self.request.user,
        ).select_related('local')

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)


class ConsultaViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ConsultaSerializer
    queryset = Consulta.objects.all().order_by('-fecha_creacion')

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]
