import test from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableAuthors, matchesAuthorFilter } from '../../src/services/libraryFilters.js';

test('vytvoří seznam unikátních autorů v českém abecedním pořadí', () => {
  const authors = getAvailableAuthors([
    { author: 'Oscar Wilde' },
    { author: 'Molière' },
    { author: 'oscar wilde' },
    { author: 'Čapek, Karel' },
    { author: '' }
  ]);

  assert.deepEqual(authors, ['Čapek, Karel', 'Molière', 'Oscar Wilde']);
});

test('filtruje autora bez ohledu na velikost písmen a diakritiku', () => {
  assert.equal(matchesAuthorFilter('Molière', 'moliere'), true);
  assert.equal(matchesAuthorFilter('Oscar Wilde', 'Oscar Wilde'), true);
  assert.equal(matchesAuthorFilter('Karel Čapek', 'Josef Čapek'), false);
});

test('výchozí volba zobrazí všechny autory', () => {
  assert.equal(matchesAuthorFilter('Oscar Wilde', 'all'), true);
  assert.equal(matchesAuthorFilter('Oscar Wilde', ''), true);
});

test('zvládne autora předaného jako pole nebo objekt', () => {
  const authors = getAvailableAuthors([
    { author: ['Oscar Wilde'] },
    { author: { name: 'Molière' } }
  ]);

  assert.deepEqual(authors, ['Molière', 'Oscar Wilde']);
  assert.equal(matchesAuthorFilter(['Oscar Wilde'], 'Oscar Wilde'), true);
});
