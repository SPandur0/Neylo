import { useEffect, useRef, useState } from 'react';
import { Modal, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, Icon } from './FinanceUI';
import { parseAmount } from '../data/financeData';
import { useFinances } from '../context/FinanceContext';
import CategoryManager from './CategoryManager';
import { styles } from '../styles/styles';

// Mounted fresh for each edit, so unsaved values disappear on Cancel.
export default function EntryModal({ group, entry, onSave, onDelete, onClose }) {
  const { expenseCategories, data } = useFinances();
  const [managingCategories, setManagingCategories] = useState(false);
  const [name, setName] = useState(entry?.name ?? '');
  const [amount, setAmount] = useState(entry ? String(entry.amount).replace('.', ',') : '');
  const [category, setCategory] = useState(entry?.category_id ?? expenseCategories[0]?.id ?? '');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (group.key !== 'expenses') return;
    if (!expenseCategories.some(item => item.id === category)) {
      const current = data.expenses.find(item => item.id === entry?.id);
      setCategory(current?.category_id ?? expenseCategories[0]?.id ?? '');
    }
  }, [expenseCategories, data.expenses, entry?.id, group.key, category]);

  const pending = useRef(false);
  async function persist(operation) {
    if (pending.current) return;
    pending.current = true;
    setError('');
    try { await operation(); }
    catch { setError('Ændringen kunne ikke gemmes. Prøv igen.'); }
    finally { pending.current = false; }
  }
  const close = () => { if (!pending.current) onClose(); };

  function submit() {
    const parsed = parseAmount(amount);
    if (!name.trim()) { setError('Skriv et navn til posten.'); return; }
    if (parsed === null) { setError('Skriv et beløb mellem 0 og 999.999.999 kr. Brug fx 10.000,50.'); return; }
    if (group.key === 'expenses' && !expenseCategories.some(item => item.id === category)) { setError('Opret eller vælg en kategori.'); return; }
    persist(() => onSave({ name: name.trim(), amount: parsed, ...(group.key === 'expenses' ? { category_id: category } : {}) }));
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={managingCategories ? () => setManagingCategories(false) : close}>
      <SafeAreaView style={styles.modalBackdrop}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            {managingCategories ? <CategoryManager onClose={() => setManagingCategories(false)} /> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}>
              <View style={styles.between}>
                <View style={styles.grow}>
                  <Text style={styles.eyebrow}>{group.label.toUpperCase()}</Text>
                  <Text style={styles.sectionTitle}>{entry ? 'Rediger post' : 'Ny post'}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Luk formular" onPress={close} style={styles.iconButton}><Icon name="close" /></Pressable>
              </View>
              <Text style={styles.subtitle}>{['income', 'expenses'].includes(group.key) ? 'Indtast beløbet pr. måned.' : 'Indtast den aktuelle beholdning, ikke et månedligt bidrag.'}</Text>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput accessibilityLabel="Name" style={styles.entryInput} value={name} onChangeText={setName} placeholder="Fx Rent" maxLength={60} autoCapitalize="sentences" />
              <Text style={styles.inputLabel}>Amount · kr.</Text>
              <TextInput accessibilityLabel="Amount i kroner" style={styles.entryInput} value={amount} onChangeText={setAmount} placeholder="Fx 10.000,50" keyboardType="decimal-pad" maxLength={20} />
              <Text style={styles.muted}>Dansk talformat · Komma til decimaler</Text>
              {group.key === 'expenses' && (
                <>
                  <View style={styles.between}>
                    <Text style={styles.inputLabel}>Category</Text>
                    <ActionButton label="Administrer" variant="secondary" icon="options-outline" onPress={() => setManagingCategories(true)} />
                  </View>
                  {expenseCategories.length === 0 && <Text style={styles.subtitle}>Ingen kategorier endnu. Tryk på Administrer for at tilføje en.</Text>}
                  <View style={styles.categoryOptions}>
                    {expenseCategories.map(item => (
                      <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: category === item.id }} onPress={() => setCategory(item.id)} style={[styles.filter, category === item.id && styles.filterActive]}>
                        <Text style={[styles.filterText, category === item.id && styles.filterTextActive]}>{item.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <ActionButton label="Gem post" icon="checkmark-outline" onPress={submit} />
              <ActionButton label="Annuller" icon="close-outline" variant="secondary" onPress={close} />
              {entry && !confirmDelete && (
                <ActionButton label="Slet post" variant="destructive" icon="trash-outline" onPress={() => setConfirmDelete(true)} />
              )}
              {confirmDelete && (
                <View style={styles.deleteConfirmation}>
                  <Text style={styles.bodyText}>Vil du slette “{entry.name}”?</Text>
                  <ActionButton label="Ja, slet posten" variant="destructive" icon="trash-outline" onPress={() => persist(onDelete)} />
                  <ActionButton label="Behold post" variant="secondary" icon="arrow-back-outline" onPress={() => setConfirmDelete(false)} />
                </View>
              )}
            </ScrollView>}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
