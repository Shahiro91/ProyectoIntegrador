import Sidebar from '../../components/Admin/Sidebar'
import Turnero from '../../Components/Calendario/Turnero'
import styles from './Calendario.module.css'

function Calendario() {
  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <Turnero />
      </main>
    </div>
  )
}

export default Calendario
