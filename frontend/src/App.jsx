import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { auth } from './api/auth.js';
import AuthLayout from './components/AuthLayout.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AccountPage from './pages/AccountPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let active = true;
    auth.me().then(({ user }) => { if (active) setUser(user); })
      .catch((error) => { if (active && error.status !== 401) setSessionError(error.message); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  return (
    <>
      <ThemeToggle />
      <AuthLayout>
        {checking ? <p className="session-loading" role="status">Comprobando sesión…</p> : <>
          {sessionError && <p className="form-error" role="alert">{sessionError}</p>}
          <Routes>
            <Route path="/iniciar-sesion" element={user ? <Navigate to="/cuenta" replace /> : <AuthPage key="login" onAuthenticated={(value) => { setSessionError(''); setUser(value); }} />} />
            <Route path="/registro" element={user ? <Navigate to="/cuenta" replace /> : <AuthPage key="register" register onAuthenticated={(value) => { setSessionError(''); setUser(value); }} />} />
            <Route path="/cuenta" element={user ? <AccountPage user={user} onLogout={() => setUser(null)} /> : <Navigate to="/iniciar-sesion" replace />} />
            <Route path="*" element={<Navigate to={user ? '/cuenta' : '/iniciar-sesion'} replace />} />
          </Routes>
        </>}
      </AuthLayout>
    </>
  );
}
