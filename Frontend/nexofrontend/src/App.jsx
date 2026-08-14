import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './Components/Routing/ProtectedRoute'
import Layout from './Components/Layout/Layout'
import Login from './Components/Login/Login'
import Home from './Components/Home/Home'
import TransportPassengers from './Components/Transport/TransportPassengers'
import ComerciosAdheridos from './Components/Comercios/ComerciosAdheridos'
import AdminDashboard from './Components/Admin/AdminDashboard'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />

          <Route
            path="/passengers"
            element={
              <Layout>
                <TransportPassengers />
              </Layout>
            }
          />

          <Route
            path="/comercios"
            element={
              <Layout>
                <ComerciosAdheridos />
              </Layout>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
