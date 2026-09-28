from datetime import date, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import Reserva, Viaje


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
