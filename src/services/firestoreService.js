import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import * as localStorageService from './storage';

// Collection references
const BOOKS_COL = 'books';
const LIBRARIES_COL = 'libraries';
const EXEMPLARS_COL = 'exemplars';

/**
 * Ensures or creates a book title document in 'books' collection
 */
export async function getOrCreateBookTitle(bookData) {
  if (!isFirebaseConfigured) {
    return {
      id: bookData.isbn ? 'isbn_' + bookData.isbn.replace(/\s+/g, '') : 'title_' + Date.now(),
      ...bookData
    };
  }

  const cleanIsbn = (bookData.isbn || '').trim().replace(/[- ]/g, '');
  const cleanTitle = (bookData.title || '').trim();

  try {
    // If ISBN exists, check if book title already exists by ISBN
    if (cleanIsbn) {
      const q = query(collection(db, BOOKS_COL), where('isbn', '==', cleanIsbn));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        return { id: existingDoc.id, ...existingDoc.data() };
      }
    } else {
      // Query by exact title & author
      const q = query(
        collection(db, BOOKS_COL),
        where('title', '==', cleanTitle)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        return { id: existingDoc.id, ...existingDoc.data() };
      }
    }

    // Otherwise create new book title
    const newBookTitle = {
      isbn: cleanIsbn,
      title: cleanTitle,
      author: (bookData.author || '').trim(),
      genre: bookData.genre || '',
      year: bookData.year || '',
      target_age: bookData.target_age || 'Všechny věkové kategorie',
      language: bookData.language || 'Čeština',
      coverUrl: bookData.coverUrl || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, BOOKS_COL), newBookTitle);
    return { id: docRef.id, ...newBookTitle };
  } catch (err) {
    console.error('Chyba při hledání/vytváření titulu v Firestore:', err);
    return { id: 'temp_' + Date.now(), ...bookData };
  }
}

/**
 * LIBRARIES
 */
export async function fetchLibraries() {
  if (!isFirebaseConfigured) {
    return localStorageService.getLibraries();
  }

  try {
    const snap = await getDocs(collection(db, LIBRARIES_COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // If empty in Firestore, return default sample library
    if (list.length === 0) {
      const sample = {
        id: 'lib_default',
        name: 'Školní knihovna',
        google_sheet_url: '',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, LIBRARIES_COL, 'lib_default'), sample);
      return [sample];
    }
    return list;
  } catch (err) {
    console.error('Chyba při načítání knihoven z Firestore:', err);
    return localStorageService.getLibraries();
  }
}

export async function saveLibrary({ name, google_sheet_url, ownerId }) {
  if (!isFirebaseConfigured) {
    return localStorageService.saveLibrary({ name, google_sheet_url });
  }

  const cleanName = (name || '').trim();
  if (!cleanName) throw new Error('Název knihovny je povinný');

  try {
    const q = query(collection(db, LIBRARIES_COL), where('name', '==', cleanName));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const existing = snap.docs[0];
      if (google_sheet_url !== undefined) {
        await updateDoc(doc(db, LIBRARIES_COL, existing.id), {
          google_sheet_url: google_sheet_url.trim()
        });
      }
      return { id: existing.id, ...existing.data(), google_sheet_url };
    }

    const newLib = {
      name: cleanName,
      google_sheet_url: (google_sheet_url || '').trim(),
      ownerId: ownerId || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, LIBRARIES_COL), newLib);
    return { id: docRef.id, ...newLib };
  } catch (err) {
    console.error('Chyba při ukládání knihovny do Firestore:', err);
    return localStorageService.saveLibrary({ name, google_sheet_url });
  }
}

/**
 * LIBRARY EXEMPLARS
 */
