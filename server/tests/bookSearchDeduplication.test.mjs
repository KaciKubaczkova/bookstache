import test from 'node:test';
import assert from 'node:assert/strict';
import { deduplicateBookCandidates } from '../../src/services/bookLookup.js';

test('sloučí stejnou knihu, když katalogy zapíší jméno autora různě', () => {
  const results = deduplicateBookCandidates([
    { title: 'Obraz Doriana Graye', author: ['Oscar Wilde'], isbn: '9780000000001' },
    { title: 'Obraz Doriana Graye', author: ['Wilde, Oscar (1854–1900)'], isbn: '9780000000002' },
    { title: 'Obraz Doriana Graye: román', author: ['Oscar Fingal O’Flahertie Wills Wilde (1854–1900)'] },
    { title: 'Obraz Doriana Graye (The Picture of Dorian Gray)', author: ['Oscar Wilde'] }
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Obraz Doriana Graye');
  assert.equal(results[0].author.length, 1);
});

test('ponechá stejnojmenné knihy od různých autorů odděleně', () => {
  const results = deduplicateBookCandidates([
    { title: 'Obraz Doriana Graye', author: ['Oscar Wilde'] },
    { title: 'Obraz Doriana Graye', author: ['Jiný Autor'] }
  ]);

  assert.equal(results.length, 2);
});

test('sloučí záznam bez autora pouze tehdy, když je známý jediný autor', () => {
  const results = deduplicateBookCandidates([
    { title: 'Obraz Doriana Graye', author: ['Oscar Wilde'] },
    { title: 'Obraz Doriana Graye', author: [] }
  ]);

  assert.equal(results.length, 1);
  assert.deepEqual(results[0].author, ['Oscar Wilde']);
});

test('nepřiřadí záznam bez autora, pokud existuje více autorů stejného názvu', () => {
  const results = deduplicateBookCandidates([
    { title: 'Lakomec', author: ['Molière'] },
    { title: 'Lakomec', author: ['Jiný Autor'] },
    { title: 'Lakomec', author: [] }
  ]);

  assert.equal(results.length, 3);
});
