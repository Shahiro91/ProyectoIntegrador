import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './nav.module.css'

const publicLinks = [
  { label: 'Inicio', path: '/' },
  { label: 'Transporte pasajeros', path: '/passengers' },
  { label: 'Comercios adheridos', path: '/comercios' },
  { label: 'Hacer pedido', path: '/#pedido' },
  { label: 'Contacto', path: '/#contacto' },
]

function Nav() {
  const { logout, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuLinks = publicLinks.filter((link) => {
    if (link.label === 'Hacer pedido' && !isAuthenticated) {
      return false
    }
    return true
  })

  const getLinkClass = (link) => {
    const currentPath = location.pathname
    const [linkPath, linkHash] = link.path.split('#')

    if (linkHash) {
      return currentPath === linkPath && location.hash === `#${linkHash}`
        ? styles.active
        : styles.link
    }

    return currentPath === linkPath ? styles.active : styles.link
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img src="/logoNexo.png" alt="Nexo" className={styles.logoImage} />
        <p className={styles.tagline}>Viajes, encomiendas y pedidos.</p>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.linkList}>
          {menuLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.path}
                className={getLinkClass(link)}
                onClick={(event) => {
                  event.preventDefault()
                  navigate(link.path)
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {user && (
        <div className={styles.footer}>
          <p className={styles.userName}>{user?.name}</p>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  )
}

export default Nav
