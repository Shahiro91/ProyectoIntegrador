import { useEffect, useState } from 'react'
import Sidebar from '../../Components/Admin/Sidebar'
import { actualizarEstadoConsulta, obtenerConsultas } from '../../services/consultasService'
import styles from './Consultas.module.css'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function Consultas() {
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorActualizacion, setErrorActualizacion] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [actualizandoId, setActualizandoId] = useState(null)

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

  async function cambiarEstado(consultaId, estado) {
    setActualizandoId(consultaId)
    setErrorActualizacion('')

    try {
      const consultaActualizada = await actualizarEstadoConsulta(consultaId, estado)
      setConsultas((current) => current
        .map((consulta) => consulta.id === consultaId ? consultaActualizada : consulta)
        .sort((left, right) => (
          left.estado.localeCompare(right.estado)
          || new Date(left.fecha_creacion) - new Date(right.fecha_creacion)
          || left.id - right.id
        )))
    } catch (updateError) {
      setErrorActualizacion(updateError.message)
    } finally {
      setActualizandoId(null)
    }
  }

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
          {errorActualizacion && (
            <p className={styles.error} role="alert">{errorActualizacion}</p>
          )}
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
                    <th>Estado</th>
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
                      <td>
                        <select
                          className={consulta.estado === 'resuelta' ? styles.resuelta : styles.pendiente}
                          aria-label={`Estado de la consulta de ${consulta.nombre}`}
                          value={consulta.estado}
                          disabled={actualizandoId === consulta.id}
                          onChange={(event) => cambiarEstado(consulta.id, event.target.value)}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="resuelta">Resuelta</option>
                        </select>
                      </td>
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