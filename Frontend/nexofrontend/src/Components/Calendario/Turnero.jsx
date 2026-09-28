import { useEffect, useState } from "react";
import styles from "./Turnero.module.css";
import { guardarViaje, obtenerViajes } from "../../services/viajesService";

const jornadasIniciales = {
  "2026-09-01": {
    tipo: "pasajeros",
    horario: "08:00",
    origen: "Avellaneda",
    destino: "Reconquista",
    ocupados: 12,
    capacidad: 19,
  },
  "2026-09-02": {
    tipo: "encomiendas",
    horario: "10:00",
    origen: "Avellaneda",
    destino: "Reconquista",
    idEncomienda: "ENC-0002",
    idCliente: "CLI-0012",
    idLocal: "LOC-0004",
    estado: "Pendiente",
    cantidadPaquetes: 4,
    tamañoAprox: "Mediano",
    direccionEntrega: "San Martín 1240, Reconquista",
    costoEnvio: 8500,
    observaciones: "Entregar por la mañana",
    fechaEntrega: "2026-09-02",
    pesoActual: 320,
    pesoMaximo: 500,
    encomiendas: [
      {
        idEncomienda: "ENC-0002-A",
        idCliente: "CLI-0012",
        idLocal: "LOC-0004",
        cliente: "María González",
        local: "Mercado Reconquista",
        localidadEntrega: "Avellaneda",
        direccionEntrega: "San Martín 1240, Avellaneda",
        cantidadPaquetes: 2,
        tamañoAprox: "Mediano",
        estado: "Pendiente",
      },
      {
        idEncomienda: "ENC-0002-B",
        idCliente: "CLI-0021",
        idLocal: "LOC-0004",
        cliente: "Sofía Martínez",
        local: "Mercado Reconquista",
        localidadEntrega: "Villa Ocampo",
        direccionEntrega: "Rivadavia 825, Villa Ocampo",
        cantidadPaquetes: 2,
        tamañoAprox: "Pequeño",
        estado: "En preparación",
      },
    ],
  },
  "2026-09-04": {
    tipo: "pasajeros",
    horario: "08:00",
    origen: "Villa Ocampo",
    destino: "Reconquista",
    ocupados: 7,
    capacidad: 19,
  },
  "2026-09-05": {
    tipo: "encomiendas",
    horario: "10:00",
    origen: "Reconquista",
    destino: "Avellaneda",
    idEncomienda: "ENC-0005",
    idCliente: "CLI-0018",
    idLocal: "LOC-0002",
    estado: "En preparación",
    cantidadPaquetes: 2,
    tamañoAprox: "Grande",
    direccionEntrega: "Belgrano 385, Avellaneda",
    costoEnvio: 12000,
    observaciones: "Llamar antes de entregar",
    fechaEntrega: "2026-09-05",
    pesoActual: 180,
    pesoMaximo: 500,
  },
};

const locales = [
  {
    id: "LOC-0001",
    nombre: "La Tiendita",
    direccion: "Av. 9 de Julio 123, Resistencia",
  },
  {
    id: "LOC-0002",
    nombre: "Delicias Corrientes",
    direccion: "Sarmiento 455, Corrientes",
  },
  {
    id: "LOC-0004",
    nombre: "Mercado Reconquista",
    direccion: "Rivadavia 78, Reconquista",
  },
];

const clientes = [
  {
    id: "CLI-0012",
    nombre: "María González",
    documento: "DNI 32.456.789",
  },
  {
    id: "CLI-0018",
    nombre: "Juan Rodríguez",
    documento: "DNI 28.123.456",
  },
  {
    id: "CLI-0021",
    nombre: "Sofía Martínez",
    documento: "DNI 35.987.654",
  },
];

const formularioInicial = {
  fecha: "",
  horario: "08:00",
  origen: "",
  destino: "",
  capacidad: 19,
  precio: "8500.00",
  idEncomienda: "",
  idCliente: "",
  idLocal: "",
  estado: "Pendiente",
  cantidadPaquetes: 1,
  tamañoAprox: "Mediano",
  paquetesPequeños: 0,
  paquetesMedianos: 1,
  paquetesGrandes: 0,
  direccionEntrega: "",
  costoEnvio: "",
  observaciones: "",
  fechaEntrega: "",
};

