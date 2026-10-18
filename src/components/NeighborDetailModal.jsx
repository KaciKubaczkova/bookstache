import React from 'react';
import { X, Book, Mail, MapPin, UserCheck, Phone } from 'lucide-react';

export default function NeighborDetailModal({ neighbor, books, isOpen, onClose, onContactClick }) {
  if (!isOpen || !neighbor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#f7f3ed] border-2 border-[#d7ccc8] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-[#efe6d5] p-5 border-b border-[#d7ccc8] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#8b2626] text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs">
              {(neighbor.name || 'S')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#3a2212]">
                {neighbor.name || 'Soused čtenář'}
              </h3>
              <p className="text-xs text-[#5c3a21] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8b2626]" />
                <span>{neighbor.location || 'Česká republika'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#5c3a21] hover:bg-[#e8ddc8] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-3 bg-[#efe6d5] p-3.5 rounded-2xl border border-[#d7ccc8] text-center">
            <div>
              <div className="text-xl font-bold text-[#8b2626]">{books.length}</div>
              <div className="text-[11px] font-semibold text-[#5c3a21]">Nabízených knih</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#5c3a21]">
                {books.filter((b) => b.status === 'Dostupná k půjčení' || b.status === 'Dostupná').length}
              </div>
              <div className="text-[11px] font-semibold text-[#5c3a21]">Ihneď k půjčení</div>
            </div>
          </div>

          {/* Contact info or CTA */}
          <div className="bg-[#efe6d5] p-4 rounded-2xl border border-[#d7ccc8] space-y-2">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#3a2212] flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-[#8b2626]" />
              <span>Možnosti předání & Kontakt</span>
            </h4>
            <p className="text-xs text-[#5c3a21]">
              Knihy od tohoto souseda si můžete domluvit osobně v lokalitě <strong>{neighbor.location || 'jeho okolí'}</strong>.
            </p>
          </div>

          {/* List of neighbor's books */}
          <div>
            <h4 className="font-serif font-bold text-sm text-[#3a2212] mb-3 flex items-center justify-between">
              <span>Knihy od souseda ({books.length})</span>
            </h4>

            {books.length === 0 ? (
              <p className="text-xs text-[#5c3a21] italic text-center py-4">
                Tento soused zatím nemá aktivní veřejné nabídky.
              </p>
            ) : (
              <div className="space-y-3">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className="bg-white border border-[#d7ccc8] p-3 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded-lg shrink-0 border border-[#d7ccc8]"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-[#f7f3ed] border border-[#d7ccc8] rounded-lg flex items-center justify-center shrink-0">
                          <Book className="w-4 h-4 text-[#8b2626]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h5 className="font-serif font-bold text-xs text-[#3a2212] truncate">
                          {book.title}
                        </h5>
                        <p className="text-[11px] text-[#5c3a21] italic truncate">
                          {book.author || 'Neznámý autor'}
                        </p>
                        <span
                          className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            book.status === 'Dostupná k půjčení' || book.status === 'Dostupná'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {book.status || 'Dostupná'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onContactClick(book)}
                      className="px-3 py-1.5 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold text-[11px] rounded-xl shadow-xs shrink-0 flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Půjčit</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
