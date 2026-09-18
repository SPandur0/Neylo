export function profileInitial(name) {
  const letter = name.trim().match(/\p{L}/u)?.[0];
  return letter ? Array.from(letter.toLocaleUpperCase())[0] : 'N';
}
