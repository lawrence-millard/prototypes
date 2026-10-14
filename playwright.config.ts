import { defineConfig, devices } from '@playwright/test'

const publishable = 'pk_' + 'live_' + Buffer.from('clerk.millard.ink$').toString('base64')
const env = {
  ...process.env,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishable,
  CLERK_SECRET_KEY: 'sk_' + 'live_' + 'millardplaceholdersecretkeyvalue123456',
  DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/prototypes',
  CLERK_TELEMETRY_DISABLED: '1',
}

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    headless: true,
    launchOptions: { args: ['--no-sandbox', '--disable-dev-shm-usage'] },
  },
  webServer: [
    { command: 'npm run start -w focus -- -p 3101', port: 3101, env, reuseExistingServer: false, timeout: 60_000 },
    { command: 'npm run start -w cards -- -p 3102', port: 3102, env, reuseExistingServer: false, timeout: 60_000 },
    { command: 'npm run start -w soon -- -p 3103', port: 3103, env, reuseExistingServer: false, timeout: 60_000 },
    { command: 'npm run start -w secret -- -p 3104', port: 3104, env, reuseExistingServer: false, timeout: 60_000 },
  ],
  projects: [
    { name: 'focus', testMatch: /focus.spec.ts/, use: { baseURL: 'http://127.0.0.1:3101' } },
    { name: 'cards', testMatch: /cards.spec.ts/, use: { baseURL: 'http://127.0.0.1:3102' } },
    { name: 'soon', testMatch: /soon.spec.ts/, use: { baseURL: 'http://127.0.0.1:3103' } },
    { name: 'secret', testMatch: /secret.spec.ts/, use: { baseURL: 'http://127.0.0.1:3104' } },
  ],
})
