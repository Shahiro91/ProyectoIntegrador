from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Sum

from .models import JornadaEncomienda, Reserva, SolicitudEncomienda, Viaje

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
    @transaction.atomic
    def asignar_a_jornada(cls, solicitud_id, jornada_id):
        solicitud = SolicitudEncomienda.objects.select_for_update().get(pk=solicitud_id)

        if jornada_id is None:
            solicitud.jornada_encomienda = None
            solicitud.save(update_fields=['jornada_encomienda'])
            return solicitud

        jornada = JornadaEncomienda.objects.select_for_update().get(pk=jornada_id)
        peso_actual = jornada.solicitudes.exclude(pk=solicitud.pk).aggregate(
            total=Sum('peso_kg'),
        )['total'] or Decimal('0.00')

        if peso_actual + solicitud.peso_kg > jornada.capacidad_kg:
            raise ValidationError(
                f'La carga supera la capacidad disponible de {jornada.capacidad_kg} kg.'
            )

        solicitud.jornada_encomienda = jornada
        solicitud.save(update_fields=['jornada_encomienda'])
        return solicitud

    @classmethod
    def solicitar_encomienda(cls, cliente, datos_envio):
        """Valida límites de peso y crea la solicitud de envío"""
        peso = datos_envio.get('peso_kg', 0)
        local = datos_envio.get('local')
        
        if peso > cls.PESO_MAXIMO_KG:
            raise ValidationError(f"El peso excede el límite permitido de {cls.PESO_MAXIMO_KG}kg.")
        
        return SolicitudEncomienda.objects.create(
            cliente=cliente,
            local_nombre=local.nombre if local else '',
            local_direccion=local.direccion if local else '',
            local_telefono=local.telefono if local else '',
            **datos_envio
        )