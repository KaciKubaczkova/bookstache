/**
 * Checks if a book might already exist in the library.
 * Returns the matching book if found, or null.
 */
export function findDuplicateBook(existingBooks, newBook, currentEditingId = null) {
  if (!existingBooks || !Array.isArray(existingBooks) || !newBook) return null;

  const asText = (value) => {
    if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(', ');
    if (value && typeof value === 'object') {
      return asText(value.name || value.displayName || value.author || value.value || '');
    }
    return String(value || '');
  };

  const newIsbn = asText(newBook.isbn).replace(/[\s-]/g, '').toLowerCase();
  const newTitle = asText(newBook.title).trim().toLowerCase();
  const newAuthor = asText(newBook.author).trim().toLowerCase();

  for (const book of existingBooks) {
    if (currentEditingId && book.id === currentEditingId) {
      continue;
    }

    const bookIsbn = (book.isbn || '').replace(/[\s-]/g, '').toLowerCase();
    const bookTitle = asText(book.title).trim().toLowerCase();
    const bookAuthor = asText(book.author).trim().toLowerCase();

    // Check ISBN match first if ISBN is provided
    if (newIsbn && bookIsbn && newIsbn === bookIsbn) {
      return { matchType: 'isbn', book };
    }

    // Check exact title + author match
    if (newTitle && bookTitle && newTitle === bookTitle) {
      if (newAuthor && bookAuthor) {
        if (newAuthor === bookAuthor) {
          return { matchType: 'title_and_author', book };
        }
      } else {
        return { matchType: 'title', book };
      }
    }
  }

  return null;
}
