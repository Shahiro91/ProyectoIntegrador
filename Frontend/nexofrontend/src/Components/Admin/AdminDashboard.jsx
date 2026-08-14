import { useAuth } from '../../context/AuthContext'
import styles from './AdminDashboard.module.css'

function AdminDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel de administración</h1>
          <p className={styles.subtitle}>Bienvenido, {user?.name}</p>
        </div>
        <button type="button" className={styles.logoutButton} onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Pedidos</h2>
          <p>Gestioná pedidos y envíos en curso.</p>
        </article>
        <article className={styles.card}>
          <h2>Viajes</h2>
          <p>Programá rutas y fechas de entrega.</p>
        </article>
        <article className={styles.card}>
          <h2>Clientes</h2>
          <p>Revisá cuentas y actividad reciente.</p>
        </article>
      </div>
    </div>
  )
}

export default AdminDashboard
