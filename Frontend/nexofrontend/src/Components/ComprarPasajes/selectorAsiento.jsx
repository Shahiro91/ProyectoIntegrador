import { useState } from "react";
import styles from "./ComprarPasaje.module.css";

const seats = [
  { id: 1, occupied: false },
  { id: 2, occupied: true },
  { id: 3, occupied: false },
  { id: 4, occupied: false },

  { id: 5, occupied: false },
  { id: 6, occupied: false },
  { id: 7, occupied: true },
  { id: 8, occupied: false },

  { id: 9, occupied: false },
  { id: 10, occupied: true },
  { id: 11, occupied: false },
  { id: 12, occupied: false },

  { id: 13, occupied: false },
  { id: 14, occupied: false },
  { id: 15, occupied: true },
  { id: 16, occupied: false },

  { id: 17, occupied: false },
  { id: 18, occupied: false },
];

const rearSeat = { id: 19, occupied: false };

function ComprarPasaje() {
  const [selectedSeats, setSelectedSeats] = useState([]);

  const price = 8500;

  const toggleSeat = (seat) => {
    if (seat.occupied) return;

    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(
        selectedSeats.filter((id) => id !== seat.id)
      );
    } else {
      setSelectedSeats([...selectedSeats, seat.id]);
    }
  };

  const total = selectedSeats.length * price;

  return (
    <div className={styles["pasaje-page"]}>

      {/* ENCABEZADO */}
      <div className={styles["pasaje-header"]}>
        <div>
          <button className={styles["back-button"]}>‹</button>
        </div>

        <div>
          <h1>Elegí tu asiento</h1>
          <p>Seleccioná la butaca para tu viaje</p>
        </div>
      </div>


      {/* CONTENIDO */}
      <div className={styles["pasaje-content"]}>

        {/* MAPA DE ASIENTOS */}
        <div className={styles["seat-card"]}>

          <div className={styles["seat-header"]}>
            <div>
              <h2>Elegí tu butaca</h2>
              <p>Combi NEXO · 19 pasajeros</p>
            </div>

            <div className={styles.legend}>
              <div>
                <span className={`${styles["legend-seat"]} ${styles.available}`}></span>
                Disponible
              </div>

              <div>
                <span className={`${styles["legend-seat"]} ${styles.selected}`}></span>
                Seleccionado
              </div>

              <div>
                <span className={`${styles["legend-seat"]} ${styles.occupied}`}></span>
                Ocupado
              </div>
            </div>
          </div>


          {/* COMBI */}
          <div className={styles.van}>

            {/* FRENTE */}
            <div className={styles["van-front"]}>
              <div className={styles["driver-seat"]}>
                🚗
              </div>
              <span>Conductor</span>
            </div>


            {/* ASIENTOS */}
            <div className={styles["seats-grid"]}>

              {Array.from({ length: 4 }, (_, rowIndex) => (
                <div className={styles["seat-row"]} key={`row-${rowIndex}`}>
                  {seats.slice(rowIndex * 4, rowIndex * 4 + 4).map((seat) => {
                    const isSelected = selectedSeats.includes(seat.id);

                    return (
                      <button
                        key={seat.id}
                        disabled={seat.occupied}
                        onClick={() => toggleSeat(seat)}
                        className={`${styles.seat} ${seat.occupied ? styles.occupied : ""} ${isSelected ? styles.selected : ""}`}
                      >
                        {seat.id}
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className={`${styles["seat-row"]} ${styles["last-seat-row"]}`}>
                {seats.slice(16).map((seat) => {
                  const isSelected = selectedSeats.includes(seat.id);

                  return (
                    <button
                      key={seat.id}
                      disabled={seat.occupied}
                      onClick={() => toggleSeat(seat)}
                      className={`${styles.seat} ${seat.occupied ? styles.occupied : ""} ${isSelected ? styles.selected : ""}`}
                    >
                      {seat.id}
                    </button>
                  );
                })}
                <button
                  className={`${styles.seat} ${rearSeat.occupied ? styles.occupied : ""} ${selectedSeats.includes(rearSeat.id) ? styles.selected : ""}`}
                  disabled={rearSeat.occupied}
                  onClick={() => toggleSeat(rearSeat)}
                >
                  {rearSeat.id}
                </button>
              </div>

            </div>

          </div>

        </div>


        {/* RESUMEN */}
        <div className={styles["summary-card"]}>

          <h2>Resumen del viaje</h2>

          <div className={styles["summary-route"]}>
            <div>
              <span>Origen</span>
              <strong>Avellaneda</strong>
            </div>

            <span className={styles["summary-arrow"]}>→</span>

            <div>
              <span>Destino</span>
              <strong>Reconquista</strong>
            </div>
          </div>


          <div className={styles["summary-line"]}>
            <span>Fecha</span>
            <strong>02/09/2026</strong>
          </div>

          <div className={styles["summary-line"]}>
            <span>Horario</span>
            <strong>10:00 hs</strong>
          </div>


          <div className={styles["summary-line"]}>
            <span>Butacas</span>

            <strong>
              {selectedSeats.length > 0
                ? selectedSeats.join(", ")
                : "Ninguna"}
            </strong>
          </div>


          <div className={styles["summary-divider"]}></div>


          <div className={styles["price-row"]}>
            <span>Precio por persona</span>
            <strong>${price.toLocaleString("es-AR")}</strong>
          </div>

          <div className={`${styles["price-row"]} ${styles.total}`}>
            <span>Total</span>
            <strong>
              ${total.toLocaleString("es-AR")}
            </strong>
          </div>


          <button
            className={styles["continue-button"]}
            disabled={selectedSeats.length === 0}
          >
            Continuar
          </button>

          {selectedSeats.length === 0 && (
            <p className={styles["select-message"]}>
              Seleccioná al menos una butaca para continuar.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

export default ComprarPasaje;