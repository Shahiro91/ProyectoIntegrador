import Sidebar from '../../Components/Admin/Sidebar'
import ComerciosAdheridos from '../../Components/Comercios/ComerciosAdheridos'
import styles from './Locales.module.css'

function Locales() {
  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <ComerciosAdheridos adminMode />
      </main>
    </div>
  )
}

export default Locales