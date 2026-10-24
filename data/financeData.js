// Denne fil indeholder de fælles beregninger og formateringsfunktioner, som appen bruger til totals, kategorier og grafer.
export const groups = [
  { key: 'income', label: 'Income', icon: 'arrow-down-outline' },
  { key: 'expenses', label: 'Expenses', icon: 'arrow-up-outline' },
  { key: 'savings', label: 'Savings', icon: 'wallet-outline' },
  { key: 'investments', label: 'Investments', icon: 'stats-chart-outline' },
];

const expenseColors = ['#285747', '#87a975', '#bdcc9c', '#b4a3ca', '#d59f7d', '#83aeb4', '#a9afa5'];

export const initialData = {
  income: [{ id: 'income-1', name: 'Salary', amount: 35000 }],
  expenses: [
    { id: 'expense-1', name: 'Rent', amount: 10000, category: 'Housing' },
    { id: 'expense-2', name: 'Groceries', amount: 3500, category: 'Food' },
    { id: 'expense-3', name: 'Transport', amount: 2000, category: 'Transport' },
    { id: 'expense-4', name: 'Insurance', amount: 800, category: 'Insurance' },
    { id: 'expense-5', name: 'Subscriptions', amount: 300, category: 'Subscriptions' },
    { id: 'expense-6', name: 'Cafés & experiences', amount: 1500, category: 'Entertainment' },
    { id: 'expense-7', name: 'Other expenses', amount: 1000, category: 'Other' },
  ],
  savings: [{ id: 'savings-1', name: 'Emergency Fund', amount: 50000 }],
  investments: [{ id: 'investment-1', name: 'Index funds', amount: 86400 }],
};

export const money = (value) => `${new Intl.NumberFormat('da-DK', {
  minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(value)} kr.`;

// Sum whole øre to avoid accumulating floating-point rounding errors.
export const sumAmounts = (items) => items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;

export function calculateTotals(data) {
  const totals = Object.fromEntries(groups.map(({ key }) => [key, sumAmounts(data[key])]));
  return {
    ...totals,
    cashFlow: Math.round((totals.income - totals.expenses) * 100) / 100,
    totalSavings: totals.savings,
  };
}

export function expenseBreakdown(expenses) {
  const total = sumAmounts(expenses);
  const categories = new Map();
  for (const item of expenses) {
    const key = item.category_id ?? item.category;
    if (!categories.has(key)) categories.set(key, {
      id: key, name: item.category,
      color: expenseColors[item.category_id ? (Number(item.category_id) - 1) % expenseColors.length : categories.size % expenseColors.length],
      minor: 0,
    });
    categories.get(key).minor += Math.round(item.amount * 100);
  }
  return [...categories.values()].map(({ minor, ...category }) => {
    const amount = minor / 100;
    return { ...category, amount, share: total > 0 ? amount / total : 0 };
  }).filter(category => category.amount > 0);
}

// Accept Danish amounts: 10000, 10000,50 or 10.000,50. No negatives.
export function parseAmount(input) {
  const value = input.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return null;
  const amount = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(amount) && amount >= 0 && amount <= 999999999 ? amount : null;
}

export function saveEntry(data, group, entry) {
  const exists = data[group].some(item => item.id === entry.id);
  return { ...data, [group]: exists
    ? data[group].map(item => item.id === entry.id ? entry : item)
    : [...data[group], entry] };
}

export function deleteEntry(data, group, id) {
  return { ...data, [group]: data[group].filter(item => item.id !== id) };
}

export const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// null means not registered; zero is a valid registered value.
export const initialMonthlySavings = [
  85000, 92000, 98000, 105000, 111000, 118000,
  123000, 128000, 136400, null, null, null,
];

export function savingsHistoryPoints(history) {
  return history.flatMap((amount, monthIndex) => amount === null ? [] : [{ monthIndex, amount }]);
}
