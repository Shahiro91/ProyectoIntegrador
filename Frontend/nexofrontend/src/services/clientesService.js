const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function obtenerClientes() {
  const response = await fetch(`${API_URL}/api/clientes/`, { credentials: 'include' })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? 'Iniciá sesión como administrador para ver los clientes.'
        : 'No se pudieron cargar los clientes.',
    )
  }

  return result
}
