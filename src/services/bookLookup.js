// Client-side book lookup using Google Books API & Open Library API

function mapLanguageCode(lang) {
  if (!lang) return '';
  const l = String(lang).toLowerCase().trim();
  if (l.includes('eng') || l === 'en' || l.includes('english') || l.includes('angličtina')) return 'Angličtina';
  if (l.includes('cze') || l.includes('ces') || l === 'cs' || l.includes('czech') || l.includes('čeština')) return 'Čeština';
  if (l.includes('slo') || l.includes('slk') || l === 'sk' || l.includes('slovak') || l.includes('slovenština')) return 'Slovenština';
  if (l.includes('ger') || l.includes('deu') || l === 'de' || l.includes('german') || l.includes('němčina')) return 'Němčina';
  if (l.includes('fre') || l.includes('fra') || l === 'fr' || l.includes('french') || l.includes('francouzština')) return 'Francouzština';
  if (l.includes('ita') || l === 'it' || l.includes('italian') || l.includes('italština')) return 'Italština';
  if (l.includes('pol') || l === 'pl' || l.includes('polish') || l.includes('polština')) return 'Polština';
  if (l.includes('rus') || l === 'ru' || l.includes('russian') || l.includes('ruština')) return 'Ruština';
  if (l.includes('spa') || l === 'es' || l.includes('spanish') || l.includes('španělština')) return 'Španělština';
  return l.toUpperCase();
}

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
    language: '',
    notes: ''
  };

  // 1. Try Knihovny.cz API (VuFind API)
  let knihovnyData = null;
  try {
    const qParam = isIsbn ? `lookfor=${isbnClean}&type=ISN` : `lookfor=${encodeURIComponent(cleanQuery)}&type=AllFields`;
    const res = await fetch(`https://www.knihovny.cz/api/v1/search?${qParam}&limit=5`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      knihovnyData = await res.json();
    }
  } catch (err) {
    console.warn('Knihovny.cz API selhalo nebo vypršelo:', err);
  }

  if (knihovnyData && knihovnyData.records && knihovnyData.records.length > 0) {
    const rec = knihovnyData.records[0];
    bookInfo.title = rec.title || rec.shortTitle || '';
    if (rec.authors) {
      if (rec.authors.primary) {
        bookInfo.author = Object.keys(rec.authors.primary).join(', ');
      } else if (Array.isArray(rec.authors)) {
        bookInfo.author = rec.authors.join(', ');
      }
    }
    if (rec.publishDate && Array.isArray(rec.publishDate) && rec.publishDate.length > 0) {
      bookInfo.year = String(rec.publishDate[0]);
    }
    if (rec.languages && rec.languages.length > 0) {
      bookInfo.language = mapLanguageCode(rec.languages[0]);
    }
    if (rec.genres && Array.isArray(rec.genres) && rec.genres.length > 0) {
      bookInfo.genre = rec.genres.slice(0, 3).join(', ');
    }
  }

  // 2. Try Google Books API
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
    if (!bookInfo.title) {
      bookInfo.title = item.title || '';
      if (item.subtitle) {
        bookInfo.title += `: ${item.subtitle}`;
      }
    }
    if (!bookInfo.author) {
      bookInfo.author = item.authors ? item.authors.join(', ') : '';
    }
    if (!bookInfo.year) {
      bookInfo.year = item.publishedDate ? item.publishedDate.substring(0, 4) : '';
    }
    if (!bookInfo.genre) {
      bookInfo.genre = item.categories ? item.categories.join(', ') : '';
    }

    if (!bookInfo.language && item.language) {
      bookInfo.language = mapLanguageCode(item.language);
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
    if (!bookInfo.language && openLibraryData.languages) {
      const langObj = openLibraryData.languages[0];
      const langStr = typeof langObj === 'string' ? langObj : (langObj.key || langObj.name || '');
      if (langStr) {
        bookInfo.language = mapLanguageCode(langStr.replace('/languages/', ''));
      }
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
