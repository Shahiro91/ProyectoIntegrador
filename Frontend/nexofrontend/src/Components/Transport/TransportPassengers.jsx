import { useNavigate } from 'react-router-dom'
import styles from './TransportPassengers.module.css'

function TransportPassengers() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.label}>Transporte de pasajeros</span>
          <h1 className={styles.title}>Viajamos con vos cuando más lo necesitás.</h1>
          <p className={styles.subtitle}>
            Traslados programados para consultas médicas, estudios y tratamientos en Reconquista.
            Servicio pensado para adultos mayores, personas con movilidad reducida y pacientes que necesitan viajar con comodidad y asistencia.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate('/login')}
            >
              Solicitar traslado
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TransportPassengers
