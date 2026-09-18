export function categoryName(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Skriv et navn til kategorien.');
  const name = value.trim().normalize('NFC');
  if (name.length > 60) throw new Error('Navnet må højst være 60 tegn.');
  return { name, key: name.toLocaleLowerCase('da-DK') };
}
