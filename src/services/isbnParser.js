/**
 * Normalizes common OCR misrecognitions in string where digits are expected.
 */
function fixOcrDigits(str) {
  if (!str) return str;
  return str
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8');
}

/**
 * Validates ISBN-10 checksum
 */
export function isValidIsbn10(isbn) {
  if (!isbn || isbn.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(isbn[i], 10);
    if (isNaN(digit)) return false;
    sum += (10 - i) * digit;
  }
  const lastChar = isbn[9].toUpperCase();
  const lastVal = lastChar === 'X' ? 10 : parseInt(lastChar, 10);
  if (isNaN(lastVal)) return false;
  sum += lastVal;
  return sum % 11 === 0;
}

/**
 * Validates ISBN-13 checksum
 */
export function isValidIsbn13(isbn) {
  if (!isbn || isbn.length !== 13) return false;
  if (!isbn.startsWith('978') && !isbn.startsWith('979')) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn[i], 10);
    if (isNaN(digit)) return false;
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(isbn[12], 10);
}

/**
 * Extracts ISBN from recognized OCR text.
 * Handles both ISBN-10 and ISBN-13 formats, with or without 'ISBN' prefix and hyphens.
 * Corrects typical OCR noise (e.g. O instead of 0, l instead of 1).
 */
export function extractIsbnFromText(text) {
  if (!text || typeof text !== 'string') return null;

  const clean = text.replace(/\r?\n/g, ' ');

  // 1. Look for explicit "ISBN" prefix followed by numbers
  // Matches e.g. "ISBN 978-80-204-0000-1", "ISBN: 978 80 204 0000 1", "ISBN 80-204-0000-0"
  // Allow common OCR confusion characters in the number part
  const isbnPrefixRegex = /(?:ISBN(?:-?1[03])?[\s:.]*)\s*([0-9Xx\s\-OoIl|SsBb]{9,25})/gi;
  let match;
  while ((match = isbnPrefixRegex.exec(clean)) !== null) {
    const candidateRaw = match[1];
    // Clean and fix candidate
    const candidateDigits = fixOcrDigits(candidateRaw).replace(/[\s\-.]/g, '').toUpperCase();

    // Check if 13-digit candidate
    if (candidateDigits.length >= 13) {
      const sub13 = candidateDigits.substring(0, 13);
      if (/^97[89]\d{10}$/.test(sub13)) {
        if (isValidIsbn13(sub13)) return sub13;
        // If checksum is off by 1 digit due to OCR error, still return if starts with 978/979
        return sub13;
      }
    }
    // Check if 10-digit candidate
    if (candidateDigits.length >= 10) {
      const sub10 = candidateDigits.substring(0, 10);
      if (/^\d{9}[\dX]$/.test(sub10)) {
        if (isValidIsbn10(sub10)) return sub10;
        return sub10;
      }
    }
  }

  // 2. Direct regex search for ISBN-13 without prefix
  const isbn13Regex = /\b(97[89][\s-]*(?:\d[\s-]*){9}\d)\b/gi;
  while ((match = isbn13Regex.exec(clean)) !== null) {
    const rawNumber = match[1].replace(/[\s-]/g, '');
    if (rawNumber.length === 13 && (rawNumber.startsWith('978') || rawNumber.startsWith('979'))) {
      return rawNumber;
    }
  }

  // 3. Fallback: Search for any 13-digit sequence starting with 978 or 979
  const digitsOnly = fixOcrDigits(clean).replace(/[^0-9]/g, '');
  const idx = digitsOnly.search(/97[89]\d{10}/);
  if (idx !== -1) {
    return digitsOnly.substring(idx, idx + 13);
  }

  // 4. Direct regex search for ISBN-10 with prefix or hyphens
  const isbn10Regex = /(?:ISBN[\s:.]*)?(\b\d{1,5}[- ]\d{1,7}[- ]\d{1,7}[- ][\dXx]\b)/gi;
  while ((match = isbn10Regex.exec(clean)) !== null) {
    const rawNumber = fixOcrDigits(match[1]).replace(/[\s-]/g, '').toUpperCase();
    if (rawNumber.length === 10 && /^\d{9}[\dX]$/.test(rawNumber)) {
      return rawNumber;
    }
  }

  return null;
}
