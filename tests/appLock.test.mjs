import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppLock, APP_LOCK_KEY } from '../security/appLock.js';
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup(value = null) {
  let time = 0;
  const calls = [];
  const storage = { getItem: async () => value, setItem: async (key, next) => { assert.equal(key, APP_LOCK_KEY); value = next; } };
  const biometrics = { hasHardwareAsync: async () => true, isEnrolledAsync: async () => true, authenticateAsync: async options => { calls.push(options); return { success: true }; } };
  const lock = createAppLock({ storage, biometrics, now: () => time });
  return { lock, storage, biometrics, calls, advance: ms => { time += ms; }, value: () => value };
}
test('disabled startup has no prompt; enable and disable require successful authentication and persist', async () => {
  const f = setup(); await f.lock.load(); f.lock.finishSplash();
  assert.equal(f.lock.getSnapshot().locked, false); assert.equal(f.calls.length, 0);
  await f.lock.setEnabled(true); assert.equal(f.value(), 'true'); assert.equal(f.calls.length, 1);
  await f.lock.setEnabled(false); assert.equal(f.value(), 'false'); assert.equal(f.calls.length, 2);
});
test('enabled cold startup waits for splash; cancellation stays locked without a loop; retry succeeds', async () => {
  const f = setup('true'); await f.lock.load(); assert.equal(f.lock.getSnapshot().locked, true); assert.equal(f.calls.length, 0);
  f.biometrics.authenticateAsync = async () => { f.calls.push('cancel'); return { success: false, error: 'user_cancel' }; };
  f.lock.finishSplash(); await flush(); assert.equal(f.lock.getSnapshot().locked, true); assert.equal(f.calls.length, 1);
  f.lock.changeAppState('inactive'); f.lock.changeAppState('active'); await flush(); assert.equal(f.calls.length, 1);
  f.biometrics.authenticateAsync = async () => ({ success: true }); await f.lock.unlock(); assert.equal(f.lock.getSnapshot().locked, false);
});
test('Control Center and brief background do not prompt; 30 seconds does', async () => {
  const f = setup('true'); await f.lock.load(); f.lock.finishSplash(); await flush();
  f.lock.changeAppState('inactive'); f.advance(40000); f.lock.changeAppState('active');
  f.lock.changeAppState('background'); f.advance(29999); f.lock.changeAppState('active'); await flush(); assert.equal(f.calls.length, 1);
  f.lock.changeAppState('background'); f.advance(30000); f.lock.changeAppState('active'); assert.equal(f.lock.getSnapshot().locked, true);
  await flush(); assert.equal(f.calls.length, 2);
});
test('unavailable, unenrolled, cancelled and failed biometrics cannot enable or disable', async () => {
  for (const value of [null, 'true']) for (const reason of ['hardware', 'enrollment', 'cancel', 'failure', 'throw']) {
    const f = setup(value); await f.lock.load();
    if (reason === 'hardware') f.biometrics.hasHardwareAsync = async () => false;
    if (reason === 'enrollment') f.biometrics.isEnrolledAsync = async () => false;
    if (reason === 'cancel' || reason === 'failure') f.biometrics.authenticateAsync = async () => ({ success: false, error: reason === 'cancel' ? 'user_cancel' : 'authentication_failed' });
    if (reason === 'throw') f.biometrics.authenticateAsync = async () => { throw Error(); };
    await f.lock.setEnabled(value !== 'true'); assert.equal(f.value(), value); assert.equal(f.lock.getSnapshot().enabled, value === 'true');
  }
});
test('storage failures fail closed and writes do not change the displayed preference', async () => {
  const f = setup('true'); f.storage.getItem = async () => { throw Error(); }; await f.lock.load();
  assert.equal(f.lock.getSnapshot().locked, true); assert.equal(f.lock.getSnapshot().storageError, true);
  await f.lock.unlock(); assert.equal(f.calls.length, 0);
  f.storage.getItem = async () => 'true'; await f.lock.load();
  f.storage.setItem = async () => { throw Error(); }; await f.lock.setEnabled(false); assert.equal(f.lock.getSnapshot().enabled, true);
});
test('concurrent taps use one prompt and backgrounded prompt cannot unlock', async () => {
  const f = setup('true'); await f.lock.load(); let resolve;
  f.biometrics.authenticateAsync = () => new Promise(done => { resolve = done; });
  const pending = f.lock.unlock(); await flush(); await f.lock.unlock();
  f.lock.changeAppState('background'); resolve({ success: true }); await pending;
  assert.equal(f.lock.getSnapshot().locked, true); assert.equal(f.lock.getSnapshot().busy, false);
});
