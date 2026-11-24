import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/auth.js';
import Field from '../components/Field.jsx';

export default function AuthPage({ register = false, onAuthenticated }) {
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const alertRef = useRef(null);
  const recoveryRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { document.title = `${register ? 'Registro' : 'Iniciar sesión'} · LeetBattle`; }, [register]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const nextErrors = {};
    if (register && values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) {
      form.elements.namedItem(Object.keys(nextErrors)[0]).focus();
      return;
    }
    setBusy(true);
    try {
      await (register ? auth.register(values) : auth.login(values));
      const { user } = await auth.me();
      onAuthenticated(user);
      navigate('/cuenta', { replace: true });
    } catch (error) {
      setErrors(error.fields || {});
      setMessage(error.message);
      requestAnimationFrame(() => alertRef.current?.focus());
    } finally { setBusy(false); }
  }

  return (
    <>
      <h1>{register ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
      <form onSubmit={submit} className="auth-form" aria-busy={busy}>
        {message && <p ref={alertRef} className="form-error" role="alert" tabIndex={-1}>{message}</p>}
        <fieldset disabled={busy}>
          {register && <Field id="alias" name="alias" label="Usuario" autoComplete="username" required minLength={3} maxLength={24}
            pattern="[a-zA-Z0-9_]{3,24}" title="Entre 3 y 24 letras, números o guiones bajos." placeholder="Tu alias" error={errors.alias} />}
          <Field id="email" name={register ? 'email' : 'identifier'} label={register ? 'Correo electrónico' : 'Usuario / Correo electrónico'}
            type={register ? 'email' : 'text'} autoComplete={register ? 'email' : 'username'} autoCapitalize="none" spellCheck={false}
            required maxLength={254} placeholder={register ? 'tu@correo.com' : 'Tu usuario o correo'} error={errors.email || errors.identifier} />
          <Field id="password" name="password" label="Contraseña" type="password" autoComplete={register ? 'new-password' : 'current-password'}
            required minLength={register ? 8 : undefined} maxLength={128} placeholder={register ? 'Crea una contraseña' : 'Tu contraseña'}
            hint={register ? 'Entre 8 y 128 caracteres.' : undefined} error={errors.password} />
          {register && <Field id="confirmPassword" name="confirmPassword" label="Repite la contraseña" type="password"
            autoComplete="new-password" required maxLength={128} placeholder="Repite tu contraseña" error={errors.confirmPassword} />}
        </fieldset>
        {!register && <button className="text-link recovery-link" type="button" onClick={() => recoveryRef.current.showModal()}>¿Has olvidado tu contraseña?</button>}
        <div className={`form-actions ${register ? 'register-actions' : ''}`}>
          <button className="primary-button bg-lb-accion text-lb-sobre-accion" type="submit" disabled={busy}>
            {busy ? (register ? 'Creando cuenta…' : 'Iniciando sesión…') : (register ? 'Regístrate' : 'Iniciar sesión')}
          </button>
          <p className="auth-switch">{register ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
            <Link className="text-link" to={register ? '/iniciar-sesion' : '/registro'}>{register ? 'Inicia sesión' : 'Regístrate'}</Link>
          </p>
        </div>
      </form>
      {!register && <dialog ref={recoveryRef} className="recovery-dialog" aria-labelledby="recovery-title"
        onClick={(event) => { if (event.target === recoveryRef.current) recoveryRef.current.close(); }}>
        <div>
          <h2 id="recovery-title">Recuperar el acceso</h2>
          <p>La recuperación de contraseñas todavía no está disponible.</p>
          <form method="dialog"><button className="secondary-button" autoFocus>Volver al inicio de sesión</button></form>
        </div>
      </dialog>}
    </>
  );
}
