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

async function obtenerTokenCsrfSeguro() {
  if (!obtenerTokenCsrf()) {
    const response = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' })
    if (!response.ok) throw new Error('No se pudo iniciar una sesión segura.')
  }

  const csrfToken = obtenerTokenCsrf()
  if (!csrfToken) throw new Error('No se recibió el token de seguridad.')
  return csrfToken
}

function mensajeError(response, fallback) {
  return response?.detail
    ?? Object.values(response ?? {}).flat(Infinity).find((value) => typeof value === 'string')
    ?? fallback
}

async function guardarLocal(id, datos) {
  const csrfToken = await obtenerTokenCsrfSeguro()
  const formData = new FormData()
  formData.append('nombre', datos.nombre)
  formData.append('direccion', datos.direccion)
  formData.append('telefono', datos.telefono)
  if (datos.catalogo_pdf) formData.append('catalogo_pdf', datos.catalogo_pdf)

  const url = id ? `${API_URL}/api/locales/${id}/` : `${API_URL}/api/locales/`
  const response = await fetch(url, {
    method: id ? 'PATCH' : 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: formData,
  })
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(mensajeError(result, 'No se pudo guardar el local.'))
  }

  return result
}

export function crearLocal(datos) {
  return guardarLocal(null, datos)
}

export function actualizarLocal(id, datos) {
  return guardarLocal(id, datos)
}

export async function eliminarLocal(id) {
  const csrfToken = await obtenerTokenCsrfSeguro()
  const response = await fetch(`${API_URL}/api/locales/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrfToken },
  })
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(mensajeError(result, 'No se pudo eliminar el local.'))
  }
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
