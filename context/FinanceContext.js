// Denne provider samler appens finansdata og sørger for, at skærme får de samme opdaterede værdier fra lokal database og opsparingssnapshot.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { calculateTotals, saveEntry, deleteEntry } from '../data/financeData';
import income from '../database/repositories/incomeRepository';
import expenses from '../database/repositories/expenseRepository';
import * as savings from '../database/repositories/savingsRepository';
import investments from '../database/repositories/investmentRepository';
import { ActionButton } from '../Components/FinanceUI';
import { styles } from '../styles/styles';

import * as categories from '../database/repositories/expenseCategoryRepository';

import * as profile from '../database/repositories/profileRepository';

const repositories = { income, expenses, investments };
const FinanceContext = createContext(null);

export function FinanceProvider({ children, onReady }) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);
  const nameRevision = useRef(0);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [data, setData] = useState(null);
  const [savingsSnapshot, setSavingsSnapshot] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    (async () => {
      try {
        const entries = await Promise.all(Object.entries(repositories).map(async ([key, repository]) => [key, await repository.get()]));
        const snapshot = await savings.getSavingsSnapshot();
        const categoryList = await categories.getExpenseCategories();
        const savedName = await profile.getName();
        if (active) { setExpenseCategories(categoryList); setName(savedName); setData({ ...Object.fromEntries(entries), savings: snapshot.accounts }); setSavingsSnapshot(snapshot); }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) onReady?.();
      }
    })();
    return () => { active = false; };
  }, [attempt, onReady]);

  function updateName(value) {
    setName(value);
    setNameError(false);
    const revision = ++nameRevision.current;
    // The shared database queue preserves typing order, even on slow storage.
    profile.saveName(value).catch(() => {
      if (revision === nameRevision.current) setNameError(true);
    });
  }

  async function mutateSavings(action, ...args) {
    await savings[action](...args);
    try {
      const snapshot = await savings.getSavingsSnapshot();
      setSavingsSnapshot(snapshot);
      setData(current => ({ ...current, savings: snapshot.accounts }));
    } catch {
      // The write committed: reload instead of letting a retry duplicate the transaction.
      setError(true);
    }
  }
  async function mutateCategory(action, ...args) {
    const operations = { create: categories.createExpenseCategory, rename: categories.renameExpenseCategory, delete: categories.deleteExpenseCategory };
    if (!operations[action]) throw new Error('Unknown category action');
    const result = await operations[action](...args);
    try {
      const categoryList = await categories.getExpenseCategories();
      const updatedExpenses = await expenses.get();
      setExpenseCategories(categoryList);
      setData(current => ({ ...current, expenses: updatedExpenses }));
    } catch {
      // A committed write must not be retried just because the refresh failed.
      setError(true);
    }
    return result;
  }
  async function save(group, values, id) {
    const repository = repositories[group];
    if (!repository) throw new Error('Unknown finance group');
    const entry = id == null ? await repository.add(values) : await repository.update(id, values);
    setData(current => saveEntry(current, group, entry));
  }
  async function remove(group, id) {
    const repository = repositories[group];
    if (!repository) throw new Error('Unknown finance group');
    await repository.remove(id);
    setData(current => deleteEntry(current, group, id));
  }

  if (error) return <View style={[styles.screen, styles.loadError]}>
    <Text accessibilityRole="alert" style={styles.error}>Dine data kunne ikke indlæses. Prøv igen.</Text>
    <ActionButton label="Prøv igen" onPress={() => setAttempt(value => value + 1)} />
  </View>;
  if (!data) return null;
  return <FinanceContext.Provider value={{ expenseCategories, mutateCategory, name, updateName, nameError, data, totals: calculateTotals(data), save, remove, monthlySavings: savingsSnapshot.history, savingsSnapshot, mutateSavings }}>
    {children}
  </FinanceContext.Provider>;
}
export const useFinances = () => useContext(FinanceContext);
