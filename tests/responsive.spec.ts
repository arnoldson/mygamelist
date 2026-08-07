import { test, expect, Page } from "@playwright/test"
import { TEST_USER } from "../prisma/seed"
import { MOCK_SEARCH_RESPONSE } from "./fixtures/rawgSearchResponse"

// Public pages that don't require auth or seeded data.
// Add new routes here as they're built/made responsive.
const PUBLIC_PAGES = [
  { name: "Home", path: "/" },
  { name: "Login", path: "/login" },
  { name: "Register", path: "/register" },
  { name: "Forgot Password", path: "/forgot-password" },
  // Token validity is only checked on submit, not on page load, so any
  // placeholder value is safe here for layout testing.
  { name: "Reset Password", path: "/reset-password/test-token-for-layout" },
  { name: "Games Search", path: "/games/search" },
]

// Representative breakpoints: smallest common phone, standard phone,
// tablet, and small desktop/laptop.
const VIEWPORTS = [
  { name: "mobile-small", width: 320, height: 568 }, // iPhone SE (1st gen)
  { name: "mobile", width: 375, height: 667 }, // iPhone SE (2nd/3rd gen) / 8
  { name: "tablet", width: 768, height: 1024 }, // iPad portrait
  { name: "desktop", width: 1280, height: 800 },
]

// Minimum recommended touch target size (WCAG 2.5.5 AA-ish baseline).
const MIN_TOUCH_TARGET = 40

// Allow a couple of px of tolerance for scrollbar quirks/subpixel rounding.
const OVERFLOW_TOLERANCE = 2

async function getHorizontalOverflow(page: Page): Promise<{
  overflow: number
  culprit: string | null
}> {
  return page.evaluate(() => {
    const doc = document.documentElement
    const overflow = doc.scrollWidth - doc.clientWidth

    if (overflow <= 2) return { overflow, culprit: null }

    // Walk the tree to find the widest offender so failures are
    // actionable instead of just reporting a raw pixel count.
    const viewportWidth = doc.clientWidth
    let widest: Element | null = null
    let widestWidth = 0

    document.querySelectorAll("body *").forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.right > viewportWidth + 2 && rect.width > widestWidth) {
        widest = el
        widestWidth = rect.width
      }
    })

    const culprit = widest
      ? `<${(widest as Element).tagName.toLowerCase()} class="${(widest as Element).className}"> ` +
        `width=${widestWidth.toFixed(0)}px right-edge=${(widest as Element).getBoundingClientRect().right.toFixed(0)}px`
      : null

    return { overflow, culprit }
  })
}

test.describe("Responsive layout — no horizontal overflow", () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`at ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      for (const targetPage of PUBLIC_PAGES) {
        test(`${targetPage.name} has no horizontal scroll`, async ({
          page,
        }) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          })
          await page.goto(targetPage.path)
          await page.waitForLoadState("networkidle")

          const { overflow, culprit } = await getHorizontalOverflow(page)
          expect(
            overflow,
            culprit
              ? `${targetPage.name} overflows horizontally by ${overflow}px at ${viewport.width}px width. Widest offender: ${culprit}`
              : `${targetPage.name} overflows horizontally by ${overflow}px at ${viewport.width}px width`,
          ).toBeLessThanOrEqual(OVERFLOW_TOLERANCE)
        })
      }
    })
  }
})

test.describe("Responsive layout — touch targets on mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test("login submit button and inputs meet minimum touch target size", async ({
    page,
  }) => {
    await page.goto("/login")

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    const buttonBox = await submitButton.boundingBox()
    expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)

    const emailInput = page.locator('input[name="email"]')
    const emailBox = await emailInput.boundingBox()
    expect(emailBox?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)

    const passwordInput = page.locator('input[name="password"]')
    const passwordBox = await passwordInput.boundingBox()
    expect(passwordBox?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  test("register submit button and inputs meet minimum touch target size", async ({
    page,
  }) => {
    await page.goto("/register")

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    const buttonBox = await submitButton.boundingBox()
    expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)

    for (const id of ["#username", "#email", "#password"]) {
      const input = page.locator(id)
      const box = await input.boundingBox()
      expect(
        box?.height ?? 0,
        `${id} is shorter than the minimum touch target`,
      ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
    }
  })

  test("navbar auth links are tappable on mobile", async ({ page }) => {
    await page.goto("/")

    const loginLink = page.getByRole("link", { name: "Login" })
    await expect(loginLink).toBeVisible()
    const loginBox = await loginLink.boundingBox()
    expect(loginBox?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET - 8) // nav links run slightly slimmer by design

    const registerLink = page.getByRole("link", { name: "Register" })
    await expect(registerLink).toBeVisible()
  })

  test("navbar does not force horizontal overflow for a guest on mobile", async ({
    page,
  }) => {
    await page.goto("/")

    const nav = page.locator("nav")
    const box = await nav.boundingBox()
    expect(box, "navbar should be visible").not.toBeNull()
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375 + OVERFLOW_TOLERANCE)
    }

    // "Login" text label collapses to an icon-only link below sm;
    // "Register" stays visible as the primary CTA at all widths.
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible()
  })
})

test.describe("Responsive layout — key content visible without horizontal scrolling", () => {
  for (const viewport of VIEWPORTS) {
    test(`login form stays within viewport at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page.goto("/login")

      const form = page.locator("form")
      const box = await form.boundingBox()
      expect(box, "login form should be visible").not.toBeNull()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(
          viewport.width + OVERFLOW_TOLERANCE,
        )
      }
    })

    test(`register form stays within viewport at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page.goto("/register")

      const form = page.locator("form")
      const box = await form.boundingBox()
      expect(box, "register form should be visible").not.toBeNull()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(
          viewport.width + OVERFLOW_TOLERANCE,
        )
      }
    })
  }
})

// Profile requires a real, existing user to return actual data rather than
// an error state, so it can't share the placeholder-friendly PUBLIC_PAGES
// list above. It relies on the seeded TEST_USER from prisma/seed.ts, same
// as login.spec.ts — run via `npm run test` (or otherwise ensure the test
// database has been seeded) before running this suite.
test.describe("Responsive layout — profile page", () => {
  for (const viewport of VIEWPORTS) {
    test(`profile page has no horizontal scroll at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page.goto(`/profile/${TEST_USER.username}`)
      await page.waitForLoadState("networkidle")

      const { overflow, culprit } = await getHorizontalOverflow(page)
      expect(
        overflow,
        culprit
          ? `Profile overflows horizontally by ${overflow}px at ${viewport.width}px width. Widest offender: ${culprit}`
          : `Profile overflows horizontally by ${overflow}px at ${viewport.width}px width`,
      ).toBeLessThanOrEqual(OVERFLOW_TOLERANCE)
    })
  }

  test("profile page primary action is tappable on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`/profile/${TEST_USER.username}`)

    const viewLibraryLink = page.getByRole("link", {
      name: /View Game Library/i,
    })
    await expect(viewLibraryLink).toBeVisible()
    const box = await viewLibraryLink.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })
})

