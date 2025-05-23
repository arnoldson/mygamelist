import { test, expect } from "@playwright/test"
import { TEST_USER } from "../prisma/seed"

test.describe("Login Test", () => {
  test("should login with seeded test user", async ({ page }) => {
    // Go to login page
    await page.goto("/login")

    // Fill form with seeded user credentials
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)

    // Submit form
    await page.click('button[type="submit"]')

    // Verify successful login (adjust URL based on your app)
    await page.waitForURL("**/dashboard", { timeout: 10000 })
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test("should reject wrong password", async ({ page }) => {
    await page.goto("/login")

    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', "wrongpassword")

    await page.click('button[type="submit"]')

    // Should show error and stay on login page
    await expect(page.locator(".bg-red-50")).toBeVisible()
    await expect(page).toHaveURL(/.*login/)
  })
})
