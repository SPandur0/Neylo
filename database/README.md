# Neylo local persistence — schema version 4

`neylo.db` remains in expo-sqlite's default application database directory. No new dependencies. UI → FinanceContext → repositories → serialized SQLite connection. WAL, foreign keys and a busy timeout are enabled. All SQL parameters supplied by users are bound.

## Savings schema and migration

Migration 2 is appended in `migrations.js`; migration 1 is unchanged. The migration and `PRAGMA user_version = 2` commit together. No database reset, table deletion or existing-row deletion is performed.

| Table | Columns |
| --- | --- |
| asset_accounts | id INTEGER primary key; name TEXT; type TEXT (defaults to savings); category TEXT nullable; initial_balance_minor INTEGER; created_at TEXT; archived_at TEXT nullable; legacy_savings_id INTEGER unique foreign key to savings |
| asset_transactions | id INTEGER primary key; account_id INTEGER foreign key to asset_accounts (delete restricted); amount_minor INTEGER signed; transaction_type TEXT (deposit/withdrawal/transfer); date TEXT; note TEXT nullable; transfer_id TEXT nullable; created_at TEXT UTC timestamp |

Opening amounts are integer øre in 0–99,999,999,900. Transactions are nonzero integer øre with absolute value up to 99,999,999,900. SQL checks enforce deposit/withdrawal signs and transfer link presence. Indexes cover account/date and transfer ID. Account type leaves room for future asset categories; only savings accounts are queried by this repository. Investments continue using the existing separate repository and legacy table rows.

Each existing `savings` row of type `savings` becomes one account with its original name, category and exact balance, linked to the source row. An empty name becomes General Savings. The opening date is the local migration date: old rows describe a current balance, not a verified balance on their original creation date. Assigning that current value to the past would invent history. Legacy source rows remain untouched and are no longer used as live Savings balances.

The old `savings_history` table remains intact. Its manually entered Savings + Investments snapshots cannot establish savings-only transactions or account attribution. They are retained for preservation, excluded from live graphs, and have no editing UI. No historical transactions are invented.

## Balances, history and transfers

Current account balance = opening balance + SUM(signed transactions). Total Savings = SUM(current balances of active savings accounts), excluding investments. There is no editable current/total balance column.

Graphs show month-end balances; the current month stops at today, future months are null. Accounts contribute only from their opening date. Prior transactions carry forward. Months before any selected account existed are null. The total graph retains past balances from archived accounts too. Archiving requires zero balance, so this preserves historical totals without changing current Total Savings. Archived individual account graphs and activity remain available. The UI shows this year; repository functions accept any year.

Deposits, withdrawals and transfers accept a calendar date and optional note. Dates are valid local calendar dates, no earlier than account opening and no later than today. Negative balances are disallowed, including at earlier/later dates affected by a backdated withdrawal. Daily closing balances are checked; no intraday ordering is implied.

Transfers insert equal and opposite entries with one random shared transfer ID inside one SQLite transaction. Both accounts must be active and distinct. Failure of either insert or balance validation rolls back both. Total Savings is unchanged. Archive requires zero balance; withdraw or transfer the funds first. Financial history is retained permanently through this UI. Corrections use compensating transactions; the delete function deliberately rejects deletion.

## UI propagation

All Savings mutations go through FinanceContext. After successful persistence, one serialized snapshot reads active/archived accounts, activity, total history and individual histories. Shared React state updates the account list, details, Home values and charts together. Failed writes retain inputs. If a write commits but snapshot reload fails, the provider presents its reload/retry screen instead of allowing the same financial action to be submitted twice.

Savings has its own account form and details within the existing Savings tab. Account selection opens its graph and history; the all-accounts view displays Total. Other tabs/navigation and the Neylo style remain intact. Home's Savings card now shows savings only; Investments still has its own card and existing editor.

## Verification

`node --test tests/*.test.mjs`: 12 passing tests. Production migrations/repositories run against real disk SQLite with only Expo's bridge replaced by a Node adapter. Covers requested A–D amounts, database close/reopen persistence, F–G dated graph inputs, Home calculation/expense chart regressions, cents, rejected withdrawals, atomic transfer rollback, date validation, archive safety, preservation of existing version-1 rows/snapshots, migration rollback and newer-version refusal.

