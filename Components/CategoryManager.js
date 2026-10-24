// Denne editor styrer udgiftskategorier og flytter eksisterende poster til en ny kategori, hvis en kategori slettes.
import { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useFinances } from '../context/FinanceContext';
import { ActionButton } from './FinanceUI';
import { styles } from '../styles/styles';

// Render inside the expense modal so its unsaved fields survive category edits.
export default function CategoryManager({ onClose }) {
  const { expenseCategories, data, mutateCategory } = useFinances();
  const [editor, setEditor] = useState(null);
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [replacement, setReplacement] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const count = editor?.id ? data.expenses.filter(item => item.category_id === editor.id).length : 0;
  const alternatives = expenseCategories.filter(item => item.id !== editor?.id);
  function open(category) {
    setEditor(category); setName(category.name ?? ''); setDeleting(false); setReplacement(''); setError('');
  }
  function back() {
    if (pending.current) return;
    if (deleting) { setDeleting(false); setError(''); }
    else if (editor) { setEditor(null); setError(''); }
    else onClose();
  }
  async function submit() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      if (deleting) await mutateCategory('delete', editor.id, replacement || null);
      else if (editor.id) await mutateCategory('rename', editor.id, name);
      else await mutateCategory('create', name);
      setEditor(null); setDeleting(false);
    } catch (failure) { setError(failure.message || 'Ændringen kunne ikke gemmes. Prøv igen.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
    <Text style={styles.sectionTitle}>{deleting ? 'Slet kategori' : editor ? (editor.id ? 'Rediger kategori' : 'Ny kategori') : 'Kategorier'}</Text>
    {!editor ? <>
      {expenseCategories.length === 0 && <Text style={styles.subtitle}>Tilføj din første kategori.</Text>}
      {expenseCategories.map(category => <View key={category.id} style={styles.between}>
        <Text style={[styles.rowTitle, styles.grow]}>{category.name}</Text>
        <ActionButton label="Rediger" variant="secondary" icon="create-outline" onPress={() => open(category)} />
      </View>)}
      <ActionButton label="Tilføj kategori" icon="add" onPress={() => open({})} />
      <ActionButton label="Tilbage" variant="secondary" icon="arrow-back-outline" onPress={back} />
    </> : deleting ? <View style={styles.deleteConfirmation}>
      <Text style={styles.bodyText}>Vil du slette “{editor.name}”?</Text>
      {count > 0 && <>
        <Text style={styles.bodyText}>{count} poster bruger denne kategori. Vælg hvilken kategori de skal flyttes til.</Text>
        {alternatives.length === 0 && <Text style={styles.subtitle}>Opret en anden kategori først. Gå tilbage til Kategorier og vælg Tilføj kategori.</Text>}
        {alternatives.map(category => <ActionButton key={category.id} label={`${replacement === category.id ? '✓ ' : ''}${category.name}`} variant={replacement === category.id ? 'primary' : 'secondary'} icon="checkmark-outline" disabled={busy} onPress={() => setReplacement(category.id)} />)}
      </>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <ActionButton label={count > 0 ? 'Annuller' : 'Behold kategori'} variant="secondary" icon="arrow-back-outline" disabled={busy} onPress={back} />
      <ActionButton label={count > 0 ? 'Flyt og slet' : 'Slet kategori'} variant="destructive" icon="trash-outline" disabled={busy || (count > 0 && !replacement)} onPress={submit} />
    </View> : <>
      <Text style={styles.inputLabel}>Navn</Text>
      <TextInput accessibilityLabel="Kategorinavn" style={styles.entryInput} value={name} onChangeText={setName} maxLength={60} editable={!busy} autoCapitalize="sentences" />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <ActionButton label="Gem" icon="checkmark-outline" disabled={busy} onPress={submit} />
      <ActionButton label="Annuller" variant="secondary" icon="close-outline" disabled={busy} onPress={back} />
      {!!editor.id && <ActionButton label="Slet kategori" variant="destructive" icon="trash-outline" disabled={busy} onPress={() => { setError(''); setDeleting(true); }} />}
    </>}
  </ScrollView>;
}
