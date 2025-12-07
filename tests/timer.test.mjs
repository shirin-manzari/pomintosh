import assert from "node:assert/strict";
import test from "node:test";
import {
  completeSession, createTimerState, getRemainingTime,
  pauseTimer, resetTimer, skipTimer, startTimer,
} from "../src/timer.ts";

const focusMs = 25 * 60 * 1000;
const breakMs = 5 * 60 * 1000;

test("starts with the full focus duration and an absolute deadline", () => {
  const timer = createTimerState();
  assert.equal(getRemainingTime(timer, 1000), focusMs);
  assert.equal(timer.status, "idle");
  startTimer(timer, 1000);
  assert.equal(timer.endsAt, 1000 + focusMs);
  assert.equal(timer.status, "running");
});

test("uses elapsed timestamps even when no refresh callbacks run", () => {
  const timer = createTimerState();
  startTimer(timer, 1000);
  assert.equal(getRemainingTime(timer, 1000 + 3425), focusMs - 3425);
  startTimer(timer, 8000);
  assert.equal(timer.endsAt, 1000 + focusMs);
});

test("pause preserves milliseconds and resume excludes the paused time", () => {
  const timer = createTimerState();
  startTimer(timer, 1000);
  pauseTimer(timer, 2537);
  assert.equal(timer.status, "paused");
  assert.equal(timer.endsAt, null);
  assert.equal(getRemainingTime(timer, 9000000), focusMs - 1537);
  assert.equal(completeSession(timer, 9000000), false);
  startTimer(timer, 9000000);
  assert.equal(getRemainingTime(timer, 9000750), focusMs - 2287);
});

test("reset restores the duration and idle status in both modes", () => {
  const timer = createTimerState();
  startTimer(timer, 1000);
  resetTimer(timer);
  assert.deepEqual(timer, createTimerState());
  skipTimer(timer);
  startTimer(timer, 1000);
  pauseTimer(timer, 2000);
  resetTimer(timer);
  assert.deepEqual(timer, { mode: "break", status: "idle", endsAt: null, remainingMs: breakMs, durations: { focus: focusMs, break: breakMs } });
});

test("skip moves running and paused timers to the next idle mode", () => {
  const timer = createTimerState();
  startTimer(timer, 1000);
  skipTimer(timer);
  assert.deepEqual(timer, { mode: "break", status: "idle", endsAt: null, remainingMs: breakMs, durations: { focus: focusMs, break: breakMs } });
  startTimer(timer, 2000);
  pauseTimer(timer, 3000);
  skipTimer(timer);
  assert.deepEqual(timer, createTimerState());
});

test("completion occurs exactly once and does not start the next session", () => {
  const timer = createTimerState();
  startTimer(timer, 1000);
  assert.equal(completeSession(timer, 1000 + focusMs - 1), false);
  assert.equal(completeSession(timer, 1000 + focusMs), true);
  assert.equal(timer.mode, "break");
  assert.equal(timer.status, "idle");
  assert.equal(completeSession(timer, 1000 + focusMs + 1), false);
  startTimer(timer, 2000 + focusMs);
  assert.equal(completeSession(timer, 2000 + focusMs + breakMs), true);
  assert.deepEqual(timer, createTimerState());
});

test("a sleep past the deadline clamps the countdown and completes once", () => {
  const timer = createTimerState();
  startTimer(timer, 1000);
  const wakeTime = 1000 + 8 * 60 * 60 * 1000;
  assert.equal(getRemainingTime(timer, wakeTime), 0);
  assert.equal(completeSession(timer, wakeTime), true);
  assert.equal(completeSession(timer, wakeTime + focusMs), false);
  assert.equal(getRemainingTime(timer, wakeTime), breakMs);
});

test("pausing idle or paused timers has no effect", () => {
  const timer = createTimerState();
  pauseTimer(timer, 2000);
  assert.deepEqual(timer, createTimerState());
  startTimer(timer, 1000);
  pauseTimer(timer, 2000);
  const paused = { ...timer };
  pauseTimer(timer, 9000);
  assert.deepEqual(timer, paused);
});

test("custom durations are used by reset, skip, and completion", () => {
  const settings = { focus: 2 * 60000, break: 7000 };
  const timer = createTimerState(settings);
  settings.focus = 9000;
  assert.equal(getRemainingTime(timer), 2 * 60000);
  startTimer(timer, 1000);
  assert.equal(completeSession(timer, 121000), true);
  assert.equal(getRemainingTime(timer), 7000);
  startTimer(timer, 122000);
  resetTimer(timer);
  assert.equal(getRemainingTime(timer), 7000);
  skipTimer(timer);
  assert.equal(getRemainingTime(timer), 2 * 60000);
});
