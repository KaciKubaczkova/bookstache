// Client-side LocalStorage service for managing libraries and books

const LIBRARIES_KEY = 'knihovnicka_libraries';
const BOOKS_KEY = 'knihovnicka_books';

function getStoredLibraries() {
  try {
    const data = localStorage.getItem(LIBRARIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Chyba při čtení knihoven z localStorage:', err);
    return [];
  }
}

function saveStoredLibraries(libraries) {
  try {
    localStorage.setItem(LIBRARIES_KEY, JSON.stringify(libraries));
  } catch (err) {
    console.error('Chyba při ukládání knihoven do localStorage:', err);
  }
}

function getStoredBooks() {
  try {
    const data = localStorage.getItem(BOOKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Chyba při čtení knih z localStorage:', err);
    return [];
  }
}

function saveStoredBooks(books) {
  try {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  } catch (err) {
    console.error('Chyba při ukládání knih do localStorage:', err);
  }
}

export function getLibraries() {
  return getStoredLibraries();
}

export function saveLibrary({ name, google_sheet_url }) {
  if (!name || !name.trim()) {
    throw new Error('Název knihovny je povinný');
  }

  const libraries = getStoredLibraries();
  const cleanName = name.trim();

  let existing = libraries.find(
    (l) => l.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (existing) {
    if (google_sheet_url !== undefined) {
      existing.google_sheet_url = google_sheet_url.trim();
      saveStoredLibraries(libraries);
    }
    return existing;
  }

  const newLibrary = {
    id: Date.now(),
    name: cleanName,
    google_sheet_url: (google_sheet_url || '').trim(),
    created_at: new Date().toISOString()
  };

  libraries.push(newLibrary);
  saveStoredLibraries(libraries);
  return newLibrary;
}

export function getBooks(libraryId) {
  if (!libraryId) return [];
  const books = getStoredBooks();
  return books.filter((b) => String(b.library_id) === String(libraryId));
}

export function saveBook(libraryId, formData) {
  if (!formData.title || !formData.title.trim()) {
    throw new Error('Název knihy je povinný');
  }

  const books = getStoredBooks();
  const libraries = getStoredLibraries();
  const library = libraries.find((l) => String(l.id) === String(libraryId));

  const newBook = {
    id: Date.now(),
    library_id: libraryId,
    isbn: formData.isbn || '',
    title: formData.title.trim(),
    author: formData.author || '',
    year: formData.year || '',
    genre: formData.genre || '',
    target_age: formData.target_age || 'Všechny věkové kategorie',
    language: formData.language || 'Čeština',
    status: formData.status || 'Dostupná',
    notes: formData.notes || '',
    scanned_at: new Date().toISOString()
  };

  books.unshift(newBook);
  saveStoredBooks(books);

  // Trigger Google Sheet Webhook if configured
  if (library && library.google_sheet_url && library.google_sheet_url.startsWith('http')) {
    try {
      fetch(library.google_sheet_url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      }).catch((err) =>
        console.error('Chyba při odesílání knihy na Google Sheet Webhook:', err)
      );
    } catch (e) {
      console.error(e);
    }
  }

  return newBook;
}

export function updateBook(bookId, formData) {
  const books = getStoredBooks();
  const index = books.findIndex((b) => String(b.id) === String(bookId));

  if (index === -1) {
    throw new Error('Kniha nenalezena');
  }

  const existing = books[index];
  const updatedBook = {
    ...existing,
    ...formData,
    isbn: formData.isbn !== undefined ? formData.isbn : existing.isbn,
    title: formData.title !== undefined ? formData.title.trim() : existing.title,
    author: formData.author !== undefined ? formData.author : existing.author,
    year: formData.year !== undefined ? formData.year : existing.year,
    genre: formData.genre !== undefined ? formData.genre : existing.genre,
    target_age: formData.target_age !== undefined ? formData.target_age : existing.target_age,
    language: formData.language !== undefined ? formData.language : existing.language,
    status: formData.status !== undefined ? formData.status : existing.status,
    notes: formData.notes !== undefined ? formData.notes : existing.notes
  };

  books[index] = updatedBook;
  saveStoredBooks(books);
  return updatedBook;
}

export function deleteBook(bookId) {
  const books = getStoredBooks();
  const filtered = books.filter((b) => String(b.id) !== String(bookId));
  saveStoredBooks(filtered);
  return true;
}

export function exportLibraryCsv(library) {
  if (!library) return;

  const libraryBooks = getBooks(library.id);

  let csvContent = '\uFEFF'; // BOM for UTF-8 in Excel / Google Sheets
  csvContent += 'ID;ISBN;Název;Autor;Rok vydání;Žánr;Věková skupina;Jazyk;Stav;Datum naskenování;Poznámky\n';

  for (const b of libraryBooks) {
    const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
    csvContent += `${b.id};${escape(b.isbn)};${escape(b.title)};${escape(b.author)};${escape(b.year)};${escape(b.genre)};${escape(b.target_age)};${escape(b.language)};${escape(b.status)};${escape(b.scanned_at)};${escape(b.notes)}\n`;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeFilename = encodeURIComponent(library.name.replace(/\s+/g, '_'));

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `knihovna_${safeFilename}_export.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
