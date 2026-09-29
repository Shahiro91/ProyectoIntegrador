import { useEffect, useState } from 'react'
import { AuthContext } from './useAuth'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((session) => {
        if (active) setUser(session)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function login(email, password) {
    setLoading(true)
    setError(null)

    try {
      const session = await loginRequest(email, password)
      setUser(session)
      return session
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function register(data) {
    setLoading(true)
    setError(null)

    try {
      const session = await registerRequest(data)
      setUser(session)
      return session
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    setLoading(true)
    setError(null)

    try {
      await logoutRequest()
    } catch (err) {
      setError(err.message)
    } finally {
      setUser(null)
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isCliente: user?.role === 'cliente',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
