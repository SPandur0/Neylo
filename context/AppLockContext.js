import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { createAppLock } from '../security/appLock';

const AppLockContext = createContext(null);
export function AppLockProvider({ children }) {
  const [controller] = useState(() => createAppLock({ storage: Storage, biometrics: LocalAuthentication, initialAppState: AppState.currentState }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', controller.changeAppState);
    void controller.load();
    LocalAuthentication.supportedAuthenticationTypesAsync().then(types => {
      const { FACIAL_RECOGNITION, FINGERPRINT } = LocalAuthentication.AuthenticationType;
      controller.setMethod(Platform.OS === 'ios' && types.includes(FACIAL_RECOGNITION) ? 'Face ID' : types.includes(FINGERPRINT) ? (Platform.OS === 'ios' ? 'Touch ID' : 'fingerprint') : 'device biometrics');
    }).catch(() => {});
    return () => subscription.remove();
  }, [controller]);
  return <AppLockContext.Provider value={{ ...state, controller }}>{children}</AppLockContext.Provider>;
}
export const useAppLock = () => useContext(AppLockContext);
