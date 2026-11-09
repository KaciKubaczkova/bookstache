import React, { useState } from 'react';
import {
  X,
  Book,
  User,
  Calendar,
  Tag,
  Globe,
  Users,
  CheckCircle2,
  Clock,
  Barcode,
  Trash2,
  Edit3,
  MoreVertical,
  Copy,
  BookOpen
} from 'lucide-react';

export default function BookDetailModal({
  book,
  isOpen,
  onClose,
  role,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate,
  onDifferentEdition
}) {
  const [showMenu, setShowMenu] = useState(false);
  if (!isOpen || !book) return null;

  const isAvailable = book.status === 'Dostupná';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#f7f3ed] border-2 border-[#8b2626]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-visible">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#d7ccc8] mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#8b2626] text-white rounded-xl">
              <Book className="w-6 h-6" />
            </div>
            <div>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1 ${
                  isAvailable
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {isAvailable ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Dostupná v knihovně</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Momentálně půjčená</span>
                  </>
                )}
              </span>
              <h2 className="font-serif font-bold text-xl text-[#3a2212] leading-snug">
                {book.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {role === 'librarian' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-[#efe6d5] text-[#5c3a21] rounded-lg transition-colors cursor-pointer"
                  title="Více možností správy knihy"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-52 bg-[#f7f3ed] border border-[#a1887f] rounded-xl shadow-xl z-30 py-1 text-xs text-[#3a2212] font-semibold"
                    onClick={() => setShowMenu(false)}
                  >
                    <button
                      onClick={() => {
                        onClose();
                        onDuplicate && onDuplicate(book);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#efe6d5] flex items-center space-x-2 text-[#3a2212]"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#8b2626]" />
                      <span>Duplikovat exemplář</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onDifferentEdition && onDifferentEdition(book);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#efe6d5] flex items-center space-x-2 text-[#3a2212]"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#8b2626]" />
                      <span>Přidat jiné vydání</span>
                    </button>

                    <div className="border-t border-[#d7ccc8] my-1"></div>

                    <button
                      onClick={() => {
                        onClose();
                        onEdit && onEdit(book);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#efe6d5] flex items-center space-x-2 text-[#3a2212]"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#5c3a21]" />
                      <span>Upravit knihu</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onDelete && onDelete(book.id);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-700 flex items-center space-x-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Smazat knihu</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#efe6d5] text-[#5c3a21] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-3 text-sm text-[#3a2212] mb-6">
          <div className="flex items-center space-x-2 bg-[#efe6d5] p-2.5 rounded-xl border border-[#d7ccc8]">
            <User className="w-4 h-4 text-[#8b2626] shrink-0" />
            <span className="font-semibold text-xs text-[#5c3a21]">Autor:</span>
            <span className="font-bold">{book.author || 'Neuveden'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2 bg-[#efe6d5] p-2.5 rounded-xl border border-[#d7ccc8]">
              <Calendar className="w-4 h-4 text-[#8b2626] shrink-0" />
              <span className="font-semibold text-xs text-[#5c3a21]">Rok:</span>
              <span className="font-bold">{book.year || 'Neuveden'}</span>
            </div>

            <div className="flex items-center space-x-2 bg-[#efe6d5] p-2.5 rounded-xl border border-[#d7ccc8]">
              <Globe className="w-4 h-4 text-[#8b2626] shrink-0" />
              <span className="font-semibold text-xs text-[#5c3a21]">Jazyk:</span>
              <span className="font-bold">{book.language || 'Čeština'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-[#efe6d5] p-2.5 rounded-xl border border-[#d7ccc8]">
            <Tag className="w-4 h-4 text-[#8b2626] shrink-0" />
            <span className="font-semibold text-xs text-[#5c3a21]">Žánr:</span>
            <span className="font-bold truncate">{book.genre || 'Neuveden'}</span>
          </div>

          {book.isbn && (
            <div className="flex items-center space-x-2 bg-[#efe6d5] p-2.5 rounded-xl border border-[#d7ccc8]">
              <Barcode className="w-4 h-4 text-[#8b2626] shrink-0" />
              <span className="font-semibold text-xs text-[#5c3a21]">ISBN:</span>
              <span className="font-mono font-bold text-xs">{book.isbn}</span>
            </div>
          )}

          {book.notes && (
            <div className="bg-[#efe6d5] p-3 rounded-xl border border-[#d7ccc8] text-xs">
              <span className="font-bold text-[#5c3a21] block mb-1">Poznámky:</span>
              <p className="italic text-[#3a2212]">{book.notes}</p>
            </div>
          )}
        </div>

        {/* Actions for Librarian */}
        {role === 'librarian' ? (
          <div className="pt-3 border-t border-[#d7ccc8] flex flex-col space-y-2">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  onToggleStatus(book);
                  onClose();
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-colors cursor-pointer ${
                  isAvailable ? 'bg-amber-700 hover:bg-amber-800' : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {isAvailable ? 'Označit jako Půjčenou' : 'Označit jako Dostupnou'}
              </button>
            </div>

            <div className="flex space-x-2 pt-1">
              {onDuplicate && (
                <button
                  onClick={() => {
                    onClose();
                    onDuplicate(book);
                  }}
                  className="flex-1 py-2.5 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] border border-[#a1887f] font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#8b2626]" />
                  <span>Duplikovat</span>
                </button>
              )}

              {onDifferentEdition && (
                <button
                  onClick={() => {
                    onClose();
                    onDifferentEdition(book);
                  }}
                  className="flex-1 py-2.5 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] border border-[#a1887f] font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#8b2626]" />
                  <span>Jiné vydání</span>
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(book);
                  }}
                  className="px-3 py-2.5 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] border border-[#a1887f] font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer"
                  title="Upravit"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#5c3a21]" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(book.id);
                    onClose();
                  }}
                  className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer"
                  title="Smazat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold rounded-xl shadow-md text-sm cursor-pointer"
          >
            Zavřít detail
          </button>
        )}
      </div>
    </div>
  );
}
