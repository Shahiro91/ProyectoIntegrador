import { useState } from "react";
import styles from "./Turnero.module.css";

const jornadas = {
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
    pesoActual: 320,
    pesoMaximo: 500,
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
    pesoActual: 180,
    pesoMaximo: 500,
  },
};

function Turnero() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState("2026-09-01");

  const fecha = new Date(2026, 8, 1);

  const año = fecha.getFullYear();
  const mes = fecha.getMonth();

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

  const jornada = jornadas[fechaSeleccionada];

  return (
    <div className={styles.turnero}>

      {/* ENCABEZADO */}
      <div className={styles.turneroHeader}>
        <div>
          <h1>Turnero</h1>
          <p>Organización de jornadas de transporte</p>
        </div>

        <button className={styles.btnNueva}>
          + Nueva jornada
        </button>
      </div>

      <div className={styles.turneroContenido}>

        {/* CALENDARIO */}
        <div className={styles.calendario}>

          <div className={styles.calendarioHeader}>
            <button>‹</button>

            <h2>
              {meses[mes]} {año}
            </h2>

            <button>›</button>
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
                            {jornadaDia.pesoActual}/
                            {jornadaDia.pesoMaximo} kg
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

              <button className={styles.btnNueva}>
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

                <button className={styles.btnSecundario}>
                  Ver detalle
                </button>

                <button className={styles.btnNueva}>
                  Editar jornada
                </button>

              </div>

            </>

          )}

        </div>

      </div>
    </div>
  );
}

export default Turnero;