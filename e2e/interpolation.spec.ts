import { expect, test } from '@playwright/test'
import type { Page, Locator } from '@playwright/test'

function activeTab(page: Page): Locator {
  return page.locator('[data-testid="request-tab"]').filter({ visible: true })
}

async function setupWorkspace(page: Page) {
  await page
    .getByRole('button', { name: 'New Workspace' })
    .filter({ hasText: 'New Workspace' })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByPlaceholder('Workspace name').fill('Test')
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: 'New Request' }).filter({ hasText: 'New Request' }).click()
}

async function openVariables(page: Page) {
  await page.getByRole('button', { name: 'Variables' }).click()
}

async function addVariable(page: Page, key: string, value: string) {
  await page.getByRole('button', { name: 'Add variable' }).click()
  await page.getByPlaceholder('name').last().fill(key)
  await page.getByPlaceholder('value').last().fill(value)
}

test.describe('variable interpolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await setupWorkspace(page)
  })

  test('unresolved {{var}} in URL is highlighted red', async ({ page }) => {
    await activeTab(page).locator('input[name="requestUrl"]').fill('http://example.com/{{unknown}}')

    const mark = activeTab(page).locator('mark').first()
    await expect(mark).toBeVisible()
    await expect(mark).toHaveClass(/text-red-/)
  })

  test('resolved {{var}} in URL is highlighted orange', async ({ page }) => {
    await openVariables(page)
    await addVariable(page, 'host', 'example.com')

    await activeTab(page).locator('input[name="requestUrl"]').fill('http://{{host}}/api')

    const mark = activeTab(page).locator('mark').first()
    await expect(mark).toBeVisible()
    await expect(mark).toHaveClass(/text-orange-/)
  })

  test('highlight updates from red to orange when the matching variable is added', async ({
    page,
  }) => {
    // Start with unresolved variable → red
    await activeTab(page).locator('input[name="requestUrl"]').fill('http://{{env}}.example.com/api')
    await expect(activeTab(page).locator('mark').first()).toHaveClass(/text-red-/)

    // Define the variable → should turn orange reactively
    await openVariables(page)
    await addVariable(page, 'env', 'production')

    await expect(activeTab(page).locator('mark').first()).toHaveClass(/text-orange-/)
  })

  test('variable in URL path is substituted on submit', async ({ page }) => {
    await page.route('http://example.com/**', (route) => route.fulfill({ status: 200, body: '' }))

    await openVariables(page)
    await addVariable(page, 'version', 'v2')

    await activeTab(page)
      .locator('input[name="requestUrl"]')
      .fill('http://example.com/{{version}}/users')

    const [, req] = await Promise.all([
      page.getByRole('button', { name: 'Submit' }).click(),
      page.waitForRequest('http://example.com/**'),
    ])

    expect(req.url()).toBe('http://example.com/v2/users')
  })

  test('variable in query param value is substituted on submit', async ({ page }) => {
    await page.route('http://example.com/**', (route) => route.fulfill({ status: 200, body: '' }))

    await openVariables(page)
    await addVariable(page, 'page_num', '3')

    await activeTab(page).locator('input[name="requestUrl"]').fill('http://example.com/api')

    const tab = activeTab(page)
    await tab.getByRole('tab', { name: 'Params' }).click()
    const paramRows = tab.locator('[data-state="active"][id*="params"] table tbody tr')
    await expect(paramRows).toHaveCount(1)

    await paramRows.last().getByRole('textbox').nth(0).fill('page')
    await expect(paramRows).toHaveCount(2)
    await paramRows.first().getByRole('textbox').nth(1).fill('{{page_num}}')

    const [, req] = await Promise.all([
      page.getByRole('button', { name: 'Submit' }).click(),
      page.waitForRequest('http://example.com/**'),
    ])

    const url = new URL(req.url())
    expect(url.searchParams.get('page')).toBe('3')
  })

  test('variable in header value is substituted on submit', async ({ page }) => {
    await page.route('http://example.com/**', (route) => route.fulfill({ status: 200, body: '' }))

    await openVariables(page)
    await addVariable(page, 'token', 'secret-abc')

    await activeTab(page).locator('input[name="requestUrl"]').fill('http://example.com/api')

    const tab = activeTab(page)
    await tab.getByRole('tab', { name: 'Headers' }).click()
    const headerRows = tab.locator('[data-state="active"][id*="headers"] table tbody tr')
    await expect(headerRows).toHaveCount(1)

    await headerRows.last().getByRole('textbox').nth(0).fill('Authorization')
    await expect(headerRows).toHaveCount(2)
    await headerRows.first().getByRole('textbox').nth(1).fill('Bearer {{token}}')

    const [, req] = await Promise.all([
      page.getByRole('button', { name: 'Submit' }).click(),
      page.waitForRequest('http://example.com/**'),
    ])

    expect(req.headers()['authorization']).toBe('Bearer secret-abc')
  })

  test('unresolved variable used as header name is excluded from request', async ({ page }) => {
    await page.route('http://example.com/**', (route) => route.fulfill({ status: 200, body: '' }))

    await activeTab(page).locator('input[name="requestUrl"]').fill('http://example.com/api')

    const tab = activeTab(page)
    await tab.getByRole('tab', { name: 'Headers' }).click()
    const headerRows = tab.locator('[data-state="active"][id*="headers"] table tbody tr')
    await headerRows.last().getByRole('textbox').nth(0).fill('{{undefined-header}}')
    await expect(headerRows).toHaveCount(2)
    await headerRows.first().getByRole('textbox').nth(1).fill('some-value')

    // Should submit without throwing despite the invalid header name
    const [, req] = await Promise.all([
      page.getByRole('button', { name: 'Submit' }).click(),
      page.waitForRequest('http://example.com/**'),
    ])

    // The header with the invalid {{...}} name must be silently dropped
    expect(req.headers()).not.toHaveProperty('{{undefined-header}}')
  })

  test('multiple variables are all substituted', async ({ page }) => {
    await page.route('http://api.example.com/**', (route) =>
      route.fulfill({ status: 200, body: '' }),
    )

    await openVariables(page)
    await addVariable(page, 'base', 'http://api.example.com')
    await addVariable(page, 'version', 'v1')

    await activeTab(page).locator('input[name="requestUrl"]').fill('{{base}}/{{version}}/resources')

    const [, req] = await Promise.all([
      page.getByRole('button', { name: 'Submit' }).click(),
      page.waitForRequest('http://api.example.com/**'),
    ])

    expect(req.url()).toBe('http://api.example.com/v1/resources')
  })
})
