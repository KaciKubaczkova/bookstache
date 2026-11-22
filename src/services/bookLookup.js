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


export function extractLanguageValue(value) {
  if (!value) return '';
  if (Array.isArray(value)) {
    for (const entry of value) {
      const language = extractLanguageValue(entry);
      if (language) return language;
    }
    return '';
  }
  if (typeof value === 'object') {
    return mapLanguageCode(value.code || value.lang || value.key || value.name || value.value || '');
  }
  return mapLanguageCode(value);
}

function getGoogleBookLanguage(items, isbn) {
  if (!Array.isArray(items) || !items.length) return '';
  const normalizedIsbn = String(isbn || '').replace(/[^0-9X]/gi, '').toUpperCase();
  const exactItem = normalizedIsbn
    ? items.find(({ volumeInfo = {} }) =>
        (volumeInfo.industryIdentifiers || []).some(({ identifier }) =>
          String(identifier || '').replace(/[^0-9X]/gi, '').toUpperCase() === normalizedIsbn
        )
      )
    : items[0];
  return extractLanguageValue(exactItem?.volumeInfo?.language);
}


export function firstNonEmpty(values) {
  if (!Array.isArray(values)) return values ?? null;
  return values.find((value) => {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }) ?? null;
}

function normalizeIsbn(value) {
  return String(value || '').replace(/[^0-9X]/gi, '').toUpperCase();
}

function recordHasExactIsbn(record, isbn) {
  const target = normalizeIsbn(isbn);
  if (!target) return false;
  const candidates = [
    record?.isbn, record?.isbn13, record?.isbn10, record?.isbnNumber,
    record?.ean, record?.identifiers?.isbn, record?.identifiers?.ISBN,
    record?.isbns, record?.ISBN
  ];
  const flatten = (value) => Array.isArray(value) ? value.flatMap(flatten)
    : value && typeof value === 'object' ? Object.values(value).flatMap(flatten)
    : value == null ? [] : [value];
  return flatten(candidates).some((value) => normalizeIsbn(value) === target);
}

