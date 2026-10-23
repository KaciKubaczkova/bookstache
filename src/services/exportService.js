import * as XLSX from 'xlsx';
import { fetchLibraryExemplars } from './firestoreService';
import { getBooks as getLocalStorageBooks } from './storage';

/**
 * Exports all books of a library to a native Microsoft Excel (.xlsx) file.
 * @param {Object} library - Library object ({ id, name, ... })
 * @param {Array} [providedBooks] - Optional pre-fetched list of books for this library
 */
export async function exportLibraryToExcel(library, providedBooks = null) {
  if (!library) {
    alert('Nebyla vybrána žádná knihovna k exportu.');
    return;
  }

  let books = providedBooks;

  // If books list was not provided directly, fetch all books for this library
  if (!books) {
    try {
      books = await fetchLibraryExemplars(library.id);
    } catch (err) {
      console.warn('Chyba při načítání knih z Firestore, použije se záloha:', err);
      books = getLocalStorageBooks(library.id);
    }
  }

  const rows = (books || []).map((b) => {
    let formattedDate = '';
    if (b.scanned_at) {
      try {
        formattedDate = new Date(b.scanned_at).toLocaleString('cs-CZ');
      } catch (e) {
        formattedDate = b.scanned_at;
      }
    } else if (b.createdAt) {
      try {
        formattedDate = new Date(b.createdAt).toLocaleString('cs-CZ');
      } catch (e) {
        formattedDate = b.createdAt;
      }
    }

    return {
      'ID': b.id || '',
      'ISBN': b.isbn || '',
      'Název knihy': b.title || '',
      'Autor': b.author || '',
      'Rok vydání': b.year || '',
      'Žánr': b.genre || '',
      'Jazyk': b.language || 'Čeština',
      'Stav': b.status || 'Dostupná',
      'Datum naskenování / Přidání': formattedDate,
      'Poznámky': b.notes || ''
    };
  });

  // If library has no books, create at least header row or an informative message
  if (rows.length === 0) {
    rows.push({
      'ID': '',
      'ISBN': '',
      'Název knihy': 'V této knihovně zatím nejsou žádné knihy',
      'Autor': '',
      'Rok vydání': '',
      'Žánr': '',
      'Jazyk': '',
      'Stav': '',
      'Datum naskenování / Přidání': '',
      'Poznámky': ''
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Define column widths for optimal display in Excel
  worksheet['!cols'] = [
    { wch: 16 }, // ID
    { wch: 18 }, // ISBN
    { wch: 35 }, // Název knihy
    { wch: 25 }, // Autor
    { wch: 12 }, // Rok vydání
    { wch: 18 }, // Žánr
    { wch: 12 }, // Jazyk
    { wch: 15 }, // Stav
    { wch: 22 }, // Datum naskenování / Přidání
    { wch: 30 }  // Poznámky
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Seznam knih');

  const safeLibraryName = (library.name || 'knihovna')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_');
  const fileName = `knihovna_${safeLibraryName}_export.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
