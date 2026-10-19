import { useEffect, useState } from 'react'
import {
  asignarSolicitudEncomienda,
  guardarJornadaEncomienda,
  obtenerJornadasEncomienda,
  obtenerSolicitudesTurnero,
} from '../../services/turneroEncomiendasService'
import styles from './PlanificadorEncomiendas.module.css'

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function emptyForm(date) {
  return { fecha: date, horario: '08:00', origen: '', destino: '', capacidad_kg: '500.00' }
}

function PlanificadorEncomiendas() {
  const today = new Date()
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDate, setSelectedDate] = useState(dateKey(today))
  const [jornadas, setJornadas] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJourney, setEditingJourney] = useState(null)
  const [form, setForm] = useState(emptyForm(dateKey(today)))
  const [draggedRequest, setDraggedRequest] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [movingRequest, setMovingRequest] = useState(null)

  useEffect(() => {
    let isActive = true
    Promise.all([obtenerJornadasEncomienda(), obtenerSolicitudesTurnero()])
      .then(([journeyItems, requestItems]) => {
        if (!isActive) return
        setJornadas(journeyItems)
        setSolicitudes(requestItems)
        setError('')
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

  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate()
  const firstWeekday = new Date(month.year, month.month, 1).getDay()
  const leadingSpaces = firstWeekday === 0 ? 6 : firstWeekday - 1
  const journeysByDate = jornadas.reduce((groups, journey) => {
    groups[journey.fecha] = [...(groups[journey.fecha] ?? []), journey]
    return groups
  }, {})
  const selectedJourneys = jornadas.filter((journey) => journey.fecha === selectedDate)
  const pendingCount = solicitudes.filter((request) => !request.jornada_encomienda).length
  const requestsByDestination = solicitudes.reduce((groups, request) => {
    const destination = request.destino || 'Destino sin indicar'
    groups[destination] = [...(groups[destination] ?? []), request]
    return groups
  }, {})

  function changeMonth(offset) {
    const next = new Date(month.year, month.month + offset, 1)
    setMonth({ year: next.getFullYear(), month: next.getMonth() })
  }

  function startNewJourney() {
    setEditingJourney(null)
    setForm(emptyForm(selectedDate))
    setError('')
    setModalOpen(true)
  }

  function editJourney(journey) {
    setEditingJourney(journey)
    setSelectedDate(journey.fecha)
    setForm({ ...journey, horario: journey.horario.slice(0, 5) })
    setError('')
    setModalOpen(true)
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function saveJourney(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      const saved = await guardarJornadaEncomienda(editingJourney?.id, {
        ...form,
        capacidad_kg: Number(form.capacidad_kg),
      })
      setMonth({ year: Number(saved.fecha.slice(0, 4)), month: Number(saved.fecha.slice(5, 7)) - 1 })
      setSelectedDate(saved.fecha)
      setModalOpen(false)
      setFeedback(editingJourney ? 'Jornada actualizada.' : 'Jornada de encomiendas creada.')
      setLoading(true)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function moveRequest(requestId, journeyId) {
    if (!requestId) return
    setMovingRequest(requestId)
    setError('')
    setFeedback('')
    try {
      await asignarSolicitudEncomienda(requestId, journeyId)
      setFeedback(journeyId ? 'Solicitud asignada a la jornada.' : 'Solicitud devuelta a pendientes.')
      setLoading(true)
      setReloadKey((key) => key + 1)
    } catch (moveError) {
      setError(moveError.message)
    } finally {
      setMovingRequest(null)
      setDraggedRequest(null)
      setDropTarget(null)
    }
  }

  function startDragging(event, request) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(request.id))
    setDraggedRequest(request.id)
  }

  function dropOnJourney(event, journey) {
    event.preventDefault()
    event.stopPropagation()
    moveRequest(Number(event.dataTransfer.getData('text/plain')), journey.id)
  }

  function dropOnPending(event) {
    event.preventDefault()
    moveRequest(Number(event.dataTransfer.getData('text/plain')), null)
  }

  return (
    <section className={styles.planner} aria-labelledby="planner-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>LOGÍSTICA</p>
          <h1 id="planner-title">Planificar encomiendas</h1>
          <p>Organizá solicitudes por destino y capacidad de carga.</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={startNewJourney}>+ Nueva jornada</button>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {feedback && <p className={styles.feedback} role="status">{feedback}</p>}

      <div className={styles.plannerGrid}>
        <section className={styles.calendarPanel} aria-label="Calendario de jornadas de encomiendas">
          <div className={styles.monthHeader}>
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">‹</button>
            <h2>{months[month.month]} {month.year}</h2>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente">›</button>
          </div>

          <div className={styles.calendarGrid}>
            {weekdays.map((day) => <div className={styles.weekday} key={day}>{day}</div>)}
            {Array.from({ length: leadingSpaces }, (_, index) => (
              <div className={`${styles.dayCell} ${styles.emptyDay}`} key={`empty-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1
              const key = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayJourneys = journeysByDate[key] ?? []
              const oneJourney = dayJourneys.length === 1 ? dayJourneys[0] : null

              return (
                <div
                  className={`${styles.dayCell} ${selectedDate === key ? styles.selectedDay : ''} ${dropTarget === key ? styles.dayDropTarget : ''}`}
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  onDragOver={(event) => {
                    if (oneJourney) {
                      event.preventDefault()
                      setDropTarget(key)
                    }
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(event) => oneJourney && dropOnJourney(event, oneJourney)}
                >
                  <span className={styles.dayNumber}>{day}</span>
                  {dayJourneys.map((journey) => {
                    const assigned = solicitudes.filter((request) => request.jornada_encomienda === journey.id)
                    const load = Math.min(100, Number(journey.peso_asignado) / Number(journey.capacidad_kg) * 100)
                    const target = dropTarget === `journey-${journey.id}`

                    return (
                      <article
                        className={`${styles.journeyCard} ${target ? styles.journeyDropTarget : ''}`}
                        key={journey.id}
                        onDragOver={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setDropTarget(`journey-${journey.id}`)
                        }}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={(event) => dropOnJourney(event, journey)}
                      >
                        <strong>{journey.origen} → {journey.destino}</strong>
                        <span>{journey.horario.slice(0, 5)} · {assigned.length} solicitudes</span>
                        <span>{journey.peso_asignado} / {journey.capacidad_kg} kg</span>
                        <span className={styles.loadTrack}>
                          <span className={styles.loadFill} style={{ width: `${load}%` }} />
                        </span>
                        <button type="button" className={styles.editButton} onClick={() => editJourney(journey)}>Editar jornada</button>
                      </article>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <footer className={styles.calendarFooter}>
            <span>{selectedJourneys.length} jornadas el {selectedDate}</span>
            <button type="button" onClick={startNewJourney}>+ Crear para este día</button>
          </footer>
        </section>

        <aside
          className={`${styles.requestsPanel} ${dropTarget === 'pending' ? styles.pendingDropTarget : ''}`}
          aria-label="Solicitudes de encomienda"
          onDragOver={(event) => {
            event.preventDefault()
            setDropTarget('pending')
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={dropOnPending}
        >
          <header className={styles.requestsHeader}>
            <div>
              <h2>Solicitudes</h2>
              <p>{pendingCount} pendientes · {solicitudes.length} en total</p>
            </div>
          </header>
          <p className={styles.dropHint}>Arrastrá solicitudes a una jornada. Soltalas acá para desasignarlas.</p>

          {loading && <p className={styles.emptyState}>Cargando solicitudes...</p>}
          {!loading && solicitudes.length === 0 && <p className={styles.emptyState}>No hay solicitudes recibidas.</p>}

          <div className={styles.requestGroups}>
            {Object.entries(requestsByDestination)
              .sort(([first], [second]) => first.localeCompare(second, 'es'))
              .map(([destination, requests]) => (
                <section className={styles.destinationGroup} key={destination}>
                  <h3>{destination}</h3>
                  {requests.map((request) => {
                    const assigned = jornadas.find((journey) => journey.id === request.jornada_encomienda)
                    const isMoving = movingRequest === request.id

                    return (
                      <article
                        className={`${styles.requestCard} ${draggedRequest === request.id ? styles.dragging : ''}`}
                        key={request.id}
                        draggable={!isMoving}
                        onDragStart={(event) => startDragging(event, request)}
                        onDragEnd={() => {
                          setDraggedRequest(null)
                          setDropTarget(null)
                        }}
                      >
                        <div className={styles.requestTopline}>
                          <strong>{request.cliente_nombre}</strong>
                          <strong>{request.peso_kg} kg</strong>
                        </div>
                        <p>{request.local_nombre} · {request.nombre_destinatario}</p>
                        <p>{request.destino}</p>
                        <a href={`tel:${request.telefono_destinatario.replace(/[^\d+]/g, '')}`}>
                          {request.telefono_destinatario}
                        </a>
                        <span className={assigned ? styles.assignedLabel : styles.pendingLabel}>
                          {assigned ? `Asignada · ${assigned.fecha} · ${assigned.destino}` : 'Pendiente de asignación'}
                        </span>
                        {isMoving && <span className={styles.movingLabel}>Actualizando...</span>}
                      </article>
                    )
                  })}
                </section>
              ))}
          </div>
        </aside>
      </div>

      {modalOpen && (
        <div className={styles.modalBackdrop} onMouseDown={() => setModalOpen(false)}>
          <form
            className={styles.modal}
            onSubmit={saveJourney}
            onMouseDown={(event) => event.stopPropagation()}
            aria-labelledby="journey-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>JORNADA DE CARGA</p>
                <h2 id="journey-modal-title">{editingJourney ? 'Editar jornada' : 'Crear jornada de encomiendas'}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setModalOpen(false)} aria-label="Cerrar">×</button>
            </header>

            <label className={styles.field}>
              <span>Fecha</span>
              <input type="date" name="fecha" value={form.fecha} onChange={updateForm} required />
            </label>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Horario</span>
                <input type="time" name="horario" value={form.horario} onChange={updateForm} required />
              </label>
              <label className={styles.field}>
                <span>Capacidad máxima (kg)</span>
                <input type="number" name="capacidad_kg" min="0.01" step="0.01" value={form.capacidad_kg} onChange={updateForm} required />
              </label>
              <label className={styles.field}>
                <span>Origen</span>
                <input name="origen" value={form.origen} onChange={updateForm} required />
              </label>
              <label className={styles.field}>
                <span>Destino del recorrido</span>
                <input name="destino" value={form.destino} onChange={updateForm} required />
              </label>
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}
            <footer className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className={styles.primaryButton} disabled={saving}>
                {saving ? 'Guardando...' : editingJourney ? 'Guardar cambios' : 'Crear jornada'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  )
}

export default PlanificadorEncomiendas