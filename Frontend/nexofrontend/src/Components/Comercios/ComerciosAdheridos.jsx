import styles from './ComerciosAdheridos.module.css'

const comerciosAdheridos = [
  {
    name: 'La Tiendita',
    address: 'Av. 9 de Julio 123, Resistencia',
    phone: '+54 362 123-4567',
    catalogUrl: '/catalogs/la-tiendita.pdf',
  },
  {
    name: 'Delicias Corrientes',
    address: 'Sarmiento 455, Corrientes',
    phone: '+54 379 987-6543',
    catalogUrl: '/catalogs/delicias-corrientes.pdf',
  },
  {
    name: 'Mercado Reconquista',
    address: 'Rivadavia 78, Reconquista',
    phone: '+54 348 321-0098',
    catalogUrl: '/catalogs/mercado-reconquista.pdf',
  },
]

function ComerciosAdheridos() {
  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1 className={styles.title}>Locales adheridos</h1>
        <p className={styles.subtitle}>
          Conocé los comercios que trabajan con Nexo y cómo contactarlos.
        </p>
      </section>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Local</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Catálogo</th>
            </tr>
          </thead>
          <tbody>
            {comerciosAdheridos.map((local) => (
              <tr key={local.name}>
                <td>{local.name}</td>
                <td>{local.address}</td>
                <td>{local.phone}</td>
                <td>
                  <a
                    className={styles.catalogLink}
                    href={local.catalogUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Descargar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ComerciosAdheridos