`npx expo export --platform all --output-dir /private/tmp/neylo-savings-export`: iOS, Android and web bundle checks. This does not substitute for device interaction. A native force-close/relaunch, keyboard/accessibility and visual smoke test still need to be performed on a device or simulator.

Web continues to require the existing SharedArrayBuffer/WASM hosting headers (`Cross-Origin-Embedder-Policy: require-corp`, `Cross-Origin-Opener-Policy: same-origin`) and a secure context.

## Files changed for this redesign

Created: `Components/SavingsAccounts.js`.

Modified: `Components/MonthlySavings.js`, `Components/SavingsChart.js`, `context/FinanceContext.js`, `data/financeData.js`, `database/database.js`, `database/migrations.js`, `database/repositories/savingsRepository.js`, `database/repositories/savingsHistoryRepository.js`, `database/README.md`, `screens/HomeScreen.js`, `screens/IncomeExpensesScreen.js`, `tests/database.test.mjs`, `tests/finance.test.mjs`.

Some files already contained uncommitted work (including the database directory); this list describes this task's edits, not all git changes.

## Intentional limits

No investment portfolio, net-worth system, goals, authentication, cloud sync, bank connection or other requested exclusions. No account deletion, transaction deletion, future-dated transactions, overdrafts, archive restoration or legacy-snapshot browsing UI. Initial balance/date are immutable after creation; rename is supported. Archived accounts remain viewable. No unrelated Income, Expenses, Settings, branding or splash changes.

## Savings UX simplification

Creation asks only for Name and Current amount. The repository supplies today's local date and stores the amount as the opening balance. Add money and Take out ask for an amount and optional note; dates are automatic. The pot view prioritizes its balance, these two actions, its graph and Recent. The overview shows only pot names and balances plus the automatically calculated total. Move money, Rename and Archive sit behind an overflow menu. Archived pots remain accessible through the overview overflow menu. Category/date inputs, opening-balance metadata, transaction classifications and chart-calculation instructions are no longer shown. No manual monthly chart fields exist.

No schema change or new migration is required for this simplification. Existing investments remain separate and unchanged. Assumptions: current-day actions in the consumer UI, Danish kroner/input formatting retained, zero-balance archiving retained. The repository still supports dated history and transfers internally. Native UI interaction/force-close validation remains a device smoke-test step; SQLite close/reopen persistence and all-platform bundle exports are tested.

Files changed for this follow-up: Components/SavingsAccounts.js, Components/SavingsChart.js, database/repositories/savingsRepository.js, tests/database.test.mjs, database/README.md.


## Expense categories (migration 4)

`expense_categories` has `id INTEGER PRIMARY KEY AUTOINCREMENT`, `name TEXT NOT NULL` (nonblank), `name_key TEXT NOT NULL UNIQUE`, and `created_at` / `updated_at TEXT NOT NULL` with UTC timestamp defaults. Names are trimmed and NFC-normalized; `name_key` uses Danish lowercase to reject case-insensitive duplicates including Danish letters. New names are limited to 60 characters.

`expenses.category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT` replaces the old category-name column. The existing period index and a new category index support lookups. The repository joins the current category name for display. All other expense columns and constraints remain unchanged.

Migration 4 seeds the seven former defaults once, imports custom legacy names, merges names differing only by whitespace/case, and maps missing legacy names to Other. It copies every expense ID, name, integer amount, month/year and timestamp exactly, and preserves the autoincrement sequence. Table replacement and version update occur in the existing migration transaction; a failure rolls back everything. Subsequent launches never reseed deleted categories.

The expense form's Administrer action opens category management inside the same modal, preserving unsaved form fields. Keep/cancel uses the shared secondary variant; delete and Flyt og slet use the shared destructive variant. An in-use category requires a different existing destination; reassignment and deletion commit atomically. No expense is deleted. With no alternative, the user must first create one; with no categories, the form offers the management path to create one.

FinanceContext refreshes categories and joined expenses after each category mutation. Expense rows and Home's existing ExpenseChart receive this state immediately. Breakdown groups actual expenses by stable category ID and assigns colors from the existing chart palette; no hardcoded category-name list filters chart data.
