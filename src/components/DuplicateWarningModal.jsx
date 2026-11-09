import React from 'react';
import { AlertTriangle, BookOpen, Copy, Plus, X } from 'lucide-react';

export default function DuplicateWarningModal({ isOpen, existingBook, onConfirm, onCancel }) {
  if (!isOpen || !existingBook) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#f7f3ed] border-2 border-amber-600/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-[#d7ccc8] mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#3a2212]">
                Kniha již v knihovně existuje
              </h2>
              <p className="text-xs text-[#5c3a21]">
                Detekována možná duplicita
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-[#efe6d5] text-[#5c3a21] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-xs space-y-2">
          <p className="text-amber-900 font-semibold">
            Tato kniha (nebo stejné vydání / ISBN) se v této knihovně už nachází:
          </p>
          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 font-sans">
            <p className="font-bold text-[#3a2212] text-sm">{existingBook.title}</p>
            <p className="text-[#5c3a21]">{existingBook.author || 'Neznámý autor'}</p>
            {existingBook.isbn && (
              <p className="text-[11px] font-mono text-gray-600 mt-1">ISBN: {existingBook.isbn}</p>
            )}
            <p className="text-[11px] text-gray-500 mt-0.5">
              Stav: <span className="font-semibold">{existingBook.status || 'Dostupná'}</span>
            </p>
          </div>
          <p className="text-amber-800 text-[11px] italic">
            Možná jste knihu omylem naskenovali dvakrát, nebo si přejete zaevidovat další fyzický kus (exemplář).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#d7ccc8]">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Přesto přidat další kus</span>
          </button>

          <button
            onClick={onCancel}
            className="py-2.5 px-4 bg-[#d7ccc8] hover:bg-[#c8b7b2] text-[#3a2212] font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
          >
            Zrušit (nepřidávat)
          </button>
        </div>
      </div>
    </div>
  );
}
