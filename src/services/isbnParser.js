/**
 * Extracts ISBN from recognized OCR text.
 * Handles both ISBN-10 and ISBN-13 formats, with or without 'ISBN' prefix and hyphens.
 */
export function extractIsbnFromText(text) {
  if (!text || typeof text !== 'string') return null;

  // Normalize text: replace common OCR confusions like 'O' instead of '0', 'l'/'I' instead of '1'
  // But first let's look for explicit "ISBN" prefix
  const clean = text.replace(/\r?\n/g, ' ');

  // Match ISBN-13 (usually starts with 978 or 979, total 13 digits)
  // e.g., "ISBN 978-80-204-0000-1" or "9788020400001" or "ISBN: 978 80 204 0000 1"
  const isbn13Regex = /(?:ISBN(?:-13)?:?\s*)?(97[89][\s-]*(?:\d[\s-]*){9}\d)/gi;
  let match;
  while ((match = isbn13Regex.exec(clean)) !== null) {
    const rawNumber = match[1].replace(/[\s-]/g, '');
    if (rawNumber.length === 13 && (rawNumber.startsWith('978') || rawNumber.startsWith('979'))) {
      return rawNumber;
    }
  }

  // Match ISBN-10 (10 characters: 9 digits + 1 digit or 'X')
  // e.g., "ISBN 80-204-0000-0" or "ISBN: 802040000X"
  const isbn10Regex = /(?:ISBN(?:-10)?:?\s*)?(\b\d[\s-]*(?:\d[\s-]*){8}[\dXx]\b)/gi;
  while ((match = isbn10Regex.exec(clean)) !== null) {
    const rawNumber = match[1].replace(/[\s-]/g, '').toUpperCase();
    if (rawNumber.length === 10) {
      return rawNumber;
    }
  }

  // Fallback: look for any 13 digit number starting with 978 or 979 anywhere in text
  const raw13Match = clean.replace(/[^0-9]/g, '');
  const idx = raw13Match.search(/97[89]\d{10}/);
  if (idx !== -1) {
    return raw13Match.substring(idx, idx + 13);
  }

  return null;
}
