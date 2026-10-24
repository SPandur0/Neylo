// Disse tests kontrollerer de centrale finansberegninger, så ændringer i grupper, beløb og grafer bliver opdaget tidligt.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Load the same plain JavaScript helpers used by React Native without changing
// the Expo project's module configuration or adding a test dependency.
const source = await readFile(new URL('../data/financeData.js', import.meta.url), 'utf8');
const { initialData, groups, calculateTotals, expenseBreakdown, parseAmount, sumAmounts, saveEntry, deleteEntry, savingsHistoryPoints } =
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('rent increase updates expenses, cash flow and chart, but not total savings', () => {
  const before = calculateTotals(initialData);
  const rent = initialData.expenses[0];
  const updated = saveEntry(initialData, 'expenses', { ...rent, amount: 12000 });
  const after = calculateTotals(updated);
  assert.equal(after.expenses - before.expenses, 2000);
  assert.equal(after.cashFlow - before.cashFlow, -2000);
  assert.equal(after.totalSavings, before.totalSavings);
  assert.ok(expenseBreakdown(updated.expenses)[0].share > expenseBreakdown(initialData.expenses)[0].share);
  assert.equal(initialData.expenses[0].amount, 10000);
});

test('add, edit and delete work in each group without mutating start data', () => {
  for (const { key } of groups) {
    const entry = { id: 'new', name: 'Example', amount: 123.45, ...(key === 'expenses' ? { category: 'Other' } : {}) };
    let data = saveEntry(initialData, key, entry);
    assert.equal(data[key].length, initialData[key].length + 1);
    data = saveEntry(data, key, { ...entry, amount: 678.90 });
    assert.equal(data[key].filter(item => item.id === 'new').length, 1);
    assert.equal(data[key].at(-1).amount, 678.90);
    data = deleteEntry(data, key, 'new');
    assert.deepEqual(data, initialData);
  }
});

test('only savings accounts affect total savings', () => {
  const before = calculateTotals(initialData);
  for (const [key, effect] of [['income', 0], ['expenses', 0], ['savings', 200], ['investments', 0]]) {
    const after = calculateTotals(saveEntry(initialData, key, { id: 'new', amount: 200, category: 'Other' }));
    assert.equal(after.totalSavings - before.totalSavings, effect);
  }
});

test('chart aggregates categories and handles reclassification, one slice and zero expenses', () => {
  const expenses = [{ amount: 100, category: 'Housing' }, { amount: 50, category: 'Housing' }, { amount: 50, category: 'Food' }];
  assert.equal(expenseBreakdown(expenses)[0].amount, 150);
  assert.equal(expenseBreakdown(expenses)[0].share, 0.75);
  assert.equal(expenseBreakdown(expenses).reduce((sum, slice) => sum + slice.share, 0), 1);
  const changed = expenses.map(item => ({ ...item, category: 'Food' }));
  assert.equal(expenseBreakdown(changed).length, 1);
  assert.equal(expenseBreakdown(changed)[0].share, 1);
  assert.deepEqual(expenseBreakdown([]), []);
  assert.deepEqual(expenseBreakdown([{ amount: 0, category: 'Food' }]), []);
});

test('Danish input, cents, zero and invalid amounts', () => {
  for (const [input, amount] of [['10000', 10000], ['10.000', 10000], ['10.000,50', 10000.5], ['0,25', 0.25], ['0', 0]]) {
    assert.equal(parseAmount(input), amount);
  }
  for (const input of ['', '-5', 'NaN', 'Infinity', '1e5', '1,234', '12.34', '1000000000']) assert.equal(parseAmount(input), null);
  assert.equal(sumAmounts([{ amount: 0.1 }, { amount: 0.2 }]), 0.3);
});

test('empty accounts and negative cash flow stay valid', () => {
  const empty = Object.fromEntries(groups.map(({ key }) => [key, []]));
  assert.ok(Object.values(calculateTotals(empty)).every(value => value === 0));
  const data = saveEntry(empty, 'expenses', { id: 'rent', amount: 100, category: 'Housing' });
  assert.equal(calculateTotals(data).cashFlow, -100);
});

test('Savings excludes investments', () => {
  const data = { ...initialData, savings: [{ amount: 80000 }], investments: [{ amount: 45000 }] };
  assert.equal(calculateTotals(data).totalSavings, 80000);
  assert.deepEqual(groups.map(group => group.key), ['income', 'expenses', 'savings', 'investments']);
  assert.equal('debt' in calculateTotals(data), false);
});

test('derived chart points omit unknown months and retain zero balances', () => {
  assert.deepEqual(savingsHistoryPoints([null, 0, 124000, null]), [
    { monthIndex: 1, amount: 0 }, { monthIndex: 2, amount: 124000 },
  ]);
});
