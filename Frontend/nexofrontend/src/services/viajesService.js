const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function obtenerViajes() {
  const response = await fetch(`${API_URL}/api/viajes/`, { credentials: 'include' })

  if (!response.ok) {
    throw new Error('No se pudieron cargar los viajes disponibles.')
  }

  return response.json()
}

function obtenerTokenCsrf() {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrftoken='))
    ?.split('=')[1]
}

export async function guardarViaje(viajeId, viaje) {
  let csrfToken = obtenerTokenCsrf()
  if (!csrfToken) {
    await obtenerViajes()
    csrfToken = obtenerTokenCsrf()
  }

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