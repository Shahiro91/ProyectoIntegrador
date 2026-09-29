from django.contrib import admin

from .models import Consulta, Local, Reserva, SolicitudEncomienda, Viaje


@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
	list_display = ('nombre', 'celular', 'email', 'fecha_creacion')
	list_filter = ('fecha_creacion',)
	search_fields = ('nombre', 'celular', 'email', 'mensaje')
	readonly_fields = ('nombre', 'email', 'celular', 'mensaje', 'fecha_creacion')


@admin.register(Local)
class LocalAdmin(admin.ModelAdmin):
	list_display = ('nombre', 'direccion', 'telefono', 'catalogo_pdf')
	search_fields = ('nombre', 'direccion')


@admin.register(Viaje)
class ViajeAdmin(admin.ModelAdmin):
	list_display = ('origen', 'destino', 'fecha_salida', 'horario_salida', 'precio', 'capacidad_total')
	list_filter = ('fecha_salida', 'origen', 'destino')
	search_fields = ('origen', 'destino')


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
	list_display = ('cliente', 'viaje', 'numero_asiento', 'fecha_reserva')
	list_filter = ('viaje', 'fecha_reserva')
	search_fields = ('cliente__username', 'cliente__email', 'viaje__origen', 'viaje__destino')
	list_select_related = ('cliente', 'viaje')


@admin.register(SolicitudEncomienda)
class SolicitudEncomiendaAdmin(admin.ModelAdmin):
	list_display = ('cliente', 'origen', 'destino', 'estado', 'peso_kg', 'fecha_solicitud')
	list_filter = ('estado', 'fecha_solicitud', 'origen', 'destino')
	search_fields = ('cliente__username', 'cliente__email', 'nombre_destinatario', 'destino')
	list_select_related = ('cliente', 'local')
