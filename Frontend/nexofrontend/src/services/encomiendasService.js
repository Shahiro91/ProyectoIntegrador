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

function enviarLocal(url, method, datos) {
  const body = new FormData()
  body.append('nombre', datos.nombre)
  body.append('direccion', datos.direccion)
  body.append('telefono', datos.telefono)
  if (datos.catalogo_pdf) body.append('catalogo_pdf', datos.catalogo_pdf)

  return fetchConCsrf(url, { method, body })
}

async function fetchConCsrf(url, opciones) {
  let csrfToken = obtenerTokenCsrf()
  if (!csrfToken) {
    await obtenerLocales()
    csrfToken = obtenerTokenCsrf()
  }

  const response = await fetch(url, {
    ...opciones,
    credentials: 'include',
    headers: { 'X-CSRFToken': csrfToken ?? '' },
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const detail = result.detail ?? Object.values(result).flat().join(' ')
    throw new Error(detail || 'No se pudo completar la operación con el local.')
  }

  return result
}

export function crearLocal(datos) {
  return enviarLocal(`${API_URL}/api/locales/`, 'POST', datos)
}

export function actualizarLocal(id, datos) {
  return enviarLocal(`${API_URL}/api/locales/${id}/`, 'PATCH', datos)
}

export async function eliminarLocal(id) {
  await fetchConCsrf(`${API_URL}/api/locales/${id}/`, { method: 'DELETE' })
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