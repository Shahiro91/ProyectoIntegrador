import { useEffect, useState } from 'react'
import styles from './ComerciosAdheridos.module.css'
import { obtenerLocales } from '../../services/encomiendasService'

function ComerciosAdheridos() {
  const [locales, setLocales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    obtenerLocales()
      .then((items) => {
        if (isActive) setLocales(items)
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

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1 className={styles.title}>Locales adheridos</h1>
        <p className={styles.subtitle}>
          Conocé los comercios que trabajan con Nexo y cómo contactarlos.
        </p>
      </section>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Local</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Catálogo</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="4">Cargando locales...</td></tr>}
            {error && <tr><td colSpan="4" role="alert">{error}</td></tr>}
            {!loading && !error && locales.length === 0 && (
              <tr><td colSpan="4">No hay locales adheridos disponibles.</td></tr>
            )}
            {locales.map((local) => (
              <tr key={local.id}>
                <td>{local.nombre}</td>
                <td>{local.direccion}</td>
                <td>{local.telefono}</td>
                <td>
                  {local.catalogo_pdf ? (
                    <a
                      className={styles.catalogLink}
                      href={local.catalogo_pdf}
                      target="_blank"
                      rel="noreferrer"
                    >Descargar</a>
                  ) : 'Sin catálogo'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ComerciosAdheridos
