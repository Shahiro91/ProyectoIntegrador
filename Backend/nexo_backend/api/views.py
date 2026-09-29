from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import mixins, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import Consulta, Local, Reserva, SolicitudEncomienda, Viaje
from .serializers import (
    ConsultaSerializer,
    LocalSerializer,
    ReservaSerializer,
    SolicitudEncomiendaSerializer,
    ViajeSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(request):
    return Response({'detail': 'Token CSRF listo.'})


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
