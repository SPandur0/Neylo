// Denne skærm viser én opsparingskonto med saldo, aktivitet og mulighed for at indbetale, hæve, overføre eller arkivere penge.
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinances } from '../context/FinanceContext';
import { ActionButton, Icon, PageHeader } from '../Components/FinanceUI';
import SavingsChart from '../Components/SavingsChart';
import SavingsAccountEditor from '../Components/SavingsAccountEditor';
import { money } from '../data/financeData';
import { styles } from '../styles/styles';
import { savingsDetailsStyles as detail } from '../styles/savingsDetailsStyles';

function dateLabel(value) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('da-DK');
}

function transactionLabel(item) {
  if (item.transaction_type === 'transfer') return item.amount > 0 ? 'Transfer in' : 'Transfer out';
  return item.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal';
}

export default function SavingsDetailsScreen({ route, navigation }) {
  const { savingsSnapshot: snapshot, mutateSavings } = useFinances();
  const [editorMode, setEditorMode] = useState(null);
  const accountId = String(route.params?.accountId ?? '');
  // Look up live data by ID so actions update the balance, graph and history together.
  const account = [...snapshot.accounts, ...snapshot.archived].find(item => item.id === accountId);
  const back = <Pressable accessibilityRole="button" accessibilityLabel="Back to savings" onPress={() => navigation.goBack()} style={({ pressed }) => [detail.back, pressed && styles.pressed]}>
    <Icon name="arrow-back" /><Text style={styles.linkText}>Back to savings</Text>
  </Pressable>;

  if (!account) return <SafeAreaView style={styles.screen}>
    <View style={styles.content}>{back}<Text style={styles.sectionTitle}>Savings account not found</Text></View>
  </SafeAreaView>;

  const activity = snapshot.activity[accountId] ?? [];
  return <SafeAreaView style={styles.screen}>
    <FlatList
      data={activity}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<>
        {back}
        <PageHeader eyebrow="YOUR SAVINGS" title={account.name} />
        <View style={[styles.entryCard, detail.balance]}>
          <Text style={styles.metricLabel}>Current balance</Text>
          <Text style={styles.summaryValue}>{money(account.amount)}</Text>
          <Text style={styles.rowMeta}>Opened {dateLabel(account.created_at)} · Opening balance {money(account.initial_balance_minor / 100)}</Text>
          {account.archived_at && <Text style={detail.archived}>Archived {dateLabel(account.archived_at)} · History is preserved</Text>}
        </View>
        {!account.archived_at && <>
          <View style={detail.actions}>
            <ActionButton label="Add money" icon="add" onPress={() => setEditorMode('deposit')} />
            <ActionButton label="Take out money" icon="remove" variant="secondary" onPress={() => setEditorMode('withdrawal')} />
          </View>
          <View style={detail.secondaryActions}>
            <ActionButton label="Move money" icon="swap-horizontal-outline" variant="secondary" onPress={() => setEditorMode('transfer')} />
            <ActionButton label="Rename savings" icon="create-outline" variant="secondary" onPress={() => setEditorMode('rename')} />
            <ActionButton label="Archive savings" icon="archive-outline" variant="destructive" onPress={() => setEditorMode('archive')} />
          </View>
        </>}
        <SavingsChart history={snapshot.histories[accountId] ?? []} label={account.name} />
        <View style={detail.history}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <Text style={styles.subtitle}>Deposits, withdrawals and transfers for this account.</Text>
        </View>
      </>}
      ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.bodyText}>No transactions yet. Your opening balance is shown above.</Text></View>}
      renderItem={({ item }) => <View style={detail.transaction}>
        <View style={detail.transactionHeader}>
          <Text style={styles.rowTitle}>{transactionLabel(item)}</Text>
          <Text style={[detail.amount, item.amount > 0 ? detail.credit : detail.debit]}>{item.amount > 0 ? '+' : '−'}{money(Math.abs(item.amount))}</Text>
        </View>
        <Text style={styles.rowMeta}>{dateLabel(item.date)}</Text>
        {!!item.note && <Text style={styles.bodyText}>{item.note}</Text>}
      </View>}
    />
    {editorMode && <SavingsAccountEditor
      key={`${accountId}-${editorMode}`}
      mode={editorMode}
      account={account}
      accounts={snapshot.accounts}
      mutate={mutateSavings}
      onClose={() => setEditorMode(null)}
    />}
  </SafeAreaView>;
}
