// Denne skærm viser en samlet økonomioversigt, så brugeren kan se saldo, indtægter, udgifter og udviklingen i opsparingen.
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, ActionButton } from '../Components/FinanceUI';
import ExpenseChart from '../Components/ExpenseChart';
import SavingsChart from '../Components/SavingsChart';
import ProfileAvatar from '../Components/ProfileAvatar';
import NeyloLogo from '../Components/NeyloLogo';
import { useFinances } from '../context/FinanceContext';
import { money } from '../data/financeData';
import { styles, colors } from '../styles/styles';

export default function HomeScreen({ navigation }) {
  const { data, totals, monthlySavings } = useFinances();
  const metrics = [
    { label: 'Monthly Income', value: totals.income, icon: 'arrow-down', tone: 'green' },
    { label: 'Monthly Expenses', value: totals.expenses, icon: 'arrow-up', tone: 'peach' },
  ];
  const assets = [
    { label: 'Savings', value: totals.savings, icon: 'wallet-outline', tone: 'green' },
    { label: 'Investments', value: totals.investments, icon: 'stats-chart-outline', tone: 'lavender' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <NeyloLogo />
            <Text style={styles.brandName}>neylo<Text style={styles.brandDot}>.</Text></Text>
          </View>
          <View style={styles.demoPill}><View style={styles.dot} /><Text style={styles.demoText}>DEMO</Text></View>
        </View>
        <View style={styles.greetingRow}>
          <View style={styles.grow}>
            <Text style={styles.pageTitle}>Din økonomi, samlet.</Text>
          </View>
          <ProfileAvatar />
        </View>
        <View style={styles.balanceCard}>
          <View style={styles.between}>
            <Text style={styles.balanceLabel}>Savings</Text>
            <Icon name="wallet-outline" color="#d9e5df" />
          </View>
          <Text style={styles.balanceValue}>{money(totals.savings)}</Text>
          <View style={styles.balanceFooter}>
            <Text style={styles.balanceFootText}>TOTAL SAVINGS</Text>
          </View>
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Dit månedlige budget</Text>
        </View>
        <View style={styles.metricGrid}>
          {metrics.map(item => (
            <View key={item.label} style={styles.metricCard}>
              <View style={[styles.smallIcon, styles[item.tone]]}><Icon name={item.icon} size={18} /></View>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={styles.metricValue}>{money(item.value)}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.savingsStrip, totals.cashFlow < 0 && styles.peach]}>
          <Icon name="swap-horizontal-outline" size={19} />
          <Text style={styles.savingsText}>Monthly Cash Flow</Text>
          <Text style={styles.savingsValue}>{money(totals.cashFlow)}</Text>
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Dine beholdninger</Text>
          <Icon name="grid-outline" size={18} color={colors.muted} />
        </View>
        <View style={styles.assetGrid}>
          {assets.map(item => (
            <View key={item.label} style={styles.assetCard}>
              <View style={[styles.smallIcon, styles[item.tone]]}><Icon name={item.icon} size={18} /></View>
              <Text style={styles.assetLabel}>{item.label}</Text>
              <Text style={styles.assetValue}>{money(item.value)}</Text>
            </View>
          ))}
        </View>
        <View><ExpenseChart expenses={data.expenses} /></View>
        <View><SavingsChart history={monthlySavings} /></View>
        <View style={styles.advisorTeaser}>
          <Text style={styles.sectionTitle}>Dit overblik starter med dine tal.</Text>
          <Text style={styles.teaserText}>Tilføj eller ret dine poster. Budget, formue og udgiftsfordeling følger automatisk med.</Text>
          <ActionButton label="Administrer din økonomi" onPress={() => navigation.navigate('Income & Expenses')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
