import { test, expect } from "@playwright/test"

test.describe("User Registration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the registration page
    await page.goto("/register")
  })

  test("should successfully register a new user with valid data", async ({
    page,
  }) => {
    // Generate unique email for this test run
    const timestamp = Date.now()
    const testEmail = `test.user.${timestamp}@example.com`
    const testPassword = "SecurePassword123!"
    const testName = "John Doe"

    // Fill out the registration form using ID selectors
    await page.fill("#name", testName)
    await page.fill("#email", testEmail)
    await page.fill("#password", testPassword)

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for navigation to login page with registered parameter
    await page.waitForURL("**/login?registered=true", { timeout: 10000 })

    // Verify successful registration redirect
    await expect(page).toHaveURL(/.*login\?registered=true/)

    // Check for any success indication on the login page
    // You might want to add a success message on your login page for registered users
  })
})
