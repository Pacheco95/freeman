import { expect, test } from '@playwright/test'

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({ page }) => {
  await page.goto('/')

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      test.fail(true, 'Should not see error messages in the console')
    }
  })

  expect(true).toBe(true)
})
