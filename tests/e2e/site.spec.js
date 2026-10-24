import { test, expect } from '@playwright/test';
async function tab(page, name) {
  const nav = page.viewportSize().width < 900 ? page.getByRole('navigation', { name: '手機導覽' }) : page.getByRole('navigation', { name: '主要導覽' });
  await nav.getByRole('link', { name, exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  // Third-party availability is checked separately; deterministic interaction tests
  // intentionally run without outside map tiles or fonts.
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.goto('/');
});
test('Traditional Chinese page, working tabs and no horizontal overflow', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await expect(page).toHaveTitle(/2026年12月6日陽明山十連峰/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant-TW');
  for (const name of ['十峰手帖', '當日計畫', '行前準備', '路線地圖']) {
    await tab(page, name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});
test('ten peak progress, filters and equipment persist after reload', async ({ page }) => {
  await tab(page, '十峰手帖');
  await expect(page.locator('.peak-card')).toHaveCount(10);
  await page.getByRole('button', { name: '頂山：標記已完成', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await page.getByRole('button', { name: '已完成', exact: true }).click();
  await expect(page.locator('.peak-card')).toHaveCount(1);
  await tab(page, '行前準備');
  await page.getByText('止滑登山鞋', { exact: true }).click();
  await page.reload();
  await expect(page.locator('[data-gear="0-0"]')).toBeChecked();
  await tab(page, '十峰手帖');
  await expect(page.getByRole('button', { name: '頂山：已完成，點擊取消' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
});
test('peak detail modal can mark completion and closes accessibly', async ({ page }) => {
  await page.getByRole('button', { name: /01 頂山/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: '頂山', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '標記這座山已完成' }).click();
  await expect(dialog.getByRole('button', { name: '已完成，點擊可取消' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: /01 頂山/ })).toBeFocused();
});
test('reset requires a deliberate confirmation and preserves equipment', async ({ page }) => {
  await tab(page, '行前準備'); await page.getByText('止滑登山鞋', { exact: true }).click();
  await tab(page, '十峰手帖'); await page.getByRole('button', { name: '頂山：標記已完成', exact: true }).click();
  await page.getByRole('button', { name: '重設山峰進度' }).click();
  await page.getByRole('button', { name: '保留紀錄' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await page.getByRole('button', { name: '重設山峰進度' }).click();
  await page.getByRole('button', { name: '清除山峰進度' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await tab(page, '行前準備'); await expect(page.locator('[data-gear="0-0"]')).toBeChecked();
});
test('source status, photo gaps and lack of verified geometry are explicit', async ({ page }) => {
  await expect(page.getByText('路線查證尚未完成', { exact: true })).toBeVisible();
  await expect(page.locator('.peak-marker')).toHaveCount(0);
  await tab(page, '十峰手帖');
  await expect(page.getByText('山峰照片待查證', { exact: true })).toHaveCount(10);
  await page.getByLabel('資料來源與查證狀態', { exact: true }).click();
  await expect(page.getByRole('dialog').getByText('查證尚未完成', { exact: true })).toBeVisible();
});
test('export contains current event progress without location data', async ({ page }) => {
  await tab(page, '十峰手帖'); await page.getByRole('button', { name: '頂山：標記已完成', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '匯出我的紀錄' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('2026-12-06');
  const stream = await download.createReadStream(); let text = ''; for await (const chunk of stream) text += chunk.toString();
  const data = JSON.parse(text);
  expect(data.completed).toEqual(['ding']); expect(data.eventDate).toBe('2026-12-06'); expect(data.coordinates).toBeUndefined();
});
test('map zoom and dragging operate even when the tile server is unavailable', async ({ page }) => {
  const map = page.locator('#trail-map');
  await map.scrollIntoViewIfNeeded();
  const pane = page.locator('.leaflet-map-pane');
  const before = await pane.getAttribute('style');
  const box = await map.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 65, box.y + box.height / 2 + 30, { steps: 12 }); await page.mouse.up();
  await expect(pane).not.toHaveAttribute('style', before);
  const beforeTiles = await page.locator('.leaflet-tile-container').last().getAttribute('style');
  await page.getByRole('button', { name: '放大地圖', exact: true }).click();
  await expect.poll(async () => page.locator('.leaflet-tile-container').first().getAttribute('style')).not.toBe(beforeTiles);
  await expect(page.locator('#map-status')).toContainText('底圖目前無法載入');
});
test('plan shows conservative exit decisions and confirmed status for transport', async ({ page }) => {
  await tab(page, '當日計畫');
  await expect(page.getByRole('heading', { name: '小油坑｜第二個決策點' })).toBeVisible();
  await expect(page.locator('.timeline-item.exit')).toHaveCount(2);
  await expect(page.getByText(/2026\/12\/6班次與末班車尚未確認/)).toBeVisible();
  await tab(page, '行前準備');
  await expect(page.getByRole('link', { name: /119/ })).toHaveAttribute('href', 'tel:119');
});
test('denied browser storage leaves the application usable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Access denied', 'SecurityError'); } }); });
  await page.reload();
  await tab(page, '十峰手帖');
  await page.getByRole('button', { name: '頂山：標記已完成', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
});
