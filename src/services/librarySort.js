function getAddedTimestamp(book = {}) {
  for (const value of [book.scanned_at, book.createdAt, book.created_at, book.addedAt]) {
    if (value == null || value === '') continue;

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value < 100000000000 ? value * 1000 : value;
    }

    if (typeof value === 'object' && typeof value.toDate === 'function') {
      const timestamp = value.toDate().getTime();
      if (Number.isFinite(timestamp)) return timestamp;
    }

    const timestamp = Date.parse(String(value));
    if (Number.isFinite(timestamp)) return timestamp;

    const numericValue = Number(value);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue < 100000000000 ? numericValue * 1000 : numericValue;
    }
  }

  // Older localStorage records used Date.now() as their ID.
  const legacyId = Number(book.id);
  if (Number.isFinite(legacyId) && legacyId >= 100000000000) return legacyId;

  return 0;
}

export function compareLibraryBooks(a = {}, b = {}, sortBy = 'newest') {
  if (sortBy === 'title') {
    return String(a.title || '').localeCompare(String(b.title || ''), 'cs', { sensitivity: 'base' });
  }

  if (sortBy === 'author') {
    return String(a.author || '').localeCompare(String(b.author || ''), 'cs', { sensitivity: 'base' });
  }

  if (sortBy === 'year') {
    return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
  }

  const dateDifference = getAddedTimestamp(b) - getAddedTimestamp(a);
  if (dateDifference !== 0) return dateDifference;

  // Keep equal/unknown dates in a stable, predictable Czech title order.
  return String(a.title || '').localeCompare(String(b.title || ''), 'cs', { sensitivity: 'base' });
}
