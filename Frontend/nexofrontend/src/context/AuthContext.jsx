import { createContext, useContext, useMemo, useState } from 'react'
import {
  clearSession,
  getSession,
  login as loginRequest,
  saveSession,
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function login(email, password) {
    setLoading(true)
    setError(null)

    try {
      const session = await loginRequest(email, password)
      saveSession(session)
      setUser(session)
      return session
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    clearSession()
    setUser(null)
    setError(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isCliente: user?.role === 'cliente',
    }),
    [user, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
