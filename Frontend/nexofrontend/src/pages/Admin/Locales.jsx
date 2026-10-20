import { useEffect, useState } from 'react'
import Sidebar from '../../Components/Admin/Sidebar'
import { actualizarLocal, crearLocal, eliminarLocal, obtenerLocales } from '../../services/encomiendasService'
import styles from './Locales.module.css'

const formularioInicial = { nombre: '', direccion: '', telefono: '', catalogo_pdf: null }

function Locales() {
  const [locales, setLocales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formAbierto, setFormAbierto] = useState(false)
  const [localEnEdicion, setLocalEnEdicion] = useState(null)
  const [form, setForm] = useState(formularioInicial)
  const [fileKey, setFileKey] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

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

  function actualizarCampo(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrorForm('')
  }

  function cerrarFormulario() {
    setFormAbierto(false)
    setLocalEnEdicion(null)
    setForm(formularioInicial)
    setFileKey((current) => current + 1)
    setErrorForm('')
  }

  function abrirNuevo() {
    cerrarFormulario()
    setFormAbierto(true)
  }

  function abrirEdicion(local) {
    setLocalEnEdicion(local)
    setForm({
      nombre: local.nombre,
      direccion: local.direccion,
      telefono: local.telefono ?? '',
      catalogo_pdf: null,
    })
    setFileKey((current) => current + 1)
    setErrorForm('')
    setFormAbierto(true)
  }

  async function borrarLocal(local) {
    const confirmado = window.confirm(
      `¿Eliminar "${local.nombre}"? Las encomiendas ya solicitadas en este local quedarán sin local asignado.`,
    )
    if (!confirmado) return

    setError('')
    try {
      await eliminarLocal(local.id)
      setLocales((current) => current.filter((item) => item.id !== local.id))
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function guardarLocal(event) {
    event.preventDefault()
    setGuardando(true)
    setErrorForm('')

    try {
      const guardado = localEnEdicion
        ? await actualizarLocal(localEnEdicion.id, form)
        : await crearLocal(form)
      setLocales((current) => [
        ...current.filter((item) => item.id !== guardado.id),
        guardado,
      ].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      cerrarFormulario()
    } catch (saveError) {
      setErrorForm(saveError.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRACIÓN</p>
            <h1>Locales adheridos</h1>
            <p>{locales.length} locales registrados.</p>
          </div>
          <button type="button" className={styles.primaryButton} onClick={abrirNuevo}>
            + Agregar local
          </button>
        </header>

        {formAbierto && (
          <section className={styles.formSection} aria-label={localEnEdicion ? 'Editar local' : 'Agregar local'}>
            <form className={styles.form} onSubmit={guardarLocal}>
              <label className={styles.field}>
                <span>Nombre</span>
                <input name="nombre" value={form.nombre} onChange={actualizarCampo} maxLength={150} required />
              </label>
              <label className={styles.field}>
                <span>Dirección</span>
                <input name="direccion" value={form.direccion} onChange={actualizarCampo} maxLength={255} required />
              </label>
              <label className={styles.field}>
                <span>Teléfono</span>
                <input type="tel" name="telefono" value={form.telefono} onChange={actualizarCampo} maxLength={50} />
              </label>
              <label className={styles.field}>
                <span>
                  {localEnEdicion?.catalogo_pdf
                    ? 'Reemplazar catálogo (PDF, opcional)'
                    : 'Catálogo (PDF, opcional)'}
                </span>
                <input
                  key={fileKey}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setForm((current) => ({ ...current, catalogo_pdf: event.target.files[0] ?? null }))}
                />
              </label>

              {errorForm && <p className={styles.error} role="alert">{errorForm}</p>}

              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={cerrarFormulario}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryButton} disabled={guardando}>
                  {guardando ? 'Guardando...' : localEnEdicion ? 'Guardar cambios' : 'Guardar local'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className={styles.listSection} aria-label="Lista de locales">
          {loading && <p className={styles.message}>Cargando locales...</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {!loading && !error && locales.length === 0 && (
            <p className={styles.message}>Todavía no hay locales registrados.</p>
          )}
          {!loading && !error && locales.length > 0 && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Local</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Catálogo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {locales.map((local) => (
                    <tr key={local.id}>
                      <td>{local.nombre}</td>
                      <td>{local.direccion}</td>
                      <td>{local.telefono || 'Sin teléfono'}</td>
                      <td>
                        {local.catalogo_pdf ? (
                          <a href={local.catalogo_pdf} target="_blank" rel="noreferrer">Ver PDF</a>
                        ) : 'Sin catálogo'}
                      </td>
                      <td className={styles.rowActions}>
                        <button type="button" className={styles.editButton} onClick={() => abrirEdicion(local)}>
                          Editar
                        </button>
                        <button type="button" className={styles.deleteButton} onClick={() => borrarLocal(local)}>
                          Eliminar
                        </button>
                      </td>
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

export default Locales
