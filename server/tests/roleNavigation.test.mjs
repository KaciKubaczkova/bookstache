import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoleSwitchTransition } from '../../src/services/roleNavigation.js';

test('přepnutí z knihovníka jde přímo do čtenáře a zachová vybranou knihovnu', () => {
  assert.deepEqual(getRoleSwitchTransition('librarian'), {
    nextRole: 'reader',
    preserveCurrentLibrary: true
  });
});

test('přepnutí ze čtenáře vyžaduje nový výběr role a ověření knihovníka', () => {
  assert.deepEqual(getRoleSwitchTransition('reader'), {
    nextRole: null,
    preserveCurrentLibrary: false
  });
});
