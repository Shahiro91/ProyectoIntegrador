import { useEffect, useState } from "react";
import styles from "./Turnero.module.css";
import { guardarViaje, obtenerViajes } from "../../services/viajesService";
import {
  guardarJornadaEncomienda,
  obtenerJornadasEncomienda,
  obtenerSolicitudesTurnero,
} from "../../services/turneroEncomiendasService";

const jornadasIniciales = {};

const formularioInicial = {
  fecha: "",
  horario: "08:00",
  origen: "",
  destino: "",
  capacidad: 19,
  precio: "8500.00",
  capacidadKg: "500",
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
  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const [jornadas, setJornadas] = useState(jornadasIniciales);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaHoy);
  const [mesActual, setMesActual] = useState({ año: hoy.getFullYear(), mes: hoy.getMonth() });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoFormulario, setTipoFormulario] = useState(null);
  const [fechaEnEdicion, setFechaEnEdicion] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errorGuardado, setErrorGuardado] = useState("");
  const [guardando, setGuardando] = useState(false);
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

  useEffect(() => {
    let isActive = true;

    Promise.all([obtenerJornadasEncomienda(), obtenerSolicitudesTurnero()])
      .then(([items, solicitudes]) => {
        if (!isActive) return;
        const jornadasEncomienda = Object.fromEntries(
          items.map((item) => {
            const envios = solicitudes.filter((solicitud) => solicitud.jornada_encomienda === item.id);
            return [item.fecha, {
              id: item.id,
              tipo: "encomiendas",
              horario: item.horario,
              origen: item.origen,
              destino: item.destino,
              cantidadPaquetes: envios.length,
              pesoActual: Number(item.peso_asignado),
              pesoMaximo: Number(item.capacidad_kg),
              encomiendas: envios,
            }];
          }),
        );
        setJornadas((actuales) => ({ ...jornadasEncomienda, ...actuales }));
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
    });
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
      capacidadKg: jornada.tipo === "encomiendas" ? String(jornada.pesoMaximo) : formularioInicial.capacidadKg,
      fecha: fechaSeleccionada,
    });
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

  const guardarJornada = async (evento) => {
    evento.preventDefault();

    const fecha = formulario.fecha;
    const idExistente = fechaEnEdicion && jornada?.tipo === tipoFormulario ? jornada.id : undefined;
    let viajePersistido = null;
    let jornadaEncomienda = null;

    setGuardando(true);
    setErrorGuardado("");
    try {
      if (tipoFormulario === "pasajeros") {
        viajePersistido = await guardarViaje(idExistente, {
          fecha,
          horario: formulario.horario,
          origen: formulario.origen,
          destino: formulario.destino,
          capacidad: formulario.capacidad,
          precio: formulario.precio,
        });
      } else {
        jornadaEncomienda = await guardarJornadaEncomienda(idExistente, {
          fecha,
          horario: formulario.horario,
          origen: formulario.origen,
          destino: formulario.destino,
          capacidad_kg: formulario.capacidadKg,
        });
      }
    } catch (error) {
      setErrorGuardado(error.message);
      setGuardando(false);
      return;
    }
    setGuardando(false);

    const jornadaGuardada = {
      ...formulario,
      id: viajePersistido?.id ?? jornadaEncomienda?.id ?? idExistente,
      tipo: tipoFormulario,
      cantidadPaquetes: tipoFormulario === "encomiendas" ? (jornada?.encomiendas ?? []).length : 0,
      ocupados: viajePersistido?.asientos_ocupados.length ?? (fechaEnEdicion ? jornada.ocupados || 0 : 0),
      precio: viajePersistido?.precio ?? formulario.precio,
      pesoActual: fechaEnEdicion ? jornada.pesoActual || 0 : 0,
      pesoMaximo: Number(jornadaEncomienda?.capacidad_kg ?? 500),
      encomiendas: tipoFormulario === "encomiendas"
        ? (fechaEnEdicion ? jornada.encomiendas ?? [] : [])
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
  const encomiendasDeJornada = jornada?.encomiendas ?? [];

  const imprimirDetalle = () => {
    const escapar = (valor) => String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const filas = encomiendasDeJornada.map((envio, indice) => `
      <tr>
        <td>${indice + 1}</td>
        <td><strong>${escapar(envio.destino)}</strong><br>${escapar(envio.localidad_destino)} (CP ${escapar(envio.codigo_postal_destino)})</td>
        <td>${escapar(envio.nombre_destinatario)}<br>${escapar(envio.telefono_destinatario)}</td>
        <td>${escapar(envio.local_nombre)}<br>${escapar(envio.origen)}</td>
        <td>${escapar(envio.peso_kg)} kg<br>${escapar(envio.tamano)}</td>
        <td class="firma"></td>
      </tr>`).join("");

    const ventana = window.open("", "_blank");
    if (!ventana) {
      setErrorGuardado("El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes.");
      return;
    }

    ventana.document.write(`<!doctype html>
      <html lang="es"><head><meta charset="utf-8"><title>Encomiendas ${escapar(fechaSeleccionada)}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
        h1 { margin: 0 0 4px; font-size: 22px; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th, td { border: 1px solid #444; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background: #eee; }
        .firma { width: 120px; }
        tr { page-break-inside: avoid; }
      </style></head><body>
        <h1>Encomiendas: ${escapar(jornada.origen)} → ${escapar(jornada.destino)}</h1>
        <p>Fecha: <strong>${escapar(fechaSeleccionada)}</strong> · Horario: <strong>${escapar(jornada.horario)}</strong></p>
        <p>${encomiendasDeJornada.length} envíos · ${escapar(jornada.pesoActual)} / ${escapar(jornada.pesoMaximo)} kg</p>
        <table>
          <thead><tr><th>#</th><th>Destino</th><th>Recibe</th><th>Retirar en</th><th>Carga</th><th>Firma</th></tr></thead>
          <tbody>${filas || '<tr><td colspan="6">Sin envíos asignados.</td></tr>'}</tbody>
        </table>
      </body></html>`);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

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
                    <h3>Capacidad del vehículo</h3>
                    <label>Capacidad de carga (kg)<input type="number" name="capacidadKg" min="0.01" max="99999.99" step="0.01" value={formulario.capacidadKg} onChange={actualizarFormulario} required /></label>
                    <p className={styles.sinResultados}>
                      Los destinos específicos y los locales a visitar se cargan después, al agregar cada encomienda.
                    </p>
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
              <button type="button" className={styles.btnSecundario} onClick={imprimirDetalle}>
                🖨️ Imprimir
              </button>
              <button type="button" className={styles.btnCerrar} onClick={() => setDetalleAbierto(false)} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className={styles.resumenRuta}>
              <span>Retiro: <strong>{jornada.origen}</strong></span>
              <span>Viaje: <strong>{jornada.destino}</strong></span>
              <span>{encomiendasDeJornada.length} envíos asignados · {jornada.pesoActual} / {jornada.pesoMaximo} kg</span>
            </div>

            <div className={styles.listaEncomiendas}>
              {encomiendasDeJornada.length === 0 && (
                <p className={styles.sinResultados}>Todavía no hay envíos asignados a esta jornada.</p>
              )}
              {encomiendasDeJornada.map((encomienda) => (
                <article className={styles.tarjetaEncomienda} key={encomienda.id}>
                  <div className={styles.encabezadoEncomienda}>
                    <div>
                      <strong>Envío #{encomienda.id}</strong>
                      <span>{encomienda.cliente_nombre}</span>
                    </div>
                    <span className={styles.estadoEncomienda}>{encomienda.estado}</span>
                  </div>
                  <div className={styles.detalleEncomienda}>
                    <div><span>Retirar en</span><strong>{encomienda.local_nombre}</strong><small>{encomienda.origen}</small></div>
                    <div>
                      <span>Dirección de destino</span>
                      <strong>{encomienda.destino}</strong>
                      <small>{encomienda.localidad_destino} (CP {encomienda.codigo_postal_destino})</small>
                    </div>
                    <div><span>Recibe</span><strong>{encomienda.nombre_destinatario}</strong><small>{encomienda.telefono_destinatario}</small></div>
                    <div><span>Carga</span><strong>{encomienda.peso_kg} kg · {encomienda.tamano}</strong></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Turnero;