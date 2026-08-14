import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Login.module.css'

function Login() {
  const navigate = useNavigate()
  const { login, loading, error, isAuthenticated, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState(null)

  if (isAuthenticated && user?.role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    try {
      const session = await login(email, password)
      navigate(session.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div className={styles.photoPlaceholder} aria-hidden="true">
          <span className={styles.photoHint}>Espacio para foto</span>
        </div>

        <div className={styles.bannerContent}>
          <p className={styles.brand}>Nexo</p>
          <h1 className={styles.slogan}>Conectamos ciudades. Acercamos lo que necesitás.</h1>
          <p className={styles.tagline}>
            Viajes, encomiendas y pedidos entre Resistencia, Corrientes y más.
          </p>
        </div>
      </section>

      <section className={styles.loginSection}>
        <div className={styles.loginCard}>
          <h2 className={styles.loginTitle}>Iniciar sesión</h2>
          <p className={styles.loginSubtitle}>
            Ingresá con tu cuenta de cliente o administrador.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </label>

            <label className={styles.field}>
              <span>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </label>

            {(formError || error) && (
              <p className={styles.error} role="alert">
                {formError || error}
              </p>
            )}

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Login
