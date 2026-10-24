// Denne fil samler appens hovedstilark og giver de konsistente farver, layoutmønstre og knapstile, som hele appen bruger.
import { StyleSheet } from 'react-native';
export const colors = {
  background: '#f6f7f3',
  surface: '#ffffff',
  ink: '#203a31',
  green: '#285747',
  destructive: '#87464D',
  muted: '#7b857d',
  border: '#e7ebe4'
};
export const styles = StyleSheet.create({
  loadError: { justifyContent: 'center', padding: 24 },
  chartCard: { padding: 20, marginTop: 24, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, gap: 8 },
  pieWrap: { alignItems: 'center', marginVertical: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 6 },
  legendName: { flex: 1, fontSize: 12, color: colors.ink },
  legendPercent: { width: 42, textAlign: 'right', fontSize: 11, color: colors.muted },
  emptyState: { padding: 25, alignItems: 'center', gap: 12 },
  editorHeader: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 22 },
  segmentRow: { gap: 8, paddingBottom: 8 },
  editorSummary: { padding: 18, borderRadius: 22, backgroundColor: '#e9eddf', marginTop: 12, marginBottom: 16 },
  entryList: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 28 },
  entryCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 17, marginBottom: 10, gap: 13 },
  entryTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryAmount: { color: colors.ink, fontSize: 20, fontWeight: '600', flexShrink: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 39, 31, 0.45)' },
  modalKeyboard: { flex: 1, justifyContent: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 520, maxHeight: '100%', alignSelf: 'center', backgroundColor: colors.background, borderRadius: 24, overflow: 'hidden' },
  modalContent: { padding: 22, gap: 13 },
  iconButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  entryInput: { minHeight: 50, padding: 14, borderWidth: 1, borderColor: '#dce2d8', borderRadius: 12, backgroundColor: '#fff', color: colors.ink, fontSize: 16 },
  categoryOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deleteConfirmation: { padding: 14, borderRadius: 13, backgroundColor: '#f9eade', gap: 13 },
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 22,
    paddingBottom: 28,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center'
  },
  grow: {
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandName: {
    fontSize: 27,
    letterSpacing: -1.2,
    fontWeight: '700',
    color: colors.ink
  },
  brandDot: {
    color: '#81a66a'
  },
  demoPill: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#729c55'
  },
  demoText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.green
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 23,
    gap: 8
  },
  pageTitle: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.ink,
    marginTop: 7
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 21
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8ecdF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 16,
    color: colors.green,
    fontWeight: '600'
  },
  balanceCard: {
    backgroundColor: '#244e42',
    padding: 23,
    borderRadius: 25
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  balanceLabel: {
    color: '#d0dfd6',
    fontSize: 13
  },
  balanceValue: {
    fontSize: 39,
    fontWeight: '600',
    letterSpacing: -1.6,
    color: '#fff',
    marginTop: 12
  },
  balanceChange: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 15
  },
  balanceChangeText: {
    fontSize: 11,
    color: '#ccf5a5'
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3
  },
  chartLabel: {
    fontSize: 10,
    color: '#b8cdc2'
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 17,
    marginTop: 17,
    borderTopWidth: 1,
    borderTopColor: '#426659'
  },
  balanceFootText: {
    fontSize: 9,
    color: '#c1d2c8',
    letterSpacing: 0.8
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 13,
    gap: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    flexShrink: 1
  },
  muted: {
    color: colors.muted,
    fontSize: 11
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12
  },
  metricCard: {
    flex: 1,
    padding: 17,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  smallIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center'
  },
  green: {
    backgroundColor: '#e7efdf'
  },
  peach: {
    backgroundColor: '#f9eade'
  },
  lavender: {
    backgroundColor: '#ece9f6'
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 12
  },
  metricValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.8,
    marginTop: 6
  },
  savingsStrip: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 14,
    backgroundColor: '#eaf0e3',
    borderRadius: 12,
    marginTop: 11
  },
  savingsText: {
    flex: 1,
    color: colors.green,
    fontSize: 12
  },
  savingsValue: {
    fontWeight: '700',
    color: colors.green,
    fontSize: 13
  },
  assetGrid: {
    flexDirection: 'row',
    gap: 9
  },
  assetCard: {
    flex: 1,
    padding: 12,
    borderRadius: 17,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border
  },
  assetLabel: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 14
  },
  assetValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 6,
    letterSpacing: -0.4
  },
  goalCard: {
    padding: 17,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    marginTop: 16
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1
  },
  goalPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.green
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#eef0e9',
    marginVertical: 17,
    overflow: 'hidden'
  },
  progressFill: {
    width: '64%',
    height: '100%',
    backgroundColor: '#82a76e',
    borderRadius: 4
  },
  goalAmount: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600'
  },
  advisorTeaser: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#e9eddf',
    marginTop: 23
  },
  aiIcon: {
    backgroundColor: colors.green,
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  teaserText: {
    fontSize: 13,
    lineHeight: 21,
    color: '#65705e',
    marginTop: 12,
    marginBottom: 16
  },
  button: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: colors.green,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#718579',
    // Include the border in the existing 14-point content inset.
    padding: 13
  },
  secondaryButtonPressed: {
    backgroundColor: '#e7efdf',
    borderColor: colors.green
  },
  destructiveButton: {
    backgroundColor: colors.destructive
  },
  disabledButton: {
    opacity: 0.45
  },
  secondaryButtonText: {
    color: colors.green
  },
  pressed: {
    opacity: 0.7
  },
  textButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: 12
  },
  linkText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '600'
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 13,
    overflow: 'hidden'
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 17,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#f1f2ee',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink
  },
  rowMeta: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 5,
    lineHeight: 15
  },
  amount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink
  },
  positive: {
    color: '#4f7e46'
  },
  footnote: {
    fontSize: 10,
    lineHeight: 17,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 10
  },
  pageHeader: {
    marginTop: 13,
    marginBottom: 24,
    gap: 7
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: colors.green
  },
  summaryCard: {
    borderRadius: 22,
    padding: 22,
    backgroundColor: '#e9eddf'
  },
  summaryValue: {
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: -1,
    color: colors.ink,
    marginVertical: 9
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 23
  },
  filter: {
    borderRadius: 24,
    minHeight: 44,
    paddingHorizontal: 19,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border
  },
  filterActive: {
    backgroundColor: colors.green,
    borderColor: colors.green
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600'
  },
  filterTextActive: {
    color: '#fff'
  },
  transactionSurface: {
    backgroundColor: '#fff',
    paddingHorizontal: 14
  },
  advisorIntro: {
    backgroundColor: '#e9eddf',
    borderRadius: 23,
    padding: 23,
    alignItems: 'flex-start'
  },
  introTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.6,
    marginTop: 18
  },
  introText: {
    color: '#65705e',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 9
  },
  localBadge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 20
  },
  insightCard: {
    borderRadius: 19,
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  insightTitle: {
    fontSize: 18,
    color: colors.ink,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    letterSpacing: -0.3
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#6c776e'
  },
  askCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#dce2d8',
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.ink,
    backgroundColor: '#fafbf8'
  },
  error: {
    color: '#aa4a32',
    fontSize: 12
  },
  answer: {
    padding: 15,
    backgroundColor: '#f0f4e9',
    borderRadius: 13,
    gap: 10
  },
  answerQuestion: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '600'
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: colors.border,
    elevation: 0
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600'
  },
  tabItem: {
    paddingTop: 4
  }
});