export async function fetchLibraryExemplars(libraryId) {
  if (!libraryId) return [];

  if (!isFirebaseConfigured) {
    return localStorageService.getBooks(libraryId);
  }

  try {
    const q = query(
      collection(db, EXEMPLARS_COL),
      where('ownerId', '==', String(libraryId)),
      where('ownerType', '==', 'library')
    );
    const snap = await getDocs(q);

    // Join with book title details
    const exemplars = [];
    for (const docSnap of snap.docs) {
      const exData = docSnap.data();
      let bookTitle = {};
      if (exData.bookId) {
        const bSnap = await getDoc(doc(db, BOOKS_COL, exData.bookId));
        if (bSnap.exists()) bookTitle = bSnap.data();
      }

      exemplars.push({
        id: docSnap.id,
        ...exData,
        // Flat book metadata for UI components
        title: bookTitle.title || exData.title || 'Neznámý název',
        author: bookTitle.author || exData.author || '',
        isbn: bookTitle.isbn || exData.isbn || '',
        genre: bookTitle.genre || exData.genre || '',
        year: bookTitle.year || exData.year || '',
        target_age: bookTitle.target_age || exData.target_age || 'Všechny věkové kategorie',
        language: bookTitle.language || exData.language || 'Čeština',
        coverUrl: exData.coverUrl || bookTitle.coverUrl || ''
      });
    }

    return exemplars;
  } catch (err) {
    console.error('Chyba při načítání exemplářů knihovny z Firestore:', err);
    return localStorageService.getBooks(libraryId);
  }
}

export async function saveLibraryExemplar(libraryId, formData) {
  if (!formData.title || !formData.title.trim()) {
    throw new Error('Název knihy je povinný');
  }

  if (!isFirebaseConfigured) {
    return localStorageService.saveBook(libraryId, formData);
  }

  try {
    // 1. Get or create title
    const bookTitle = await getOrCreateBookTitle(formData);

    // 2. Create exemplar document
    const exemplarData = {
      bookId: bookTitle.id,
      ownerType: 'library',
      ownerId: String(libraryId),
      ownerName: formData.libraryName || 'Knihovna',
      status: formData.status || 'Dostupná',
      notes: formData.notes || '',
      coverUrl: formData.coverUrl || bookTitle.coverUrl || '',
      scanned_at: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, EXEMPLARS_COL), exemplarData);

    return {
      id: docRef.id,
      ...exemplarData,
      title: bookTitle.title,
      author: bookTitle.author,
      isbn: bookTitle.isbn,
      genre: bookTitle.genre,
      year: bookTitle.year,
      target_age: bookTitle.target_age,
      language: bookTitle.language
    };
  } catch (err) {
    console.error('Chyba při ukládání exempláře knihovny:', err);
    return localStorageService.saveBook(libraryId, formData);
  }
}

/**
 * VINTED / USER LENDING EXEMPLARS
 */
export async function fetchVintedExemplars(filters = {}) {
  if (!isFirebaseConfigured) {
    // Fallback demo vinted list from localStorage
    const localBooks = localStorageService.getBooks('vinted_demo');
    return localBooks.map((b) => ({
      ...b,
      ownerType: 'user',
      ownerName: b.ownerName || 'Jan Novák',
      ownerEmail: b.ownerEmail || 'jan.novak@example.cz',
      ownerLocation: b.ownerLocation || 'Ostrava-Poruba',
      isForLend: true,
      lendingTerms: b.lendingTerms || 'Půjčím na 1 měsíczdarma, předání v Ostravě.'
    }));
  }

  try {
    const q = query(
      collection(db, EXEMPLARS_COL),
      where('ownerType', '==', 'user'),
      where('isForLend', '==', true)
    );
    const snap = await getDocs(q);

    const results = [];
    for (const docSnap of snap.docs) {
      const exData = docSnap.data();
      let bookTitle = {};
      if (exData.bookId) {
        try {
          const bSnap = await getDoc(doc(db, BOOKS_COL, exData.bookId));
          if (bSnap.exists()) bookTitle = bSnap.data();
        } catch (e) {}
      }

      const item = {
        id: docSnap.id,
        ...exData,
        title: bookTitle.title || exData.title || 'Neznámý název',
        author: bookTitle.author || exData.author || '',
        isbn: bookTitle.isbn || exData.isbn || '',
        genre: bookTitle.genre || exData.genre || '',
        year: bookTitle.year || exData.year || '',
        target_age: bookTitle.target_age || exData.target_age || 'Všechny věkové kategorie',
        language: bookTitle.language || exData.language || 'Čeština',
        coverUrl: exData.coverUrl || bookTitle.coverUrl || ''
      };

      // Client-side filtering if needed
      if (filters.location && filters.location !== 'all') {
        const locFilter = filters.location.toLowerCase();
        if (!(item.ownerLocation || '').toLowerCase().includes(locFilter)) {
          continue;
        }
      }

      results.push(item);
    }

    return results;
  } catch (err) {
    console.error('Chyba při načítání Vinted nabídek z Firestore:', err);
    return [];
  }
}

