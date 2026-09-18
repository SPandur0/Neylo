import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppLock } from '../context/AppLockContext';
import NeyloLogo from './NeyloLogo';
import { ActionButton } from './FinanceUI';
import { colors, styles } from '../styles/styles';

export default function AppLockGate({ children }) {
  const lock = useAppLock();
  // Unmount protected screens, including native modals, while access is blocked.
  if (lock.ready && !lock.storageError && !lock.locked && (!lock.enabled || lock.appState === 'active')) return children;
  return <View style={local.screen} accessibilityViewIsModal>
    <NeyloLogo size={80} />
    <Text style={styles.pageTitle}>Neylo is locked</Text>
    {lock.message ? <Text accessibilityRole="alert" style={local.message}>{lock.message}</Text> : null}
    {!lock.ready || lock.busy ? <ActivityIndicator color={colors.green} accessibilityLabel="Checking App Lock" /> :
      <ActionButton label={lock.storageError ? 'Try again' : `Unlock with ${lock.method}`} onPress={lock.storageError ? lock.controller.load : lock.controller.unlock} disabled={lock.appState !== 'active'} icon="lock-open-outline" />}
  </View>;
}
const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 24 },
  message: { color: colors.muted, textAlign: 'center' },
});
