import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractLanguageValue, firstNonEmpty, normalizeGenres } from '../../src/services/bookLookup.js';

describe('book metadata normalization', () => {
  it('uses the first populated catalogue field instead of stopping at an empty array', () => {
    assert.deepEqual(firstNonEmpty([[], '', ['Romance'], ['Other']]), ['Romance']);
    assert.equal(firstNonEmpty([[], '', null]), null);
  });

  it('maps Open Library language keys and ISO language codes', () => {
    assert.equal(extractLanguageValue([{ key: '/languages/eng' }]), 'Angličtina');
    assert.equal(extractLanguageValue('en'), 'Angličtina');
  });

  it('does not classify audience labels as genres', () => {
    assert.equal(normalizeGenres(['Young Adult', 'Adult']), '');
    assert.equal(normalizeGenres(['Young Adult Fiction', 'Teen']), '');
  });

  it('keeps genuine romance and contemporary genre from BIC-style labels', () => {
    assert.equal(normalizeGenres(['Adult & contemporary romance (FRD)']), 'Romantika, Současný román');
    assert.equal(normalizeGenres(['Contemporary romance']), 'Romantika, Současný román');
  });

  it('extracts genres when the first catalogue field is present but empty', () => {
    const record = { genres: [], genre: '', subjects: ['Contemporary romance'] };
    const chosen = firstNonEmpty([record.genres, record.genre, record.subjects]);
    assert.equal(normalizeGenres(chosen), 'Romantika, Současný román');
  });
});
