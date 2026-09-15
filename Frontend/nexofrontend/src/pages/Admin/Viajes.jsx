import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Admin/Sidebar'
import styles from './Viajes.module.css'

const upcomingTrips = [
  {
    date: 'Lunes 14 de Septiembre',
    route: 'Reconquista a Resistencia',
    time: '08:00',
    passengers: '12 pasajeros',
    seats: '7 Lugares disponibles',
  },
  {
    date: 'Lunes 14 de Septiembre',
    route: 'Resistencia a Reconquista',
    time: '16:00',
    passengers: '12 pasajeros',
    seats: '7 Lugares disponibles',
  },
  {
    date: 'Miércoles 16 de Septiembre',
    route: 'Reconquista a Resistencia',
    time: '08:00',
    passengers: '12 pasajeros',
    seats: '7 Lugares disponibles',
  },
]

function Viajes() {
  const { user } = useAuth()

  return (
    <div className={styles.page}>
      <Sidebar />

      <main className={styles.content}>
        <header className={styles.welcome}>
          <div>
            <p className={styles.eyebrow}>ADMIN</p>
            <h1>Bienvenido{user?.name ? `, ${user.name}` : ''}</h1>
          </div>
        </header>

        <section className={styles.stats} aria-label="Resumen del día">
          <article className={styles.statCard}>
            <h2>Viajes hoy</h2>
            <strong>4</strong>
          </article>
          <article className={styles.statCard}>
            <h2>Pasajeros totales</h2>
            <strong>32</strong>
          </article>
          <article className={styles.statCard}>
            <h2>Encomiendas</h2>
            <strong>8</strong>
          </article>
        </section>

        <section className={styles.tripsPanel}>
          <h2>Próximo viaje</h2>
          <div className={styles.tripList}>
            {upcomingTrips.map((trip) => (
              <article className={styles.trip} key={`${trip.time}-${trip.route}`}>
                <div className={styles.tripDetails}>
                  <h3>{trip.date} - {trip.route}</h3>
                  <p>{trip.time} - {trip.passengers} - {trip.seats}</p>
                </div>
                <button type="button" className={styles.viewButton}>Ver viaje</button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Viajes
