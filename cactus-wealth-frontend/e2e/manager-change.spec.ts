import { test, expect } from '@playwright/test';

test.describe('Manager change flow (smoke)', () => {
  test('advisor can open profile and send request UI exists', async ({ page }) => {
    // This is a smoke UI test; assumes authenticated session in real env
    await page.goto('/profile');
    await expect(page.getByText('Cambiar de manager (solicitud)')).toBeVisible();
  });

  test('admin page exists', async ({ page }) => {
    await page.goto('/admin/manager-requests');
    await expect(page.getByText('Solicitudes de cambio de manager')).toBeVisible();
  });
});


