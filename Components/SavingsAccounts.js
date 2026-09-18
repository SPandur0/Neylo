import { useRef, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinances } from '../context/FinanceContext';
import { money, parseAmount } from '../data/financeData';
import { ActionButton, Icon } from './FinanceUI';
import SavingsChart from './SavingsChart';
import { styles, colors } from '../styles/styles';

export default function SavingsAccounts() {
  const { savingsSnapshot: snapshot, totals, mutateSavings } = useFinances();
  const [editor, setEditor] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openEditor = (mode, pot) => { setMenuOpen(false); setEditor({ mode, account: pot }); };
  return <ScrollView contentContainerStyle={styles.entryList}>
    <View style={styles.between}>
      <Text style={styles.metricLabel}>Savings</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="More savings options" accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(!menuOpen)} style={styles.iconButton}><Icon name="ellipsis-horizontal" /></Pressable>
    </View>
    {menuOpen && <View style={styles.entryCard}>
      {snapshot.accounts.map(pot => <View key={pot.id}>
        <Text style={styles.rowTitle}>{pot.name}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
          <MenuItem label="Rename" onPress={() => openEditor('rename', pot)} />
          <MenuItem label="Move money" onPress={() => openEditor('transfer', pot)} />
          <ActionButton label="Archive" variant="destructive" icon="archive-outline" onPress={() => openEditor('archive', pot)} />
        </View>
      </View>)}
      <MenuItem label={showArchived ? 'Show savings' : 'Archived savings'} onPress={() => { setShowArchived(!showArchived); setMenuOpen(false); }} />
    </View>}
      <Text style={styles.summaryValue}>{money(totals.savings)}</Text>
      {showArchived && <Text style={styles.sectionTitle}>Archived savings</Text>}
      {(showArchived ? snapshot.archived : snapshot.accounts).map(row => <View key={row.id} style={[styles.entryCard, overviewStyles.card]}>
        <View style={overviewStyles.balance}>
          <Text style={[styles.rowTitle, overviewStyles.name]}>{row.name}</Text>
          <Text style={[styles.entryAmount, overviewStyles.amount]}>{money(row.amount)}</Text>
        </View>
        {!row.archived_at && <View style={overviewStyles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Withdraw money from ${row.name}`} onPress={() => openEditor('withdrawal', row)} style={({ pressed }) => [overviewStyles.action, pressed && styles.pressed]}>
            <Icon name="remove" size={19} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Add money to ${row.name}`} onPress={() => openEditor('deposit', row)} style={({ pressed }) => [overviewStyles.action, pressed && styles.pressed]}>
            <Icon name="add" size={19} />
          </Pressable>
        </View>}
      </View>)}
      {showArchived ? <MenuItem label="Back to savings" onPress={() => setShowArchived(false)} /> : <>
        <ActionButton label="Add savings" icon="add" onPress={() => setEditor({ mode: 'create' })} />
        <View><SavingsChart history={snapshot.history} /></View>
      </>}
    {editor && <AccountEditor {...editor} accounts={snapshot.accounts} mutate={mutateSavings} onClose={() => setEditor(null)} />}
  </ScrollView>;
}

function AccountEditor({ mode, account, accounts, mutate, onClose }) {
  const [name, setName] = useState(account?.name || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const close = () => { if (!pending.current) onClose(); };
  const labels = { create: 'What are you saving for?', rename: 'Rename savings', deposit: `Add money to ${account?.name}`, withdrawal: `Take money out of ${account?.name}`, transfer: 'Move money', archive: 'Archive savings' };
  const submitLabels = { create: 'Create', rename: 'Save', deposit: 'Add', withdrawal: 'Take out', transfer: 'Move', archive: 'Archive' };
  async function submit() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      if (['create', 'rename'].includes(mode) && !name.trim()) throw new Error('Give your savings a name.');
      if (mode === 'archive' && account.amount !== 0) throw new Error('Move or take out the remaining money first.');
      if (mode === 'rename') await mutate('updateSavingsAccount', account.id, { name });
      else if (mode === 'archive') await mutate('archiveSavingsAccount', account.id);
      else {
        const parsed = parseAmount(amount);
        if (parsed === null) throw new Error('Enter an amount, for example 10.000,50.');
        if (mode !== 'create' && parsed <= 0) throw new Error('Enter an amount greater than zero.');
        if (['withdrawal', 'transfer'].includes(mode) && parsed > account.amount) throw new Error('There isn’t enough money in this pot.');
        if (mode === 'transfer' && !target) throw new Error('Choose where to move your money.');
        if (mode === 'create') await mutate('createSavingsAccount', { name, initialBalance: parsed });
        else if (mode === 'transfer') await mutate('transferBetweenSavingsAccounts', account.id, target, { amount: parsed });
        else await mutate('addSavingsTransaction', account.id, { amount: parsed, note, type: mode });
      }
      onClose();
    } catch (failure) { setError(failure.message || 'Could not save. Please try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  const field = (label, value, onChangeText, props = {}) => <View><Text style={styles.inputLabel}>{label}</Text><TextInput accessibilityLabel={label} style={styles.entryInput} value={value} onChangeText={onChangeText} editable={!busy} {...props} /></View>;
  return <Modal visible transparent animationType="fade" onRequestClose={close}>
    <SafeAreaView style={styles.modalBackdrop}><KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.modalCard} accessibilityViewIsModal>
      <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>{labels[mode]}</Text>
        {['create', 'rename'].includes(mode) && field('Name', name, setName, { maxLength: 60 })}

        {mode === 'archive' ? <Text style={styles.bodyText}>Archive “{account.name}”? It will leave your savings list, but your history stays. Move or take out any remaining money first.</Text> : mode !== 'rename' && <>
          {field(mode === 'create' ? 'Current amount · kr.' : 'Amount · kr.', amount, setAmount, { keyboardType: 'decimal-pad', maxLength: 20 })}
          {['deposit', 'withdrawal'].includes(mode) && field('Optional note', note, setNote, { maxLength: 500 })}
        </>}
        {mode === 'transfer' && <><Text style={styles.inputLabel}>From</Text><Text style={styles.rowTitle}>{account.name}</Text><Text style={styles.inputLabel}>To</Text>{accounts.length < 2 && <Text style={styles.muted}>Add another savings pot to move money.</Text>}{accounts.filter(row => row.id !== account.id).map(row => <Pressable key={row.id} accessibilityRole="button" accessibilityState={{ selected: target === row.id }} onPress={() => { if (!busy) setTarget(row.id); }} style={[styles.filter, target === row.id && styles.filterActive]}><Text style={[styles.filterText, target === row.id && styles.filterTextActive]}>{row.name}</Text></Pressable>)}</>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <ActionButton label={busy ? 'Saving…' : submitLabels[mode]} variant={mode === 'archive' ? 'destructive' : 'primary'} icon={mode === 'archive' ? 'archive-outline' : 'arrow-forward'} onPress={submit} />
        <ActionButton label="Cancel" variant="secondary" onPress={close} />
      </ScrollView>
    </View></KeyboardAvoidingView></SafeAreaView>
  </Modal>;
}

function MenuItem({ label, onPress }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [{ paddingVertical: 14 }, pressed && styles.pressed]}><Text style={styles.linkText}>{label}</Text></Pressable>;
}

const overviewStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 0, gap: 4 },
  balance: { flex: 1, minWidth: 0, minHeight: 68, padding: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4 },
  name: { flexGrow: 1, flexShrink: 1 },
  amount: { fontSize: 17 },
  actions: { flexDirection: 'row', gap: 6, paddingRight: 12 },
  action: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
});
