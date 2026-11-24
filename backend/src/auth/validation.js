export function validateLogin(body) {
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const fields = {};
  if (!identifier || identifier.length > 254) fields.identifier = 'Introduce tu usuario o correo electrónico.';
  if (!password || password.length > 128) fields.password = 'Introduce tu contraseña.';
  return { values: { identifier, password }, fields };
}

export function validateRegistration(body) {
  const alias = typeof body?.alias === 'string' ? body.alias.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const fields = {};
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(alias)) fields.alias = 'Usa entre 3 y 24 letras, números o guiones bajos.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'Introduce un correo electrónico válido.';
  if (password.length < 8 || password.length > 128) {
    fields.password = 'Usa entre 8 y 128 caracteres.';
  }
  if (typeof body?.confirmPassword !== 'string' || password !== body.confirmPassword) fields.confirmPassword = 'Las contraseñas no coinciden.';
  return { values: { alias, email, password }, fields };
}
