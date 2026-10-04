import React, { useState, useEffect } from 'react';
import { Library, Plus, ArrowRight, Table, Search, X } from 'lucide-react';
import { fetchLibraries as fetchLibrariesFromFirestore, saveLibrary as saveLibraryToFirestore } from '../services/firestoreService';

export default function LibrarySelectModal({ role, currentLibrary, onSelectLibrary }) {
  const [libraries, setLibraries] = useState([]);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibraries();
  }, []);

  const loadLibraries = async () => {
    setLoading(true);
    try {
      const data = await fetchLibrariesFromFirestore();
      setLibraries(data);
    } catch (err) {
      console.error('Chyba při načítání knihoven:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (lib) => {
    onSelectLibrary(lib);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newLibraryName.trim()) {
      setError('Zadejte název knihovny');
      return;
    }

    try {
      const created = await saveLibraryToFirestore({
        name: newLibraryName.trim(),
        google_sheet_url: googleSheetUrl.trim()
      });
      onSelectLibrary(created);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredLibraries = libraries.filter((lib) =>
    (lib.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#f7f3ed] border-2 border-[#8b2626]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-[#8b2626] text-white rounded-xl">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#3a2212]">
              {role === 'librarian' ? 'Výběr nebo přidání knihovny' : 'Vyberte knihovnu'}
            </h2>
            <p className="text-xs text-[#5c3a21]">
              {role === 'librarian'
                ? 'Zadejte název vaší knihovny nebo vyberte ze seznamu'
                : 'Zvolte knihovnu, jejíž fond chcete prozkoumat'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 text-xs p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Existing Libraries List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-[#5c3a21] uppercase tracking-wider">
              Registrované knihovny ({searchQuery.trim() ? `${filteredLibraries.length} z ${libraries.length}` : libraries.length})
            </label>
          </div>

          {libraries.length > 0 && (
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a1887f]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Vyhledat knihovnu podle názvu..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#f7f3ed] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626] text-[#3a2212] placeholder-[#a1887f]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a1887f] hover:text-[#3a2212] p-0.5 rounded-full cursor-pointer"
                  title="Vymazat hledání"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-6 text-sm text-[#5c3a21]">Načítání knihoven...</div>
          ) : libraries.length === 0 ? (
            <div className="text-center py-6 bg-[#efe6d5] rounded-xl text-sm text-[#5c3a21] border border-dashed border-[#a1887f]">
              Zatím nebyla vytvořena žádná knihovna.
            </div>
          ) : filteredLibraries.length === 0 ? (
            <div className="text-center py-6 bg-[#efe6d5] rounded-xl text-sm text-[#5c3a21] border border-dashed border-[#a1887f]">
              Žádná knihovna neodpovídá vyhledávání „{searchQuery}“.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {filteredLibraries.map((lib) => (
                <button
                  key={lib.id}
                  onClick={() => handleSelect(lib)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                    currentLibrary?.id === lib.id
                      ? 'bg-[#8b2626] text-white border-[#8b2626]'
                      : 'bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] border-[#d7ccc8]'
                  }`}
                >
                  <span className="font-semibold">{lib.name}</span>
                  <div className="flex items-center space-x-2 text-xs">
                    {lib.google_sheet_url && (
                      <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${currentLibrary?.id === lib.id ? 'bg-white/20 text-white' : 'bg-[#5c3a21]/10 text-[#5c3a21]'}`}>
                        <Table className="w-3 h-3" /> Tabulka
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Library section for Librarian or option */}
        {role === 'librarian' && (
          <div className="border-t border-[#d7ccc8] pt-4">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 px-4 bg-[#efe6d5] hover:bg-[#e8ddc8] border border-[#a1887f] text-[#3a2212] font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#8b2626]" />
                <span>Přidat novou knihovnu</span>
              </button>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3 bg-[#efe6d5] p-4 rounded-xl border border-[#d7ccc8]">
                <h3 className="font-bold text-sm text-[#3a2212]">Vytvořit novou knihovnu</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#5c3a21] mb-1">
                    Název knihovny *
                  </label>
                  <input
                    type="text"
                    value={newLibraryName}
                    onChange={(e) => setNewLibraryName(e.target.value)}
                    placeholder="např. Městská knihovna Praha"
                    className="w-full p-2.5 text-sm bg-[#f7f3ed] border border-[#a1887f] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5c3a21] mb-1">
                    Odkaz na Google Tabulku / Webhook (Volitelné)
                  </label>
                  <input
                    type="url"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full p-2.5 text-sm bg-[#f7f3ed] border border-[#a1887f] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                  />
                  <p className="text-[10px] text-[#7d5d42] mt-1">
                    Vložte odkaz na vaši Google Tabulku pro snadný přístup z menu.
                  </p>
                </div>
                <div className="flex space-x-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-[#8b2626] hover:bg-[#701e1e] text-white py-2 rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Vytvořit a vybrat
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-2 bg-[#d7ccc8] text-[#3a2212] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Zrušit
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
