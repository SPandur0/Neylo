export const APP_LOCK_KEY = 'neylo.appLock.enabled';
export const LOCK_TIMEOUT_MS = 30_000;

// Platform-independent state machine; only the preference is persisted.
export function createAppLock({ storage, biometrics, now = Date.now, initialAppState = 'active' }) {
  let state = { ready: false, enabled: false, locked: true, busy: false, appState: initialAppState, message: '', storageError: false, method: 'device biometrics' };
  let backgroundAt = null;
  let backgroundRevision = 0;
  let splashFinished = false;
  let automaticPending = true;
  const listeners = new Set();
  const update = patch => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };

  async function authenticate(target) {
    if (state.busy || state.appState !== 'active' || !state.ready || state.storageError) return;
    const revision = backgroundRevision;
    update({ busy: true, message: '' });
    try {
      if (!await biometrics.hasHardwareAsync() || !await biometrics.isEnrolledAsync()) {
        update({ message: 'Set up Face ID or device biometrics in your device settings to use App Lock.' });
        return;
      }
      const result = await biometrics.authenticateAsync({
        promptMessage: target === undefined ? 'Unlock Neylo' : target ? 'Enable App Lock for Neylo' : 'Disable App Lock for Neylo',
        cancelLabel: 'Cancel', disableDeviceFallback: true, fallbackLabel: '', biometricsSecurityLevel: 'strong',
      });
      if (revision !== backgroundRevision) return;
      if (!result.success) {
        const cancelled = ['user_cancel', 'system_cancel', 'app_cancel'].includes(result.error);
        update({ message: cancelled ? '' : 'Authentication did not complete. Please try again. If biometrics are locked, unlock your device first.' });
        return;
      }
      if (target !== undefined) {
        await storage.setItem(APP_LOCK_KEY, target ? 'true' : 'false');
        update({ enabled: target, locked: target && revision !== backgroundRevision });
      } else {
        update({ locked: false });
      }
    } catch {
      update({ message: 'App Lock could not complete. Please try again. Biometric authentication requires a supported device and app build.' });
    } finally {
      update({ busy: false });
      maybeAuthenticate();
    }
  }
  function maybeAuthenticate() {
    if (!splashFinished || !state.ready || state.storageError || state.busy || state.appState !== 'active' || !automaticPending) return;
    automaticPending = false;
    if (state.enabled && state.locked) void authenticate();
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async load() {
      update({ storageError: false, ready: false });
      try {
        const value = await storage.getItem(APP_LOCK_KEY);
        if (value !== null && value !== 'true' && value !== 'false') throw new Error('Invalid lock preference');
        update({ ready: true, enabled: value === 'true', locked: value === 'true' });
        maybeAuthenticate();
      } catch {
        update({ ready: true, locked: true, storageError: true, message: 'App Lock settings could not be loaded. Please try again.' });
      }
    },
    setMethod: method => update({ method }),
    finishSplash() { splashFinished = true; maybeAuthenticate(); },
    unlock: () => authenticate(),
    setEnabled: enabled => authenticate(enabled),
    changeAppState(next) {
      if (next === 'background' && backgroundAt === null) {
        backgroundAt = now();
        backgroundRevision++;
      }
      const relock = next === 'active' && backgroundAt !== null && now() - backgroundAt >= LOCK_TIMEOUT_MS && state.enabled;
      if (next === 'active') backgroundAt = null;
      if (relock) automaticPending = true;
      update({ appState: next, ...(relock ? { locked: true } : {}) });
      maybeAuthenticate();
    },
  };
}
