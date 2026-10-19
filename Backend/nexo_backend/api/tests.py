from datetime import date, time, timedelta

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from nexo_backend.Clientes.models import Cliente

from .models import Consulta, Local, Reserva, SolicitudEncomienda, Viaje


class ListarViajesTests(TestCase):
	def test_devuelve_viajes_futuros_ordenados_con_asientos_ocupados(self):
		fecha = date.today() + timedelta(days=2)
		viaje_tarde = Viaje.objects.create(
			origen='Reconquista',
			destino='Resistencia',
			fecha_salida=fecha,
			horario_salida=time(16, 0),
			capacidad_total=19,
			precio='8500.00',
		)
		Viaje.objects.create(
			origen='Resistencia',
			destino='Reconquista',
			fecha_salida=fecha,
			horario_salida=time(8, 0),
			capacidad_total=19,
			precio='9000.00',
		)
		Viaje.objects.create(
			origen='Reconquista',
			destino='Resistencia',
			fecha_salida=date.today() - timedelta(days=1),
			horario_salida=time(8, 0),
			capacidad_total=19,
			precio='8500.00',
		)
		cliente = get_user_model().objects.create_user(username='cliente')
		Reserva.objects.create(cliente=cliente, viaje=viaje_tarde, numero_asiento=2)

		response = self.client.get(reverse('viaje-list'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(
			[viaje['horario_salida'] for viaje in response.json()],
			['08:00', '16:00'],
		)
		self.assertEqual(response.json()[1]['id'], viaje_tarde.id)
		self.assertEqual(response.json()[1]['asientos_ocupados'], [2])


class CrearViajeTests(TestCase):
	def test_requiere_un_administrador(self):
		response = self.client.post(reverse('viaje-list'), data='{}', content_type='application/json')

		self.assertEqual(response.status_code, 403)
		self.assertEqual(Viaje.objects.count(), 0)

	def test_administrador_puede_crear_un_viaje_visible_para_clientes(self):
		administrador = get_user_model().objects.create_user(
			username='admin',
			password='password',
			is_staff=True,
		)
		self.client.force_login(administrador)
		fecha = date.today() + timedelta(days=1)

		response = self.client.post(
			reverse('viaje-list'),
			data={
				'origen': 'Avellaneda',
				'destino': 'Reconquista',
				'fecha_salida': fecha.isoformat(),
				'horario_salida': '09:30',
				'capacidad_total': 19,
				'precio': '8500.00',
			},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 201)
		self.assertEqual(Viaje.objects.count(), 1)
		self.assertEqual(self.client.get(reverse('viaje-list')).json()[0]['fecha_salida'], fecha.isoformat())
class CrearReservaTests(TestCase):
	def setUp(self):
		self.cliente = get_user_model().objects.create_user(username='cliente', password='password')
		self.viaje = Viaje.objects.create(
			origen='Avellaneda',
			destino='Reconquista',
			fecha_salida=date.today() + timedelta(days=1),
			horario_salida=time(9, 30),
			capacidad_total=2,
			precio='8500.00',
		)

	def test_reserva_requiere_autenticacion(self):
		response = self.client.post(
			reverse('reserva-list'),
			data={'viaje': self.viaje.id, 'numero_asiento': 1},
		)

		self.assertEqual(response.status_code, 403)
		self.assertEqual(Reserva.objects.count(), 0)

	def test_cliente_puede_reservar_un_asiento_disponible(self):
		self.client.force_login(self.cliente)

		response = self.client.post(
			reverse('reserva-list'),
			data={'viaje': self.viaje.id, 'numero_asiento': 1},
		)

		self.assertEqual(response.status_code, 201)
		self.assertEqual(Reserva.objects.get().cliente, self.cliente)

	def test_no_permite_reservar_asiento_ocupado_ni_fuera_de_capacidad(self):
		self.client.force_login(self.cliente)
		Reserva.objects.create(cliente=self.cliente, viaje=self.viaje, numero_asiento=1)

		asiento_ocupado = self.client.post(
			reverse('reserva-list'),
			data={'viaje': self.viaje.id, 'numero_asiento': 1},
		)
		asiento_fuera_de_rango = self.client.post(
			reverse('reserva-list'),
			data={'viaje': self.viaje.id, 'numero_asiento': 3},
		)

		self.assertEqual(asiento_ocupado.status_code, 400)
		self.assertEqual(asiento_fuera_de_rango.status_code, 400)


class CrearLocalTests(TestCase):
	def setUp(self):
		self.datos = {
			'nombre': 'Local de prueba para crear',
			'direccion': 'Av. 9 de Julio 123, Resistencia',
			'telefono': '+54 362 123-4567',
		}
		self.local = Local.objects.create(
			nombre='Local existente para editar',
			direccion='Calle 1',
		)

	def test_usuario_comun_no_puede_crear_local(self):
		cliente = get_user_model().objects.create_user(username='cliente', password='password')
		self.client.force_login(cliente)
		cantidad_locales = Local.objects.count()

		response = self.client.post(reverse('local-list'), data=self.datos)

		self.assertEqual(response.status_code, 403)
		self.assertEqual(Local.objects.count(), cantidad_locales)

	def test_administrador_puede_crear_local(self):
		administrador = get_user_model().objects.create_user(
			username='admin',
			password='password',
			is_staff=True,
		)
		self.client.force_login(administrador)

		response = self.client.post(reverse('local-list'), data=self.datos)

		self.assertEqual(response.status_code, 201)
		self.assertTrue(Local.objects.filter(nombre=self.datos['nombre']).exists())

	def test_usuario_comun_no_puede_editar_ni_eliminar_local(self):
		cliente = get_user_model().objects.create_user(username='cliente', password='password')
		self.client.force_login(cliente)

		edicion = self.client.patch(reverse('local-detail', args=[self.local.id]), data={'nombre': 'Otro nombre'})
		eliminacion = self.client.delete(reverse('local-detail', args=[self.local.id]))

		self.assertEqual(edicion.status_code, 403)
		self.assertEqual(eliminacion.status_code, 403)
		self.assertTrue(Local.objects.filter(pk=self.local.id).exists())

	def test_administrador_puede_editar_local(self):
		administrador = get_user_model().objects.create_user(
			username='admin',
			password='password',
			is_staff=True,
		)
		self.client.force_login(administrador)

		response = self.client.patch(
			reverse('local-detail', args=[self.local.id]),
			data='{"nombre": "Nombre actualizado"}',
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 200)
		self.local.refresh_from_db()
		self.assertEqual(self.local.nombre, 'Nombre actualizado')

	def test_administrador_puede_eliminar_local_sin_borrar_solicitudes(self):
		cliente = get_user_model().objects.create_user(username='cliente', password='password')
		solicitud = SolicitudEncomienda.objects.create(
			cliente=cliente,
			local=self.local,
			origen='Resistencia',
			destino='Reconquista',
			nombre_destinatario='María Pérez',
			telefono_destinatario='+54 9 362 555-1234',
			peso_kg='2.50',
			tamano='Mediano',
		)
		administrador = get_user_model().objects.create_user(
			username='admin',
			password='password',
			is_staff=True,
		)
		self.client.force_login(administrador)

		response = self.client.delete(reverse('local-detail', args=[self.local.id]))

		self.assertEqual(response.status_code, 204)
		self.assertFalse(Local.objects.filter(pk=self.local.id).exists())
		solicitud.refresh_from_db()
		self.assertIsNone(solicitud.local)


class SolicitudEncomiendaTests(TestCase):
	def setUp(self):
		self.cliente = get_user_model().objects.create_user(username='cliente', password='password')
		self.local = Local.objects.create(
			nombre='La Tiendita',
			direccion='Av. 9 de Julio 123, Resistencia',
			telefono='+54 362 123-4567',
		)
		self.datos = {
			'local': self.local.id,
			'origen': 'Resistencia',
			'destino': 'Reconquista',
			'nombre_destinatario': 'María Pérez',
			'telefono_destinatario': '+54 9 362 555-1234',
			'peso_kg': '2.50',
			'tamano': 'Mediano',
		}

	def test_locales_publicos_incluyen_los_locales_adheridos(self):
		response = self.client.get(reverse('local-list'))

		self.assertEqual(response.status_code, 200)
		self.assertIn('La Tiendita', [local['nombre'] for local in response.json()])

	def test_solicitud_requiere_autenticacion(self):
		response = self.client.post(reverse('encomienda-list'), data=self.datos)

		self.assertEqual(response.status_code, 403)
		self.assertEqual(SolicitudEncomienda.objects.count(), 0)

	def test_cliente_autenticado_puede_crear_solicitud(self):
		self.client.force_login(self.cliente)

		response = self.client.post(reverse('encomienda-list'), data=self.datos)

		self.assertEqual(response.status_code, 201)
		solicitud = SolicitudEncomienda.objects.get()
		self.assertEqual(solicitud.cliente, self.cliente)
		self.assertEqual(solicitud.local, self.local)
		self.assertEqual(solicitud.local_nombre, self.local.nombre)
		self.assertEqual(solicitud.local_direccion, self.local.direccion)
		self.assertEqual(solicitud.local_telefono, self.local.telefono)

		self.local.delete()
		solicitud.refresh_from_db()
		self.assertIsNone(solicitud.local)
		self.assertEqual(solicitud.local_nombre, 'La Tiendita')
		self.assertEqual(solicitud.local_direccion, 'Av. 9 de Julio 123, Resistencia')
		self.assertEqual(solicitud.local_telefono, '+54 362 123-4567')

	def test_rechaza_peso_superior_al_limite(self):
		self.client.force_login(self.cliente)
		self.datos['peso_kg'] = '30.01'

		response = self.client.post(reverse('encomienda-list'), data=self.datos)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(SolicitudEncomienda.objects.count(), 0)


class ConsultaTests(TestCase):
	def test_publico_puede_enviar_consulta_con_celular(self):
		response = self.client.post(
			reverse('consulta-list'),
			data={
				'nombre': 'Ana Pérez',
				'email': 'ana@example.com',
				'celular': '+54 9 362 555-1234',
				'mensaje': 'Quiero consultar por un envío.',
				'estado': Consulta.Estado.RESUELTA,
			},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 201)
		self.assertEqual(Consulta.objects.get().celular, '+54 9 362 555-1234')
		self.assertEqual(Consulta.objects.get().estado, Consulta.Estado.PENDIENTE)

	def test_solo_administrador_puede_cambiar_estado_y_listado_prioriza_pendientes_antiguas(self):
		pendiente_antigua = Consulta.objects.create(
			nombre='Ana',
			celular='123',
			mensaje='Consulta antigua.',
		)
		pendiente_nueva = Consulta.objects.create(
			nombre='Bea',
			celular='456',
			mensaje='Consulta nueva.',
		)
		resuelta = Consulta.objects.create(
			nombre='Ceci',
			celular='789',
			mensaje='Consulta resuelta.',
			estado=Consulta.Estado.RESUELTA,
		)
		ahora = timezone.now()
		Consulta.objects.filter(id=pendiente_antigua.id).update(
			fecha_creacion=ahora - timedelta(days=2),
		)
		Consulta.objects.filter(id=pendiente_nueva.id).update(
			fecha_creacion=ahora - timedelta(days=1),
		)
		Consulta.objects.filter(id=resuelta.id).update(fecha_creacion=ahora - timedelta(days=3))
		cliente = get_user_model().objects.create_user(username='cliente')
		self.client.force_login(cliente)

		response_cliente = self.client.patch(
			reverse('consulta-detail', args=[pendiente_antigua.id]),
			data={'estado': Consulta.Estado.RESUELTA},
			content_type='application/json',
		)

		self.assertEqual(response_cliente.status_code, 403)
		pendiente_antigua.refresh_from_db()
		self.assertEqual(pendiente_antigua.estado, Consulta.Estado.PENDIENTE)

		administrador = get_user_model().objects.create_user(
			username='admin',
			is_staff=True,
		)
		self.client.force_login(administrador)
		response_admin = self.client.get(reverse('consulta-list'))
		self.assertEqual(
			[item['id'] for item in response_admin.json()],
			[pendiente_antigua.id, pendiente_nueva.id, resuelta.id],
		)

		response_cambio = self.client.patch(
			reverse('consulta-detail', args=[pendiente_antigua.id]),
			data={'estado': Consulta.Estado.RESUELTA},
			content_type='application/json',
		)

		self.assertEqual(response_cambio.status_code, 200)
		pendiente_antigua.refresh_from_db()
		self.assertEqual(pendiente_antigua.estado, Consulta.Estado.RESUELTA)
		response_reordenado = self.client.get(reverse('consulta-list'))
		self.assertEqual(
			[item['id'] for item in response_reordenado.json()],
			[pendiente_nueva.id, resuelta.id, pendiente_antigua.id],
		)

	def test_listado_de_consultas_requiere_staff(self):
		consulta = Consulta.objects.create(
			nombre='Ana Pérez',
			celular='+54 9 362 555-1234',
			mensaje='Quiero consultar por un envío.',
		)
		self.client.force_login(get_user_model().objects.create_user(username='cliente'))

		response_cliente = self.client.get(reverse('consulta-list'))
		self.assertEqual(response_cliente.status_code, 403)

		administrador = get_user_model().objects.create_user(
			username='admin',
			is_staff=True,
		)
		self.client.force_login(administrador)
		response_admin = self.client.get(reverse('consulta-list'))

		self.assertEqual(response_admin.status_code, 200)
		self.assertEqual(response_admin.json()[0]['id'], consulta.id)


class AutenticacionClienteTests(TestCase):
	def setUp(self):
		self.datos_registro = {
			'nombre': 'Ana',
			'apellido': 'Pérez',
			'email': 'ana@example.com',
			'password': 'Segura-2026!Cuenta',
			'telefono': '+54 362 555-1234',
			'direccion': 'Resistencia',
			'codigo_postal': '3500',
		}

	def test_registro_crea_usuario_perfil_y_inicia_sesion(self):
		response = self.client.post(
			reverse('auth-register'),
			data=self.datos_registro,
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 201)
		self.assertEqual(response.json()['role'], 'cliente')
		cliente = Cliente.objects.get()
		self.assertEqual(cliente.email, 'ana@example.com')
		self.assertEqual(cliente.apellido, 'Pérez')
		self.assertEqual(cliente.codigo_postal, '3500')
		self.assertEqual(response.json()['name'], 'Ana Pérez')
		usuario = get_user_model().objects.get(username='ana@example.com')
		self.assertTrue(usuario.check_password(self.datos_registro['password']))
		self.assertFalse(usuario.is_staff)
		self.assertEqual(
			self.client.get(reverse('auth-me')).json()['user']['email'],
			'ana@example.com',
		)

	def test_registro_rechaza_email_duplicado_sin_crear_otra_cuenta(self):
		self.client.post(
			reverse('auth-register'),
			data=self.datos_registro,
			content_type='application/json',
		)
		self.client.logout()
		self.datos_registro['email'] = 'ANA@example.com'

		response = self.client.post(
			reverse('auth-register'),
			data=self.datos_registro,
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(get_user_model().objects.filter(username__iexact='ana@example.com').count(), 1)

	def test_registro_exige_apellido_y_codigo_postal(self):
		self.datos_registro.pop('apellido')
		self.datos_registro.pop('codigo_postal')

		response = self.client.post(
			reverse('auth-register'),
			data=self.datos_registro,
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 400)
		self.assertIn('apellido', response.json())
		self.assertIn('codigo_postal', response.json())
		self.assertEqual(get_user_model().objects.count(), 0)

	def test_registro_no_permite_elegir_permisos_administrativos(self):
		self.datos_registro['is_staff'] = True

		response = self.client.post(
			reverse('auth-register'),
			data=self.datos_registro,
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 201)
		self.assertFalse(get_user_model().objects.get(username='ana@example.com').is_staff)

	def test_login_con_email_y_logout(self):
		usuario = get_user_model().objects.create_user(
			username='ana@example.com',
			email='ana@example.com',
			password=self.datos_registro['password'],
		)
		Cliente.objects.create(
			usuario=usuario,
			nombre='Ana',
			apellido='Pérez',
			email='ana@example.com',
			codigo_postal='3500',
		)

		response = self.client.post(
			reverse('auth-login'),
			data={
				'email': 'ana@example.com',
				'password': self.datos_registro['password'],
			},
			content_type='application/json',
		)
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()['role'], 'cliente')

		logout_response = self.client.post(reverse('auth-logout'))
		self.assertEqual(logout_response.status_code, 200)
		self.assertIsNone(self.client.get(reverse('auth-me')).json()['user'])

	def test_login_staff_devuelve_rol_admin(self):
		get_user_model().objects.create_user(
			username='admin@example.com',
			email='admin@example.com',
			password=self.datos_registro['password'],
			is_staff=True,
		)

		response = self.client.post(
			reverse('auth-login'),
			data={
				'email': 'admin@example.com',
				'password': self.datos_registro['password'],
			},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()['role'], 'admin')

	def test_registro_requiere_csrf(self):
		cliente_csrf = Client(enforce_csrf_checks=True)
		url = reverse('auth-register')
		response_sin_token = cliente_csrf.post(
			url,
			data=self.datos_registro,
			content_type='application/json',
		)
		self.assertEqual(response_sin_token.status_code, 403)

		cliente_csrf.get(reverse('csrf-token'))
		csrf_token = cliente_csrf.cookies['csrftoken'].value
		response_con_token = cliente_csrf.post(
			url,
			data=self.datos_registro,
			content_type='application/json',
			HTTP_X_CSRFTOKEN=csrf_token,
			HTTP_ORIGIN='http://127.0.0.1:5173',
		)
		self.assertEqual(response_con_token.status_code, 201)
