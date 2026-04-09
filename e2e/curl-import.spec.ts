import { expect, test } from '@playwright/test'
import type { Page, Locator } from '@playwright/test'

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

async function openImportDialog(page: Page) {
  await page.getByRole('menubar').getByText('File').click()
  await page.getByRole('menuitem', { name: 'Import' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

async function importCurl(page: Page, curlCommand: string) {
  await openImportDialog(page)
  await page.getByRole('dialog').locator('textarea').fill(curlCommand)
  await page.getByRole('dialog').getByRole('button', { name: 'Import' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

/** Returns the currently visible RequestTab container */
function activeTab(page: Page): Locator {
  return page.locator('[data-testid="request-tab"]').filter({ visible: true })
}

test.describe('cURL import', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/')
    await setupWorkspace(page)
  })

  test('simple POST with JSON body fills method, url, headers and body', async ({ page }) => {
    await importCurl(
      page,
      `curl -X POST http://test/posts -H "Content-Type: application/json" -d '{"title":"foo","body":"bar","userId":1}'`,
    )

    const tab = activeTab(page)

    // Method and URL
    await expect(tab.getByRole('combobox').first()).toHaveText('POST')
    await expect(tab.locator('input[name="requestUrl"]')).toHaveValue(`http://test/posts`)

    // Params tab — no params expected
    await tab.getByRole('tab', { name: 'Params' }).click()
    const paramRows = tab.locator('[data-state="active"][id*="params"] table tbody tr')
    await expect(paramRows).toHaveCount(1) // only the empty placeholder row

    // Headers tab
    await tab.getByRole('tab', { name: 'Headers' }).click()
    const headerRows = tab.locator('[data-state="active"][id*="headers"] table tbody tr')
    await expect(headerRows).toHaveCount(2) // one active + one empty placeholder
    const firstHeaderRow = headerRows.first()
    await expect(firstHeaderRow.getByRole('textbox').nth(0)).toHaveValue('Content-Type')
    await expect(firstHeaderRow.getByRole('textbox').nth(1)).toHaveValue('application/json')

    // Body tab — raw radio selected, editor contains JSON
    await tab.getByRole('tab', { name: 'Body' }).click()
    await expect(tab.getByRole('radio', { name: 'raw' })).toHaveAttribute('data-state', 'checked')
    await expect(tab.locator('.view-lines')).toContainText('"title"')
    await expect(tab.locator('.view-lines')).toContainText('"foo"')
    await expect(tab.locator('.view-lines')).toContainText('"userId"')
  })

  test('POST with query params and JSON body fills params table', async ({ page }) => {
    await importCurl(
      page,
      `curl -X POST "http://test/search?page=1&limit=20" -H "Content-Type: application/json" -H "X-Api-Key: abc123" -d '{"query":"test"}'`,
    )

    const tab = activeTab(page)

    // URL field contains the full URL including query string (params are synced bidirectionally)
    await expect(tab.locator('input[name="requestUrl"]')).toHaveValue(
      `http://test/search?page=1&limit=20`,
    )

    // Params tab
    await tab.getByRole('tab', { name: 'Params' }).click()
    const paramRows = tab.locator('[data-state="active"][id*="params"] table tbody tr')
    await expect(paramRows).toHaveCount(3) // page, limit, empty placeholder
    await expect(paramRows.nth(0).getByRole('textbox').nth(0)).toHaveValue('page')
    await expect(paramRows.nth(0).getByRole('textbox').nth(1)).toHaveValue('1')
    await expect(paramRows.nth(1).getByRole('textbox').nth(0)).toHaveValue('limit')
    await expect(paramRows.nth(1).getByRole('textbox').nth(1)).toHaveValue('20')

    // Headers tab
    await tab.getByRole('tab', { name: 'Headers' }).click()
    const headerRows = tab.locator('[data-state="active"][id*="headers"] table tbody tr')
    await expect(headerRows).toHaveCount(3) // Content-Type, X-Api-Key, empty placeholder
    await expect(headerRows.nth(1).getByRole('textbox').nth(0)).toHaveValue('X-Api-Key')
    await expect(headerRows.nth(1).getByRole('textbox').nth(1)).toHaveValue('abc123')
  })

  test('PUT with multiple headers fills headers table correctly', async ({ page }) => {
    await importCurl(
      page,
      `curl -X PUT http://test/posts/1 -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test" -d '{"id":1,"title":"updated title"}'`,
    )

    const tab = activeTab(page)

    await expect(tab.getByRole('combobox').first()).toHaveText('PUT')

    await tab.getByRole('tab', { name: 'Headers' }).click()
    const headerRows = tab.locator('[data-state="active"][id*="headers"] table tbody tr')
    await expect(headerRows).toHaveCount(3) // Content-Type, Authorization, empty placeholder
    await expect(headerRows.nth(1).getByRole('textbox').nth(0)).toHaveValue('Authorization')
    await expect(headerRows.nth(1).getByRole('textbox').nth(1)).toHaveValue(
      'Bearer eyJhbGciOiJIUzI1NiJ9.test',
    )
  })

  test('body tab shows none state by default on a fresh tab', async ({ page }) => {
    const tab = activeTab(page)
    await tab.getByRole('tab', { name: 'Body' }).click()
    await expect(tab.getByRole('radio', { name: 'none' })).toHaveAttribute('data-state', 'checked')
  })

  test('import dialog is dismissed on cancel', async ({ page }) => {
    await openImportDialog(page)
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('import button is disabled when textarea is empty', async ({ page }) => {
    await openImportDialog(page)
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Import' })).toBeDisabled()
  })
})
