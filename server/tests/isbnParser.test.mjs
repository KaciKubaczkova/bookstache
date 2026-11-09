import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractIsbnFromText } from '../../src/services/isbnParser.js';

describe('ISBN text extractor', () => {
  it('extracts ISBN-13 with prefix and dashes', () => {
    const text = 'Knižní klub 2021\nISBN 978-80-242-7000-5\nVytištěno v ČR';
    assert.strictEqual(extractIsbnFromText(text), '9788024270005');
  });

  it('extracts ISBN-13 with spaces', () => {
    const text = 'ISBN: 978 80 7335 123 4';
    assert.strictEqual(extractIsbnFromText(text), '9788073351234');
  });

  it('extracts plain 13-digit ISBN starting with 978', () => {
    const text = 'Cena 299 Kč 9788020412345 vč. DPH';
    assert.strictEqual(extractIsbnFromText(text), '9788020412345');
  });

  it('extracts ISBN-10 with hyphens', () => {
    const text = 'ISBN 80-7203-123-X';
    assert.strictEqual(extractIsbnFromText(text), '807203123X');
  });

  it('extracts ISBN-10 with numeric check digit', () => {
    const text = 'ISBN 80-204-0000-0';
    assert.strictEqual(extractIsbnFromText(text), '8020400000');
  });

  it('returns null when no ISBN present', () => {
    const text = 'Toto je obyčejný text bez jakéhokoliv čísla';
    assert.strictEqual(extractIsbnFromText(text), null);
  });
});
