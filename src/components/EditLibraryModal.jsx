import React, { useState, useEffect } from 'react';
import { X, Settings, Trash2, Save, KeyRound } from 'lucide-react';
import { updateLibraryDetails, deleteLibraryAndExemplars } from '../services/firestoreService';

export default function EditLibraryModal({ isOpen, onClose, currentLibrary, onLibraryUpdated, onLibraryDeleted }) {
  const [name, setName] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentLibrary) {
      setName(currentLibrary.name || '');
      setGoogleSheetUrl(currentLibrary.google_sheet_url || '');
      setPassword(currentLibrary.password || '');
    }
  }, [currentLibrary, isOpen]);

  if (!isOpen || !currentLibrary) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Název knihovny nesmí být prázdný.');
      return;
    }
    if (!password.trim()) {
      setError('Heslo knihovny nesmí být prázdné.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateLibraryDetails(currentLibrary.id, {
        name: name.trim(),
        google_sheet_url: googleSheetUrl.trim(),
        password: password.trim()
      });
      const updated = {
        ...currentLibrary,
        name: name.trim(),
        google_sheet_url: googleSheetUrl.trim(),
        password: password.trim()
      };
      onLibraryUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Chyba při ukládání zmen knihovny.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmMessage = `Opravdu chcete smazat knihovnu "${currentLibrary.name}" a všechny její knihy? Tato akce je nevratná.`;
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    setError('');
    try {
      await deleteLibraryAndExemplars(currentLibrary.id);
      onLibraryDeleted(currentLibrary.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Chyba při mazání knihovny.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#f7f3ed] border-2 border-[#8b2626]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5c3a21] hover:text-[#8b2626] p-1 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 bg-[#8b2626]/10 text-[#8b2626] rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#3a2212]">
              Upravit knihovnu
            </h2>
            <p className="text-xs text-[#5c3a21]">
              Správa nastavení a hesla pro knihovnu
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 text-xs p-3 rounded-xl mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5c3a21] mb-1">
              Název knihovny *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 text-xs bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626] text-[#3a2212]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5c3a21] mb-1">
              Heslo knihovny *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 text-xs bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626] text-[#3a2212]"
              required
            />
            <p className="text-[10px] text-[#7d5d42] mt-1">
              Heslo vyžadované od knihovníků při přihlášení ke knihovně.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5c3a21] mb-1">
              Odkaz na Google Tabulku (Volitelné)
            </label>
            <input
              type="url"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full p-2.5 text-xs bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626] text-[#3a2212]"
            />
          </div>

          <div className="pt-2 flex flex-col space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Uložit změny</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full py-2.5 bg-red-800/10 hover:bg-red-800/20 text-red-900 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-2 border border-red-800/30"
            >
              <Trash2 className="w-4 h-4 text-red-700" />
              <span>Smazat knihovnu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
