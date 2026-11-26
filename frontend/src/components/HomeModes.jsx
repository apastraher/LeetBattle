function ModeIcon({ type }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'practica' && <><path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18" /></>}
    {type === 'duelos' && <><path d="m5 3 16 16-2 2L3 5V3h2Zm14 0L3 19l2 2L21 5V3h-2ZM2 16l6 6m8 0 6-6" /></>}
    {type === 'clasificacion' && <><path d="M4 21V11h5v10m1 0V4h5v17m1 0v-7h5v7M2 21h21" /></>}
  </svg>;
}

export default function HomeModes({ onFeature }) {
  return (
    <section className="home-modes" aria-labelledby="modes-title">
      <div className="modes-heading">
        <div><p className="eyebrow">PASO A PASO, RETO A RETO</p><h2 id="modes-title">Cada reto cuenta.</h2></div>
        <p>Entrena tu lógica y prepárate para el siguiente nivel.</p>
      </div>
      <div className="mode-grid">
        <article className="mode-card">
          <div className="mode-card-top"><span className="mode-icon"><ModeIcon type="practica" /></span><span className="mode-label">Empieza aquí</span></div>
          <h3>Un poco mejor cada día</h3>
          <p>Explora el reto diario, entiende los ejemplos y encuentra tu forma de resolverlo.</p>
          <a className="mode-action" href="#reto-diario">Ir al reto diario <span aria-hidden="true">→</span></a>
        </article>
        <article className="mode-card">
          <div className="mode-card-top"><span className="mode-icon"><ModeIcon type="duelos" /></span><span className="mode-label">Próximamente</span></div>
          <h3>Dos rivales. Un desafío.</h3>
          <p>Pon a prueba tu ingenio en duelos 1v1. El mismo problema y una carrera por la solución.</p>
          <button className="mode-action" onClick={() => onFeature('duelos')}>Conocer los duelos <span aria-hidden="true">→</span></button>
        </article>
        <article className="mode-card">
          <div className="mode-card-top"><span className="mode-icon"><ModeIcon type="clasificacion" /></span><span className="mode-label">Próximamente</span></div>
          <h3>Hazte un sitio en la cima</h3>
          <p>Los duelos pondrán a prueba tu nivel. Suma puntos y encuentra tu lugar en la clasificación.</p>
          <button className="mode-action" onClick={() => onFeature('clasificacion')}>Ver la clasificación <span aria-hidden="true">→</span></button>
        </article>
      </div>
    </section>
  );
}
