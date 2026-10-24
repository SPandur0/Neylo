// Disse tests kontrollerer brugergrænsefladens små regler, for eksempel hvordan profilinitialer skal vises i avataren.
import assert from 'node:assert/strict';
import test from 'node:test';
import { profileInitial } from '../data/profile.js';

test('profile initials handle live replacements, whitespace, Unicode and empty names', () => {
  for (const [name, expected] of [['Sune', 'S'], ['Marco', 'M'], ['sune', 'S'], [' Maria ', 'M'], ['Andreas', 'A'], ['', 'N'], ['   ', 'N'], ['Émilie', 'É'], ['🌿 Sune', 'S']]) {
    assert.equal(profileInitial(name), expected);
  }
});
