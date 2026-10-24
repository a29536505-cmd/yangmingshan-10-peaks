import { STORAGE_KEY, peaks, gearGroups } from './data.js';
const peakIds = new Set(peaks.map(p => p.id));
export const gearIds = gearGroups.flatMap((group, gi) => group.items.map((_, i) => `${gi}-${i}`));
const allowedGear = new Set(gearIds);
export function sanitizeState(value) {
  const list = (items, allowed) => Array.isArray(items) ? [...new Set(items.filter(i => typeof i === 'string' && allowed.has(i)))] : [];
  return { version: 1, completed: list(value?.completed, peakIds), gear: list(value?.gear, allowedGear) };
}
export function readState(storage) {
  try { return sanitizeState(JSON.parse(storage.getItem(STORAGE_KEY))); }
  catch { return sanitizeState(null); }
}
export function writeState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state))); return true; }
  catch { return false; }
}
export function toggleItem(items, id) { return items.includes(id) ? items.filter(item => item !== id) : [...items, id]; }
export function daysUntil(now = new Date()) {
  // Compare calendar dates in Taiwan, independent of the device's time zone.
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = name => parts.find(p => p.type === name).value;
  return Math.round((Date.UTC(2026, 11, 6) - Date.UTC(+part('year'), +part('month') - 1, +part('day'))) / 86400000);
}
export function isValidPeakData(record) {
  return peakIds.has(record?.id) && Array.isArray(record.coordinates) && record.coordinates.length === 2 &&
    record.coordinates.every(Number.isFinite) && record.coordinates[0] > 25.1 && record.coordinates[0] < 25.3 &&
    record.coordinates[1] > 121.4 && record.coordinates[1] < 121.7 && typeof record.sourceUrl === 'string' && record.sourceUrl.startsWith('https://');
}
