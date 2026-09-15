import { useLocation, useNavigate } from 'react-router-dom'
import styles from './Home.module.css'

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

const comercioAdheridos = [
  {
    name: 'La Tiendita',
    address: 'Av. 9 de Julio 123, Resistencia',
    phone: '+54 362 123-4567',
  },
  {
    name: 'Delicias Corrientes',
    address: 'Sarmiento 455, Corrientes',
    phone: '+54 379 987-6543',
  },
  {
    name: 'Mercado Reconquista',
    address: 'Rivadavia 78, Reconquista',
    phone: '+54 348 321-0098',
  },
]

function Home() {
  const navigate = useNavigate()
  const location = useLocation()

  const isContactOnlyView = location.hash === '#contacto'

  if (isContactOnlyView) {
    return (
      <div className={styles.contactOnlyPage}>
        <section id="contacto" className={styles.contactSection}>
          <form className={styles.contactForm}>
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Nombre</span>
                <input type="text" name="nombre" placeholder="Tu nombre" />
              </label>

              <label className={styles.field}>
                <span>Email</span>
                <input type="email" name="email" placeholder="tuemail@ejemplo.com" />
              </label>
            </div>

            <label className={styles.field}>
              <span>Celular</span>
              <input type="tel" name="celular" placeholder="Ej: +54 9 362 123-4567" />
            </label>

            <label className={styles.field}>
              <span>Consulta</span>
              <textarea
                name="mensaje"
                rows="6"
                placeholder="Contanos qué necesitás y te asesoramos."
              />
            </label>

            <button type="submit" className={styles.submitButton}>
              Enviar consulta
            </button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.home}>
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
