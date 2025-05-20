import { test, expect } from "@playwright/test"

test("homepage displays welcome message", async ({ page }) => {
  // Navigate to the homepage
  await page.goto("http://localhost:3000/")

  // Check for the text "Welcome" on the page
  // The :text() selector will find elements containing the specified text
  const welcomeElement = page.locator(':text("Welcome")')

  // Assert that the welcome element is visible
  await expect(welcomeElement).toBeVisible()
})
