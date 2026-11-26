export async function getDailyChallenge(signal) {
  let response;
  try {
    response = await fetch('/api/ejercicios/reto-diario', { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se ha podido cargar el reto. Comprueba tu conexión e inténtalo de nuevo.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No se ha podido cargar el reto diario. Inténtalo de nuevo.');
  return data.reto;
}
