const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const MOCK_USERS = [
  {
    email: 'cliente@nexo.com',
    password: 'cliente123',
    role: 'cliente',
    name: 'Cliente Demo',
  },
  {
    email: 'admin@nexo.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin Demo',
  },
]

const VALID_ROLES = ['cliente', 'admin']

function findMockUser(email, password) {
  return MOCK_USERS.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() && user.password === password,
  )
}

function isValidUser(user) {
  return Boolean(user?.email && user?.role && VALID_ROLES.includes(user.role))
}

async function loginWithApi(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail ?? 'Credenciales incorrectas')
  }

  const user = await response.json()

  if (!isValidUser(user)) {
    throw new Error('Respuesta de login inválida')
  }

  return user
}

export async function login(email, password) {
  const mockUser = findMockUser(email, password)

  if (mockUser) {
    return {
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
    }
  }

  try {
    return await loginWithApi(email, password)
  } catch (error) {
    throw new Error(error.message || 'Email o contraseña incorrectos')
  }
}

export function saveSession(user) {
  localStorage.setItem('nexo_user', JSON.stringify(user))
}

export function getSession() {
  const raw = localStorage.getItem('nexo_user')
  if (!raw) return null

  try {
    const user = JSON.parse(raw)

    if (!isValidUser(user)) {
      clearSession()
      return null
    }

    return user
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('nexo_user')
}
