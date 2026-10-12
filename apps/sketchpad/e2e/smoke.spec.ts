import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const screenshots = '/opt/cursor/artifacts/screenshots'

test('core loop: boards, connect, autosave, export, and import', async ({ page }) => {
  mkdirSync(screenshots, { recursive: true })
  const clerkHits: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('clerk.com') || url.includes('clerk.accounts') || url.includes('@clerk')) {
      clerkHits.push(url)
    }
  })

  await page.goto('/')
  await expect(page.getByTestId('privacy-mode')).toHaveText('Private on this browser')
  await expect(page.getByRole('heading', { name: 'Sample: personal whiteboard' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete sample data' }).click()
  await expect(page.getByRole('heading', { name: 'No boards on this browser' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Sample data deleted from this browser.')
  await page.screenshot({ path: path.join(screenshots, 'empty_state.png') })

  await page.getByRole('button', { name: 'New board' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Board created.' })).toBeVisible()
  const name = page.getByRole('textbox', { name: 'Board name' })
  await name.fill('Flow')
  await name.press('Enter')

  const canvas = page.getByRole('application', { name: /Whiteboard/ })
  await page.getByRole('button', { name: 'Rectangle' }).click()
  await canvas.click({ position: { x: 220, y: 170 } })
  await page.getByRole('textbox', { name: 'Shape text' }).fill('Start')

  await page.getByRole('button', { name: 'Ellipse' }).click()
  await canvas.click({ position: { x: 520, y: 180 } })
  await page.getByRole('textbox', { name: 'Shape text' }).fill('End')

  await page.getByRole('button', { name: 'Diamond' }).click()
  await canvas.click({ position: { x: 370, y: 340 } })
  await page.getByRole('textbox', { name: 'Shape text' }).fill('Choose')

  await page.getByRole('button', { name: 'Connector' }).click()
  await page.locator('[data-shape-kind="rectangle"]').click()
  await page.locator('[data-shape-kind="ellipse"]').click()
  await page.locator('[data-shape-kind="ellipse"]').click()
  await page.locator('[data-shape-kind="diamond"]').click()
  await expect(page.getByTestId('connector')).toHaveCount(2)

  await page.locator('.canvas-wrap').evaluate((element) => {
    element.scrollTop = 0
    element.scrollLeft = 0
  })
  await page.screenshot({ path: path.join(screenshots, 'connected_shapes.png') })

  await page.getByRole('button', { name: 'Export' }).click()
  await expect(page.getByRole('dialog', { name: 'Export board' })).toBeVisible()
  await page.screenshot({ path: path.join(screenshots, 'export_dialog.png') })
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download JSON' }).click(),
  ])
  const downloadPath = await download.path()
  expect(downloadPath).toBeTruthy()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Select' }).click()
  const rect = page.locator('[data-shape-kind="rectangle"] rect')
  const line = page.getByTestId('connector').first()
  const xBefore = await rect.getAttribute('x')
  const x1Before = await line.getAttribute('x1')
  const box = await page.locator('[data-shape-kind="rectangle"]').boundingBox()
  if (!box || !xBefore || !x1Before) throw new Error('Shape was not ready to drag')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 50, { steps: 12 })
  await page.mouse.up()
  await expect(rect).not.toHaveAttribute('x', xBefore)
  await expect(line).not.toHaveAttribute('x1', x1Before)
  await page.keyboard.press('Control+Z')
  await expect(rect).toHaveAttribute('x', xBefore)

  const status = page.getByTestId('save-status')
  await expect(status).toHaveText(/Unsaved changes|Saving…/)
  await expect(status).toHaveText('Saved on this browser')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Flow' })).toBeVisible()
  await page.getByRole('button', { name: 'Open Flow' }).click()
  await expect(page.locator('[data-shape-kind]')).toHaveCount(3)
  await expect(page.getByTestId('connector')).toHaveCount(2)

  await page.getByRole('button', { name: 'Boards' }).click()
  await page.getByRole('button', { name: 'Import JSON' }).click()
  await page.getByLabel('Board file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"format":"nope","secret":"do-not-show"}'),
  })
  await expect(page.getByRole('alert')).toHaveText('This file is not a Sketchpad board.')
  await expect(page.getByRole('dialog')).not.toContainText('do-not-show')
  await page.getByLabel('Board file').setInputFiles(downloadPath!)
  await expect(page.getByRole('status').filter({ hasText: 'Imported "Flow".' })).toBeVisible()
  await expect(page.locator('[data-shape-kind="rectangle"]')).toBeVisible()
  expect(clerkHits).toEqual([])
})
