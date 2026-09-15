import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './Components/Routing/ProtectedRoute'
import Layout from './Components/Layout/Layout'
import Login from './Components/Login/Login'
import Home from './Components/Home/Home'
import TransportPassengers from './Components/Transport/TransportPassengers'
import ComerciosAdheridos from './Components/Comercios/ComerciosAdheridos'
import Viajes from './pages/Admin/Viajes'
import Calendario from './pages/Admin/Calendario'
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
                <Viajes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/calendario"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Calendario />
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
