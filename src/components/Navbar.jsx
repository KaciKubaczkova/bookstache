import React from 'react';
import { BookMarked, BookOpen, Search, Library, Table, User, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  onOpenSidebar,
  currentLibrary,
  onOpenLibraryModal,
  role,
  searchQuery,
  onSearchChange,
  activeTab, // 'library' | 'vinted'
  onTabChange,
  onOpenAuthModal
}) {
  const { currentUser, userProfile } = useAuth();

  return (
    <header className="bg-[#5c3a21] text-[#efe6d5] sticky top-0 z-30 shadow-md border-b-2 border-[#8b2626]">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Category Menu & App Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 bg-[#8b2626] hover:bg-[#701e1e] text-white rounded-xl transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
            title="Otevřít menu kategorií a filtrů"
          >
            <BookMarked className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#8b2626] text-white rounded-lg hidden sm:flex">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg sm:text-xl text-white tracking-tight leading-none">
                Knihovnička
              </h1>
              {currentLibrary && activeTab === 'library' && (
                <button
                  onClick={onOpenLibraryModal}
                  className="text-[11px] text-[#d7ccc8] hover:text-white flex items-center space-x-1 cursor-pointer mt-0.5"
                >
                  <Library className="w-3 h-3" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px] font-medium">
                    {currentLibrary.name}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center: Main View Tabs */}
        <div className="flex items-center bg-[#422917] p-1 rounded-xl border border-[#a1887f]/30">
          <button
            onClick={() => onTabChange('library')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'library'
                ? 'bg-[#8b2626] text-white shadow-xs'
                : 'text-[#d7ccc8] hover:text-white'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Katalog</span>
          </button>

          <button
            onClick={() => onTabChange('vinted')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'vinted'
                ? 'bg-[#8b2626] text-white shadow-xs'
                : 'text-[#d7ccc8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Knižní Vinted</span>
          </button>
        </div>

        {/* Search input */}
        <div className="flex-1 max-w-xs sm:max-w-xs mx-1 order-3 sm:order-none w-full sm:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#a1887f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Hledat knihu, autora, ISBN..."
              className="w-full bg-[#efe6d5] text-[#3a2212] text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#a1887f] focus:outline-none focus:ring-2 focus:ring-[#8b2626] placeholder-[#8d6e63]"
            />
          </div>
        </div>

        {/* Right Side: Auth / Profile Button */}
        <div className="flex items-center space-x-2">
          {currentLibrary?.google_sheet_url && activeTab === 'library' && (
            <a
              href={currentLibrary.google_sheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-[#2e6f40] hover:bg-[#255a33] text-white rounded-xl text-xs font-bold hidden lg:flex items-center space-x-1 transition-colors cursor-pointer"
              title="Otevřít Google Tabulku"
            >
              <Table className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={onOpenAuthModal}
            className="px-3 py-1.5 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-[#a1887f]"
          >
            {currentUser ? (
              <>
                <User className="w-3.5 h-3.5 text-[#8b2626]" />
                <span className="truncate max-w-[90px]">
                  {userProfile?.displayName || 'Účet'}
                </span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-[#8b2626]" />
                <span>Přihlásit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
