import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_DURATIONS } from "../src/timer.ts";
import { loadSettings, saveSettings } from "../src/storage.ts";

test("missing preferences use independent defaults", () => {
  const settings = loadSettings({ getItem: () => null });
  assert.deepEqual(settings, DEFAULT_DURATIONS);
  settings.focus = 9000;
  assert.notEqual(settings.focus, DEFAULT_DURATIONS.focus);
});

test("saved Focus and Break durations survive a storage round trip", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const settings = { focus: 25 * 60000, break: 5 * 60000 };
  assert.equal(saveSettings(settings, storage), true);
  assert.deepEqual(loadSettings(storage), settings);
});

test("legacy test settings do not override standard defaults or new preferences", () => {
  const values = new Map([["minimac-durations", JSON.stringify({ focus: 5000, break: 5000 })]]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.deepEqual(loadSettings(storage), { focus: 25 * 60000, break: 5 * 60000 });
  const settings = { focus: 10 * 60000, break: 2 * 60000 };
  assert.equal(saveSettings(settings, storage), true);
  assert.deepEqual(loadSettings(storage), settings);
});

test("malformed and invalid saved values use defaults", () => {
  for (const raw of ['{', 'null', '[]', '{}', '{"focus":"5000","break":5000}', '{"focus":0,"break":5000}', '{"focus":-1000,"break":5000}', '{"focus":1500,"break":5000}', '{"focus":10801000,"break":5000}']) {
    assert.deepEqual(loadSettings({ getItem: () => raw }), DEFAULT_DURATIONS);
  }
});

test("unavailable storage never prevents startup", () => {
  assert.deepEqual(loadSettings({ getItem() { throw new Error("storage blocked"); } }), DEFAULT_DURATIONS);
  assert.equal(saveSettings(DEFAULT_DURATIONS, { setItem() { throw new Error("storage blocked"); } }), false);
});

test("invalid preferences are rejected before writing", () => {
  let writes = 0;
  const storage = { setItem() { writes++; } };
  for (const focus of [0, -1000, NaN, Infinity, 1500, 10801000]) {
    assert.equal(saveSettings({ focus, break: 5000 }, storage), false);
  }
  assert.equal(writes, 0);
});
