import { defineConfig } from "@playwright/test"

const port = 4113

export default defineConfig({
  testDir: "tests",
  testMatch: "smoke.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 800, height: 900 },
    colorScheme: "light",
    launchOptions: {
      executablePath: process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  webServer: {
    command: `npm run start -- -H 127.0.0.1 -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
