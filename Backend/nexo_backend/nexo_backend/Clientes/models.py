from django.conf import settings
from django.db import models

# Create your models here.
class Cliente(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil_cliente',
    )
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100, default='')
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.CharField(max_length=200, blank=True)
    codigo_postal = models.CharField(max_length=20, default='')

    def __str__(self):
        return f'{self.nombre} {self.apellido}'.strip()