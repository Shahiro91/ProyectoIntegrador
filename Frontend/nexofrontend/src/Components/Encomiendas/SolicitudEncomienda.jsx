import { useEffect, useState } from 'react'
import styles from '../Home/Home.module.css'
import { crearSolicitudEncomienda, obtenerLocales } from '../../services/encomiendasService'

const initialForm = {
  local: '',
  origen: '',
  destino: '',
  nombre_destinatario: '',
  telefono_destinatario: '',
  peso_kg: '',
  tamano: 'Mediano',
}

function SolicitudEncomienda() {
  const [locales, setLocales] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loadingLocales, setLoadingLocales] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        if (isActive) setLoadingLocales(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  function actualizarCampo(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  function seleccionarLocal(event) {
    const localId = event.target.value
    const localSeleccionado = locales.find((local) => String(local.id) === localId)

    setForm((current) => ({
      ...current,
      local: localId,
      origen: localSeleccionado?.direccion ?? '',
    }))
    setError('')
    setSuccess('')
  }

  async function enviarSolicitud(event) {
    event.preventDefault()
    setSending(true)
    setError('')
    setSuccess('')

    try {
      await crearSolicitudEncomienda({
        ...form,
        peso_kg: Number(form.peso_kg),
        local: Number(form.local),
      })
      setForm(initialForm)
      setSuccess('Solicitud enviada. Nos pondremos en contacto para coordinar la encomienda.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className={styles.contactSection} aria-labelledby="titulo-encomienda">
      <header className={styles.formHeader}>
        <p className={styles.formEyebrow}>ENVÍOS NEXO</p>
        <h1 id="titulo-encomienda" className={styles.formTitle}>Solicitar encomienda</h1>
        <p className={styles.formDescription}>Completá los datos del envío para que podamos coordinarlo.</p>
      </header>

      <form className={styles.contactForm} onSubmit={enviarSolicitud}>
        <label className={styles.field}>
          <span>Local adherido</span>
          <select
            name="local"
            value={form.local}
            onChange={seleccionarLocal}
            disabled={loadingLocales || locales.length === 0}
            required
          >
            <option value="">
              {loadingLocales ? 'Cargando locales...' : 'Seleccioná un local'}
            </option>
            {locales.map((local) => (
              <option key={local.id} value={local.id}>{local.nombre}</option>
            ))}
          </select>
          {!loadingLocales && locales.length === 0 && (
            <small>No hay locales adheridos disponibles.</small>
          )}
        </label>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>Origen</span>
            <input
              name="origen"
              value={form.origen}
              placeholder="Se completa al elegir el local"
              readOnly
              required
            />
          </label>
          <label className={styles.field}>
            <span>Dirección exacta de destino</span>
            <input
              name="destino"
              value={form.destino}
              onChange={actualizarCampo}
              placeholder="Calle, altura y localidad"
              autoComplete="street-address"
              required
            />
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>Nombre de quien recibe</span>
            <input name="nombre_destinatario" value={form.nombre_destinatario} onChange={actualizarCampo} required />
          </label>
          <label className={styles.field}>
            <span>Teléfono de contacto</span>
            <input type="tel" name="telefono_destinatario" value={form.telefono_destinatario} onChange={actualizarCampo} required />
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>Peso (kg)</span>
            <input type="number" name="peso_kg" min="0.01" max="30" step="0.01" value={form.peso_kg} onChange={actualizarCampo} required />
          </label>
          <label className={styles.field}>
            <span>Tamaño aproximado</span>
            <select name="tamano" value={form.tamano} onChange={actualizarCampo} required>
              <option value="Pequeño">Pequeño</option>
              <option value="Mediano">Mediano</option>
              <option value="Grande">Grande</option>
            </select>
          </label>
        </div>

        {error && <p className={styles.formError} role="alert">{error}</p>}
        {success && <p className={styles.formSuccess} role="status">{success}</p>}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={sending || loadingLocales || locales.length === 0}
        >
          {sending ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </section>
  )
}

export default SolicitudEncomienda