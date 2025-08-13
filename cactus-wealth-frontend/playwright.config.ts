import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : Math.max(os.cpus().length - 1, 1),
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
      ]
    : [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium-smoke', use: { ...devices['Desktop Chrome'] }, grep: /@smoke/ },
    { name: 'chromium-full', use: { ...devices['Desktop Chrome'] }, grep: /@full/ },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] }, grep: /@full/ },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: 'test-results/',
  globalTimeout: 600_000,
});
