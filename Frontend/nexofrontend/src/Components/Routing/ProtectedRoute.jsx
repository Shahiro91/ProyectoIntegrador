import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <p role="status">Cargando sesión...</p>
  }

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  }

  return children
}
