const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function leerRespuesta(response) {
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Iniciá sesión como administrador en Django Admin y volvé a abrir el planificador.')
    }
    throw new Error(
      result.detail ?? 'No se pudo completar la operación. Iniciá sesión como administrador en Django y volvé a intentar.',
    )
  }
  return result
}

async function obtenerCsrfToken() {
  const response = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' })
  await leerRespuesta(response)
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrftoken='))
    ?.split('=')[1]
}

export async function obtenerJornadasEncomienda() {
  const response = await fetch(`${API_URL}/api/jornadas-encomienda/`, {
    credentials: 'include',
  })
  return leerRespuesta(response)
}

export async function obtenerSolicitudesTurnero() {
  const response = await fetch(`${API_URL}/api/encomiendas/`, {
    credentials: 'include',
  })
  return leerRespuesta(response)
}

export async function guardarJornadaEncomienda(jornadaId, jornada) {
  const csrfToken = await obtenerCsrfToken()
  const response = await fetch(
    jornadaId
      ? `${API_URL}/api/jornadas-encomienda/${jornadaId}/`
      : `${API_URL}/api/jornadas-encomienda/`,
    {
      method: jornadaId ? 'PATCH' : 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken ?? '',
      },
      body: JSON.stringify(jornada),
    },
  )
  return leerRespuesta(response)
}

export async function asignarSolicitudEncomienda(solicitudId, jornadaId) {
  const csrfToken = await obtenerCsrfToken()
  const response = await fetch(`${API_URL}/api/encomiendas/${solicitudId}/asignar/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken ?? '',
    },
    body: JSON.stringify({ jornada_encomienda: jornadaId }),
  })
  return leerRespuesta(response)
}