// Regression test for a real bug: GameCard's action button used to be
// opacity-0 group-hover:opacity-100 with no touch fallback, making it
// impossible to tap on mobile. Playwright's toBeVisible() does NOT catch
// opacity:0 (only display/visibility), so this checks computed opacity
// directly rather than relying on toBeVisible() alone.
//
// This test intercepts /api/games/search using the shared fixture instead
// of hitting the real RAWG API, so it's fully deterministic regardless of
// RAWG's uptime or response latency.
test.describe("Responsive layout — games search card actions", () => {
  test("game card action button is not hover-only on mobile", async ({
    page,
  }) => {
    await page.route("**/api/games/search**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SEARCH_RESPONSE),
      }),
    )

    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/games/search")

    const searchInput = page.locator('input[placeholder="Search for games..."]')
    await searchInput.fill("zelda")
    await page.locator('button[type="submit"]').click()

    const gameCards = page.locator('[data-testid="game-card"]')
    await expect(gameCards.first()).toBeVisible()

    // The top-right action pill on the card (either "Add to your list" for
    // a signed-in user or "Sign in to add to list" for a guest) must be
    // visibly opaque without any hover interaction — that's the fix.
    // Selecting by title specifically, since the card also has a second,
    // separate "Sign in to Add" overlay button that's intentionally still
    // desktop-hover-only (the top-right pill already covers mobile access).
    const actionButton = gameCards
      .first()
      .locator(
        'button[title="Add to your list"], button[title="Sign in to add to list"]',
      )

    await expect(actionButton).toBeVisible()
    const opacity = await actionButton.evaluate(
      (el) => window.getComputedStyle(el).opacity,
    )
    expect(
      Number(opacity),
      "action button should be visibly opaque without hover on mobile",
    ).toBeGreaterThan(0.5)
  })
})

// Dashboard requires an authenticated session, so this logs in as the
// seeded TEST_USER first (same credentials login.spec.ts uses) before
// checking layout. Depends on the seeded test database, same as the
// profile page tests above.
async function loginAsTestUser(page: Page) {
  await page.goto("/login")
  await page.fill('input[name="email"]', TEST_USER.email)
  await page.fill('input[name="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 10000 })
}

test.describe("Responsive layout — dashboard", () => {
  for (const viewport of VIEWPORTS) {
    test(`dashboard has no horizontal scroll at ${viewport.name}`, async ({
      page,
    }) => {
      await loginAsTestUser(page)
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page.waitForLoadState("networkidle")

      const { overflow, culprit } = await getHorizontalOverflow(page)
      expect(
        overflow,
        culprit
          ? `Dashboard overflows horizontally by ${overflow}px at ${viewport.width}px width. Widest offender: ${culprit}`
          : `Dashboard overflows horizontally by ${overflow}px at ${viewport.width}px width`,
      ).toBeLessThanOrEqual(OVERFLOW_TOLERANCE)
    })
  }

  test("sign out button is tappable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginAsTestUser(page)

    const signOutButton = page.getByRole("button", {
      name: "Sign Out",
      exact: true,
    })
    await expect(signOutButton).toBeVisible()
    const box = await signOutButton.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })
})
