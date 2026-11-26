import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DailyChallenge from '../components/DailyChallenge.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import HomeModes from '../components/HomeModes.jsx';
import ProfileMenu from '../components/ProfileMenu.jsx';

const upcoming = {
  ejercicios: { title: 'Ejercicios', description: 'El catálogo de ejercicios estará disponible próximamente. Mientras tanto, puedes consultar el reto diario desde Inicio.' },
  clasificacion: { title: 'Clasificación', description: 'Aquí podrás comparar tu puntuación con la de otros programadores cuando estén disponibles los duelos.' },
  duelos: { title: 'Duelos 1v1', description: 'Pronto podrás desafiar a otros programadores y resolver retos en tiempo real. Por ahora, descubre el reto diario.' },
};

export default function HomePage({ user, onLogout }) {
  const dialogRef = useRef(null);
  const [feature, setFeature] = useState('duelos');
  useEffect(() => { document.title = 'Inicio · LeetBattle'; }, []);

  function showUpcoming(name) {
    setFeature(name);
    dialogRef.current.showModal();
  }

  return (
    <div id="inicio" className="home-shell min-h-dvh bg-lb-fondo text-lb-texto">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="home-header">
        <Link to="/" className="brand home-brand" aria-label="LeetBattle, inicio">
          <span className="brand-mark"><img src="/logo-leetbattle.png" alt="" width="1304" height="1212" /></span>
          <span>LeetBattle</span>
        </Link>
        <nav className="home-nav" aria-label="Navegación principal">
          <Link to="/" aria-current="page">Inicio</Link>
          <button onClick={() => showUpcoming('ejercicios')}>Ejercicios</button>
          <button onClick={() => showUpcoming('clasificacion')}>Clasificación</button>
        </nav>
        <div className="home-header-actions">
          <ThemeToggle />
          <ProfileMenu user={user} onLogout={onLogout} />
        </div>
      </header>
      <main id="contenido" className="home-content" tabIndex={-1}>
        <div className="home-hero">
          <section className="home-intro" aria-labelledby="home-title">
            <p className="hero-eyebrow">{user ? `Hola, ${user.alias}. ¿Un nuevo desafío?` : 'Tu siguiente desafío empieza aquí'}</p>
            <h1 id="home-title"><span>Piensa.</span><span>Programa.</span><span className="hero-accent">Compite.</span></h1>
            <p className="hero-description">Desafía a otros programadores<br className="hero-line-break" /> resolviendo retos en tiempo real.</p>
            {user
              ? <button className="primary-button bg-lb-accion text-lb-sobre-accion" onClick={() => showUpcoming('duelos')}>Entrar a competir <span aria-hidden="true">→</span></button>
              : <Link className="primary-button bg-lb-accion text-lb-sobre-accion" to="/iniciar-sesion">Entrar a competir <span aria-hidden="true">→</span></Link>}
            <p className="hero-caption">Practica a tu ritmo. Compite cuando estés listo.</p>
          </section>
          <DailyChallenge />
        </div>
        <HomeModes onFeature={showUpcoming} />
      </main>
      <footer className="home-footer">
        <span>LeetBattle</span>
        <p>Programación, práctica y duelos 1v1.</p>
        <a href="#inicio">Volver arriba <span aria-hidden="true">↑</span></a>
      </footer>
      <dialog ref={dialogRef} className="recovery-dialog feature-dialog" aria-labelledby="feature-title"
        onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
        <p className="eyebrow">Próximamente</p>
        <h2 id="feature-title">{upcoming[feature].title}</h2>
        <p>{upcoming[feature].description}</p>
        <form method="dialog"><button className="secondary-button" autoFocus>Volver al inicio</button></form>
      </dialog>
    </div>
  );
}
