import { describe, it } from 'node:test';
import assert from 'node:assert';
import { findDuplicateBook } from '../../src/services/duplicateService.js';

describe('duplicateService', () => {
  const existingBooks = [
    { id: '1', title: 'Babička', author: 'Božena Němcová', isbn: '9788020400001' },
    { id: '2', title: 'Malý princ', author: 'Antoine de Saint-Exupéry', isbn: '9788000012345' },
    { id: '3', title: 'Kniha bez ISBN', author: 'Karel Čapek', isbn: '' }
  ];

  it('detects duplicate by ISBN with formatting differences', () => {
    const dup = findDuplicateBook(existingBooks, {
      isbn: '978-80-204-0000-1',
      title: 'Babička jiné vydání'
    });
    assert.ok(dup);
    assert.strictEqual(dup.matchType, 'isbn');
    assert.strictEqual(dup.book.id, '1');
  });

  it('detects duplicate by title and author when ISBN is missing', () => {
    const dup = findDuplicateBook(existingBooks, {
      title: 'Kniha bez ISBN',
      author: 'Karel Čapek'
    });
    assert.ok(dup);
    assert.strictEqual(dup.matchType, 'title_and_author');
    assert.strictEqual(dup.book.id, '3');
  });

  it('ignores self when editing an existing book', () => {
    const dup = findDuplicateBook(
      existingBooks,
      { id: '1', title: 'Babička', isbn: '9788020400001' },
      '1'
    );
    assert.strictEqual(dup, null);
  });

  it('returns null when book is completely unique', () => {
    const dup = findDuplicateBook(existingBooks, {
      title: 'R.U.R.',
      author: 'Karel Čapek',
      isbn: '9788011223344'
    });
    assert.strictEqual(dup, null);
  });
});
