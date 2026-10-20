import { useAuth } from '../../context/useAuth'
import { useLocation, useNavigate } from 'react-router-dom'
import nexoLogo from '../../assets/logo.png'
import styles from './Sidebar.module.css'

const menuItems = [
  { label: 'Inicio', path: '/admin' },
  { label: 'Calendario', path: '/admin/calendario' },
  { label: 'Viajes', path: '/admin/viajes' },
  { label: 'Locales', path: '/admin/locales' },
  { label: 'Clientes', path: '/admin/clientes' },
  { label: 'Consultas', path: '/admin/consultas' },
]

function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className={styles.sidebar}>
      <img className={styles.logoImage} src={nexoLogo} alt="Nexo" />
      <p className={styles.brandDescription}>Viajes, encomiendas y pedidos.</p>

      <nav className={styles.navigation} aria-label="Navegación de administración">
        {menuItems.map((item) => (
          <button
            type="button"
            className={`${styles.navItem} ${location.pathname === item.path ? styles.activeNavItem : ''}`}
            onClick={() => navigate(item.path)}
            key={item.label}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <button type="button" className={styles.logoutButton} onClick={logout}>
        Cerrar sesión
      </button>
    </aside>
  )
}

export default Sidebar
