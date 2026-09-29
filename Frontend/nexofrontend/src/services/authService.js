const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

function apiUrl(path) {
  return `${API_URL}/api${path}`
}

function readCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

async function getCsrfToken() {
  const response = await fetch(apiUrl('/csrf/'), { credentials: 'include' })
  if (!response.ok) throw new Error('No se pudo iniciar una sesión segura.')

  const token = readCookie('csrftoken')
  if (!token) throw new Error('No se recibió el token de seguridad.')
  return token
}

function responseError(data) {
  if (typeof data?.detail === 'string') return data.detail

  const firstMessage = Object.values(data ?? {})
    .flat(Infinity)
    .find((value) => typeof value === 'string')

  return firstMessage ?? 'No se pudo completar la solicitud.'
}

async function request(path, { method = 'GET', body, csrf = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  if (csrf) headers['X-CSRFToken'] = await getCsrfToken()

  const response = await fetch(apiUrl(path), {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) throw new Error(responseError(data))
  return data
}

export function login(email, password) {
  return request('/auth/login/', {
    method: 'POST',
    body: { email, password },
    csrf: true,
  })
}

export function register(data) {
  return request('/auth/register/', {
    method: 'POST',
    body: data,
    csrf: true,
  })
}

export async function getCurrentUser() {
  const response = await request('/auth/me/')
  return response.user
}

export function logout() {
  return request('/auth/logout/', { method: 'POST', csrf: true })
}