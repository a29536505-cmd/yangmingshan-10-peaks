import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  sanitizeState,
  readState,
  writeState,
  toggleItem,
  daysUntil,
  isValidPeakData,
  gearIds,
} from "../src/state.js";
import { peaks, STORAGE_KEY } from "../src/data.js";

test("corrupt or denied storage does not break the hiking checklist", () => {
  assert.deepEqual(readState({ getItem: () => "{broken" }), {
    version: 1,
    completed: [],
    gear: [],
  });
  assert.deepEqual(
    readState({
      getItem() {
        throw new Error("blocked");
      },
    }),
    { version: 1, completed: [], gear: [] },
  );
  assert.equal(
    writeState(
      {
        setItem() {
          throw new Error("quota");
        },
      },
      {},
    ),
    false,
  );
});
test("imported or stale state cannot invent mountains, duplicate progress or equipment", () => {
  assert.deepEqual(
    sanitizeState({
      completed: ["ding", "ding", "not-a-peak", 1],
      gear: ["0-0", "0-0", "9-9"],
    }),
    { version: 1, completed: ["ding"], gear: ["0-0"] },
  );
  assert.deepEqual(sanitizeState({ completed: "ding", gear: null }), {
    version: 1,
    completed: [],
    gear: [],
  });
});
test("completion and equipment survive a genuine JSON storage round trip", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
  };
  let completed = toggleItem([], "ding");
  completed = toggleItem(completed, "shiti");
  completed = toggleItem(completed, "ding");
  assert.equal(
    writeState(storage, { completed, gear: gearIds.slice(0, 2) }),
    true,
  );
  assert.ok(values.has(STORAGE_KEY));
  assert.deepEqual(readState(storage).completed, ["shiti"]);
  assert.equal(readState(storage).gear.length, 2);
});
test("countdown follows the Taiwan calendar, including the UTC date boundary", () => {
  assert.equal(daysUntil(new Date("2026-10-24T00:00:00Z")), 43);
  assert.equal(daysUntil(new Date("2026-12-05T16:00:00Z")), 0);
  assert.equal(daysUntil(new Date("2026-12-06T16:00:00Z")), -1);
});
test("only regionally plausible coordinates with a source may become markers", () => {
  assert.equal(
    isValidPeakData({ id: "ding", coordinates: [25.19, 121.6] }),
    false,
  );
  assert.equal(
    isValidPeakData({
      id: "unknown",
      coordinates: [25.19, 121.6],
      sourceUrl: "https://example.org/",
    }),
    false,
  );
  assert.equal(
    isValidPeakData({
      id: "ding",
      coordinates: [121.6, 25.19],
      sourceUrl: "https://example.org/",
    }),
    false,
  );
  assert.equal(
    isValidPeakData({
      id: "ding",
      coordinates: [25.19, 121.6],
      sourceUrl: "https://example.org/",
    }),
    true,
  );
});
test("unverified release contains no invented summit markers or route geometry", async () => {
  const data = JSON.parse(
    await readFile(
      new URL("../public/data/verified.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(peaks.length, 10);
  assert.equal(new Set(peaks.map((p) => p.id)).size, 10);
  if (data.status === "pending") {
    assert.deepEqual(data.peaks, []);
    assert.equal(data.route, null);
  }
  for (const p of data.peaks) assert.ok(isValidPeakData(p));
});
test("real map features retain OSM way provenance and valid GeoJSON geometry", async () => {
  const data = JSON.parse(
    await readFile(
      new URL("../public/data/verified.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(data.peaks.length, 10);
  assert.equal(data.route.status, "mapped-trails");
  assert.ok(data.route.geojson.features.length > 100);
  for (const f of data.route.geojson.features) {
    assert.equal(f.geometry.type, "LineString");
    assert.ok(f.geometry.coordinates.length >= 2);
    assert.equal(
      f.properties.sourceUrl,
      `https://www.openstreetmap.org/way/${f.properties.osmWayId}`,
    );
    for (const [lon, lat] of f.geometry.coordinates)
      assert.ok(lon > 121 && lon < 122 && lat > 25 && lat < 26);
  }
});
test("every photograph exists locally and retains its author, license and source", async () => {
  const data = JSON.parse(
    await readFile(
      new URL("../public/data/verified.json", import.meta.url),
      "utf8",
    ),
  );
  for (const p of data.peaks) {
    assert.ok(p.photo.author);
    assert.match(p.photo.license, /CC/);
    assert.match(p.photo.sourceUrl, /^https:\/\/commons\.wikimedia\.org\//);
    const bytes = await readFile(
      new URL(`../public/${p.photo.localPath}`, import.meta.url),
    );
    assert.ok(bytes.length > 1000);
    assert.ok(bytes.length < 700000);
    assert.deepEqual([...bytes.subarray(0, 3)], [255, 216, 255]);
  }
});
