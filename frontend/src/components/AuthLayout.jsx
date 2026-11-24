import { Link } from 'react-router-dom';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell min-h-dvh bg-lb-fondo text-lb-texto">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="brand-header">
        <Link to="/iniciar-sesion" className="brand" aria-label="LeetBattle, inicio">
          <span className="brand-mark"><img src="/logo-leetbattle.png" alt="" width="1304" height="1212" /></span>
          <span>LeetBattle</span>
        </Link>
      </header>
      <main id="contenido" className="auth-panel bg-lb-panel" tabIndex={-1}>{children}</main>
    </div>
  );
}
