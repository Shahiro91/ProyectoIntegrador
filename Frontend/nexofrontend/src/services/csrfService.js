const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function obtenerTokenCsrf() {
  const response = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' })
  if (!response.ok) throw new Error('No se pudo iniciar una sesión segura.')

  const data = await response.json()
  if (typeof data.csrfToken !== 'string' || !data.csrfToken) {
    throw new Error('No se recibió el token de seguridad.')
  }

  return data.csrfToken
}
