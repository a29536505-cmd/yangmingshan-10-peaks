import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sanitizeState, readState, writeState, toggleItem, daysUntil, isValidPeakData, gearIds } from '../src/state.js';
import { peaks, STORAGE_KEY } from '../src/data.js';

test('corrupt or denied storage does not break the hiking checklist', () => {
  assert.deepEqual(readState({ getItem: () => '{broken' }), { version: 1, completed: [], gear: [] });
  assert.deepEqual(readState({ getItem() { throw new Error('blocked'); } }), { version: 1, completed: [], gear: [] });
  assert.equal(writeState({ setItem() { throw new Error('quota'); } }, {}), false);
});
test('imported or stale state cannot invent mountains, duplicate progress or equipment', () => {
  assert.deepEqual(sanitizeState({ completed: ['ding', 'ding', 'not-a-peak', 1], gear: ['0-0', '0-0', '9-9'] }), { version: 1, completed: ['ding'], gear: ['0-0'] });
  assert.deepEqual(sanitizeState({ completed: 'ding', gear: null }), { version: 1, completed: [], gear: [] });
});
test('completion and equipment survive a genuine JSON storage round trip', () => {
  const values = new Map(); const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  let completed = toggleItem([], 'ding'); completed = toggleItem(completed, 'shiti'); completed = toggleItem(completed, 'ding');
  assert.equal(writeState(storage, { completed, gear: gearIds.slice(0, 2) }), true);
  assert.ok(values.has(STORAGE_KEY));
  assert.deepEqual(readState(storage).completed, ['shiti']);
  assert.equal(readState(storage).gear.length, 2);
});
test('countdown follows the Taiwan calendar, including the UTC date boundary', () => {
  assert.equal(daysUntil(new Date('2026-10-24T00:00:00Z')), 43);
  assert.equal(daysUntil(new Date('2026-12-05T16:00:00Z')), 0);
  assert.equal(daysUntil(new Date('2026-12-06T16:00:00Z')), -1);
});
test('only regionally plausible coordinates with a source may become markers', () => {
  assert.equal(isValidPeakData({ id: 'ding', coordinates: [25.19, 121.6] }), false);
  assert.equal(isValidPeakData({ id: 'unknown', coordinates: [25.19, 121.6], sourceUrl: 'https://example.org/' }), false);
  assert.equal(isValidPeakData({ id: 'ding', coordinates: [121.6, 25.19], sourceUrl: 'https://example.org/' }), false);
  assert.equal(isValidPeakData({ id: 'ding', coordinates: [25.19, 121.6], sourceUrl: 'https://example.org/' }), true);
});
test('unverified release contains no invented summit markers or route geometry', async () => {
  const data = JSON.parse(await readFile(new URL('../public/data/verified.json', import.meta.url), 'utf8'));
  assert.equal(peaks.length, 10);
  assert.equal(new Set(peaks.map(p => p.id)).size, 10);
  if (data.status === 'pending') { assert.deepEqual(data.peaks, []); assert.equal(data.route, null); }
  for (const p of data.peaks) assert.ok(isValidPeakData(p));
});
