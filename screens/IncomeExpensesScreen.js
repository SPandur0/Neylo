import { useState } from 'react';
import { FlatList, ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, Icon, PageHeader } from '../Components/FinanceUI';
import EntryModal from '../Components/EntryModal';
import SavingsAccounts from '../Components/SavingsAccounts';
import { useFinances } from '../context/FinanceContext';
import { groups, money } from '../data/financeData';
import { styles } from '../styles/styles';

export default function IncomeExpensesScreen() {
  const { data, totals, save, remove } = useFinances();
  const [selected, setSelected] = useState('income');
  const [editor, setEditor] = useState(null);
  const group = groups.find(item => item.key === selected);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.editorHeader}>
        <PageHeader eyebrow="DINE TAL. DIT OVERBLIK." title="Income & Expenses" />
        <View><ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.segmentRow}>
          {groups.map(item => (
            <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: selected === item.key }} onPress={() => setSelected(item.key)} style={[styles.filter, selected === item.key && styles.filterActive]}>
              <Text style={[styles.filterText, selected === item.key && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView></View>
        {selected !== 'savings' && <View style={styles.editorSummary}>
          <Text style={styles.metricLabel}>{group.label} · {['income', 'expenses'].includes(selected) ? 'pr. måned' : 'aktuel beholdning'}</Text>
          <Text style={styles.summaryValue}>{money(totals[selected])}</Text>
          <View style={styles.between}>
            <Text style={styles.subtitle}>{data[selected].length} poster</Text>
            <ActionButton label="Add" icon="add" iconFirst onPress={() => setEditor({ entry: null })} />
          </View>
        </View>}
      </View>
      {selected === 'savings' ? <SavingsAccounts /> : <FlatList
        key={selected}
        data={data[selected]}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.entryList}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Rediger ${item.name}, ${money(item.amount)}`} onPress={() => setEditor({ entry: item })} style={({ pressed }) => [styles.entryCard, pressed && styles.pressed]}>
            <View style={styles.entryTopRow}>
              <View style={[styles.smallIcon, styles.green]}><Icon name={group.icon} size={19} /></View>
              <View style={styles.grow}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>{item.category ?? group.label}</Text>
              </View>
              <Icon name="create-outline" size={19} />
            </View>
            <View style={styles.between}>
              <Text style={styles.entryAmount}>{money(item.amount)}</Text>
              <Text style={styles.linkText}>Rediger</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<View style={styles.emptyState}><Icon name={group.icon} size={30} /><Text style={styles.sectionTitle}>Ingen poster endnu</Text><Text style={styles.subtitle}>Tryk på + Add for at tilføje din første post.</Text></View>}
      />}
      {editor && (
        <EntryModal
          group={group}
          entry={editor.entry}
          onClose={() => setEditor(null)}
          onSave={async values => { await save(selected, values, editor.entry?.id); setEditor(null); }}
          onDelete={async () => { await remove(selected, editor.entry.id); setEditor(null); }}
        />
      )}
    </SafeAreaView>
  );
}
