import { useEffect, useState } from 'react';
import { auth } from '../api/auth.js';

export default function AccountPage({ user, onLogout }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { document.title = 'Tu cuenta · LeetBattle'; }, []);

  async function logout() {
    setBusy(true);
    setError('');
    try { await auth.logout(); onLogout(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="account-content">
      <p className="session-status">Sesión iniciada</p>
      <h1>Hola, {user.alias}</h1>
      <p className="account-email">{user.email}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button bg-lb-accion text-lb-sobre-accion" onClick={logout} disabled={busy}>
        {busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    </div>
  );
}
