import React from 'react';
import { X, Book, CheckCircle, Clock, Table, Library, ArrowLeftRight, Download, Filter, Sparkles, User, LogIn } from 'lucide-react';
import { exportLibraryCsv } from '../services/storage';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  isOpen,
  onClose,
  activeFilter,
  onSelectFilter,
  selectedGenreFilter,
  onSelectGenreFilter,
  selectedAgeFilter,
  onSelectAgeFilter,
  sortBy,
  onSelectSortBy,
  availableGenres = [],
  availableAgeGroups = [],
  currentLibrary,
  role,
  onChangeLibraryClick,
  onChangeRoleClick,
  totalCount,
  availableCount,
  borrowedCount,
  activeTab,
  onSelectTab,
  onOpenAuthModal
}) {
  const { currentUser, userProfile } = useAuth();

  if (!isOpen) return null;

  const handleExportCsv = () => {
    if (currentLibrary) {
      exportLibraryCsv(currentLibrary);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative w-80 max-w-[80vw] bg-[#efe6d5] h-full shadow-2xl border-r border-[#d7ccc8] flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-[#8b2626] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Book className="w-5 h-5" />
            <h2 className="font-serif font-bold text-lg">Knihovnička</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User profile card */}
        <div className="p-3 bg-[#e8ddc8] border-b border-[#d7ccc8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-[#8b2626]/10 text-[#8b2626] rounded-xl">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#3a2212]">
                  {currentUser ? userProfile?.displayName || 'Přihlášený uživatel' : 'Host'}
                </p>
                <p className="text-[10px] text-[#5c3a21]">
                  {currentUser ? userProfile?.location || 'Ostrava-Poruba' : 'Přihlaste se pro Knižní Vinted'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="px-2.5 py-1 bg-[#8b2626] hover:bg-[#701e1e] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              {currentUser ? 'Účet' : 'Přihlásit'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Katalog vs Vinted) */}
        <div className="p-3 border-b border-[#d7ccc8] bg-[#f7f3ed] flex space-x-2">
          <button
            onClick={() => {
              onSelectTab('library');
              onClose();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'library'
                ? 'bg-[#8b2626] text-white shadow-xs'
                : 'bg-[#efe6d5] text-[#3a2212] hover:bg-[#e8ddc8]'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Katalog</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('vinted');
              onClose();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'vinted'
                ? 'bg-[#8b2626] text-white shadow-xs'
                : 'bg-[#efe6d5] text-[#3a2212] hover:bg-[#e8ddc8]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Knižní Vinted</span>
          </button>
        </div>

        {/* Main Navigation Categories */}
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div>
            <div className="text-xs font-bold text-[#7d5d42] uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Kategorie & Filtry</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('library');
                  onSelectFilter('all');
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  activeFilter === 'all' && activeTab === 'library'
                    ? 'bg-[#8b2626] text-white font-bold'
                    : 'text-[#3a2212] hover:bg-[#e8ddc8]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Book className="w-4 h-4" />
                  <span>Všechny knihy v knihovně</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/10">
                  {totalCount}
                </span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('library');
                  onSelectFilter('Dostupná');
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  activeFilter === 'Dostupná' && activeTab === 'library'
                    ? 'bg-[#8b2626] text-white font-bold'
                    : 'text-[#3a2212] hover:bg-[#e8ddc8]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Dostupné knihy</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/10">
                  {availableCount}
                </span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('library');
                  onSelectFilter('Půjčená');
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  activeFilter === 'Půjčená' && activeTab === 'library'
                    ? 'bg-[#8b2626] text-white font-bold'
                    : 'text-[#3a2212] hover:bg-[#e8ddc8]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Nedostupné (půjčené)</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/10">
                  {borrowedCount}
                </span>
              </button>
            </div>
          </div>

          {/* Genre & Age Filtering */}
          <div className="space-y-3 border-t border-[#d7ccc8] pt-4">
            <div>
              <label className="block text-xs font-bold text-[#7d5d42] uppercase tracking-wider mb-1.5">
                Filtrovat podle žánru
              </label>
              <select
                value={selectedGenreFilter}
                onChange={(e) => onSelectGenreFilter(e.target.value)}
                className="w-full p-2 bg-[#f7f3ed] text-[#3a2212] text-xs font-semibold rounded-xl border border-[#a1887f] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              >
                <option value="all">Všechny žánry</option>
                {availableGenres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7d5d42] uppercase tracking-wider mb-1.5">
                Cílová věková skupina
              </label>
              <select
                value={selectedAgeFilter}
                onChange={(e) => onSelectAgeFilter(e.target.value)}
                className="w-full p-2 bg-[#f7f3ed] text-[#3a2212] text-xs font-semibold rounded-xl border border-[#a1887f] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              >
                <option value="all">Všechny věkové skupiny</option>
                {availableAgeGroups.map((age) => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7d5d42] uppercase tracking-wider mb-1.5">
                Řazení knih
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSelectSortBy(e.target.value)}
                className="w-full p-2 bg-[#f7f3ed] text-[#3a2212] text-xs font-semibold rounded-xl border border-[#a1887f] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              >
                <option value="newest">Nejnověji přidané</option>
                <option value="title">Podle názvu (A-Z)</option>
                <option value="author">Podle autora (A-Z)</option>
                <option value="year">Podle roku vydání (od nejnovějších)</option>
              </select>
            </div>
          </div>

          {/* Export Section */}
          <div className="border-t border-[#d7ccc8] pt-4">
            <div className="text-xs font-bold text-[#7d5d42] uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Table className="w-3.5 h-3.5" />
              <span>Export dat</span>
            </div>

            <button
              onClick={handleExportCsv}
              className="w-full text-left px-3 py-2.5 bg-[#efe6d5] hover:bg-[#e8ddc8] border border-[#a1887f] text-[#3a2212] rounded-xl font-semibold text-sm flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#8b2626]" />
              <span>Stáhnout tabulku (CSV)</span>
            </button>
          </div>
        </div>

        {/* Footer Role Switcher */}
        <div className="p-4 bg-[#e8ddc8] border-t border-[#d7ccc8]">
          <div className="flex items-center justify-between text-xs text-[#5c3a21] mb-2 font-semibold">
            <span>Aktivní režim:</span>
            <span className="px-2 py-0.5 bg-[#8b2626] text-white rounded font-bold">
              {role === 'librarian' ? 'Knihovník' : 'Čtenář'}
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              onChangeRoleClick();
            }}
            className="w-full py-2 px-3 bg-[#f7f3ed] hover:bg-white text-[#3a2212] border border-[#a1887f] rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#8b2626]" />
            <span>Přepnout režim (Knihovník / Čtenář)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
