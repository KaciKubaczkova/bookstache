import React, { useState, useEffect } from 'react';
import { X, BookPlus, Save, Calendar, User, Book } from 'lucide-react';

export default function BookFormModal({ isOpen, initialData, onClose, onSave, libraryName }) {
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    year: '',
    publisher: '',
    status: 'Dostupná',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        isbn: initialData.isbn || '',
        title: initialData.title || '',
        author: initialData.author || '',
        year: initialData.year || '',
        publisher: initialData.publisher || '',
        status: initialData.status || 'Dostupná',
        notes: initialData.notes || ''
      });

    } else {
      setFormData({
        isbn: '',
        title: '',
        author: '',
        year: '',
        publisher: '',
        status: 'Dostupná',
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Název knihy je povinný');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        title: formData.title.trim(),
        publisher: formData.publisher.trim()
      });
    } catch (err) {
      setError(err.message || 'Chyba při ukládání knihy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-dialog-overlay fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="app-dialog-panel bg-[#f7f3ed] border-2 border-[#8b2626]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d7ccc8] mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-[#8b2626] text-white rounded-xl">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#3a2212]">
                Potvrdit nebo upravit údaje o knize
              </h2>
              <p className="text-xs text-[#5c3a21]">
                Knihovna: <span className="font-semibold text-[#8b2626]">{libraryName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#efe6d5] text-[#5c3a21] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 text-xs p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-[#3a2212]">
          {/* Název knihy */}
          <div>
            <label className="block text-[#5c3a21] mb-1 font-bold flex items-center space-x-1">
              <Book className="w-3.5 h-3.5 text-[#8b2626]" />
              <span>Název knihy *</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 text-sm bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              required
            />
          </div>

          {/* Autor */}
          <div>
            <label className="block text-[#5c3a21] mb-1 font-bold flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-[#8b2626]" />
              <span>Autor</span>
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Jméno a příjmení autora"
              className="w-full p-2.5 text-sm bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
            />
          </div>

          <div className="book-form-grid grid grid-cols-2 gap-3">
            {/* Rok vydání */}
            <div>
              <label className="block text-[#5c3a21] mb-1 font-bold flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#8b2626]" />
                <span>Rok vydání</span>
              </label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="např. 2021"
                className="w-full p-2.5 text-sm bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              />
            </div>
          </div>

          <div className="book-form-grid grid grid-cols-2 gap-3">
            {/* Nakladatelství */}
          <div>
            <label className="block text-[#5c3a21] mb-1 font-bold">Nakladatelství</label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              placeholder="Např. Piatkus Books"
              className="w-full p-2.5 text-sm bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
            />
          </div>

          {/* ISBN */}
            <div>
              <label className="block text-[#5c3a21] mb-1 font-bold">
                ISBN číslo
              </label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="ISBN kód"
                className="w-full p-2.5 text-sm bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              />
            </div>

            {/* Stav výpůjčky */}
            <div>
              <label className="block text-[#5c3a21] mb-1 font-bold">
                Počáteční stav
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 text-sm bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              >
                <option value="Dostupná">Dostupná (v knihovně)</option>
                <option value="Půjčená">Půjčená (nedostupná)</option>
              </select>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-[#d7ccc8] flex space-x-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#8b2626] hover:bg-[#701e1e] text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Ukládám...' : 'Uložit knihu do knihovny'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-[#d7ccc8] hover:bg-[#c8b7b2] text-[#3a2212] font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Zrušit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
