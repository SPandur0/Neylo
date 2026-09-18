# App Lock

App Lock is an application access gate, not SQLite encryption. The OS handles biometric data. No financial or biometric data is stored by this feature.

The `neylo.appLock.enabled` string (`true` or `false`) is saved using the already-installed `expo-sqlite/kv-store`, in its separate `ExpoSQLiteStorage` database. The financial database and migrations are unchanged. Missing preference means disabled; failed or invalid reads block access with a retry button.

The existing startup hold and fade are preserved. Enabled sessions show the lock screen underneath the fade, then request authentication once. Cancellation leaves a manual retry button. Enabling and disabling both require successful native biometric authentication. Device-passcode fallback is disabled; Android requests strong biometrics.

With App Lock enabled, inactive/background states remove protected screens (including native financial modals). Actual background time of at least 30 seconds causes a fresh prompt on return. Inactive time alone, such as Control Center or the native biometric prompt, does not count. Screens remount when access resumes, so navigation returns to Home and unsaved form input is cleared. Background snapshot timing must be checked on physical devices; this JavaScript gate is not an OS screenshot-prevention feature.

No new packages were added: `expo-local-authentication` was already in package.json/package-lock.json when work began. SecureStore is not needed for this non-secret boolean preference.

The local-authentication config plugin supplies this iOS permission text:

> Allow Neylo to use Face ID to protect your financial information.

## Real iPhone test

1. Configure Face ID in iPhone Settings. Connect the iPhone to the Mac, trust the computer, and enable Developer Mode. Have Xcode installed with an Apple signing team configured.
2. From `min_app`, run `npx expo run:ios --device`, select the physical iPhone, and complete any signing/bundle-identifier setup requested by Expo/Xcode. This generates/builds the native iOS project and includes the Face ID permission. An existing custom build must be rebuilt after this config change; a JavaScript reload is insufficient.
3. Open the installed Neylo app with App Lock disabled. Confirm the existing splash and normal Home screen.
4. In Settings, turn App Lock on. Cancel first: it must remain off. Try again, allow Face ID access, and authenticate: it must turn on.
5. Force-close Neylo and reopen the installed app. Confirm the original splash, then the minimal lock screen and one native prompt, with no financial information visible.
6. Cancel the prompt. Confirm the lock screen remains with no automatic loop. Tap Unlock with Face ID and authenticate; Home must open.
7. Open Control Center briefly and return. Then switch to another app for less than 30 seconds and return. Neither should cause a new prompt after an unlocked session.
8. Switch to another app for more than 30 seconds. Return: authentication must be required. Also inspect the app-switcher preview with an entry modal previously open and confirm private content is hidden on the target iPhone.
9. Turn App Lock off: cancel first and verify it remains enabled; authenticate on the next attempt and verify it becomes disabled. Force-close/reopen: normal startup must return.
10. Repeat on Touch ID / Android fingerprint hardware if available. Also test denied permission and unavailable enrollment; the preference must not enable, and errors must stay recoverable without bypassing an enabled lock.

Face ID is not supported in iOS Expo Go. Use the native device build above for acceptance testing. There is no development bypass for an enabled lock. Simulated/mocked authentication does not verify the physical sensor or native lifecycle behavior.

Automated checks: `node --test tests/*.test.mjs`. The App Lock tests cover startup, cancellation/retry, authenticated preference changes, unavailable biometrics, storage errors, timeout boundaries, overlapping requests, and stale authentication results after backgrounding.
