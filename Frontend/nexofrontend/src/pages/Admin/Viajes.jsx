import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import Sidebar from '../../Components/Admin/Sidebar'
import { obtenerViajes } from '../../services/viajesService'
import {
  obtenerJornadasEncomienda,
  obtenerSolicitudesTurnero,
} from '../../services/turneroEncomiendasService'
import styles from './Viajes.module.css'

function fechaLocal(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function formatTripDate(date) {
  const text = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function Viajes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [viajes, setViajes] = useState([])
  const [jornadas, setJornadas] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    Promise.all([obtenerViajes(), obtenerJornadasEncomienda(), obtenerSolicitudesTurnero()])
      .then(([viajesData, jornadasData, solicitudesData]) => {
        if (!isActive) return
        setViajes(viajesData)
        setJornadas(jornadasData)
        setSolicitudes(solicitudesData)
      })
      .catch((loadError) => {
        if (isActive) setError(loadError.message)
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const hoy = fechaLocal()
  const viajesHoy = viajes.filter((viaje) => viaje.fecha_salida === hoy)
  const jornadasHoy = jornadas.filter((jornada) => jornada.fecha === hoy)
  const pasajerosHoy = viajesHoy.reduce((total, viaje) => total + viaje.asientos_ocupados.length, 0)
  const encomiendasHoy = jornadasHoy.reduce((total, jornada) => total + jornada.solicitudes.length, 0)

  const proximos = [
    ...viajes.map((viaje) => ({
      tipo: 'pasajeros',
      fecha: viaje.fecha_salida,
      horario: viaje.horario_salida,
      origen: viaje.origen,
      destino: viaje.destino,
      detalle: `${viaje.asientos_ocupados.length} pasajeros - ${viaje.capacidad_total - viaje.asientos_ocupados.length} lugares disponibles`,
    })),
    ...jornadas
      .filter((jornada) => jornada.fecha >= hoy)
      .map((jornada) => ({
        tipo: 'encomiendas',
        fecha: jornada.fecha,
        horario: jornada.horario.slice(0, 5),
        origen: jornada.origen,
        destino: jornada.destino,
        detalle: `${jornada.solicitudes.length} envíos - ${jornada.peso_asignado} / ${jornada.capacidad_kg} kg`,
      })),
  ]
    .sort((a, b) => `${a.fecha} ${a.horario}`.localeCompare(`${b.fecha} ${b.horario}`))
    .slice(0, 6)

  const solicitudesPendientes = solicitudes.filter((solicitud) => !solicitud.jornada_encomienda).length

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
            <strong>{viajesHoy.length + jornadasHoy.length}</strong>
          </article>
          <article className={styles.statCard}>
            <h2>Pasajeros hoy</h2>
            <strong>{pasajerosHoy}</strong>
          </article>
          <article className={styles.statCard}>
            <h2>Encomiendas hoy</h2>
            <strong>{encomiendasHoy}</strong>
            {solicitudesPendientes > 0 && <small>{solicitudesPendientes} sin asignar</small>}
          </article>
        </section>

        <section className={styles.tripsPanel}>
          <h2>Próximos viajes</h2>
          {loading && <p className={styles.empty}>Cargando viajes...</p>}
          {!loading && error && <p className={styles.empty} role="alert">{error}</p>}
          {!loading && !error && proximos.length === 0 && (
            <p className={styles.empty}>No hay viajes programados.</p>
          )}
          <div className={styles.tripList}>
            {proximos.map((trip) => (
              <article
                className={`${styles.trip} ${trip.tipo === 'encomiendas' ? styles.tripEncomiendas : styles.tripPasajeros}`}
                key={`${trip.tipo}-${trip.fecha}-${trip.horario}-${trip.origen}-${trip.destino}`}
              >
                <div className={styles.tripDetails}>
                  <h3>
                    {trip.tipo === 'encomiendas' ? '📦' : '🚐'} {formatTripDate(trip.fecha)} - {trip.origen} a {trip.destino}
                  </h3>
                  <p>{trip.horario} - {trip.detalle}</p>
                </div>
                <button
                  type="button"
                  className={styles.viewButton}
                  onClick={() => navigate('/admin/calendario')}
                >
                  Ver viaje
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Viajes
