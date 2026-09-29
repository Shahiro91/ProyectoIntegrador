import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Home.module.css'
import SolicitudEncomienda from '../Encomiendas/SolicitudEncomienda'
import { enviarConsulta } from '../../services/consultasService'

const cities = ['Resistencia', 'Corrientes', 'Reconquista', 'Formosa', 'Asunción']

const steps = [
  {
    number: 1,
    title: 'Elegís',
    description: 'Mandás producto o link',
  },
  {
    number: 2,
    title: 'Coordinamos',
    description: 'Confirmamos pago y tiempos',
  },
  {
    number: 3,
    title: 'Entregamos',
    description: 'Viaja y lo recibís en tu ciudad',
  },
]

const consultaInicial = {
  nombre: '',
  email: '',
  celular: '',
  mensaje: '',
}

function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [consulta, setConsulta] = useState(consultaInicial)
  const [enviandoConsulta, setEnviandoConsulta] = useState(false)
  const [errorConsulta, setErrorConsulta] = useState('')
  const [consultaEnviada, setConsultaEnviada] = useState(false)

  const isContactOnlyView = location.hash === '#contacto'

  function actualizarConsulta(event) {
    const { name, value } = event.target
    setConsulta((current) => ({ ...current, [name]: value }))
    setErrorConsulta('')
    setConsultaEnviada(false)
  }

  async function enviarFormularioContacto(event) {
    event.preventDefault()
    setEnviandoConsulta(true)
    setErrorConsulta('')

    try {
      await enviarConsulta(consulta)
      setConsulta(consultaInicial)
      setConsultaEnviada(true)
    } catch (error) {
      setErrorConsulta(error.message)
    } finally {
      setEnviandoConsulta(false)
    }
  }

  if (location.hash === '#pedido') {
    return (
      <div className={styles.contactOnlyPage}>
        <SolicitudEncomienda />
      </div>
    )
  }

  if (isContactOnlyView) {
    return (
      <div className={styles.contactOnlyPage}>
        <section id="contacto" className={styles.contactSection}>
          <header className={styles.formHeader}>
            <p className={styles.formEyebrow}>CONTACTO</p>
            <h1 className={styles.formTitle}>Dejanos tu consulta</h1>
            <p className={styles.formDescription}>Nos comunicaremos con vos por teléfono.</p>
          </header>
          <form className={styles.contactForm} onSubmit={enviarFormularioContacto}>
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Nombre</span>
                <input type="text" name="nombre" value={consulta.nombre} onChange={actualizarConsulta} placeholder="Tu nombre" required />
              </label>

              <label className={styles.field}>
                <span>Email (opcional)</span>
                <input type="email" name="email" value={consulta.email} onChange={actualizarConsulta} placeholder="tuemail@ejemplo.com" />
              </label>
            </div>

            <label className={styles.field}>
              <span>Celular para contactarte</span>
              <input type="tel" name="celular" value={consulta.celular} onChange={actualizarConsulta} placeholder="Ej: +54 9 362 123-4567" required />
            </label>

            <label className={styles.field}>
              <span>Consulta</span>
              <textarea
                name="mensaje"
                rows="6"
                value={consulta.mensaje}
                onChange={actualizarConsulta}
                placeholder="Contanos qué necesitás y te asesoramos."
                required
              />
            </label>

            {errorConsulta && <p className={styles.formError} role="alert">{errorConsulta}</p>}
            {consultaEnviada && (
              <p className={styles.formSuccess} role="status">
                Recibimos tu consulta. Nos pondremos en contacto con vos por teléfono.
              </p>
            )}

            <button type="submit" className={styles.submitButton} disabled={enviandoConsulta}>
              {enviandoConsulta ? 'Enviando...' : 'Enviar consulta'}
            </button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.home}>
      {!isAuthenticated && (
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>Comprás en otra ciudad, te lo llevamos.</h2>
          <p className={styles.heroSubtitle}>
            Qué hacemos, a dónde viajamos, cómo funciona y cómo pedir, todo en una sola vista.
          </p>
          <button
            type="button"
            className={styles.heroButton}
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>
        </section>
      )}

      <div className={styles.infoGrid}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Ciudades disponibles</h3>
          <p className={styles.cardText}>{cities.join(' · ')}</p>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Próximos viajes</h3>
          <p className={styles.cardText}>Viernes: Reconquista · Domingo: Corrientes</p>
          <span className={styles.badge}>Recepción hasta jueves 20:00</span>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Servicios</h3>
          <p className={styles.cardText}>
            Encomiendas, compras por encargo, retiros y larga distancia.
          </p>
        </article>
      </div>

      <section className={styles.howItWorks}>
        <div className={styles.howItWorksHeader}>
          <h3 className={styles.howItWorksTitle}>Cómo funciona</h3>
          <p className={styles.howItWorksSubtitle}>
            Un proceso simple para que pidas sin dudas.
          </p>
        </div>

        <div className={styles.steps}>
          {steps.map((step) => (
            <div key={step.number} className={styles.step}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div>
                <p className={styles.stepTitle}>{step.title}</p>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

export default Home
