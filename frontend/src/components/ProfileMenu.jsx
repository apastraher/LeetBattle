import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/auth.js';

function MenuIcon({ logout = false }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {logout
      ? <><path d="M9 5H5v14h4M9 12h12m-4-4 4 4-4 4" /></>
      : <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>}
  </svg>;
}

export default function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const initialFocusRef = useRef(0);
  const menuId = useId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const items = menuRef.current.querySelectorAll('[role="menuitem"]');
    items[initialFocusRef.current === -1 ? items.length - 1 : 0]?.focus();

    function outsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', outsideClick);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outsideClick);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  function navigateMenu(event) {
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')].filter((item) => !item.disabled);
    const index = items.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next !== undefined) { event.preventDefault(); items[next]?.focus(); }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await auth.logout();
      onLogout();
      navigate('/iniciar-sesion', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="profile-control" ref={containerRef}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button ref={triggerRef} className="profile-trigger" type="button" aria-label="Menú de perfil"
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => { initialFocusRef.current = 0; setOpen(!open); }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            initialFocusRef.current = event.key === 'ArrowUp' ? -1 : 0;
            setOpen(true);
          }
        }}>
        <img className="profile-avatar" src="/avatar-default.svg" width="48" height="48"
          alt={user ? `Avatar de ${user.alias}` : 'Avatar de usuario predeterminado'} />
      </button>
      {open && <div className="profile-dropdown">
        <div className="profile-identity">
          <p className="profile-alias">{user ? user.alias : 'Tu cuenta en LeetBattle'}</p>
          <p className="profile-email">{user ? user.email : 'Inicia sesión o crea una cuenta.'}</p>
        </div>
        <div ref={menuRef} id={menuId} role="menu" aria-label="Menú de perfil" className="profile-menu-items" onKeyDown={navigateMenu}>
          {user ? <>
            <Link className="profile-menu-item" role="menuitem" tabIndex={-1} to="/cuenta" onClick={() => setOpen(false)}>
              <MenuIcon /><span>Perfil</span>
            </Link>
            <button className="profile-menu-item profile-logout" role="menuitem" tabIndex={-1} type="button"
              onClick={logout} aria-disabled={busy} aria-busy={busy}>
              <MenuIcon logout /><span>{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
            </button>
          </> : <>
            <Link className="profile-menu-item" role="menuitem" tabIndex={-1} to="/iniciar-sesion" onClick={() => setOpen(false)}>
              <MenuIcon /><span>Iniciar sesión</span>
            </Link>
            <Link className="profile-menu-item" role="menuitem" tabIndex={-1} to="/registro" onClick={() => setOpen(false)}>
              <span aria-hidden="true" className="profile-add-icon">+</span><span>Crear cuenta</span>
            </Link>
          </>}
        </div>
        {error && <p className="profile-menu-error form-error" role="alert">{error}</p>}
      </div>}
    </div>
  );
}
