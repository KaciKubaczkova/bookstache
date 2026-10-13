import React, { useState } from 'react';
import { X, Search, FileSpreadsheet, Download, Printer, Table as TableIcon, Filter } from 'lucide-react';

export default function TableModal({
  isOpen,
  onClose,
  library,
  books = [],
  onExportExcel,
  onExportCsv
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');

  if (!isOpen) return null;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredBooks = books
    .filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      return (
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.isbn || '').toLowerCase().includes(q) ||
        (b.genre || '').toLowerCase().includes(q) ||
        (b.target_age || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'year') {
        valA = parseInt(valA, 10) || 0;
        valB = parseInt(valB, 10) || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('cs-CZ');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-6xl bg-[#efe6d5] border-2 border-[#d7ccc8] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:bg-white">
        {/* Modal Header */}
        <div className="p-4 bg-[#8b2626] text-white rounded-t-2xl flex items-center justify-between shrink-0 print:bg-white print:text-black print:border-b print:border-gray-300">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl print:hidden">
              <TableIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold">
                Tabulka knih: {library?.name || 'Knihovna'}
              </h2>
              <p className="text-xs text-white/80 print:text-gray-600">
                Přehled knihovního fondu ({filteredBooks.length} z {books.length} knih)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Zavřít tabulku"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Action controls & Search bar */}
        <div className="p-3 bg-[#e8ddc8] border-b border-[#d7ccc8] flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#5c3a21] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hledat v tabulce podle názvu, autora, ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#f7f3ed] text-[#3a2212] text-xs font-medium rounded-xl border border-[#a1887f] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-[#8b2626]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#f7f3ed] text-[#3a2212] text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#a1887f] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              >
                <option value="all">Všechny stavy</option>
                <option value="Dostupná">Dostupné</option>
                <option value="Půjčená">Půjčené</option>
              </select>
            </div>
          </div>

          {/* Download & Print Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 bg-[#8b2626] hover:bg-[#701e1e] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title="Stáhnout jako soubor Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Stáhnout Excel (.xlsx)</span>
            </button>

            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 bg-[#f7f3ed] hover:bg-[#e8ddc8] text-[#3a2212] border border-[#a1887f] text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Stáhnout v CSV formátu"
            >
              <Download className="w-4 h-4 text-[#8b2626]" />
              <span>Stáhnout CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#5c3a21] hover:bg-[#3a2212] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Vytisknout tabulku"
            >
              <Printer className="w-4 h-4" />
              <span>Tisk</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-4 print:p-0 print:overflow-visible">
          {filteredBooks.length === 0 ? (
            <div className="text-center py-12 text-[#5c3a21]">
              <TableIcon className="w-12 h-12 text-[#a1887f] mx-auto mb-2 opacity-50" />
              <p className="font-serif font-bold text-base text-[#3a2212]">
                V tabulce nebyly nalezeny žádné odpovídající knihy
              </p>
              <p className="text-xs text-[#5c3a21] mt-1">
                Zkuste změnit vyhledávací dotaz nebo vybraný filtr.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#d7ccc8] bg-white shadow-xs print:border-gray-300">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#efe6d5] text-[#3a2212] font-bold border-b border-[#d7ccc8] print:bg-gray-100 print:text-black">
                    <th
                      onClick={() => handleSort('id')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors whitespace-nowrap"
                    >
                      ID {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      onClick={() => handleSort('isbn')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors whitespace-nowrap"
                    >
                      ISBN {sortField === 'isbn' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      onClick={() => handleSort('title')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors min-w-[200px]"
                    >
                      Název knihy {sortField === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      onClick={() => handleSort('author')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors min-w-[150px]"
                    >
                      Autor {sortField === 'author' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      onClick={() => handleSort('year')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors whitespace-nowrap"
                    >
                      Rok {sortField === 'year' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      onClick={() => handleSort('genre')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors whitespace-nowrap"
                    >
                      Žánr {sortField === 'genre' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      onClick={() => handleSort('target_age')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors whitespace-nowrap"
                    >
                      Věková skupina {sortField === 'target_age' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      onClick={() => handleSort('language')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors whitespace-nowrap"
                    >
                      Jazyk {sortField === 'language' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="p-3 cursor-pointer hover:bg-[#e8ddc8] transition-colors whitespace-nowrap"
                    >
                      Stav {sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th className="p-3 whitespace-nowrap">Datum přidaní</th>
                    <th className="p-3 min-w-[150px]">Poznámky</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e8dc] text-[#3a2212] print:divide-gray-200">
                  {filteredBooks.map((book, index) => (
                    <tr
                      key={book.id || index}
                      className="hover:bg-[#fcfaf7] transition-colors odd:bg-[#faf6f0] print:odd:bg-gray-50"
                    >
                      <td className="p-3 font-mono text-[11px] font-semibold text-[#8b2626] whitespace-nowrap">
                        {book.id || '—'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        {book.isbn || '—'}
                      </td>
                      <td className="p-3 font-bold text-[#3a2212]">
                        {book.title || 'Bez názvu'}
                      </td>
                      <td className="p-3 text-[#5c3a21]">
                        {book.author || '—'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {book.year || '—'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {book.genre ? (
                          <span className="px-2 py-0.5 bg-[#efe6d5] text-[#5c3a21] rounded-full font-medium text-[11px]">
                            {book.genre}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-600">
                        {book.target_age || '—'}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-600">
                        {book.language || 'Čeština'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider inline-block ${
                            book.status === 'Půjčená'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {book.status || 'Dostupná'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {formatDate(book.scanned_at || book.createdAt)}
                      </td>
                      <td className="p-3 text-gray-600 text-[11px] italic">
                        {book.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#e8ddc8] rounded-b-2xl border-t border-[#d7ccc8] flex items-center justify-between text-xs text-[#5c3a21] shrink-0 print:hidden">
          <span>Celkem zobrazeno: <strong>{filteredBooks.length}</strong> položek</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3a2212] hover:bg-[#20130a] text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Zavřít tabulku
          </button>
        </div>
      </div>
    </div>
  );
}