export async function saveVintedExemplar(userProfile, formData) {
  if (!formData.title || !formData.title.trim()) {
    throw new Error('Název knihy je povinný');
  }

  if (!isFirebaseConfigured) {
    return localStorageService.saveBook('vinted_demo', {
      ...formData,
      ownerName: userProfile.displayName,
      ownerEmail: userProfile.email,
      ownerLocation: userProfile.location
    });
  }

  try {
    const bookTitle = await getOrCreateBookTitle(formData);

    const exemplarData = {
      bookId: bookTitle.id,
      ownerType: 'user',
      ownerId: userProfile.uid,
      ownerName: userProfile.displayName || 'Vlastník knihy',
      ownerEmail: userProfile.email || '',
      ownerLocation: userProfile.location || 'Nespecifikováno',
      status: formData.status || 'Dostupná k půjčení',
      isForLend: true,
      lendingTerms: formData.lendingTerms || '',
      notes: formData.notes || '',
      coverUrl: formData.coverUrl || bookTitle.coverUrl || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, EXEMPLARS_COL), exemplarData);

    return {
      id: docRef.id,
      ...exemplarData,
      title: bookTitle.title,
      author: bookTitle.author,
      isbn: bookTitle.isbn,
      genre: bookTitle.genre,
      year: bookTitle.year
    };
  } catch (err) {
    console.error('Chyba při ukládání Vinted nabídky:', err);
    throw err;
  }
}

export async function updateExemplarStatus(exemplarId, newStatus) {
  if (!isFirebaseConfigured) {
    return localStorageService.updateBook(exemplarId, { status: newStatus });
  }

  try {
    const docRef = doc(db, EXEMPLARS_COL, exemplarId);
    await updateDoc(docRef, { status: newStatus });
    return true;
  } catch (err) {
    console.error('Chyba při aktualizaci stavu exempláře:', err);
    return localStorageService.updateBook(exemplarId, { status: newStatus });
  }
}

export async function updateExemplarDetails(exemplarId, formData) {
  if (!isFirebaseConfigured) {
    return localStorageService.updateBook(exemplarId, formData);
  }

  try {
    const docRef = doc(db, EXEMPLARS_COL, exemplarId);
    const updates = {
      status: formData.status,
      lendingTerms: formData.lendingTerms !== undefined ? formData.lendingTerms : undefined,
      notes: formData.notes !== undefined ? formData.notes : undefined,
      coverUrl: formData.coverUrl !== undefined ? formData.coverUrl : undefined
    };

    // Remove undefined fields
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    await updateDoc(docRef, updates);
    return true;
  } catch (err) {
    console.error('Chyba při aktualizaci informací o exempláři:', err);
    return localStorageService.updateBook(exemplarId, formData);
  }
}

export async function deleteExemplar(exemplarId) {
  if (!isFirebaseConfigured) {
    return localStorageService.deleteBook(exemplarId);
  }

  try {
    await deleteDoc(doc(db, EXEMPLARS_COL, exemplarId));
    return true;
  } catch (err) {
    console.error('Chyba při mazání exempláře z Firestore:', err);
    return localStorageService.deleteBook(exemplarId);
  }
}
