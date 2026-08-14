import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  }

  return children
}
