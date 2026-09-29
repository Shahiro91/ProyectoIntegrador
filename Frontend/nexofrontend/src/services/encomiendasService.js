const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function obtenerLocales() {
  const response = await fetch(`${API_URL}/api/locales/`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('No se pudieron cargar los locales adheridos.')
  }

  return response.json()
}

function obtenerTokenCsrf() {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrftoken='))
    ?.split('=')[1]
}

export async function crearSolicitudEncomienda(datos) {
  let csrfToken = obtenerTokenCsrf()
  if (!csrfToken) {
    await obtenerLocales()
    csrfToken = obtenerTokenCsrf()
  }

  const response = await fetch(`${API_URL}/api/encomiendas/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken ?? '',
    },
    body: JSON.stringify(datos),
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Tu sesión no está validada por el servidor. Iniciá sesión en Django y volvé a enviar la solicitud.')
    }

    const detail = result.detail ?? Object.values(result).flat().join(' ')
    throw new Error(detail || 'No se pudo enviar la solicitud de encomienda.')
  }

  return result
}