import { overviewStyles } from '../styles/savingsStyles';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import SavingsAccountEditor from './SavingsAccountEditor';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useFinances } from '../context/FinanceContext';
import { money } from '../data/financeData';
import { ActionButton, Icon } from './FinanceUI';
import SavingsChart from './SavingsChart';
import { styles } from '../styles/styles';

export default function SavingsAccounts() {
  const navigation = useNavigation();
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
        <View style={overviewStyles.menuRow}>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View details for ${row.name}`}
          onPress={() => navigation.navigate('SavingsDetails', { accountId: row.id })}
          style={({ pressed }) => [overviewStyles.balance, pressed && styles.pressed]}
        >
          <Text style={[styles.rowTitle, overviewStyles.name]}>{row.name}</Text>
          <Text style={[styles.entryAmount, overviewStyles.amount]}>{money(row.amount)}</Text>
          <Icon name="chevron-forward" size={18} />
        </Pressable>
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
    {editor && <SavingsAccountEditor {...editor} accounts={snapshot.accounts} mutate={mutateSavings} onClose={() => setEditor(null)} />}
  </ScrollView>;
}

function MenuItem({ label, onPress }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [overviewStyles.menuItem, pressed && styles.pressed]}><Text style={styles.linkText}>{label}</Text></Pressable>;
}
