function authorAsText(value) {
  if (Array.isArray(value)) return value.map(authorAsText).filter(Boolean).join(', ');
  if (value && typeof value === 'object') {
    return authorAsText(value.name || value.displayName || value.author || value.value || '');
  }
  return String(value || '').trim();
}

function normalizeAuthor(value) {
  return authorAsText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('cs')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAvailableAuthors(books = []) {
  const authorsByKey = new Map();

  for (const book of books) {
    const displayName = authorAsText(book?.author);
    const key = normalizeAuthor(displayName);
    if (key && !authorsByKey.has(key)) {
      authorsByKey.set(key, displayName);
    }
  }

  return [...authorsByKey.values()].sort((a, b) =>
    a.localeCompare(b, 'cs', { sensitivity: 'base' })
  );
}

export function matchesAuthorFilter(bookAuthor, selectedAuthor) {
  if (!selectedAuthor || selectedAuthor === 'all') return true;
  return normalizeAuthor(bookAuthor) === normalizeAuthor(selectedAuthor);
}
