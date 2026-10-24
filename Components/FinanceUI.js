// Denne fil samler de gentagne UI-elementer, som skærmene bruger til ikoner, knapper, overskrifter og transaktionsrækker.
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '../styles/styles';
import { money } from '../data/financeData';
export function Icon({
  name,
  color = colors.green,
  size = 22
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function PageHeader({
  eyebrow,
  title,
  subtitle
}) {
  return <View style={styles.pageHeader}>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <Text style={styles.pageTitle}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>;
}
export function ActionButton({
  label,
  onPress,
  secondary = false,
  variant = secondary ? 'secondary' : 'primary',
  disabled = false,
  icon = 'arrow-forward',
  iconFirst = false
}) {
  const isSecondary = variant === 'secondary';
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({
    pressed
  }) => [styles.button, isSecondary && styles.secondaryButton, variant === 'destructive' && styles.destructiveButton, pressed && !disabled && (isSecondary ? styles.secondaryButtonPressed : styles.pressed), disabled && styles.disabledButton]}>
    {iconFirst && <Icon name={icon} color={isSecondary ? colors.green : '#fff'} size={18} />}
    <Text style={[styles.buttonText, isSecondary && styles.secondaryButtonText]}>{label}</Text>
    {!iconFirst && <Icon name={icon} color={isSecondary ? colors.green : '#fff'} size={18} />}
  </Pressable>;
}
export function TransactionRow({
  item
}) {
  return <View style={styles.transactionRow}>
    <View style={[styles.transactionIcon, item.amount > 0 && styles.green]}>
      <Icon name={item.icon} color={item.amount > 0 ? colors.green : colors.ink} size={20} />
    </View>
    <View style={styles.grow}>
      <Text style={styles.rowTitle}>{item.name}</Text>
      <Text style={styles.rowMeta}>{item.category} · {item.date}</Text>
    </View>
    <Text style={[styles.amount, item.amount > 0 && styles.positive]}>{item.amount > 0 ? '+' : '−'}{money(Math.abs(item.amount))}</Text>
  </View>;
}