function Turnero() {
  const [jornadas, setJornadas] = useState(jornadasIniciales);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("2026-09-01");
  const [mesActual, setMesActual] = useState({ año: 2026, mes: 8 });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoFormulario, setTipoFormulario] = useState(null);
  const [fechaEnEdicion, setFechaEnEdicion] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errorGuardado, setErrorGuardado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [errorLocal, setErrorLocal] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [errorCliente, setErrorCliente] = useState("");
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  useEffect(() => {
    let isActive = true;

    obtenerViajes()
      .then((viajes) => {
        if (!isActive) return;
        const jornadasBackend = Object.fromEntries(
          viajes.map((viaje) => [viaje.fecha_salida, {
            id: viaje.id,
            tipo: "pasajeros",
            horario: viaje.horario_salida,
            origen: viaje.origen,
            destino: viaje.destino,
            ocupados: viaje.asientos_ocupados.length,
            capacidad: viaje.capacidad_total,
            precio: viaje.precio,
          }]),
        );
        setJornadas((actuales) => ({ ...actuales, ...jornadasBackend }));
      })
      .catch((error) => {
        if (isActive) setErrorGuardado(error.message);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const { año, mes } = mesActual;

  const diasDelMes = new Date(año, mes + 1, 0).getDate();
  const primerDia = new Date(año, mes, 1).getDay();

  const resumenPaquetes = formulario.tamañoAprox === "Mixto"
    ? {
        pequeños: Number(formulario.paquetesPequeños) || 0,
        medianos: Number(formulario.paquetesMedianos) || 0,
        grandes: Number(formulario.paquetesGrandes) || 0,
      }
    : {
        pequeños: formulario.tamañoAprox === "Pequeño" ? Number(formulario.cantidadPaquetes) || 0 : 0,
        medianos: formulario.tamañoAprox === "Mediano" ? Number(formulario.cantidadPaquetes) || 0 : 0,
        grandes: formulario.tamañoAprox === "Grande" ? Number(formulario.cantidadPaquetes) || 0 : 0,
      };

  const totalPaquetes = resumenPaquetes.pequeños + resumenPaquetes.medianos + resumenPaquetes.grandes;
  const unidadesDeCarga = resumenPaquetes.pequeños + resumenPaquetes.medianos * 2 + resumenPaquetes.grandes * 4;

  // Ajustamos para que lunes sea el primer día
  const espaciosIniciales = primerDia === 0 ? 6 : primerDia - 1;

  const nombresDias = [
    "Lun",
    "Mar",
    "Mié",
    "Jue",
    "Vie",
    "Sáb",
    "Dom",
  ];

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const seleccionarDia = (dia) => {
    const fechaKey = `${año}-${String(mes + 1).padStart(2, "0")}-${String(
      dia
    ).padStart(2, "0")}`;

    setFechaSeleccionada(fechaKey);
  };

  const cambiarMes = (diferencia) => {
    const nuevaFecha = new Date(año, mes + diferencia, 1);
    const nuevoAño = nuevaFecha.getFullYear();
    const nuevoMes = nuevaFecha.getMonth();

    setMesActual({ año: nuevoAño, mes: nuevoMes });
    setFechaSeleccionada(
      `${nuevoAño}-${String(nuevoMes + 1).padStart(2, "0")}-01`
    );
  };

  const abrirNuevaJornada = () => {
    setFechaEnEdicion(null);
    setTipoFormulario(null);
    setErrorGuardado("");
    setFormulario({
      ...formularioInicial,
      fecha: fechaSeleccionada,
      fechaEntrega: fechaSeleccionada,
      idEncomienda: `ENC-${String(Object.keys(jornadas).length + 1).padStart(4, "0")}`,
    });
    setBusquedaLocal("");
    setErrorLocal("");
    setBusquedaCliente("");
    setErrorCliente("");
    setModalAbierto(true);
  };

  const abrirEdicion = () => {
    if (!jornada) return;

    setFechaEnEdicion(fechaSeleccionada);
    setTipoFormulario(jornada.tipo);
    setErrorGuardado("");
    setFormulario({
      ...formularioInicial,
      ...jornada,
      fecha: fechaSeleccionada,
      fechaEntrega: jornada.fechaEntrega || fechaSeleccionada,
    });
    const localSeleccionado = locales.find((local) => local.id === jornada.idLocal);
    const clienteSeleccionado = clientes.find((cliente) => cliente.id === jornada.idCliente);
    setBusquedaLocal(localSeleccionado ? localSeleccionado.nombre : "");
    setErrorLocal("");
    setBusquedaCliente(clienteSeleccionado ? clienteSeleccionado.nombre : "");
    setErrorCliente("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTipoFormulario(null);
  };

  const actualizarFormulario = (evento) => {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const actualizarBusquedaLocal = (evento) => {
    setBusquedaLocal(evento.target.value);
    setErrorLocal("");
    setFormulario((actual) => ({ ...actual, idLocal: "" }));
  };

  const seleccionarLocal = (local) => {
    setBusquedaLocal(local.nombre);
    setErrorLocal("");
    setFormulario((actual) => ({ ...actual, idLocal: local.id }));
  };

  const actualizarBusquedaCliente = (evento) => {
    setBusquedaCliente(evento.target.value);
    setErrorCliente("");
    setFormulario((actual) => ({ ...actual, idCliente: "" }));
  };

  const seleccionarCliente = (cliente) => {
    setBusquedaCliente(cliente.nombre);
    setErrorCliente("");
    setFormulario((actual) => ({ ...actual, idCliente: cliente.id }));
  };

  const guardarJornada = async (evento) => {
    evento.preventDefault();

    if (tipoFormulario === "encomiendas" && !formulario.idLocal) {
      setErrorLocal("Seleccioná un local de la lista para continuar.");
      return;
    }

    if (tipoFormulario === "encomiendas" && !formulario.idCliente) {
      setErrorCliente("Seleccioná un cliente de la lista para continuar.");
      return;
    }

    if (tipoFormulario === "encomiendas" && totalPaquetes < 1) {
      return;
    }

    const fecha = formulario.fecha;
    let viajePersistido = null;

    if (tipoFormulario === "pasajeros") {
      setGuardando(true);
      setErrorGuardado("");
      try {
        viajePersistido = await guardarViaje(jornada?.id, {
          fecha,
          horario: formulario.horario,
          origen: formulario.origen,
          destino: formulario.destino,
          capacidad: formulario.capacidad,
          precio: formulario.precio,
        });
      } catch (error) {
        setErrorGuardado(error.message);
        setGuardando(false);
        return;
      }
      setGuardando(false);
    }

    const jornadaGuardada = {
      ...formulario,
      id: viajePersistido?.id ?? jornada?.id,
      tipo: tipoFormulario,
      cantidadPaquetes: totalPaquetes,
      ocupados: viajePersistido?.asientos_ocupados.length ?? (fechaEnEdicion ? jornada.ocupados || 0 : 0),
      precio: viajePersistido?.precio ?? formulario.precio,
      pesoActual: fechaEnEdicion ? jornada.pesoActual || 0 : 0,
      pesoMaximo: 500,
      encomiendas: tipoFormulario === "encomiendas"
        ? [
            {
              ...formulario,
              tipo: undefined,
              cliente: busquedaCliente,
              local: busquedaLocal,
              localidadEntrega: formulario.destino,
            },
          ]
        : undefined,
    };

    setJornadas((actuales) => ({
      ...actuales,
      [fecha]: jornadaGuardada,
    }));
    setFechaSeleccionada(fecha);
    setMesActual({
      año: Number(fecha.slice(0, 4)),
      mes: Number(fecha.slice(5, 7)) - 1,
    });
    cerrarModal();
  };

  const jornada = jornadas[fechaSeleccionada];
  const encomiendasDeJornada = jornada?.encomiendas || (jornada?.tipo === "encomiendas" ? [jornada] : []);

  return (
    <div className={styles.turnero}>

      {/* ENCABEZADO */}
      <div className={styles.turneroHeader}>
        <div>
          <h1>Turnero</h1>
          <p>Organización de jornadas de transporte</p>
        </div>

          <button className={styles.btnNueva} onClick={abrirNuevaJornada}>
          + Nueva jornada
        </button>
      </div>

      <div className={styles.turneroContenido}>

        {/* CALENDARIO */}
        <div className={styles.calendario}>

          <div className={styles.calendarioHeader}>
            <button
              type="button"
              className={styles.navegacionMes}
              onClick={() => cambiarMes(-1)}
              aria-label="Mes anterior"
            >
              ‹
            </button>

            <h2>
              {meses[mes]} {año}
            </h2>

            <button
              type="button"
              className={styles.navegacionMes}
              onClick={() => cambiarMes(1)}
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          <div className={styles.diasSemana}>
            {nombresDias.map((dia) => (
              <div key={dia}>{dia}</div>
            ))}
          </div>

          <div className={styles.diasGrid}>

            {/* ESPACIOS VACÍOS */}
            {Array.from({ length: espaciosIniciales }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className={`${styles.dia} ${styles.vacio}`}
              />
            ))}

            {/* DÍAS */}
            {Array.from({ length: diasDelMes }).map((_, index) => {

              const dia = index + 1;

              const fechaKey = `${año}-${String(mes + 1).padStart(
                2,
                "0"
              )}-${String(dia).padStart(2, "0")}`;

              const jornadaDia = jornadas[fechaKey];

              const seleccionado = fechaSeleccionada === fechaKey;

              return (
                <div
                  key={fechaKey}
                  className={`${styles.dia} ${seleccionado ? styles.seleccionado : ""}`}
                  onClick={() => seleccionarDia(dia)}
                >

                  <span className={styles.numeroDia}>
                    {dia}
                  </span>

                  {jornadaDia && (
                    <div
                      className={`${styles.jornada} ${styles[jornadaDia.tipo]}`}
                    >

                      {jornadaDia.tipo === "pasajeros" ? (
                        <>
                          <span>🚐 Pasajeros</span>

                          <small>
                            {jornadaDia.ocupados}/
                            {jornadaDia.capacidad}
                          </small>
                        </>
                      ) : (
                        <>
                          <span>📦 Encomiendas</span>

                          <small>
                            {jornadaDia.cantidadPaquetes || 0} paquetes
                          </small>
                        </>
                      )}

                    </div>
                  )}

                </div>
              );
            })}

          </div>

          {/* REFERENCIAS */}
            <div className={styles.referencias}>

            <div>
              <span className={`${styles.punto} ${styles.pasajeros}`} />
              Pasajeros
            </div>

            <div>
              <span className={`${styles.punto} ${styles.encomiendas}`} />
              Encomiendas
            </div>

          </div>

        </div>

        {/* DETALLE */}
        <div className={styles.detalle}>

          <h2>Detalle de jornada</h2>

          {!jornada ? (
            <div className={styles.sinJornada}>
              <div>📅</div>

              <p>
                No hay ninguna jornada programada
                para este día.
              </p>

              <button className={styles.btnNueva} onClick={abrirNuevaJornada}>
                + Crear jornada
              </button>
            </div>
          ) : (

            <>
              <div
                className={`${styles.tipoJornada} ${styles[jornada.tipo]}`}
              >
                {jornada.tipo === "pasajeros"
                  ? "🚐 Transporte de pasajeros"
                  : "📦 Transporte de encomiendas"}
              </div>

              <div className={styles.detalleInfo}>

                <div>
                  <span>Fecha</span>
                  <strong>
                    {fechaSeleccionada}
                  </strong>
                </div>

                <div>
                  <span>Horario</span>
                  <strong>
                    {jornada.horario}
                  </strong>
                </div>

                <div>
                  <span>Origen</span>
                  <strong>
                    {jornada.origen}
                  </strong>
                </div>

                <div>
                  <span>Destino</span>
                  <strong>
                    {jornada.destino}
                  </strong>
                </div>

              </div>

              {jornada.tipo === "pasajeros" ? (

                <div className={styles.capacidad}>

                  <div className={styles.capacidadHeader}>
                    <span>Capacidad de la combi</span>

                    <strong>
                      {jornada.ocupados}/
                      {jornada.capacidad}
                    </strong>
                  </div>

                  <div className={styles.barra}>
                    <div
                      className={`${styles.barraProgreso} ${styles.pasajeros}`}
                      style={{
                        width: `${
                          (jornada.ocupados /
                            jornada.capacidad) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <p>
                    {jornada.capacidad -
                      jornada.ocupados}{" "}
                    asientos disponibles
                  </p>

                </div>

              ) : (

                  <div className={styles.capacidad}>

                  <div className={styles.capacidadHeader}>
                    <span>
                      Capacidad de encomiendas
                    </span>

                    <strong>
                      {jornada.pesoActual}/
                      {jornada.pesoMaximo} kg
                    </strong>
                  </div>

                  <div className={styles.barra}>
                    <div
                      className={`${styles.barraProgreso} ${styles.encomiendas}`}
                      style={{
                        width: `${
                          (jornada.pesoActual /
                            jornada.pesoMaximo) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <p>
                    {jornada.pesoMaximo -
                      jornada.pesoActual}{" "}
                    kg disponibles
                  </p>

                </div>

              )}

              <div className={styles.acciones}>

                <button className={styles.btnSecundario} onClick={() => setDetalleAbierto(true)}>
                  Ver detalle
                </button>

                <button className={styles.btnNueva} onClick={abrirEdicion}>
                  Editar jornada
                </button>

              </div>

            </>

          )}

        </div>

      </div>

      {modalAbierto && (
        <div className={styles.modalFondo} onMouseDown={cerrarModal}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>
                  {fechaEnEdicion ? "Editar jornada" : "Nueva jornada"}
                </span>
                <h2 id="titulo-formulario">
                  {tipoFormulario ? "Datos de la jornada" : "¿Qué tipo de jornada vas a crear?"}
                </h2>
              </div>
              <button type="button" className={styles.btnCerrar} onClick={cerrarModal} aria-label="Cerrar">
                ×
              </button>
            </div>

            {!tipoFormulario ? (
              <div className={styles.selectorTipo}>
                <button type="button" className={styles.opcionTipo} onClick={() => setTipoFormulario("encomiendas")}>
                  <span className={`${styles.iconoTipo} ${styles.encomiendas}`}>📦</span>
                  <strong>Encomienda</strong>
                  <small>Paquetes, entrega y costos de envío</small>
                </button>
                <button type="button" className={styles.opcionTipo} onClick={() => setTipoFormulario("pasajeros")}>
                  <span className={`${styles.iconoTipo} ${styles.pasajeros}`}>🚐</span>
                  <strong>Transporte de pasajeros</strong>
                  <small>Horarios, recorrido y capacidad</small>
                </button>
              </div>
            ) : (
              <form className={styles.formulario} onSubmit={guardarJornada}>
                <div className={styles.formularioTipo}>
                  <span className={`${styles.punto} ${styles[tipoFormulario]}`} />
                  {tipoFormulario === "encomiendas" ? "Formulario de encomienda" : "Formulario de transporte de pasajeros"}
                  <button type="button" onClick={() => setTipoFormulario(null)}>Cambiar tipo</button>
                </div>

                <div className={styles.camposComunes}>
                  <label>Fecha de jornada<input type="date" name="fecha" value={formulario.fecha} onChange={actualizarFormulario} required /></label>
                  <label>Horario<input type="time" name="horario" value={formulario.horario} onChange={actualizarFormulario} required /></label>
                  <label>Origen<input name="origen" value={formulario.origen} onChange={actualizarFormulario} placeholder="Ej. Avellaneda" required /></label>
                  <label>Destino<input name="destino" value={formulario.destino} onChange={actualizarFormulario} placeholder="Ej. Reconquista" required /></label>
                </div>

                {tipoFormulario === "pasajeros" ? (
                  <div className={styles.camposEspecificos}>
                    <h3>Capacidad</h3>
                    <label>Capacidad total<input type="number" name="capacidad" min="1" value={formulario.capacidad} onChange={actualizarFormulario} required /></label>
                    <label>Precio por pasajero<input type="number" name="precio" min="0.01" step="0.01" value={formulario.precio} onChange={actualizarFormulario} required /></label>
                  </div>
                ) : (
                  <div className={styles.camposEspecificos}>
                    <h3>Datos de la encomienda</h3>
                    <div className={styles.grillaCampos}>
                      <label>ID Encomienda<input name="idEncomienda" value={formulario.idEncomienda} readOnly /></label>
                      <div className={styles.campoBusqueda}>
                        <label htmlFor="busqueda-cliente">Cliente</label>
                        <div className={styles.buscadorLocal}>
                          <input
                            id="busqueda-cliente"
                            value={busquedaCliente}
                            onChange={actualizarBusquedaCliente}
                            placeholder="Buscar por nombre, ID o DNI"
                            autoComplete="off"
                            required
                          />
                          {busquedaCliente && !formulario.idCliente && (
                            <div className={styles.resultadosLocales}>
                              {clientes
                                .filter((cliente) => {
                                  const texto = `${cliente.id} ${cliente.nombre} ${cliente.documento}`.toLowerCase();
                                  return texto.includes(busquedaCliente.toLowerCase());
                                })
                                .map((cliente) => (
                                  <button
                                    type="button"
                                    className={styles.resultadoLocal}
                                    key={cliente.id}
                                    onClick={() => seleccionarCliente(cliente)}
                                  >
                                    <strong>{cliente.nombre}</strong>
                                    <span>{cliente.id} · {cliente.documento}</span>
                                  </button>
                                ))}
                              {clientes.every((cliente) => {
                                const texto = `${cliente.id} ${cliente.nombre} ${cliente.documento}`.toLowerCase();
                                return !texto.includes(busquedaCliente.toLowerCase());
                              }) && <p className={styles.sinResultados}>No se encontraron clientes.</p>}
                            </div>
                          )}
                        </div>
                        {formulario.idCliente && (
                          <small className={styles.localSeleccionado}>Cliente seleccionado: {formulario.idCliente}</small>
                        )}
                        {errorCliente && <small className={styles.errorCampo}>{errorCliente}</small>}
                      </div>
                      <div className={`${styles.campoBusqueda} ${styles.campoAncho}`}>
                        <label htmlFor="busqueda-local">Local de origen</label>
                        <div className={styles.buscadorLocal}>
                          <input
                            id="busqueda-local"
                            value={busquedaLocal}
                            onChange={actualizarBusquedaLocal}
                            placeholder="Buscar por nombre, ID o dirección"
                            autoComplete="off"
                            required
                          />
                          {busquedaLocal && !formulario.idLocal && (
                            <div className={styles.resultadosLocales}>
                              {locales
                                .filter((local) => {
                                  const texto = `${local.id} ${local.nombre} ${local.direccion}`.toLowerCase();
                                  return texto.includes(busquedaLocal.toLowerCase());
                                })
                                .map((local) => (
                                  <button
                                    type="button"
                                    className={styles.resultadoLocal}
                                    key={local.id}
                                    onClick={() => seleccionarLocal(local)}
                                  >
                                    <strong>{local.nombre}</strong>
                                    <span>{local.id} · {local.direccion}</span>
                                  </button>
                                ))}
                              {locales.every((local) => {
                                const texto = `${local.id} ${local.nombre} ${local.direccion}`.toLowerCase();
                                return !texto.includes(busquedaLocal.toLowerCase());
                              }) && <p className={styles.sinResultados}>No se encontraron locales.</p>}
                            </div>
                          )}
                        </div>
                        {formulario.idLocal && (
                          <small className={styles.localSeleccionado}>Local seleccionado: {formulario.idLocal}</small>
                        )}
                        {errorLocal && <small className={styles.errorCampo}>{errorLocal}</small>}
                      </div>
                      <label>Estado<select name="estado" value={formulario.estado} onChange={actualizarFormulario}><option>Pendiente</option><option>En preparación</option><option>En tránsito</option><option>Entregada</option></select></label>
                      <label>Cantidad de paquetes<input type="number" name="cantidadPaquetes" min="1" value={formulario.tamañoAprox === "Mixto" ? totalPaquetes : formulario.cantidadPaquetes} onChange={actualizarFormulario} readOnly={formulario.tamañoAprox === "Mixto"} required /></label>
                      <label>Tamaño aproximado<select name="tamañoAprox" value={formulario.tamañoAprox} onChange={actualizarFormulario}><option>Pequeño</option><option>Mediano</option><option>Grande</option><option>Mixto</option></select></label>
                      {formulario.tamañoAprox === "Mixto" && (
                        <div className={`${styles.composicionPaquetes} ${styles.campoAncho}`}>
                          <span>Composición de la encomienda</span>
                          <div className={styles.grillaCampos}>
                            <label>Paquetes pequeños<input type="number" name="paquetesPequeños" min="0" value={formulario.paquetesPequeños} onChange={actualizarFormulario} /></label>
                            <label>Paquetes medianos<input type="number" name="paquetesMedianos" min="0" value={formulario.paquetesMedianos} onChange={actualizarFormulario} /></label>
                            <label>Paquetes grandes<input type="number" name="paquetesGrandes" min="0" value={formulario.paquetesGrandes} onChange={actualizarFormulario} /></label>
                          </div>
                          <small>{totalPaquetes} paquetes · {unidadesDeCarga} unidades de carga estimadas</small>
                        </div>
                      )}
                      <label>Costo de envío<input type="number" name="costoEnvio" min="0" value={formulario.costoEnvio} onChange={actualizarFormulario} placeholder="$ 0" required /></label>
                      <label className={styles.campoAncho}>Dirección de entrega<input name="direccionEntrega" value={formulario.direccionEntrega} onChange={actualizarFormulario} placeholder="Calle y altura, localidad" required /></label>
                      <label>Fecha de entrega<input type="date" name="fechaEntrega" value={formulario.fechaEntrega} onChange={actualizarFormulario} required /></label>
                      <label className={styles.campoAncho}>Observaciones<textarea name="observaciones" value={formulario.observaciones} onChange={actualizarFormulario} rows="2" placeholder="Información adicional" /></label>
                    </div>
                  </div>
                )}

                <div className={styles.accionesModal}>
                  <button type="button" className={styles.btnSecundario} onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className={styles.btnNueva} disabled={guardando}>
                    {guardando ? "Guardando..." : fechaEnEdicion ? "Guardar cambios" : "Crear jornada"}
                  </button>
                </div>
                {errorGuardado && <p className={styles.errorCampo} role="alert">{errorGuardado}</p>}
              </form>
            )}
          </section>
        </div>
      )}

      {detalleAbierto && jornada?.tipo === "encomiendas" && (
        <div className={styles.modalFondo} onMouseDown={() => setDetalleAbierto(false)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalle-encomiendas"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>Detalle operativo</span>
                <h2 id="titulo-detalle-encomiendas">Encomiendas del viaje a {jornada.destino}</h2>
              </div>
              <button type="button" className={styles.btnCerrar} onClick={() => setDetalleAbierto(false)} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className={styles.resumenRuta}>
              <span>Retiro: <strong>{jornada.origen}</strong></span>
              <span>Viaje: <strong>{jornada.destino}</strong></span>
              <span>{encomiendasDeJornada.length} envíos registrados</span>
            </div>

            <div className={styles.listaEncomiendas}>
              {encomiendasDeJornada.map((encomienda) => {
                const localRetiro = locales.find((local) => local.id === encomienda.idLocal);

                return (
                <article className={styles.tarjetaEncomienda} key={encomienda.idEncomienda}>
                  <div className={styles.encabezadoEncomienda}>
                    <div>
                      <strong>{encomienda.idEncomienda}</strong>
                      <span>{encomienda.cliente || encomienda.idCliente}</span>
                    </div>
                    <span className={styles.estadoEncomienda}>{encomienda.estado}</span>
                  </div>
                  <div className={styles.detalleEncomienda}>
                    <div>
                      <span>Retirar en</span>
                      <strong>{encomienda.local || localRetiro?.nombre || encomienda.idLocal}</strong>
                      <small>{encomienda.idLocal}</small>
                    </div>
                    <div><span>Dirección del local</span><strong>{localRetiro?.direccion || "Dirección no disponible"}</strong></div>
                    <div><span>Entregar en</span><strong>{encomienda.direccionEntrega}</strong></div>
                    <div><span>Localidad</span><strong>{encomienda.localidadEntrega || jornada.destino}</strong></div>
                    <div><span>Carga</span><strong>{encomienda.cantidadPaquetes} paquetes · {encomienda.tamañoAprox}</strong></div>
                  </div>
                </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Turnero;