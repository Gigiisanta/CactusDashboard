import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const baseURL = (config.projects?.[0]?.use as any)?.baseURL || 'http://localhost:3000';
    const backendURL = process.env.BACKEND_URL || 'http://localhost:8000';
    console.log('⏳ Waiting for application to be ready...');

    // Wait FE health
    const feHealth = `${baseURL}/api/health`;
    await page.goto(baseURL);
    await page.waitForSelector('body', { timeout: 30000 });
    try { await page.goto(feHealth); } catch {}

    // Wait BE health
    const beHealth = `${backendURL}/api/v1/health`;
    const healthResp = await fetch(beHealth);
    if (!healthResp.ok) throw new Error(`Backend health failed: ${healthResp.status}`);

    // E2E reset/seed if enabled (skip in smoke when PWTEST_SMOKE=1)
    if (process.env.E2E_MODE === '1' && process.env.E2E_SECRET && process.env.PWTEST_SMOKE !== '1') {
      const resetUrl = `${backendURL}/api/v1/health/e2e/reset`;
      const resetResp = await fetch(resetUrl, { method: 'POST', headers: { 'X-E2E-SECRET': process.env.E2E_SECRET } });
      if (!resetResp.ok) throw new Error(`E2E reset failed: ${resetResp.status}`);
      console.log('✅ E2E reset completed');
    }

    // Optional: Perform any authentication or data setup here
    // For example, create test users, seed data, etc.

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
