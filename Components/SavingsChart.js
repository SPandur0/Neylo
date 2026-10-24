// Denne graf viser udviklingen i opsparingen over tid og gør det nemt at følge vækst eller fald i hver måned.
import { ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { months, money, savingsHistoryPoints } from '../data/financeData';
import { styles, colors } from '../styles/styles';

export default function SavingsChart({ history, label = 'Total Savings' }) {
  const points = savingsHistoryPoints(history);
  const maximum = Math.max(1, ...points.map(point => point.amount));
  const x = monthIndex => 110 + monthIndex * 39;
  const y = amount => 170 - (amount / maximum) * 140;
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.monthIndex)} ${y(point.amount)}`).join(' ');

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>Savings over time</Text>
      <Text style={styles.subtitle}>{label} · {new Date().getFullYear()}</Text>
      {points.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.sectionTitle}>Your savings start here</Text>
          <Text style={styles.subtitle}>Add savings to start your graph.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View accessible accessibilityLabel={points.map(point => `${months[point.monthIndex]}: ${money(point.amount)}`).join('. ')}>
              <Svg width={570} height={215} viewBox="0 0 570 215">
                {[0, 0.5, 1].map(fraction => (
                  <ReactChartTick key={fraction} amount={maximum * fraction} y={y(maximum * fraction)} />
                ))}
                <Path d={path} stroke={colors.green} strokeWidth={3} fill="none" strokeLinejoin="round" />
                {points.map(point => <Circle key={point.monthIndex} cx={x(point.monthIndex)} cy={y(point.amount)} r={4} fill={colors.green} />)}
                {months.map((month, index) => (
                  <SvgText key={month} x={x(index)} y={194} fontSize={10} fill={colors.muted} textAnchor="middle">{month.slice(0, 3)}</SvgText>
                ))}
              </Svg>
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
}

function ReactChartTick({ amount, y }) {
  return (
    <>
      <Line x1={110} x2={539} y1={y} y2={y} stroke={colors.border} />
      <SvgText x={100} y={y + 4} textAnchor="end" fontSize={10} fill={colors.muted}>{money(amount)}</SvgText>
    </>
  );
}
