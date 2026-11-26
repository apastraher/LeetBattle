import { test, expect } from '@playwright/test';

test('inicio, reto real de PostgreSQL, ejemplos y navegación', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1046, height: 775 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Piensa. Programa. Compite.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¡Hola mundo!', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Avatar de usuario predeterminado' })).toBeVisible();
  const profileTrigger = page.getByRole('button', { name: 'Menú de perfil', exact: true });
  await expect(profileTrigger).toHaveAttribute('aria-expanded', 'false');
  await profileTrigger.click();
  await expect(page.getByRole('menuitem', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Crear cuenta' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Cerrar sesión' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('h1').evaluate((node) => getComputedStyle(node).fontFamily)).toContain('Space Grotesk');
  expect(await page.locator('.hero-accent').evaluate((node) => getComputedStyle(node).color)).toBe('rgb(37, 99, 235)');
  await page.screenshot({ path: testInfo.outputPath('inicio-escritorio.png'), fullPage: true });
  await page.getByRole('button', { name: 'Aceptar reto' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Entrada', exact: true })).toBeVisible();
  await expect(dialog.locator('pre').first()).toHaveText('3\n');
  await expect(dialog.locator('pre').last()).toHaveText('Hola mundo.\nHola mundo.\nHola mundo.\n');
  await expect(dialog.getByRole('link')).toHaveCount(0);
  await expect(page.locator('a[href^="http"]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('reto-diario.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Aceptar reto' })).toBeFocused();
  await page.getByRole('link', { name: 'Ir al reto diario' }).click();
  await expect(page).toHaveURL('/#reto-diario');
  await expect(page.getByRole('region', { name: 'Reto diario', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Conocer los duelos' }).click();
  await expect(dialog.getByRole('heading', { name: 'Duelos 1v1' })).toBeVisible();
  await page.keyboard.press('Escape');
  for (const feature of ['Ejercicios', 'Clasificación']) {
    await page.getByRole('navigation').getByRole('button', { name: feature }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: feature })).toBeVisible();
    await page.getByRole('button', { name: 'Volver al inicio' }).click();
  }
  await page.getByRole('link', { name: 'Entrar a competir' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await page.getByRole('link', { name: 'LeetBattle, inicio' }).click();
  await expect(page).toHaveURL('/');
});

test('inicio adaptable en ambos temas, texto ampliado y teclado', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Aceptar reto' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Entrar a competir' })).toBeFocused();
  for (const theme of ['oscuro', 'claro']) {
    if (theme === 'claro') await page.getByRole('button', { name: 'Cambiar a tema claro' }).click();
    expect(await page.getByRole('link', { name: 'Entrar a competir' }).evaluate((node) => getComputedStyle(node).color))
      .toBe(theme === 'oscuro' ? 'rgb(248, 250, 252)' : 'rgb(255, 255, 255)');
    for (const width of [1916, 1440, 991, 768, 375]) {
      await page.setViewportSize({ width, height: 812 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole('heading', { name: 'Cada reto cuenta.' })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`inicio-${theme}-${width}.png`), fullPage: true });
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Aceptar reto' })).toBeVisible();
    await page.getByRole('button', { name: 'Aceptar reto' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.getByRole('dialog').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
});

test('un error al cargar el reto permite reintentar sin bloquear el inicio', async ({ page }) => {
  await page.route('**/api/ejercicios/reto-diario', (route) => route.fulfill({
    status: 503, json: { message: 'No se ha podido cargar el reto diario.' },
  }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toHaveText('No se ha podido cargar el reto diario.');
  await expect(page.getByRole('link', { name: 'Entrar a competir' })).toBeVisible();
  await page.unroute('**/api/ejercicios/reto-diario');
  await page.getByRole('button', { name: 'Volver a intentar' }).click();
  await expect(page.getByRole('heading', { name: '¡Hola mundo!', exact: true })).toBeVisible();
});
