from decimal import Decimal

from django.conf import settings
from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models

class Local(models.Model):
    nombre = models.CharField(max_length=150)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=50, blank=True)
    catalogo_pdf = models.FileField(
        upload_to='catalogos/',
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])],
    )

    def __str__(self):
        return self.nombre


class Viaje(models.Model):
    origen = models.CharField(max_length=100)
    destino = models.CharField(max_length=100)
    fecha_salida = models.DateField()
    horario_salida = models.TimeField()
    capacidad_total = models.PositiveIntegerField(
        default=19,
        validators=[MinValueValidator(1)],
    )
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )

    def __str__(self):
        return f"{self.origen} -> {self.destino} ({self.fecha_salida})"


class Reserva(models.Model):
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reservas',
    )
    viaje = models.ForeignKey(Viaje, on_delete=models.CASCADE, related_name='reservas')
    numero_asiento = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    fecha_reserva = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['viaje', 'numero_asiento'],
                name='reserva_asiento_unico_por_viaje',
            ),
            models.CheckConstraint(
                condition=models.Q(numero_asiento__gte=1),
                name='reserva_asiento_mayor_a_cero',
            ),
        ]


class SolicitudEncomienda(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_TRANSITO = 'EN_TRANSITO', 'En tránsito'
        ENTREGADO = 'ENTREGADO', 'Entregado'
        CANCELADO = 'CANCELADO', 'Cancelado'

    cliente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    local = models.ForeignKey(Local, on_delete=models.SET_NULL, null=True, blank=True)
    origen = models.CharField(max_length=150)
    destino = models.CharField(max_length=150)
    nombre_destinatario = models.CharField(max_length=150)
    telefono_destinatario = models.CharField(max_length=50)
    peso_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    tamano = models.CharField(max_length=20)
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    fecha_solicitud = models.DateTimeField(auto_now_add=True)