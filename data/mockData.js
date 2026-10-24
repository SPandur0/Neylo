// Denne fil indeholder demo-data til mock-screens og eksempler, så appen kan vise realistiske tal uden at være afhængig af live-data.
export const money = value => `${new Intl.NumberFormat('da-DK', {
  maximumFractionDigits: 0
}).format(value)} kr.`;
export const finances = {
  cash: 48250,
  investments: 86400,
  debt: 18000,
  income: 28500,
  expenses: 20100,
  savings: 8400,
  goalSaved: 32000,
  goalTotal: 50000
};
export const history = [{
  month: 'Apr',
  value: 82200
}, {
  month: 'Maj',
  value: 88100
}, {
  month: 'Jun',
  value: 84900
}, {
  month: 'Jul',
  value: 98700
}, {
  month: 'Aug',
  value: 108250
}, {
  month: 'Sep',
  value: 116650
}];
export const transactions = [{
  id: '1',
  name: 'Løn · september',
  category: 'Indkomst',
  date: '14. sep. 2026',
  amount: 28500,
  icon: 'briefcase-outline'
}, {
  id: '2',
  name: 'Netto',
  category: 'Dagligvarer',
  date: '14. sep. 2026',
  amount: -342,
  icon: 'basket-outline'
}, {
  id: '3',
  name: 'Original Coffee',
  category: 'Café & restaurant',
  date: '13. sep. 2026',
  amount: -68,
  icon: 'cafe-outline'
}, {
  id: '4',
  name: 'Spotify',
  category: 'Abonnementer',
  date: '12. sep. 2026',
  amount: -109,
  icon: 'musical-notes-outline'
}, {
  id: '5',
  name: 'Rejsekort',
  category: 'Transport',
  date: '11. sep. 2026',
  amount: -250,
  icon: 'train-outline'
}, {
  id: '6',
  name: 'Matas',
  category: 'Shopping',
  date: '10. sep. 2026',
  amount: -229,
  icon: 'bag-outline'
}, {
  id: '7',
  name: 'Ørsted',
  category: 'El & varme',
  date: '8. sep. 2026',
  amount: -485,
  icon: 'flash-outline'
}, {
  id: '8',
  name: 'Husleje',
  category: 'Bolig',
  date: '1. sep. 2026',
  amount: -7800,
  icon: 'home-outline'
}, {
  id: '9',
  name: 'Tryg',
  category: 'Forsikring',
  date: '1. sep. 2026',
  amount: -395,
  icon: 'shield-checkmark-outline'
}];
export const insights = [{
  id: '1',
  label: 'DIT FORBRUG',
  title: 'Små justeringer. Mere luft.',
  description: 'Dine udgifter er 12 % højere end sidste måned. Et godt sted at starte er cafébesøg og takeaway.',
  icon: 'trending-up-outline',
  tone: 'peach'
}, {
  id: '2',
  label: 'DIN OPSPARING',
  title: 'Drømmen kan komme tættere på',
  description: 'I dette eksempel kan 1.500 kr. ekstra om måneden bringe dit opsparingsmål cirka 3 måneder tættere på.',
  icon: 'sparkles-outline',
  tone: 'green'
}, {
  id: '3',
  label: 'DIN TRYGHED',
  title: 'Et godt fundament',
  description: 'Dine kontanter dækker 2,4 måneders udgifter. Med yderligere 12.050 kr. har du en buffer på 3 måneder.',
  icon: 'shield-checkmark-outline',
  tone: 'lavender'
}];
// Deterministic demo responses. Nothing is sent to an external service.
export function getAdvisorReply(question) {
  const text = question.toLowerCase();
  if (/opspar|mål|ferie/.test(text)) return 'Du har 32.000 kr. af dit mål på 50.000 kr. Med 3.000 kr. om måneden når du målet på 6 måneder. Øger du beløbet til 4.500 kr., tager det 4 måneder. Prøv at sætte en fast overførsel til side på lønningsdagen.';
  if (/buffer|nød|tryg/.test(text)) return 'Dine 48.250 kr. i kontanter dækker cirka 2,4 måneders udgifter. En buffer på 3 måneder svarer i demoen til 60.300 kr. Du mangler altså 12.050 kr. for at nå det niveau.';
  if (/forbrug|udgift|spare|budget/.test(text)) return 'Dit månedlige råderum er 8.400 kr. efter udgifter. Prøv et ugentligt budget til café og takeaway, og gennemgå dine abonnementer. Selv 500 kr. mindre i forbrug hver måned giver 6.000 kr. mere om året.';
  return 'I demoen får du 28.500 kr. ind og bruger 20.100 kr. om måneden. Det giver 8.400 kr. til opsparing og andre mål. Spørg mig om dit forbrug, din opsparing eller din buffer for at se et konkret eksempel.';
}
