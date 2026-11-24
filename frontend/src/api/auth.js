async function request(path, body) {
  let response;
  try {
    response = await fetch(`/api/auth/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'El servicio no está disponible. Inténtalo de nuevo en unos instantes.');
    error.status = response.status;
    error.fields = data.fields;
    throw error;
  }
  return data;
}

export const auth = {
  me: () => request('me'),
  login: (values) => request('login', values),
  register: (values) => request('register', values),
  logout: () => request('logout', {}),
};
