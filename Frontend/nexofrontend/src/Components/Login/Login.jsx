import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import styles from './Login.module.css'

function Login() {
  const navigate = useNavigate()
  const { login, register, loading, error, isAuthenticated, user } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [formError, setFormError] = useState(null)

  if (isAuthenticated && user?.role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    try {
      const session = mode === 'register'
        ? await register({
            nombre: name,
            apellido: surname,
            email,
            password,
            telefono: phone,
            direccion: address,
            codigo_postal: postalCode,
          })
        : await login(email, password)
      navigate(session.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
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
          <h2 className={styles.loginTitle}>
            {mode === 'register' ? 'Crear cuenta de cliente' : 'Iniciar sesión'}
          </h2>
          <p className={styles.loginSubtitle}>
            {mode === 'register'
              ? 'Registrate para reservar viajes y solicitar encomiendas.'
              : 'Ingresá con tu cuenta de cliente o administrador.'}
          </p>

          <div className={styles.modeSwitch} role="group" aria-label="Acceso">
            <button
              type="button"
              className={`${styles.modeButton} ${mode === 'login' ? styles.modeActive : ''}`}
              aria-pressed={mode === 'login'}
              onClick={() => {
                setMode('login')
                setFormError(null)
              }}
            >
              Ingresar
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${mode === 'register' ? styles.modeActive : ''}`}
              aria-pressed={mode === 'register'}
              onClick={() => {
                setMode('register')
                setFormError(null)
              }}
            >
              Crear cuenta
            </button>
          </div>

          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </button>

          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label className={styles.field}>
                  <span>Nombre</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                </label>

                <label className={styles.field}>
                  <span>Apellido</span>
                  <input
                    type="text"
                    value={surname}
                    onChange={(event) => setSurname(event.target.value)}
                    required
                    maxLength={100}
                    autoComplete="family-name"
                  />
                </label>

                <label className={styles.field}>
                  <span>Teléfono</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    maxLength={20}
                    autoComplete="tel"
                  />
                </label>

                <label className={styles.field}>
                  <span>Código postal</span>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                    required
                    maxLength={20}
                    autoComplete="postal-code"
                  />
                </label>

                <label className={styles.field}>
                  <span>Dirección</span>
                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    maxLength={200}
                    autoComplete="street-address"
                  />
                </label>
              </>
            )}

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
                minLength={8}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </label>

            {(formError || error) && (
              <p className={styles.error} role="alert">
                {formError || error}
              </p>
            )}

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading
                ? 'Procesando...'
                : mode === 'register'
                  ? 'Crear cuenta'
                  : 'Ingresar'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Login
