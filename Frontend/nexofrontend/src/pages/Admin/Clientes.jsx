import { useEffect, useState } from 'react'
import Sidebar from '../../Components/Admin/Sidebar'
import { obtenerClientes } from '../../services/clientesService'
import styles from './Consultas.module.css'

const dateFormatter = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' })

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    obtenerClientes()
      .then((items) => {
        if (isActive) setClientes(items)
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
      <Sidebar />
      <main className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRACIÓN</p>
            <h1>Clientes registrados</h1>
            <p>{loading ? 'Cargando...' : `${clientes.length} cliente(s) registrados en la página.`}</p>
          </div>
        </header>

        <section className={styles.listSection} aria-label="Lista de clientes registrados">
          {loading && <p className={styles.message}>Cargando clientes...</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {!loading && !error && clientes.length === 0 && (
            <p className={styles.message}>Todavía no hay clientes registrados.</p>
          )}
          {!loading && !error && clientes.length > 0 && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>CP</th>
                    <th>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>{`${cliente.nombre} ${cliente.apellido}`.trim()}</td>
                      <td>{cliente.email}</td>
                      <td>{cliente.telefono || '-'}</td>
                      <td>{cliente.direccion || '-'}</td>
                      <td>{cliente.codigo_postal || '-'}</td>
                      <td>{dateFormatter.format(new Date(cliente.fecha_registro))}</td>
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

export default Clientes
