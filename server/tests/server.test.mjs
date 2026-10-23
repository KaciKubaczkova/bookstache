import test from 'node:test';
import assert from 'node:assert';

process.env.DATABASE_PATH = ':memory:';

const { default: app } = await import('../index.mjs');

test('Server integration tests', async (t) => {
  let server;
  let baseUrl;

  t.before(() => {
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  t.after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  let libraryId;

  await t.test('POST /api/libraries creates a new library', async () => {
    const res = await fetch(`${baseUrl}/api/libraries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Městská Knihovna', google_sheet_url: 'https://docs.google.com/spreadsheets/d/test' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.name, 'Městská Knihovna');
    assert.ok(data.id);
    libraryId = data.id;
  });

  await t.test('POST /api/libraries/:id/books creates multiple books', async () => {
    const book1 = await fetch(`${baseUrl}/api/libraries/${libraryId}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isbn: '9788000000001',
        title: 'Babička',
        author: 'Božena Němcová',
        year: '1855',
        genre: 'Klasika',
        language: 'Čeština',
        status: 'Dostupná'
      })
    });
    assert.strictEqual(book1.status, 201);

    const book2 = await fetch(`${baseUrl}/api/libraries/${libraryId}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isbn: '9788020400002',
        title: 'Malý princ',
        author: 'Antoine de Saint-Exupéry',
        year: '1943',
        genre: 'Pohádka',
        language: 'Čeština',
        status: 'Půjčená'
      })
    });
    assert.strictEqual(book2.status, 201);
  });

  await t.test('GET /api/libraries/:id/books filters by status', async () => {
    const availableRes = await fetch(`${baseUrl}/api/libraries/${libraryId}/books?status=Dostupná`);
    assert.strictEqual(availableRes.status, 200);
    const available = await availableRes.json();
    assert.strictEqual(available.length, 1);
    assert.strictEqual(available[0].title, 'Babička');

    const borrowedRes = await fetch(`${baseUrl}/api/libraries/${libraryId}/books?status=Půjčená`);
    assert.strictEqual(borrowedRes.status, 200);
    const borrowed = await borrowedRes.json();
    assert.strictEqual(borrowed.length, 1);
    assert.strictEqual(borrowed[0].title, 'Malý princ');
  });

  await t.test('GET /api/libraries/:id/books filters by search query', async () => {
    const res = await fetch(`${baseUrl}/api/libraries/${libraryId}/books?search=Božena`);
    assert.strictEqual(res.status, 200);
    const books = await res.json();
    assert.strictEqual(books.length, 1);
    assert.strictEqual(books[0].title, 'Babička');
  });

  await t.test('PUT /api/books/:id updates status and details', async () => {
    const booksRes = await fetch(`${baseUrl}/api/libraries/${libraryId}/books`);
    const books = await booksRes.json();
    const bookToUpdate = books.find(b => b.title === 'Babička');

    const res = await fetch(`${baseUrl}/api/books/${bookToUpdate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Půjčená', notes: 'Vypůjčeno čtenářem Janem Novákem' })
    });
    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.status, 'Půjčená');
    assert.strictEqual(updated.notes, 'Vypůjčeno čtenářem Janem Novákem');
  });

  await t.test('GET /api/books/lookup returns book metadata', async () => {
    const res = await fetch(`${baseUrl}/api/books/lookup?query=9788020400002`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.title);
  });

  await t.test('GET /api/libraries/:id/export/csv exports UTF-8 CSV', async () => {
    const res = await fetch(`${baseUrl}/api/libraries/${libraryId}/export/csv`);
    assert.strictEqual(res.status, 200);
    const csv = await res.text();
    assert.ok(csv.includes('Babička'));
    assert.ok(csv.includes('Malý princ'));
  });
});
