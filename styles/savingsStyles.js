// Denne fil styrer oversigten over opsparingskonti, herunder menu, kort og handlinger for hver konto.
import { StyleSheet } from 'react-native';
import { colors } from './styles';

export const overviewStyles = StyleSheet.create({
  menuRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  menuItem: { paddingVertical: 14 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 0, gap: 4 },
  balance: { flex: 1, minWidth: 0, minHeight: 68, padding: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4 },
  name: { flexGrow: 1, flexShrink: 1 },
  amount: { fontSize: 17 },
  actions: { flexDirection: 'row', gap: 6, paddingRight: 12 },
  action: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
});
