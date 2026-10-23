import express from 'express';
import cors from 'cors';
import db from './db.mjs';
import { lookupBookByIsbnOrTitle } from './bookService.mjs';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Get all libraries
app.get('/api/libraries', (req, res) => {
  try {
    const libraries = db.prepare('SELECT * FROM libraries ORDER BY name ASC').all();
    res.json(libraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get or create library
app.post('/api/libraries', (req, res) => {
  try {
    const { name, google_sheet_url } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Název knihovny je povinný' });
    }

    const cleanName = name.trim();
    let library = db.prepare('SELECT * FROM libraries WHERE name = ?').get(cleanName);

    if (!library) {
      const info = db.prepare('INSERT INTO libraries (name, google_sheet_url) VALUES (?, ?)').run(
        cleanName,
        google_sheet_url || ''
      );
      library = db.prepare('SELECT * FROM libraries WHERE id = ?').get(info.lastInsertRowid);
    } else if (google_sheet_url !== undefined && google_sheet_url !== library.google_sheet_url) {
      db.prepare('UPDATE libraries SET google_sheet_url = ? WHERE id = ?').run(google_sheet_url, library.id);
      library.google_sheet_url = google_sheet_url;
    }

    res.json(library);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get books for a library
app.get('/api/libraries/:id/books', (req, res) => {
  try {
    const libraryId = req.params.id;
    const { status, search, genre } = req.query;

    let query = 'SELECT * FROM books WHERE library_id = ?';
    const params = [libraryId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (genre) {
      query += ' AND genre LIKE ?';
      params.push(`%${genre}%`);
    }

    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id DESC';

    const books = db.prepare(query).all(...params);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a book to a library
app.post('/api/libraries/:id/books', async (req, res) => {
  try {
    const libraryId = req.params.id;
    const { isbn, title, author, year, genre, language, status, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Název knihy je povinný' });
    }

    const library = db.prepare('SELECT * FROM libraries WHERE id = ?').get(libraryId);
    if (!library) {
      return res.status(404).json({ error: 'Knihovna nenalezena' });
    }

    const info = db.prepare(`
      INSERT INTO books (library_id, isbn, title, author, year, genre, language, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      libraryId,
      isbn || '',
      title.trim(),
      author || '',
      year || '',
      genre || '',
      language || 'Čeština',
      status || 'Dostupná',
      notes || ''
    );

    const newBook = db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid);

    // If library has a google_sheet_url Webhook/Apps Script URL configured, trigger webhook async
    if (library.google_sheet_url && library.google_sheet_url.startsWith('http')) {
      fetch(library.google_sheet_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      }).catch(err => console.error('Error forwarding book to Google Sheet Webhook:', err));
    }

    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update book (e.g. status "Dostupná" / "Půjčená" or edit metadata)
app.put('/api/books/:id', (req, res) => {
  try {
    const bookId = req.params.id;
    const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!existing) {
      return res.status(404).json({ error: 'Kniha nenalezena' });
    }

    const { isbn, title, author, year, genre, language, status, notes } = req.body;

    db.prepare(`
      UPDATE books
      SET isbn = ?, title = ?, author = ?, year = ?, genre = ?, language = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(
      isbn !== undefined ? isbn : existing.isbn,
      title !== undefined ? title : existing.title,
      author !== undefined ? author : existing.author,
      year !== undefined ? year : existing.year,
      genre !== undefined ? genre : existing.genre,
      language !== undefined ? language : existing.language,
      status !== undefined ? status : existing.status,
      notes !== undefined ? notes : existing.notes,
      bookId
    );

    const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete book
app.delete('/api/books/:id', (req, res) => {
  try {
    const bookId = req.params.id;
    const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!existing) {
      return res.status(404).json({ error: 'Kniha nenalezena' });
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(bookId);
    res.json({ success: true, message: 'Kniha byla smazána' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lookup book info by ISBN or Title
app.get('/api/books/lookup', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Dotaz pro vyhledání chybí' });
    }

    const bookInfo = await lookupBookByIsbnOrTitle(query);
    res.json(bookInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export library books as CSV for Google Sheets
app.get('/api/libraries/:id/export/csv', (req, res) => {
  try {
    const libraryId = req.params.id;
    const library = db.prepare('SELECT * FROM libraries WHERE id = ?').get(libraryId);
    if (!library) {
      return res.status(404).json({ error: 'Knihovna nenalezena' });
    }

    const books = db.prepare('SELECT * FROM books WHERE library_id = ? ORDER BY id ASC').all(libraryId);

    let csvContent = '\uFEFF'; // BOM for UTF-8 in Excel / Google Sheets
    csvContent += 'ID;ISBN;Název;Autor;Rok vydání;Žánr;Jazyk;Stav;Datum naskenování;Poznámky\n';

    for (const b of books) {
      const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
      csvContent += `${b.id};${escape(b.isbn)};${escape(b.title)};${escape(b.author)};${escape(b.year)};${escape(b.genre)};${escape(b.language)};${escape(b.status)};${escape(b.scanned_at)};${escape(b.notes)}\n`;
    }

    const safeFilename = encodeURIComponent(library.name.replace(/\s+/g, '_'));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="knihovna_${safeFilename}_export.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

export default app;
