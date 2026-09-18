// Legacy savings_history is retained by migration 2 as read-only source data.
// All live chart values now come from the account ledger.
export { getSavingsHistory, getSavingsAccountHistory } from './savingsRepository.js';
