import React from 'react';
import { Book, User, Calendar, Tag, CheckCircle2, Clock, Trash2, Edit3, Globe, Users } from 'lucide-react';

export default function BookCard({ book, role, onToggleStatus, onClickDetail, onEdit, onDelete }) {
  const isAvailable = book.status === 'Dostupná';

  return (
    <div
      onClick={() => onClickDetail(book)}
      className="bg-[#efe6d5] border border-[#d7ccc8] hover:border-[#8b2626] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Decorative top strip */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isAvailable ? 'bg-emerald-600' : 'bg-amber-600'}`}></div>

      <div>
        {/* Header: Status badge & options */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isAvailable
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {isAvailable ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Dostupná</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-amber-700" />
                <span>Půjčená</span>
              </>
            )}
          </span>

          {book.isbn && (
            <span className="text-[10px] font-mono text-[#7d5d42] bg-[#f7f3ed] px-2 py-0.5 rounded border border-[#d7ccc8]">
              ISBN: {book.isbn}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-base text-[#3a2212] group-hover:text-[#8b2626] transition-colors line-clamp-2 mb-1">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-xs text-[#5c3a21] font-semibold flex items-center space-x-1 mb-3">
          <User className="w-3.5 h-3.5 text-[#8b2626] shrink-0" />
          <span className="truncate">{book.author || 'Neznámý autor'}</span>
        </p>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-1.5 text-[11px] text-[#5c3a21] mb-3">
          {book.year && (
            <span className="bg-[#f7f3ed] px-2 py-0.5 rounded-md border border-[#d7ccc8] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#7d5d42]" />
              {book.year}
            </span>
          )}
          {book.genre && (
            <span className="bg-[#f7f3ed] px-2 py-0.5 rounded-md border border-[#d7ccc8] flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#7d5d42]" />
              {book.genre}
            </span>
          )}
        </div>
      </div>

      {/* Footer / Librarian actions */}
      <div className="pt-3 border-t border-[#d7ccc8] flex items-center justify-between gap-2 mt-auto">
        {role === 'librarian' ? (
          <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleStatus(book)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer ${
                isAvailable
                  ? 'bg-amber-700 hover:bg-amber-800 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isAvailable ? 'Označit jako Půjčenou' : 'Označit jako Dostupnou'}
            </button>

            <div className="flex items-center space-x-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(book)}
                  className="p-1.5 text-[#5c3a21] hover:bg-[#d7ccc8] rounded-lg transition-colors cursor-pointer"
                  title="Upravit informace o knize"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(book.id)}
                  className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                  title="Smazat knihu"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#7d5d42] italic">
            Kliknutím zobrazíte detail
          </div>
        )}
      </div>
    </div>
  );
}
