import test from 'node:test';
import assert from 'node:assert/strict';
import { compareLibraryBooks } from '../../src/services/librarySort.js';

test('řadí knihy podle skutečného data přidání od nejnovější', () => {
  const books = [
    { title: 'Starší', scanned_at: '2024-01-10T10:00:00.000Z' },
    { title: 'Nejnovější', scanned_at: '2025-06-20T10:00:00.000Z' },
    { title: 'Prostřední', scanned_at: '2024-12-01T10:00:00.000Z' }
  ];

  assert.deepEqual(
    books.sort((a, b) => compareLibraryBooks(a, b, 'newest')).map(book => book.title),
    ['Nejnovější', 'Prostřední', 'Starší']
  );
});

test('použije starší pole createdAt nebo created_at, pokud scanned_at chybí', () => {
  const books = [
    { title: 'A', createdAt: '2024-01-01T00:00:00.000Z' },
    { title: 'B', created_at: '2025-01-01T00:00:00.000Z' }
  ];

  assert.deepEqual(
    books.sort((a, b) => compareLibraryBooks(a, b, 'newest')).map(book => book.title),
    ['B', 'A']
  );
});

test('řadí názvy abecedně podle českých pravidel', () => {
  const books = [
    { title: 'Dům' },
    { title: 'Čaj' },
    { title: 'Babička' },
    { title: 'Auto' }
  ];

  assert.deepEqual(
    books.sort((a, b) => compareLibraryBooks(a, b, 'title')).map(book => book.title),
    ['Auto', 'Babička', 'Čaj', 'Dům']
  );
});

test('při shodném nebo chybějícím datu použije název jako stabilní pořadí', () => {
  const books = [{ title: 'Život' }, { title: 'Alena' }];

  assert.deepEqual(
    books.sort((a, b) => compareLibraryBooks(a, b, 'newest')).map(book => book.title),
    ['Alena', 'Život']
  );
});
