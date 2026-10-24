// Denne modal håndterer oprettelse, omdøbning, overførsel og arkivering af opsparingskonti med validering af saldo og dato.
import { useRef, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseAmount } from '../data/financeData';
import { ActionButton } from './FinanceUI';
import { styles } from '../styles/styles';

export default function SavingsAccountEditor({ mode, account, accounts, mutate, onClose }) {
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

