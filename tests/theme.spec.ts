import { test, expect } from "@playwright/test"

// Regression: the body background followed prefers-color-scheme, so
// light-mode visitors got a white page behind the translucent navbar and
// its light text was unreadable. The UI is dark-only.
test.use({ colorScheme: "light" })

test("body background stays dark when the visitor prefers light mode", async ({
  page,
}) => {
  await page.goto("/")

  const [r, g, b] = await page.evaluate(() =>
    getComputedStyle(document.body)
      .backgroundColor.match(/\d+/g)!
      .slice(0, 3)
      .map(Number),
  )
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  expect(luminance).toBeLessThan(0.2)
})
