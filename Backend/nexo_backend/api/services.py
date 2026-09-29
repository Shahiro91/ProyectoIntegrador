from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from .models import Reserva, Viaje, SolicitudEncomienda

class ViajeService:
    @staticmethod
    def obtener_asientos_disponibles(viaje_id):
        """Calcula los asientos libres de una combi"""
        viaje = Viaje.objects.get(id=viaje_id)
        asientos_ocupados = viaje.reservas.count()
        return viaje.capacidad_total - asientos_ocupados

    @staticmethod
    @transaction.atomic
    def crear_reserva(cliente, viaje_id, numero_asiento):
        """Valida disponibilidad y realiza la reserva"""
        viaje = Viaje.objects.select_for_update().get(id=viaje_id)
        
        # Validación de rango de asiento
        if numero_asiento < 1 or numero_asiento > viaje.capacidad_total:
            raise ValidationError("El número de asiento no es válido para este vehículo.")
        
        # Validación de asiento libre
        if Reserva.objects.filter(viaje=viaje, numero_asiento=numero_asiento).exists():
            raise ValidationError("El asiento seleccionado ya se encuentra ocupado.")

        try:
            return Reserva.objects.create(
                cliente=cliente,
                viaje=viaje,
                numero_asiento=numero_asiento
            )
        except IntegrityError as error:
            raise ValidationError("El asiento seleccionado ya se encuentra ocupado.") from error


class EncomiendaService:
    PESO_MAXIMO_KG = Decimal('30.00')

    @classmethod
    def solicitar_encomienda(cls, cliente, datos_envio):
        """Valida límites de peso y crea la solicitud de envío"""
        peso = datos_envio.get('peso_kg', 0)
        
        if peso > cls.PESO_MAXIMO_KG:
            raise ValidationError(f"El peso excede el límite permitido de {cls.PESO_MAXIMO_KG}kg.")
        
        return SolicitudEncomienda.objects.create(
            cliente=cliente,
            **datos_envio
        )