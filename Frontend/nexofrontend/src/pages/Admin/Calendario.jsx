import { useState } from 'react'
import Sidebar from '../../components/Admin/Sidebar'
import Turnero from '../../Components/Calendario/Turnero'
import PlanificadorEncomiendas from '../../Components/Calendario/PlanificadorEncomiendas'
import styles from './Calendario.module.css'

function Calendario() {
  const [view, setView] = useState('pasajeros')

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.viewSwitch} role="tablist" aria-label="Tipo de jornada">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'pasajeros'}
            className={view === 'pasajeros' ? styles.activeView : ''}
            onClick={() => setView('pasajeros')}
          >
            Pasajeros
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'encomiendas'}
            className={view === 'encomiendas' ? styles.activeView : ''}
            onClick={() => setView('encomiendas')}
          >
            Planificar encomiendas
          </button>
        </div>
        {view === 'pasajeros' ? <Turnero /> : <PlanificadorEncomiendas />}
      </main>
    </div>
  )
}

export default Calendario
