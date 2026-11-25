import { test, expect } from "@playwright/test"
import { MOCK_SEARCH_RESPONSE } from "./fixtures/rawgSearchResponse"

// Regression: calendar dates (release, started, completed) are midnight UTC,
// and formatting them in local time showed the previous day west of UTC.
test.use({ timezoneId: "America/Los_Angeles" })

test("search cards show the release date as given", async ({ page }) => {
  await page.route("**/api/games/search**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SEARCH_RESPONSE),
    }),
  )

  await page.goto("/games/search")
  await page.locator('input[placeholder="Search for games..."]').fill("zelda")
  await page.locator('button[type="submit"]').click()

  // Fixture: Breath of the Wild, released "2017-03-03"
  const card = page.locator('[data-testid="game-card"]', {
    hasText: "Breath of the Wild",
  })
  await expect(card.locator('[data-testid="release-date"]')).toContainText(
    "Mar 3, 2017",
  )
})

test("game list shows started and completed dates as entered", async ({
  page,
}) => {
  await page.goto("/gameslist/testuser")

  // Seed: Grand Theft Auto V started 2024-12-01
  const gta = page.locator("div.group", { hasText: "Grand Theft Auto V" })
  await expect(gta).toContainText("Dec 1, 2024")
})
