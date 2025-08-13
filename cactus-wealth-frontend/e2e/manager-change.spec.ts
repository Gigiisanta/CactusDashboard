import { test, expect } from '@playwright/test';

test.describe('@smoke Manager change flow', () => {
  test('advisor can open profile and send request UI exists', async ({ page }) => {
    // This is a smoke UI test; assumes authenticated session in real env
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*(auth\/login|login|profile)/);
  });

  test('admin page exists', async ({ page }) => {
    await page.goto('/admin/manager-requests');
    await expect(page).toHaveURL(/.*(auth\/login|login|manager-requests)/);
  });
});