export function normalizeGenres(values) {
  // VuFind/Knihovny.cz returns subjects as nested arrays; Google Books and
  // Open Library use flat arrays. Normalize both shapes before matching.
  const flattenLabels = (value) => {
    if (value == null) return [];
    if (Array.isArray(value)) return value.flatMap(flattenLabels);
    if (typeof value === 'string' || typeof value === 'number') return [String(value)];
    if (typeof value === 'object') {
      return ['name', 'value', 'label', 'heading', 'term', 'topic']
        .flatMap((key) => value[key] == null ? [] : flattenLabels(value[key]));
    }
    return [];
  };
  const audienceOnly = /^(young adult|ya|new adult|adult|teen|teenage|adolescent)(\s+(fiction|books?|literature))?$/i;
  const text = flattenLabels(values)
    .filter(Boolean)
    .filter((label) => !audienceOnly.test(label.trim()))
    .join(' | ')
    .toLowerCase();
  const genres = [];
  const add = (label) => { if (!genres.includes(label)) genres.push(label); };
  // BIC subject codes and English catalogue labels are both common in publisher metadata.
  if (/\bfrd\b|adult.{0,30}romance|romance|romantick|román pro ženy|love stor/.test(text)) add('Romantika');
  if (/fantasy|fantastick|\bfm\b/.test(text)) add('Fantasy');
  if (/science fiction|\bsci[- ]?fi\b|\bfld\b/.test(text)) add('Sci-fi');
  if (/thriller|suspense|napětí/.test(text)) add('Thriller');
  if (/mystery|detective|krimi|detektiv/.test(text)) add('Detektivka');
  if (/horror|horor/.test(text)) add('Horor');
  if (/historical|historick/.test(text)) add('Historický román');
  if (/contemporary|modern.{0,20}romance|současn/.test(text)) add('Současný román');
  // Young Adult / New Adult / Adult describe the intended readership,
  // not the book's genre, so they are intentionally not added here.
  if (/fiction|beletrie|literatura/.test(text) && !genres.length) add('Beletrie');
  return genres.slice(0, 4).join(', ');
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
    publisher: '',
    notes: ''
  };

  // 1. Try Knihovny.cz API (VuFind API)
  let knihovnyData = null;
  try {
    const qParam = isIsbn ? `lookfor=${isbnClean}&type=ISN` : `lookfor=${encodeURIComponent(cleanQuery)}&type=AllFields`;
    const res = await fetch(`https://www.knihovny.cz/api/v1/search?${qParam}&limit=20`, {
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
    // For ISBN searches, never take language from a different edition.
    // The Knihovny.cz request above uses type=ISN with this exact ISBN.
    // Its VuFind result schema does not always expose ISBN in the fields we can inspect,
    // so requiring a second ISBN-field match incorrectly discards the exact search result.
    const exactKnihovnyRecord = isIsbn
      ? ((knihovnyData.records || []).find((record) => recordHasExactIsbn(record, isbnClean)) || rec)
      : rec;
    if (exactKnihovnyRecord) {
      bookInfo.language = extractLanguageValue(firstNonEmpty([exactKnihovnyRecord.languages, exactKnihovnyRecord.language]));
    }
    const metadataRecord = exactKnihovnyRecord || (!isIsbn ? rec : null);
    bookInfo.publisher = metadataRecord?.publisher || metadataRecord?.publishers?.[0] || metadataRecord?.publisherName || '';
    const record = metadataRecord || rec;
    bookInfo.genre = normalizeGenres(
      firstNonEmpty([
        record.genres, record.genre, record.subjects, record.subjectsExtended,
        record.genre_facet, record.categories
      ]) || []
    );
  }

  // 2. Try Google Books API
  let googleData = null;
  try {
    const qParam = isIsbn ? `isbn:${isbnClean}` : encodeURIComponent(cleanQuery);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${qParam}&maxResults=40`);
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
        const resSearch = await fetch(`https://openlibrary.org/search.json?q=isbn:${isbnClean}&limit=100`);
        if (resSearch.ok) {
          const jsonSearch = await resSearch.json();
          if (jsonSearch.docs && jsonSearch.docs.length > 0) {
            const exactOpenLibraryDoc = jsonSearch.docs.find((doc) =>
              (doc.isbn || []).some((value) =>
                String(value).replace(/[^0-9X]/gi, '').toUpperCase() === isbnClean.toUpperCase()
              )
            );
            openLibraryData = exactOpenLibraryDoc || null;
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
    const matchingLanguage = getGoogleBookLanguage(googleData.items, isIsbn ? isbnClean : '');
    const exactGoogleItem = isIsbn ? googleData.items.find(({ volumeInfo = {} }) =>
      (volumeInfo.industryIdentifiers || []).some(({ identifier }) =>
        String(identifier || '').replace(/[^0-9X]/gi, '').toUpperCase() === isbnClean.toUpperCase()
      )
    ) : null;
    // ISBN lookups must never borrow edition-specific metadata from a merely similar result.
    // If Google Books does not return the exact ISBN, let other exact-ISBN sources fill the gaps.
    const selectedGoogleItem = isIsbn ? exactGoogleItem : googleData.items[0];
    const item = selectedGoogleItem?.volumeInfo;
    if (item && !bookInfo.title) {
      bookInfo.title = item.title || '';
      if (item.subtitle) {
        bookInfo.title += `: ${item.subtitle}`;
      }
    }
    if (item && !bookInfo.author) {
      bookInfo.author = item.authors ? item.authors.join(', ') : '';
    }
    if (item && !bookInfo.year) {
      bookInfo.year = item.publishedDate ? item.publishedDate.substring(0, 4) : '';
    }
    if (item && !bookInfo.genre) {
      bookInfo.genre = normalizeGenres(item.categories || []);
    }

    if (item && !bookInfo.publisher) bookInfo.publisher = item.publisher || '';

    if (!bookInfo.language && matchingLanguage) {
      bookInfo.language = matchingLanguage;
    }

    if (isIsbn && !bookInfo.isbn) {
      bookInfo.isbn = isbnClean;
    } else if (!bookInfo.isbn && item?.industryIdentifiers) {
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
        .map((s) => (typeof s === 'string' ? s : s.name));
      bookInfo.genre = normalizeGenres(subjs);
    }
    if (!bookInfo.publisher && openLibraryData.publishers) {
      bookInfo.publisher = openLibraryData.publishers.map((p) => p.name || p).join(', ');
    }
    if (!bookInfo.language && (openLibraryData.languages || openLibraryData.language)) {
      bookInfo.language = extractLanguageValue(firstNonEmpty([openLibraryData.languages, openLibraryData.language]));
    }
  }

  // Fallback defaults if no title was retrieved from APIs
  if (!bookInfo.title) {
    bookInfo.title = isIsbn ? `Kniha (ISBN: ${isbnClean})` : cleanQuery;
  }

  return bookInfo;
}
