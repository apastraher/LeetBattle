import { useEffect, useState } from 'react';

function savedTheme() {
  try { return localStorage.getItem('leetbattle-tema') === 'claro' ? 'claro' : 'oscuro'; }
  catch { return 'oscuro'; }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(savedTheme);
  useEffect(() => {
    document.documentElement.dataset.tema = theme;
    try { localStorage.setItem('leetbattle-tema', theme); } catch { /* La preferencia no es esencial. */ }
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--color-fondo').trim();
  }, [theme]);

  return (
    <button type="button" className="theme-toggle" onClick={() => setTheme(theme === 'oscuro' ? 'claro' : 'oscuro')}
      aria-label={`Cambiar a tema ${theme === 'oscuro' ? 'claro' : 'oscuro'}`} title={`Cambiar a tema ${theme === 'oscuro' ? 'claro' : 'oscuro'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {theme === 'oscuro'
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>
          : <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />}
      </svg>
    </button>
  );
}
