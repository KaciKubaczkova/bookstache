import React, { useState, useEffect } from 'react';
import RoleSelect from './components/RoleSelect';
import LibrarySelectModal from './components/LibrarySelectModal';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ScannerModal from './components/ScannerModal';
import BookFormModal from './components/BookFormModal';
import BookCard from './components/BookCard';
import BookDetailModal from './components/BookDetailModal';
import AuthModal from './components/AuthModal';
import VintedView from './components/VintedView';
import { Scan, BookPlus, Filter, Library } from 'lucide-react';
import {
  fetchLibraryExemplars,
  saveLibraryExemplar,
  updateExemplarStatus,
  updateExemplarDetails,
  deleteExemplar
} from './services/firestoreService';

export default function App() {
  const [role, setRole] = useState(null); // 'librarian' | 'reader' | null
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'vinted'

  const [currentLibrary, setCurrentLibrary] = useState(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showBookFormModal, setShowBookFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [scannedBookData, setScannedBookData] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState(null);

  const [books, setBooks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'Dostupná' | 'Půjčená'
  const [selectedGenreFilter, setSelectedGenreFilter] = useState('all');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'title' | 'author' | 'year'
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Fetch books when current library changes
  useEffect(() => {
    if (currentLibrary) {
      fetchBooks();
    }
  }, [currentLibrary]);

  const fetchBooks = async () => {
    if (!currentLibrary) return;
    setLoadingBooks(true);
    try {
      const data = await fetchLibraryExemplars(currentLibrary.id);
      setBooks(data);
    } catch (err) {
      console.error('Chyba při načítání knih:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setShowLibraryModal(true);
  };

  const handleSelectLibrary = (library) => {
    setCurrentLibrary(library);
    setShowLibraryModal(false);
  };

  const handleBookFoundFromScanner = (bookData) => {
    setScannedBookData(bookData);
    setEditingBook(null);
    setShowScannerModal(false);
    setShowBookFormModal(true);
  };

  const handleEditBookClick = (book) => {
    setEditingBook(book);
    setScannedBookData(book);
    setShowBookFormModal(true);
  };

  const handleSaveBook = async (formData) => {
    if (!currentLibrary) return;
    try {
      if (editingBook) {
        await updateExemplarDetails(editingBook.id, formData);
      } else {
        await saveLibraryExemplar(currentLibrary.id, {
          ...formData,
          libraryName: currentLibrary.name
        });
      }

      setShowBookFormModal(false);
      setScannedBookData(null);
      setEditingBook(null);
      fetchBooks();
    } catch (err) {
      throw err;
    }
  };

  const handleToggleStatus = async (book) => {
    const newStatus = book.status === 'Dostupná' ? 'Půjčená' : 'Dostupná';
    try {
      await updateExemplarStatus(book.id, newStatus);
      fetchBooks();
    } catch (err) {
      console.error('Chyba při změně stavu knihy:', err);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Opravdu chcete tuto knihu smazat z knihovny?')) return;
    try {
      await deleteExemplar(bookId);
      fetchBooks();
    } catch (err) {
      console.error('Chyba při mazání knihy:', err);
    }
  };

  // Unique genres & age groups present in current library
  const availableGenres = Array.from(
    new Set(books.map((b) => b.genre).filter(Boolean))
  ).sort();

  const availableAgeGroups = Array.from(
    new Set(books.map((b) => b.target_age).filter(Boolean))
  ).sort();

  // Filtered and sorted books list calculation
  const filteredBooks = books
    .filter((b) => {
      if (activeFilter === 'Dostupná' && b.status !== 'Dostupná') return false;
      if (activeFilter === 'Půjčená' && b.status !== 'Půjčená') return false;

      if (selectedGenreFilter !== 'all' && b.genre !== selectedGenreFilter) {
        return false;
      }

      if (selectedAgeFilter !== 'all' && b.target_age !== selectedAgeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (b.title || '').toLowerCase().includes(q);
        const matchAuthor = (b.author || '').toLowerCase().includes(q);
        const matchIsbn = (b.isbn || '').toLowerCase().includes(q);
        const matchGenre = (b.genre || '').toLowerCase().includes(q);
        return matchTitle || matchAuthor || matchIsbn || matchGenre;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'author') {
        return (a.author || '').localeCompare(b.author || '');
      }
      if (sortBy === 'year') {
        return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
      }
      return (b.id || '').toString().localeCompare((a.id || '').toString());
    });

  const availableCount = books.filter((b) => b.status === 'Dostupná').length;
  const borrowedCount = books.filter((b) => b.status === 'Půjčená').length;

  // 1. Initial Role selection step
  if (!role) {
    return <RoleSelect onSelectRole={handleSelectRole} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenSidebar={() => setShowSidebar(true)}
        currentLibrary={currentLibrary}
        onOpenLibraryModal={() => setShowLibraryModal(true)}
        role={role}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'vinted' ? (
          <VintedView
            onOpenAuthModal={() => setShowAuthModal(true)}
            onOpenScanner={() => setShowScannerModal(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        ) : (
          <>
            {/* Librarian Header & Big Scan Button */}
            {role === 'librarian' && (
              <div className="bg-[#efe6d5] border-2 border-[#8b2626]/20 rounded-3xl p-6 shadow-md text-center relative overflow-hidden my-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8b2626]/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>

                <div className="max-w-md mx-auto">
                  <span className="inline-block text-xs font-bold text-[#8b2626] uppercase tracking-wider bg-[#8b2626]/10 px-3 py-1 rounded-full mb-3">
                    Rychlé skenování knih do knihovny
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#3a2212] mb-1">
                    Přidat novou knihu
                  </h2>
                  <p className="text-xs text-[#5c3a21] mb-6">
                    Naskenujte čárový kód čtečkou/fotoaparátem nebo zadejte kód ISBN
                  </p>

                  <button
                    onClick={() => setShowScannerModal(true)}
                    className="w-full max-w-xs mx-auto py-4 px-6 bg-[#8b2626] hover:bg-[#701e1e] active:scale-95 text-white font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center space-x-3 transition-all cursor-pointer group"
                  >
                    <Scan className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span>Naskenovat</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reader Header Banner */}
            {role === 'reader' && (
              <div className="bg-[#efe6d5] border border-[#d7ccc8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#3a2212]">
                    Katalog knihovny: {currentLibrary?.name || 'Vyberte knihovnu'}
                  </h2>
                  <p className="text-xs text-[#5c3a21] mt-0.5">
                    Prohlížejte si knižní fond a aktuální dostupnost výpůjček
                  </p>
                </div>

                <button
                  onClick={() => setShowLibraryModal(true)}
                  className="px-4 py-2 bg-[#5c3a21] hover:bg-[#3a2212] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Library className="w-4 h-4" />
                  <span>Vybrat jinou knihovnu</span>
                </button>
              </div>
            )}

            {/* Active Filter Bar & Sorting */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-[#efe6d5] p-3.5 rounded-2xl border border-[#d7ccc8]">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#5c3a21]">
                <Filter className="w-4 h-4 text-[#8b2626]" />
                <span>Filtry:</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-[#8b2626] text-white font-bold'
                        : 'bg-[#f7f3ed] text-[#3a2212] hover:bg-[#e8ddc8]'
                    }`}
                  >
                    Vše ({books.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('Dostupná')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFilter === 'Dostupná'
                        ? 'bg-[#8b2626] text-white font-bold'
                        : 'bg-[#f7f3ed] text-[#3a2212] hover:bg-[#e8ddc8]'
                    }`}
                  >
                    Dostupné ({availableCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter('Půjčená')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFilter === 'Půjčená'
                        ? 'bg-[#8b2626] text-white font-bold'
                        : 'bg-[#f7f3ed] text-[#3a2212] hover:bg-[#e8ddc8]'
                    }`}
                  >
                    Půjčené ({borrowedCount})
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {availableGenres.length > 0 && (
                  <select
                    value={selectedGenreFilter}
                    onChange={(e) => setSelectedGenreFilter(e.target.value)}
                    className="bg-[#f7f3ed] border border-[#a1887f] text-[#3a2212] text-xs font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                  >
                    <option value="all">Všechny žánry</option>
                    {availableGenres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                )}

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#f7f3ed] border border-[#a1887f] text-[#3a2212] text-xs font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                >
                  <option value="newest">Nejnovější</option>
                  <option value="title">Název A-Z</option>
                  <option value="author">Autor A-Z</option>
                  <option value="year">Rok vydání</option>
                </select>
              </div>
            </div>

            {/* Books Grid */}
            {loadingBooks ? (
              <div className="text-center py-16 text-[#5c3a21]">
                <div className="animate-spin w-8 h-8 border-4 border-[#8b2626] border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-sm font-semibold">Načítání knih v knihovně...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-16 bg-[#efe6d5] rounded-3xl border-2 border-dashed border-[#a1887f] p-8 max-w-md mx-auto">
                <div className="p-4 bg-[#8b2626]/10 text-[#8b2626] rounded-2xl inline-block mb-3">
                  <BookPlus className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#3a2212] mb-1">
                  Zatím nebyly nalezeny žádné knihy
                </h3>
                <p className="text-xs text-[#5c3a21] mb-4">
                  {searchQuery
                    ? 'Pro zadaný vyhledávací dotaz nebyly nalezeny žádné výsledky.'
                    : 'V této knihovně zatím nejsou naskenované žádné knihy.'}
                </p>

                {role === 'librarian' && (
                  <button
                    onClick={() => setShowScannerModal(true)}
                    className="px-5 py-2.5 bg-[#8b2626] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer hover:bg-[#701e1e] transition-colors"
                  >
                    Naskenovat první knihu
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    role={role}
                    onToggleStatus={handleToggleStatus}
                    onClickDetail={(b) => {
                      setSelectedBookForDetail(b);
                      setShowDetailModal(true);
                    }}
                    onEdit={role === 'librarian' ? handleEditBookClick : null}
                    onDelete={role === 'librarian' ? handleDeleteBook : null}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showLibraryModal && (
        <LibrarySelectModal
          role={role}
          currentLibrary={currentLibrary}
          onSelectLibrary={handleSelectLibrary}
        />
      )}

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        selectedGenreFilter={selectedGenreFilter}
        onSelectGenreFilter={setSelectedGenreFilter}
        selectedAgeFilter={selectedAgeFilter}
        onSelectAgeFilter={setSelectedAgeFilter}
        sortBy={sortBy}
        onSelectSortBy={setSortBy}
        availableGenres={availableGenres}
        availableAgeGroups={availableAgeGroups}
        currentLibrary={currentLibrary}
        role={role}
        onChangeLibraryClick={() => setShowLibraryModal(true)}
        onChangeRoleClick={() => {
          setRole(null);
          setCurrentLibrary(null);
        }}
        totalCount={books.length}
        availableCount={availableCount}
        borrowedCount={borrowedCount}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      <ScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onBookFound={handleBookFoundFromScanner}
      />

      <BookFormModal
        isOpen={showBookFormModal}
        initialData={scannedBookData}
        onClose={() => setShowBookFormModal(false)}
        onSave={handleSaveBook}
        libraryName={currentLibrary?.name || ''}
      />

      <BookDetailModal
        book={selectedBookForDetail}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        role={role}
        onToggleStatus={handleToggleStatus}
        onEdit={role === 'librarian' ? handleEditBookClick : null}
        onDelete={role === 'librarian' ? handleDeleteBook : null}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
