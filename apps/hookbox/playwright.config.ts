import { defineConfig, devices } from '@playwright/test'

function serverEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') env[key] = value
  }
  env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = ''
  env.CLERK_SECRET_KEY = ''
  return env
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:3102',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 900, height: 800 } },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3102',
    url: 'http://127.0.0.1:3102/login',
    reuseExistingServer: false,
    timeout: 120_000,
    env: serverEnv(),
  },
})
