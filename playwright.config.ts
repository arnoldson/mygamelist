// playwright.config.ts
import { PlaywrightTestConfig, devices } from "@playwright/test"
import path from "path"

const PORT = process.env.PORT || 3000
const baseURL = `http://localhost:${PORT}`

const rootDir = process.cwd()
const testDir = path.resolve(rootDir, "./tests")

const config: PlaywrightTestConfig = {
  // Test directory
  testDir: testDir,

  // Maximum time one test can run for
  timeout: 30000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL,

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",

    // Record video on failure
    video: process.env.CI ? "on-first-retry" : "off",
  },

  // Web server to start before tests (Next.js development server)
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 60000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
    // // Test against mobile viewports
    // {
    //   name: "mobile-chrome",
    //   use: { ...devices["Pixel 5"] },
    // },
    // {
    //   name: "mobile-safari",
    //   use: { ...devices["iPhone 12"] },
    // },
  ],

  globalSetup: path.resolve(testDir, "./global-setup.ts"),
  // globalTeardown: path.resolve(testDir, "./global-teardown.ts"),
}

export default config
