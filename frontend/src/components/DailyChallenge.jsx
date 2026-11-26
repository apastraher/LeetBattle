import { useEffect, useRef, useState } from 'react';
import { getDailyChallenge } from '../api/ejercicios.js';

const difficulties = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' };

export default function DailyChallenge() {
  const [reto, setReto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const dialogRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getDailyChallenge(controller.signal)
      .then((value) => { if (!controller.signal.aborted) setReto(value); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  return (
    <>
      <section id="reto-diario" className="daily-challenge" aria-labelledby="daily-title" aria-busy={loading} tabIndex={-1}>
        <span className="challenge-tape" aria-hidden="true" />
        <div className="challenge-heading"><h2 id="daily-title">Reto diario</h2><span aria-hidden="true">{'{ }'}</span></div>
        {loading ? <p className="challenge-message" role="status">Preparando tu próximo reto…</p>
          : error ? <div className="challenge-message">
            <p className="form-error" role="alert">{error}</p>
            <button className="secondary-button" onClick={() => setAttempt(attempt + 1)}>Volver a intentar</button>
          </div>
            : reto && <>
              <div className="challenge-meta"><span className={`difficulty difficulty-${reto.dificultad}`}>{difficulties[reto.dificultad]}</span>
                <span>Práctica de programación</span>
              </div>
              <h3>{reto.titulo}</h3>
              <p className="challenge-description">{reto.enunciado}</p>
              {reto.ejemplos[0] && <div className="challenge-preview" aria-label="Vista previa del ejemplo">
                <div><p>Entrada</p><pre><code>{reto.ejemplos[0].entrada}</code></pre></div>
                <div><p>Salida</p><pre><code>{reto.ejemplos[0].salida}</code></pre></div>
              </div>}
              <button className="secondary-button challenge-button" onClick={() => dialogRef.current.showModal()}>
                Aceptar reto <span aria-hidden="true">→</span>
              </button>
            </>}
      </section>
      {reto && <dialog ref={dialogRef} className="exercise-dialog" aria-labelledby="exercise-title"
        onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
        <div className="exercise-dialog-content">
          <div className="exercise-heading">
            <p className="eyebrow">Reto diario · {difficulties[reto.dificultad]}</p>
            <form method="dialog"><button className="dialog-close" aria-label="Cerrar reto" autoFocus>×</button></form>
          </div>
          <h2 id="exercise-title">{reto.titulo}</h2>
          <p>{reto.enunciado}</p>
          {reto.descripcion_entrada && <><h3>Entrada</h3><p>{reto.descripcion_entrada}</p></>}
          {reto.descripcion_salida && <><h3>Salida</h3><p>{reto.descripcion_salida}</p></>}
          {reto.ejemplos.map((ejemplo, index) => <div className="exercise-example" key={index}>
            <div><h3>Entrada de ejemplo</h3><pre><code>{ejemplo.entrada}</code></pre></div>
            <div><h3>Salida de ejemplo</h3><pre><code>{ejemplo.salida}</code></pre></div>
          </div>)}
          {reto.fuente === 'aceptaelreto.com' && <p className="exercise-credit">Basado en el ejercicio {reto.id_en_fuente} de ¡Acepta el reto!</p>}
          <p className="exercise-note">La resolución y el envío de soluciones estarán disponibles próximamente.</p>
        </div>
      </dialog>}
    </>
  );
}
