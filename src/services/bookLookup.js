// Client-side book lookup using Google Books API & Open Library API

export async function lookupBookByIsbnOrTitle(query) {
  if (!query || !query.trim()) {
    throw new Error('Zadejte ISBN kód nebo název knihy');
  }

  const cleanQuery = query.trim();
  const isIsbn = /^[0-9xX\-]{9,17}$/.test(cleanQuery.replace(/\s+/g, ''));
  const isbnClean = cleanQuery.replace(/[\s\-]/g, '');

  const bookInfo = {
    isbn: isIsbn ? isbnClean : '',
    title: '',
    author: '',
    year: '',
    genre: '',
    target_age: '',
    language: 'Čeština',
    notes: ''
  };

  // 1. Try Google Books API
  let googleData = null;
  try {
    const qParam = isIsbn ? `isbn:${isbnClean}` : encodeURIComponent(cleanQuery);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${qParam}&maxResults=5`);
    if (res.ok) {
      googleData = await res.json();
    }
  } catch (err) {
    console.warn('Google Books API vypršelo nebo selhalo:', err);
  }

  // 2. Try Open Library API
  let openLibraryData = null;
  try {
    if (isIsbn) {
      // First try bibkeys endpoint
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbnClean}&format=json&jscmd=data`);
      if (res.ok) {
        const json = await res.json();
        openLibraryData = json[`ISBN:${isbnClean}`];
      }

      // If bibkeys had no data, try search endpoint with ISBN
      if (!openLibraryData) {
        const resSearch = await fetch(`https://openlibrary.org/search.json?q=isbn:${isbnClean}&limit=5`);
        if (resSearch.ok) {
          const jsonSearch = await resSearch.json();
          if (jsonSearch.docs && jsonSearch.docs.length > 0) {
            openLibraryData = jsonSearch.docs[0];
          }
        }
      }
    } else {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQuery)}&limit=5`);
      if (res.ok) {
        const json = await res.json();
        if (json.docs && json.docs.length > 0) {
          openLibraryData = json.docs[0];
        }
      }
    }
  } catch (err) {
    console.warn('Open Library API selhalo:', err);
  }

  // Parse Google Books response
  if (googleData && googleData.items && googleData.items.length > 0) {
    const item = googleData.items[0].volumeInfo;
    bookInfo.title = item.title || '';
    if (item.subtitle) {
      bookInfo.title += `: ${item.subtitle}`;
    }
    bookInfo.author = item.authors ? item.authors.join(', ') : '';
    bookInfo.year = item.publishedDate ? item.publishedDate.substring(0, 4) : '';
    bookInfo.genre = item.categories ? item.categories.join(', ') : '';

    if (item.language) {
      if (item.language === 'cs') bookInfo.language = 'Čeština';
      else if (item.language === 'en') bookInfo.language = 'Angličtina';
      else if (item.language === 'sk') bookInfo.language = 'Slovenština';
      else if (item.language === 'de') bookInfo.language = 'Němčina';
      else bookInfo.language = item.language.toUpperCase();
    }

    const desc = ((item.description || '') + ' ' + (bookInfo.genre || '')).toLowerCase();
    if (
      desc.includes('dět') ||
      desc.includes('children') ||
      desc.includes('pro nejmenší') ||
      desc.includes('pohádk')
    ) {
      bookInfo.target_age = 'Děti (0-12 let)';
    } else if (
      desc.includes('mládež') ||
      desc.includes('young adult') ||
      desc.includes('dospívající')
    ) {
      bookInfo.target_age = 'Mládež (12-18 let)';
    } else if (desc.includes('dospěl') || desc.includes('adult')) {
      bookInfo.target_age = 'Dospělí';
    } else {
      bookInfo.target_age = 'Všechny věkové kategorie';
    }

    if (isIsbn && !bookInfo.isbn) {
      bookInfo.isbn = isbnClean;
    } else if (!bookInfo.isbn && item.industryIdentifiers) {
      const isbnObj = item.industryIdentifiers.find(
        (i) => i.type === 'ISBN_13' || i.type === 'ISBN_10'
      );
      if (isbnObj) bookInfo.isbn = isbnObj.identifier;
    }
  }

  // Parse Open Library response
  if (openLibraryData) {
    if (!bookInfo.title) {
      bookInfo.title = openLibraryData.title || '';
    }
    if (!bookInfo.author) {
      if (openLibraryData.authors) {
        bookInfo.author = openLibraryData.authors
          .map((a) => a.name || a)
          .join(', ');
      } else if (openLibraryData.author_name) {
        bookInfo.author = openLibraryData.author_name.join(', ');
      }
    }
    if (!bookInfo.year) {
      if (openLibraryData.publish_date) {
        bookInfo.year = openLibraryData.publish_date.slice(-4);
      } else if (openLibraryData.first_publish_year) {
        bookInfo.year = String(openLibraryData.first_publish_year);
      }
    }
    if (!bookInfo.genre && openLibraryData.subjects) {
      const subjs = openLibraryData.subjects
        .slice(0, 3)
        .map((s) => (typeof s === 'string' ? s : s.name));
      bookInfo.genre = subjs.join(', ');
    }
  }

  // Fallback defaults if no title was retrieved from APIs
  if (!bookInfo.title) {
    bookInfo.title = isIsbn ? `Kniha (ISBN: ${isbnClean})` : cleanQuery;
  }
  if (!bookInfo.target_age) {
    bookInfo.target_age = 'Všechny věkové kategorie';
  }

  return bookInfo;
}
