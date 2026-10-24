// Denne fil styrer detaljskærmen for en opsparingskonto, herunder saldo, handlinger og transaktionsliste.
import { StyleSheet } from 'react-native';
import { colors } from './styles';

export const savingsDetailsStyles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, alignSelf: 'flex-start' },
  balance: { gap: 8 },
  actions: { gap: 12, marginTop: 16 },
  secondaryActions: { gap: 10, marginTop: 12 },
  history: { marginTop: 24, gap: 12 },
  transaction: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  transactionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  amount: { fontSize: 17, fontWeight: '600', color: colors.ink },
  credit: { color: colors.green },
  debit: { color: colors.destructive },
  archived: { color: colors.muted, marginTop: 8 },
});
