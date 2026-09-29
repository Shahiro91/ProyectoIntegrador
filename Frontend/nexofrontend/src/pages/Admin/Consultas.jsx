import { useEffect, useState } from 'react'
import Sidebar from '../../Components/Admin/Sidebar'
import { obtenerConsultas } from '../../services/consultasService'
import styles from './Consultas.module.css'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function Consultas() {
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isActive = true

    obtenerConsultas()
      .then((items) => {
        if (isActive) setConsultas(items)
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
  }, [reloadKey])

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRACIÓN</p>
            <h1>Consultas recibidas</h1>
            <p>Contactá a cada persona por teléfono para dar seguimiento.</p>
          </div>
          <button type="button" onClick={() => {
            setLoading(true)
            setError('')
            setReloadKey((current) => current + 1)
          }}>
            Actualizar
          </button>
        </header>

        <section className={styles.listSection} aria-label="Lista de consultas recibidas">
          {loading && <p className={styles.message}>Cargando consultas...</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {!loading && !error && consultas.length === 0 && (
            <p className={styles.message}>Todavía no hay consultas recibidas.</p>
          )}
          {!loading && !error && consultas.length > 0 && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Recibida</th>
                    <th>Nombre</th>
                    <th>Celular</th>
                    <th>Email</th>
                    <th>Consulta</th>
                  </tr>
                </thead>
                <tbody>
                  {consultas.map((consulta) => (
                    <tr key={consulta.id}>
                      <td>{dateFormatter.format(new Date(consulta.fecha_creacion))}</td>
                      <td>{consulta.nombre}</td>
                      <td>
                        <a href={`tel:${consulta.celular.replace(/[^\d+]/g, '')}`}>
                          {consulta.celular}
                        </a>
                      </td>
                      <td>{consulta.email || 'No indicó email'}</td>
                      <td className={styles.messageCell}>{consulta.mensaje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Consultas