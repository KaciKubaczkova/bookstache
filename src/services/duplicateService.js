/**
 * Checks if a book might already exist in the library.
 * Returns the matching book if found, or null.
 */
export function findDuplicateBook(existingBooks, newBook, currentEditingId = null) {
  if (!existingBooks || !Array.isArray(existingBooks) || !newBook) return null;

  const newIsbn = (newBook.isbn || '').replace(/[\s-]/g, '').toLowerCase();
  const newTitle = (newBook.title || '').trim().toLowerCase();
  const newAuthor = (newBook.author || '').trim().toLowerCase();

  for (const book of existingBooks) {
    if (currentEditingId && book.id === currentEditingId) {
      continue;
    }

    const bookIsbn = (book.isbn || '').replace(/[\s-]/g, '').toLowerCase();
    const bookTitle = (book.title || '').trim().toLowerCase();
    const bookAuthor = (book.author || '').trim().toLowerCase();

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
