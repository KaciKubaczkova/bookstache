// Client-side book lookup using Google Books API & Open Library API

function mapLanguageCode(lang) {
  if (!lang) return '';
  const raw = String(lang).toLowerCase().trim().replace('/languages/', '');
  const code = raw.split(/[-_]/)[0];
  const languages = {
    eng: 'Angličtina', en: 'Angličtina',
    cze: 'Čeština', ces: 'Čeština', cs: 'Čeština',
    slk: 'Slovenština', slo: 'Slovenština', sk: 'Slovenština',
    ger: 'Němčina', deu: 'Němčina', de: 'Němčina',
    fre: 'Francouzština', fra: 'Francouzština', fr: 'Francouzština',
    ita: 'Italština', it: 'Italština',
    pol: 'Polština', pl: 'Polština',
    rus: 'Ruština', ru: 'Ruština',
    spa: 'Španělština', es: 'Španělština',
    dut: 'Nizozemština', nld: 'Nizozemština', nl: 'Nizozemština',
    por: 'Portugalština', pt: 'Portugalština',
    hun: 'Maďarština', hu: 'Maďarština',
    rum: 'Rumunština', ron: 'Rumunština', ro: 'Rumunština',
    ukr: 'Ukrajinština', uk: 'Ukrajinština',
    jpn: 'Japonština', ja: 'Japonština',
    chi: 'Čínština', zho: 'Čínština', zh: 'Čínština',
    kor: 'Korejština', ko: 'Korejština',
    ara: 'Arabština', ar: 'Arabština',
    gre: 'Řečtina', ell: 'Řečtina', el: 'Řečtina',
    heb: 'Hebrejština', he: 'Hebrejština',
    hrv: 'Chorvatština', hr: 'Chorvatština',
    srp: 'Srbština', sr: 'Srbština',
    slv: 'Slovinština',
    bul: 'Bulharština', bg: 'Bulharština',
    swe: 'Švédština', sv: 'Švédština',
    dan: 'Dánština', da: 'Dánština',
    nor: 'Norština', no: 'Norština',
    fin: 'Finština', fi: 'Finština',
    tur: 'Turečtina', tr: 'Turečtina',
    cat: 'Katalánština', ca: 'Katalánština',
    tha: 'Thajština', th: 'Thajština',
    vie: 'Vietnamština', vi: 'Vietnamština',
    ind: 'Indonéština', id: 'Indonéština'
  };

  if (languages[raw]) return languages[raw];
  if (languages[code]) return languages[code];

  const aliases = [
    [/english|angličtina/, 'Angličtina'],
    [/czech|čeština/, 'Čeština'],
    [/slovak|slovenština/, 'Slovenština'],
    [/german|němčina/, 'Němčina'],
    [/french|francouzština/, 'Francouzština'],
    [/italian|italština/, 'Italština'],
    [/polish|polština/, 'Polština'],
    [/russian|ruština/, 'Ruština'],
    [/spanish|španělština/, 'Španělština'],
    [/dutch|nizozemština/, 'Nizozemština'],
    [/portuguese|portugalština/, 'Portugalština'],
    [/hungarian|maďarština/, 'Maďarština'],
    [/romanian|rumunština/, 'Rumunština'],
    [/ukrainian|ukrajinština/, 'Ukrajinština'],
    [/japanese|japonština/, 'Japonština'],
    [/chinese|čínština/, 'Čínština'],
    [/korean|korejština/, 'Korejština'],
    [/arabic|arabština/, 'Arabština'],
    [/greek|řečtina/, 'Řečtina'],
    [/hebrew|hebrejština/, 'Hebrejština']
  ];
  const match = aliases.find(([pattern]) => pattern.test(raw));
  return match ? match[1] : '';
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

  return bookInfo;
}
