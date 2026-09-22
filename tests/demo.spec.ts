import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('completes the reviewable cleanup simulation and queries updated inventory', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Make room with a plan you can inspect' })).toBeVisible()
  await expect(page.getByText('Demo mode')).toBeVisible()
  await expect(page.getByText('20 sample files indexed')).toBeVisible()

  await page.getByRole('button', { name: 'Inspect request' }).click()
  await expect(page.getByRole('heading', { name: 'Review the interpretation' })).toBeVisible()
  await expect(page.getByText('Semester 2', { exact: true })).toBeVisible()
  await expect(page.getByText('DCIM / Camera', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Build plan' }).click()
  await expect(page.getByRole('heading', { name: 'Cleanup plan' })).toBeVisible()
  await expect(page.getByText('Exact duplicates', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Review Exact duplicates' }).click()
  await expect(page.getByRole('heading', { name: 'Exact duplicates' })).toBeVisible()
  await expect(page.getByText('Retained copy').first()).toBeVisible()
  await page.getByRole('button', { name: 'Done' }).click()

  await page.getByRole('button', { name: 'Review selection' }).click()
  await expect(page.getByRole('heading', { name: 'Final review' })).toBeVisible()
  await page.getByRole('button', { name: 'Simulate cleanup' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Simulate this cleanup?' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).not.toBeVisible()

  await page.getByRole('button', { name: 'Simulate cleanup' }).click()
  await dialog.getByRole('button', { name: 'Simulate cleanup' }).click()
  await expect(page.getByRole('heading', { name: 'Demo inventory updated' })).toBeVisible()
  await expect(page.getByText('No device files were changed.')).toBeVisible()
  await expect(page.getByText('Passed', { exact: true })).toHaveCount(2)

  await page.getByRole('button', { name: 'Ask' }).click()
  await expect(page.getByText(/One BEE lab record copy remains/)).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Make room with a plan you can inspect' })).toBeVisible()
  await expect(page.getByText(/sample files indexed/)).not.toHaveText('20 sample files indexed')

  await page.getByRole('button', { name: 'Storage' }).click()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByText('20 sample files indexed')).toBeVisible()
})

test('shows a shortfall when a selected group is removed', async ({ page }) => {
  await page.getByRole('button', { name: 'Inspect request' }).click()
  await page.getByRole('button', { name: 'Build plan' }).click()

  await page.getByRole('button', { name: 'Review Semester 1 material' }).click()
  await page.getByRole('checkbox', { name: /Deselect Circuit_Theory_Recorded_Lectures/ }).locator('..').click()
  await page.getByRole('checkbox', { name: /Deselect Engineering_Graphics_Practice_Demo/ }).locator('..').click()
  await page.getByRole('checkbox', { name: /Deselect Chemistry_Lab_Experiments/ }).locator('..').click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('The current selection is below target')).toBeVisible()
  await expect(page.getByText(/short$/).first()).toBeVisible()
})
