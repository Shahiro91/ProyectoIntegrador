import { obtenerTokenCsrf } from './csrfService'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function obtenerViajes() {
  const response = await fetch(`${API_URL}/api/viajes/`, { credentials: 'include' })

  if (!response.ok) {
    throw new Error('No se pudieron cargar los viajes disponibles.')
  }

  return response.json()
}

export async function obtenerProximosViajes() {
  const response = await fetch(`${API_URL}/api/proximos-viajes/`, { credentials: 'include' })

  if (!response.ok) {
    throw new Error('No se pudieron cargar los próximos viajes.')
  }

  return response.json()
}

export async function crearReserva(viajeId, numeroAsiento) {
  const csrfToken = await obtenerTokenCsrf()

  const response = await fetch(`${API_URL}/api/reservas/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken ?? '',
    },
    body: JSON.stringify({ viaje: viajeId, numero_asiento: numeroAsiento }),
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const detail = result.detail ?? Object.values(result).flat().join(' ')
    throw new Error(detail || `No se pudo reservar el asiento ${numeroAsiento}.`)
  }

  return result
}

export async function guardarViaje(viajeId, viaje) {
  const csrfToken = await obtenerTokenCsrf()

  const response = await fetch(
    viajeId
      ? `${API_URL}/api/viajes/${viajeId}/`
      : `${API_URL}/api/viajes/`,
    {
      method: viajeId ? 'PATCH' : 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken ?? '',
      },
      body: JSON.stringify({
        origen: viaje.origen,
        destino: viaje.destino,
        fecha_salida: viaje.fecha,
        horario_salida: viaje.horario,
        capacidad_total: viaje.capacidad,
        precio: viaje.precio,
      }),
    },
  )

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      result.detail ?? 'No se pudo guardar el viaje. Iniciá sesión en Django Admin y volvé a intentar.',
    )
  }

  return result
}