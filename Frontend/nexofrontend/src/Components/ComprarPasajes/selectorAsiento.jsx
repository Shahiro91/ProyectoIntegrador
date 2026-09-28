import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ComprarPasaje.module.css";
import { obtenerViajes } from "../../services/viajesService";

function formatDate(date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

function ComprarPasaje() {
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [tripsError, setTripsError] = useState("");

  useEffect(() => {
    let isActive = true;

    obtenerViajes()
      .then((availableTrips) => {
        if (!isActive) return;
        setTrips(availableTrips);
        setSelectedTripId(availableTrips[0] ? String(availableTrips[0].id) : "");
      })
      .catch((error) => {
        if (isActive) setTripsError(error.message);
      })
      .finally(() => {
        if (isActive) setLoadingTrips(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const selectedTrip = trips.find((trip) => trip.id === Number(selectedTripId));
  const seats = selectedTrip
    ? Array.from({ length: selectedTrip.capacidad_total }, (_, index) => ({
        id: index + 1,
        occupied: selectedTrip.asientos_ocupados.includes(index + 1),
      }))
    : [];
  const seatRows = Array.from({ length: Math.ceil(seats.length / 4) }, (_, index) =>
    seats.slice(index * 4, index * 4 + 4),
  );
  const price = Number(selectedTrip?.precio ?? 0);

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
          <button
            type="button"
            className={styles["back-button"]}
            aria-label="Volver a transporte de pasajeros"
            onClick={() => navigate("/passengers")}
          >
            ‹
          </button>
        </div>

        <div>
          <h1>Elegí tu asiento</h1>
          <p>Seleccioná la butaca para tu viaje</p>
        </div>
      </div>

      <div className={styles["trip-selector"]}>
        <label htmlFor="trip-choice">Viaje</label>
        <select
          id="trip-choice"
          value={selectedTripId}
          disabled={loadingTrips || trips.length === 0}
          onChange={(event) => {
            setSelectedTripId(event.target.value);
            setSelectedSeats([]);
          }}
        >
          {trips.length === 0 && <option value="">No hay viajes disponibles</option>}
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {formatDate(trip.fecha_salida)} · {trip.horario_salida} · {trip.origen} → {trip.destino}
            </option>
          ))}
        </select>
        {loadingTrips && <p className={styles["trip-message"]}>Cargando viajes...</p>}
        {!loadingTrips && tripsError && <p className={styles["trip-message"]}>{tripsError}</p>}
        {!loadingTrips && !tripsError && trips.length === 0 && (
          <p className={styles["trip-message"]}>Todavía no hay viajes publicados para reservar.</p>
        )}
      </div>


      {/* CONTENIDO */}
      <div className={styles["pasaje-content"]}>

        {/* MAPA DE ASIENTOS */}
        <div className={styles["seat-card"]}>

          <div className={styles["seat-header"]}>
            <div>
              <h2>Elegí tu butaca</h2>
              <p>
                {selectedTrip
                  ? `Combi NEXO · ${selectedTrip.capacidad_total} pasajeros`
                  : "Elegí un viaje para ver sus asientos"}
              </p>
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

              {seatRows.map((row, rowIndex) => (
                <div
                  className={`${styles["seat-row"]} ${row.length < 4 ? styles["last-seat-row"] : ""}`}
                  key={`row-${rowIndex}`}
                >
                  {row.map((seat) => {
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

            </div>

          </div>

        </div>


        {/* RESUMEN */}
        <div className={styles["summary-card"]}>

          <h2>Resumen del viaje</h2>

          <div className={styles["summary-route"]}>
            <div>
              <span>Origen</span>
              <strong>{selectedTrip?.origen ?? "-"}</strong>
            </div>

            <span className={styles["summary-arrow"]}>→</span>

            <div>
              <span>Destino</span>
              <strong>{selectedTrip?.destino ?? "-"}</strong>
            </div>
          </div>


          <div className={styles["summary-line"]}>
            <span>Fecha</span>
            <strong>{selectedTrip ? formatDate(selectedTrip.fecha_salida) : "-"}</strong>
          </div>

          <div className={styles["summary-line"]}>
            <span>Horario</span>
            <strong>{selectedTrip ? `${selectedTrip.horario_salida} hs` : "-"}</strong>
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
            disabled={!selectedTrip || selectedSeats.length === 0}
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