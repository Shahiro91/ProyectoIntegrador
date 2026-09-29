const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

function obtenerTokenCsrf() {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrftoken='))
    ?.split('=')[1]
}

async function asegurarTokenCsrf() {
  if (obtenerTokenCsrf()) return obtenerTokenCsrf()

  const response = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' })
  if (!response.ok) {
    throw new Error('No se pudo preparar el envío de la consulta.')
  }

  return obtenerTokenCsrf()
}

export async function enviarConsulta(datos) {
  const csrfToken = await asegurarTokenCsrf()
  const response = await fetch(`${API_URL}/api/consultas/`, {
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
    const detail = result.detail ?? Object.values(result).flat().join(' ')
    throw new Error(detail || 'No se pudo enviar la consulta.')
  }

  return result
}

export async function obtenerConsultas() {
  const response = await fetch(`${API_URL}/api/consultas/`, {
    credentials: 'include',
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? 'Iniciá sesión como administrador para ver las consultas.'
        : 'No se pudieron cargar las consultas.',
    )
  }

  return result
}