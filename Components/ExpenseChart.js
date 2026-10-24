// Denne graf viser, hvor store udgifterne er fordelt på kategorier, så brugeren hurtigt kan se den største belastning.
import { Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { expenseBreakdown, money } from '../data/financeData';
import { styles, colors } from '../styles/styles';

const formatPercentage = (share) => `${(share * 100).toFixed(1)}%`;

export default function ExpenseChart({ expenses }) {
  const slices = expenseBreakdown(expenses);
  const { width: windowWidth } = useWindowDimensions();
  // Match the existing card width, keeping label text readable on phones.
  const width = Math.max(230, Math.min(windowWidth, 600) - 86);
  const centerX = width / 2;
  const centerY = 160;
  const radius = Math.min(100, (width - 176) / 2);
  const labelTop = 24;
  const labelBottom = centerY * 2 - 28;
  const labelGap = 44;
  const elbowOffset = Math.min(14, (centerX - radius) * 0.16);
  let angle = -Math.PI / 2;
  const segments = slices.map(slice => {
    const start = angle;
    angle += slice.share * Math.PI * 2;
    const middle = (start + angle) / 2;
    return {
      ...slice, start, end: angle,
      side: Math.cos(middle) < 0 ? -1 : 1,
      anchorX: centerX + (radius + 2) * Math.cos(middle),
      anchorY: centerY + (radius + 2) * Math.sin(middle),
    };
  });

  // Keep the vertical order of the slices. Spread crowded labels in both
  // directions rather than pushing the entire cluster downwards.
  for (const side of [-1, 1]) {
    const labels = segments.filter(segment => segment.side === side).sort((a, b) => a.anchorY - b.anchorY);
    if (!labels.length) continue;
    const gap = Math.min(labelGap, (labelBottom - labelTop) / Math.max(1, labels.length - 1));
    labels.forEach((label, index) => {
      label.labelY = Math.max(label.anchorY, index > 0 ? labels[index - 1].labelY + gap : labelTop);
    });
    const averageDisplacement = labels.reduce((sum, label) => sum + label.labelY - label.anchorY, 0) / labels.length;
    const shift = Math.max(
      labels[labels.length - 1].labelY - labelBottom,
      Math.min(averageDisplacement, labels[0].labelY - labelTop),
    );
    labels.forEach(label => { label.labelY -= shift; });
    // Clamp both ends without sacrificing the gap when nearly every slice
    // lands on the same side of the donut.
    labels[labels.length - 1].labelY = Math.min(labelBottom, labels[labels.length - 1].labelY);
    for (let index = labels.length - 2; index >= 0; index--) {
      labels[index].labelY = Math.min(labels[index].labelY, labels[index + 1].labelY - gap);
    }
    labels[0].labelY = Math.max(labelTop, labels[0].labelY);
    for (let index = 1; index < labels.length; index++) {
      labels[index].labelY = Math.max(labels[index].labelY, labels[index - 1].labelY + gap);
    }
  }

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>Monthly expense breakdown</Text>
      <Text style={styles.subtitle}>Sådan fordeler dine månedlige udgifter sig.</Text>
      {slices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.sectionTitle}>Ingen udgifter at fordele</Text>
          <Text style={styles.subtitle}>Tilføj en udgift over 0 kr. for at se din graf.</Text>
        </View>
      ) : (
        <View style={styles.pieWrap} accessible accessibilityLabel={segments.map(slice => `${slice.name}: ${money(slice.amount)}, ${(slice.share * 100).toFixed(1)} procent`).join('. ')}>
          <Svg width="100%" height={320} viewBox={`0 0 ${width} 320`}>
            {segments.map(slice => {
              if (segments.length === 1) return <Circle key={slice.name} cx={centerX} cy={centerY} r={radius} fill={slice.color} />;
              const x1 = centerX + radius * Math.cos(slice.start);
              const y1 = centerY + radius * Math.sin(slice.start);
              const x2 = centerX + radius * Math.cos(slice.end);
              const y2 = centerY + radius * Math.sin(slice.end);
              const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${slice.share > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`;
              return <Path key={slice.name} d={path} fill={slice.color} stroke="#fff" strokeWidth={2} />;
            })}
            <Circle cx={centerX} cy={centerY} r={radius * 0.5} fill="#fff" />
            {segments.map(slice => {
              const labelX = slice.side < 0 ? 0 : width;
              const elbowX = centerX + slice.side * (radius + elbowOffset);
              const anchor = slice.side < 0 ? 'start' : 'end';
              return (
                <G key={slice.name}>
                  <Path d={`M ${slice.anchorX} ${slice.anchorY} L ${elbowX} ${slice.labelY} L ${labelX} ${slice.labelY}`} stroke={colors.muted} strokeWidth={1} fill="none" />
                  <Circle cx={slice.anchorX} cy={slice.anchorY} r={2} fill={colors.muted} />
                  <SvgText x={labelX} y={slice.labelY - 5} textAnchor={anchor} fontSize={11} fill={colors.ink}>{slice.name}</SvgText>
                  <SvgText x={labelX} y={slice.labelY + 14} textAnchor={anchor} fontSize={11} fill={colors.muted}>{formatPercentage(slice.share)}</SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      )}
    </View>
  );
}
