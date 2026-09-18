// Kept as a compatibility component; monthly values are no longer editable.
import SavingsChart from './SavingsChart';
import { useFinances } from '../context/FinanceContext';
export default function MonthlySavings() {
  const { monthlySavings } = useFinances();
  return <SavingsChart history={monthlySavings} />;
}
