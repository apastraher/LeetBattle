import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { config } from '../../backend/src/config.js';

test('registro, recarga, menú de perfil, cierre de sesión y acceso con un usuario real', async ({ page }, testInfo) => {
  const alias = `e2e_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
  const email = `${alias}@example.com`;
  const password = 'Prueba segura 123 ñ';
  const pool = new pg.Pool(config.database);
  try {
    await page.goto('/registro');
    await page.getByLabel('Usuario', { exact: true }).fill(alias);
    await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByLabel('Repite la contraseña', { exact: true }).fill('distinta');
    await page.getByRole('button', { name: 'Regístrate', exact: true }).click();
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
    await expect(page.getByLabel('Repite la contraseña', { exact: true })).toBeFocused();
    await page.getByLabel('Repite la contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Regístrate', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Piensa. Programa. Compite.' })).toBeVisible();
    await expect(page.getByRole('img', { name: `Avatar de ${alias}` })).toBeVisible();
    const cookie = (await page.context().cookies()).find(({ name }) => name === 'leetbattle.sid');
    expect(cookie.httpOnly).toBe(true);
    await page.reload();
    await expect(page.getByRole('img', { name: `Avatar de ${alias}` })).toBeVisible();
    const trigger = page.getByRole('button', { name: 'Menú de perfil', exact: true });
    const menu = page.getByRole('menu', { name: 'Menú de perfil' });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Perfil', exact: true })).toBeFocused();
    await expect(page.locator('.profile-identity')).toContainText(alias);
    await expect(page.locator('.profile-identity')).toContainText(email);
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.getByRole('heading', { name: 'Piensa. Programa. Compite.' }).click();
    await expect(menu).not.toBeVisible();
    await trigger.click();
    await page.keyboard.press('Tab');
    await expect(menu).not.toBeVisible();
    await trigger.click();
    await page.screenshot({ path: testInfo.outputPath('perfil-escritorio.png'), fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: testInfo.outputPath('perfil-oscuro-movil.png'), fullPage: true });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.locator('.profile-dropdown').evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth && node.scrollWidth <= node.clientWidth;
    })).toBe(true);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Cambiar a tema claro' }).click();
    await trigger.click();
    await page.screenshot({ path: testInfo.outputPath('perfil-claro-movil.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click();
    await page.setViewportSize({ width: 1046, height: 775 });
    await trigger.click();
    await page.route('**/api/auth/logout', (route) => route.fulfill({
      status: 503, json: { message: 'No se ha podido cerrar la sesión. Inténtalo de nuevo.' },
    }));
    await menu.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('alert')).toHaveText('No se ha podido cerrar la sesión. Inténtalo de nuevo.');
    expect((await page.request.get('/api/auth/me')).status()).toBe(200);
    await page.unroute('**/api/auth/logout');
    await menu.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    expect((await page.request.get('/api/auth/me')).status()).toBe(401);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    await page.getByLabel('Usuario / Correo electrónico').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos');
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click();
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page.getByRole('img', { name: `Avatar de ${alias}` })).toBeVisible();
    await page.getByRole('button', { name: 'Menú de perfil', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Perfil', exact: true }).click();
    await expect(page.getByRole('heading', { name: `Hola, ${alias}` })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  } finally {
    // Solo se elimina el usuario de prueba creado por este caso.
    await pool.query("DELETE FROM public.sesiones WHERE sess->>'userId' IN (SELECT id::text FROM public.usuarios WHERE email = $1)", [email]);
    await pool.query('DELETE FROM public.usuarios WHERE email = $1', [email]);
    await pool.end();
  }
});

test('fuentes reales, colores calculados, ambos temas y adaptación con texto ampliado', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1046, height: 775 });
  await page.goto('/iniciar-sesion');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  const typography = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 16px Inter', 'Contraseña ñ á é í ó ú'),
      document.fonts.load('600 16px Inter', 'Iniciar sesión'),
      document.fonts.load('700 32px "Space Grotesk"', 'Iniciar sesión'),
      document.fonts.load('400 16px "JetBrains Mono"', '0 O o 1 l I { } [ ] < > != ñ'),
    ]);
    return { loaded: [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family.replaceAll('"', '')),
      title: getComputedStyle(document.querySelector('h1')).fontFamily,
      titleColor: getComputedStyle(document.querySelector('h1')).color,
      inputColor: getComputedStyle(document.querySelector('input')).color,
      buttonColor: getComputedStyle(document.querySelector('.primary-button')).backgroundColor };
  });
  expect(typography.loaded).toEqual(expect.arrayContaining(['Inter', 'Space Grotesk', 'JetBrains Mono']));
  expect(typography.title).toContain('Space Grotesk');
  expect(typography.titleColor).toBe('rgb(248, 250, 252)');
  expect(typography.inputColor).toBe('rgb(248, 250, 252)');
  expect(typography.buttonColor).toBe('rgb(37, 99, 235)');
  await page.screenshot({ path: testInfo.outputPath('inicio-sesion-escritorio.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cambiar a tema claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
  expect(await page.locator('h1').evaluate((node) => getComputedStyle(node).color)).toBe('rgb(15, 23, 42)');
  expect(await page.locator('input').first().evaluate((node) => getComputedStyle(node).color)).toBe('rgb(15, 23, 42)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
  await page.screenshot({ path: testInfo.outputPath('inicio-sesion-claro.png'), fullPage: true });
  for (const theme of ['claro', 'oscuro']) {
    if (theme === 'oscuro') await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click();
    for (const path of ['/iniciar-sesion', '/registro']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({ path: testInfo.outputPath(`${path.slice(1)}-${theme}-movil.png`), fullPage: true });
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole('button', { name: path === '/registro' ? 'Regístrate' : 'Iniciar sesión', exact: true })).toBeVisible();
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    }
  }
  await page.setViewportSize({ width: 1046, height: 775 });
  await page.goto('/registro');
  await page.screenshot({ path: testInfo.outputPath('registro-escritorio.png'), fullPage: true });
});

test('navegación por teclado y diálogo de recuperación', async ({ page }) => {
  await page.goto('/iniciar-sesion');
  await expect(page.locator('h1')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cambiar a tema claro' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Usuario / Correo electrónico')).toBeFocused();
  expect(await page.locator('#email').evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
  await page.getByRole('button', { name: '¿Has olvidado tu contraseña?' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Regístrate', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
});
