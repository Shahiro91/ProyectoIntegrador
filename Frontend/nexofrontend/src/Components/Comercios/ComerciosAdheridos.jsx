import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import styles from './ComerciosAdheridos.module.css'
import {
  actualizarLocal,
  crearLocal,
  eliminarLocal,
  obtenerLocales,
} from '../../services/encomiendasService'

function ComerciosAdheridos({ adminMode = false }) {
  const [locales, setLocales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionError, setActionError] = useState('')
  const [editingLocal, setEditingLocal] = useState(null)
  const [deletingLocalId, setDeletingLocalId] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    catalogo_pdf: null,
  })

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

  function handleFieldChange(event) {
    const { name, value, files, type } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'file' ? files?.[0] ?? null : value,
    }))
  }

  async function handleSaveLocal(event) {
    event.preventDefault()
    const form = event.currentTarget
    const wasEditing = Boolean(editingLocal)
    setSaving(true)
    setFormError('')
    setSuccess('')

    try {
      const local = wasEditing
        ? await actualizarLocal(editingLocal.id, formData)
        : await crearLocal(formData)
      setLocales((current) => {
        const updated = wasEditing
          ? current.map((item) => (item.id === local.id ? local : item))
          : [...current, local]
        return updated.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      })
      setFormData({ nombre: '', direccion: '', telefono: '', catalogo_pdf: null })
      form.reset()
      setShowCreateForm(false)
      setEditingLocal(null)
      setSuccess(wasEditing ? 'Local actualizado correctamente.' : 'Local creado correctamente.')
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  function closeCreateForm() {
    setShowCreateForm(false)
    setEditingLocal(null)
    setFormData({ nombre: '', direccion: '', telefono: '', catalogo_pdf: null })
    setFormError('')
  }

  function openCreateForm() {
    setEditingLocal(null)
    setFormData({ nombre: '', direccion: '', telefono: '', catalogo_pdf: null })
    setFormError('')
    setActionError('')
    setSuccess('')
    setShowCreateForm(true)
  }

  function openEditForm(local) {
    setEditingLocal(local)
    setFormData({
      nombre: local.nombre,
      direccion: local.direccion,
      telefono: local.telefono ?? '',
      catalogo_pdf: null,
    })
    setFormError('')
    setActionError('')
    setSuccess('')
    setShowCreateForm(true)
  }

  async function handleDeleteLocal(local) {
    const confirmed = window.confirm(
      `¿Eliminar el local "${local.nombre}"? Las encomiendas existentes se conservarán sin local asociado.`,
    )
    if (!confirmed) return

    setDeletingLocalId(local.id)
    setActionError('')
    setSuccess('')

    try {
      await eliminarLocal(local.id)
      setLocales((current) => current.filter((item) => item.id !== local.id))
      if (editingLocal?.id === local.id) closeCreateForm()
      setSuccess('Local eliminado correctamente.')
    } catch (deleteError) {
      setActionError(deleteError.message)
    } finally {
      setDeletingLocalId(null)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{adminMode ? 'Locales' : 'Locales adheridos'}</h1>
          <p className={styles.subtitle}>
            {adminMode
              ? 'Administrá los locales adheridos a Nexo.'
              : 'Conocé los comercios que trabajan con Nexo y cómo contactarlos.'}
          </p>
        </div>
        {adminMode && (
          <button
            className={styles.createButton}
            type="button"
            aria-expanded={showCreateForm}
            aria-controls="crear-local-form"
            onClick={showCreateForm ? closeCreateForm : openCreateForm}
          >
            {showCreateForm ? 'Cerrar formulario' : 'Crear local'}
          </button>
        )}
      </section>

      {adminMode && showCreateForm && (
        <form id="crear-local-form" className={styles.createForm} onSubmit={handleSaveLocal}>
          <h2 className={styles.formTitle}>{editingLocal ? 'Editar local' : 'Nuevo local'}</h2>
          <label className={styles.field}>
            Nombre
            <input name="nombre" value={formData.nombre} onChange={handleFieldChange} required maxLength="150" />
          </label>
          <label className={styles.field}>
            Dirección
            <input name="direccion" value={formData.direccion} onChange={handleFieldChange} required maxLength="255" />
          </label>
          <label className={styles.field}>
            Teléfono
            <input name="telefono" value={formData.telefono} onChange={handleFieldChange} maxLength="50" />
          </label>
          <label className={styles.field}>
            {editingLocal ? 'Reemplazar catálogo PDF (opcional)' : 'Catálogo PDF (opcional)'}
            <input name="catalogo_pdf" type="file" accept="application/pdf,.pdf" onChange={handleFieldChange} />
          </label>
          {editingLocal?.catalogo_pdf && (
            <p className={styles.currentCatalog}>
              Catálogo actual: <a href={editingLocal.catalogo_pdf} target="_blank" rel="noreferrer">Ver PDF</a>
            </p>
          )}
          {formError && <p className={styles.formError} role="alert">{formError}</p>}
          <div className={styles.formActions}>
            <button className={styles.primaryButton} type="submit" disabled={saving}>
              {saving ? 'Guardando...' : editingLocal ? 'Guardar cambios' : 'Guardar local'}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={closeCreateForm} disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {success && <p className={styles.success} role="status">{success}</p>}
  {actionError && <p className={styles.formError} role="alert">{actionError}</p>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Local</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Catálogo</th>
              {adminMode && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={adminMode ? 5 : 4}>Cargando locales...</td></tr>}
            {error && <tr><td colSpan={adminMode ? 5 : 4} role="alert">{error}</td></tr>}
            {!loading && !error && locales.length === 0 && (
              <tr><td colSpan={adminMode ? 5 : 4}>No hay locales adheridos disponibles.</td></tr>
            )}
            {locales.map((local) => (
              <tr key={local.id}>
                <td>{local.nombre}</td>
                <td>{local.direccion}</td>
                <td>{local.telefono}</td>
                <td>
                  {local.catalogo_pdf ? (
                    <a
                      className={styles.catalogLink}
                      href={local.catalogo_pdf}
                      target="_blank"
                      rel="noreferrer"
                    >Descargar</a>
                  ) : 'Sin catálogo'}
                </td>
                {adminMode && (
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.iconButton}
                        type="button"
                        title="Editar local"
                        aria-label={`Editar ${local.nombre}`}
                        onClick={() => openEditForm(local)}
                      >
                        <Pencil size={18} aria-hidden="true" />
                      </button>
                      <button
                        className={`${styles.iconButton} ${styles.deleteButton}`}
                        type="button"
                        title="Eliminar local"
                        aria-label={`Eliminar ${local.nombre}`}
                        disabled={deletingLocalId === local.id}
                        onClick={() => handleDeleteLocal(local)}
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ComerciosAdheridos
