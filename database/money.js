// Denne fil sørger for, at pengeværdier konverteres mellem brugervenlig kr. notation og de interne øre, som SQLite gemmer.
export function toMinorUnits(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 999999999) {
    throw new Error('Invalid financial amount');
  }
  return Math.round(amount * 100);
}
export function validatePeriod(month, year) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error('Invalid financial period');
  }
}
