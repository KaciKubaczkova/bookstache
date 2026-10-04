import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Filter, BookPlus, Mail, Edit3, Trash2, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchVintedExemplars,
  saveVintedExemplar,
  updateExemplarStatus,
  updateExemplarDetails,
  deleteExemplar
} from '../services/firestoreService';
import VintedContactModal from './VintedContactModal';
import VintedBookFormModal from './VintedBookFormModal';

export default function VintedView({ onOpenAuthModal, onOpenScanner, searchQuery, setSearchQuery }) {
  const { currentUser, userProfile } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Dostupná k půjčení' | 'Rezervovaná' | 'Půjčená'
  const [locationFilter, setLocationFilter] = useState('all');
  const [showOnlyMyOffers, setShowOnlyMyOffers] = useState(false);

  // Modals
  const [selectedItemForContact, setSelectedItemForContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadVintedListings();
  }, []);

  const loadVintedListings = async () => {
    setLoading(true);
    try {
      const data = await fetchVintedExemplars();
      setItems(data);
    } catch (err) {
      console.error('Chyba při načítání Knižního Vintedu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOffer = async (formData) => {
    if (!userProfile) {
      onOpenAuthModal();
      return;
    }

    try {
      if (editingItem) {
        await updateExemplarDetails(editingItem.id, formData);
      } else {
        await saveVintedExemplar(userProfile, formData);
      }
      setShowFormModal(false);
      setEditingItem(null);
      loadVintedListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (item) => {
    // Only owner can change status
    if (currentUser?.uid !== item.ownerId) {
      alert('Stav nabídky může měnit pouze její vlastník.');
      return;
    }

    const nextStatusMap = {
      'Dostupná k půjčení': 'Rezervovaná',
      'Rezervovaná': 'Půjčená',
      'Půjčená': 'Nedostupná',
      'Nedostupná': 'Dostupná k půjčení'
    };

    const nextStatus = nextStatusMap[item.status] || 'Dostupná k půjčení';
    try {
      await updateExemplarStatus(item.id, nextStatus);
      loadVintedListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Opravdu chcete tuto nabídku smazat z Knižního Vintedu?')) return;
    try {
      await deleteExemplar(itemId);
      loadVintedListings();
    } catch (err) {
      console.error(err);
    }
  };

  // Available unique locations for filter
  const availableLocations = Array.from(
    new Set(items.map((i) => i.ownerLocation).filter(Boolean))
  ).sort();

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (showOnlyMyOffers && item.ownerId !== currentUser?.uid) return false;

    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    if (locationFilter !== 'all' && item.ownerLocation !== locationFilter) return false;

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchAuthor = (item.author || '').toLowerCase().includes(q);
      const matchIsbn = (item.isbn || '').toLowerCase().includes(q);
      const matchGenre = (item.genre || '').toLowerCase().includes(q);
      const matchLoc = (item.ownerLocation || '').toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchIsbn || matchGenre || matchLoc;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#efe6d5] border-2 border-[#8b2626]/20 rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8b2626]/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8b2626] uppercase tracking-wider bg-[#8b2626]/10 px-3 py-1 rounded-full mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Sousedská výpůjčka knih
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#3a2212]">
              Knižní Vinted – Nabídky v okolí
            </h2>
            <p className="text-xs text-[#5c3a21] max-w-xl">
              Půjčujte si knihy s lidmi ve vašem sousedství. Nabídněte knihy, které máte doma na poličce, nebo vyhledejte vysněný titul u sousedů!
            </p>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuthModal();
              } else {
                setEditingItem(null);
                setShowFormModal(true);
              }
            }}
            className="px-5 py-3 bg-[#8b2626] hover:bg-[#701e1e] active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Nabídnout knihu k půjčení</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#efe6d5] p-3.5 rounded-2xl border border-[#d7ccc8] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#5c3a21]">
          <Filter className="w-4 h-4 text-[#8b2626]" />
          <span>Filtry:</span>

          <button
            onClick={() => {
              setStatusFilter('all');
              setShowOnlyMyOffers(false);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' && !showOnlyMyOffers
                ? 'bg-[#8b2626] text-white font-bold'
                : 'bg-[#f7f3ed] text-[#3a2212] hover:bg-[#e8ddc8]'
            }`}
          >
            Všechny nabídky ({items.length})
          </button>

          <button
            onClick={() => {
              setStatusFilter('Dostupná k půjčení');
              setShowOnlyMyOffers(false);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'Dostupná k půjčení' && !showOnlyMyOffers
                ? 'bg-[#8b2626] text-white font-bold'
                : 'bg-[#f7f3ed] text-[#3a2212] hover:bg-[#e8ddc8]'
            }`}
          >
            Jen dostupné
          </button>

          {currentUser && (
            <button
              onClick={() => setShowOnlyMyOffers(!showOnlyMyOffers)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                showOnlyMyOffers
                  ? 'bg-[#5c3a21] text-white font-bold'
                  : 'bg-[#f7f3ed] text-[#3a2212] hover:bg-[#e8ddc8]'
              }`}
            >
              Moje nabídky ({items.filter((i) => i.ownerId === currentUser.uid).length})
            </button>
          )}
        </div>

        {/* Location selector */}
        {availableLocations.length > 0 && (
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-4 h-4 text-[#8b2626]" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-[#f7f3ed] border border-[#a1887f] text-[#3a2212] text-xs font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
            >
              <option value="all">Všechny lokality</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of Vinted Offers */}
      {loading ? (
        <div className="text-center py-16 text-[#5c3a21]">
          <div className="animate-spin w-8 h-8 border-4 border-[#8b2626] border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm font-semibold">Načítání sousedských nabídek...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#efe6d5] rounded-3xl border-2 border-dashed border-[#a1887f] p-8 max-w-md mx-auto">
          <div className="p-4 bg-[#8b2626]/10 text-[#8b2626] rounded-2xl inline-block mb-3">
            <BookPlus className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#3a2212] mb-1">
            Zatím nebyly nalezeny žádné nabídky
          </h3>
          <p className="text-xs text-[#5c3a21] mb-4">
            Buďte první ve své lokalitě a nabídněte knihu ze své knihovničky k půjčení!
          </p>
          <button
            onClick={() => {
              if (!currentUser) onOpenAuthModal();
              else {
                setEditingItem(null);
                setShowFormModal(true);
              }
            }}
            className="px-5 py-2.5 bg-[#8b2626] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer hover:bg-[#701e1e] transition-colors"
          >
            Přidat první knihu k půjčení
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isOwner = currentUser && currentUser.uid === item.ownerId;
            const isAvailable = item.status === 'Dostupná k půjčení' || item.status === 'Dostupná';

            return (
              <div
                key={item.id}
                className="bg-[#efe6d5] border border-[#d7ccc8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Status & Location badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.status === 'Rezervovaná'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {item.status || 'Dostupná k půjčení'}
                    </span>

                    <span className="text-[11px] font-semibold text-[#5c3a21] flex items-center space-x-1 truncate">
                      <MapPin className="w-3 h-3 text-[#8b2626] shrink-0" />
                      <span className="truncate">{item.ownerLocation || 'Ostrava'}</span>
                    </span>
                  </div>

                  {/* Book Card Details */}
                  <div className="flex gap-3 mb-3">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-16 h-22 object-cover rounded-xl shadow-xs shrink-0 border border-[#d7ccc8]"
                      />
                    ) : (
                      <div className="w-16 h-22 bg-[#f7f3ed] border border-[#d7ccc8] rounded-xl flex items-center justify-center shrink-0">
                        <BookPlus className="w-6 h-6 text-[#8b2626]/40" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-sm text-[#3a2212] line-clamp-2 mb-0.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#5c3a21] italic line-clamp-1">
                        {item.author || 'Neznámý autor'}
                      </p>

                      {item.genre && (
                        <span className="inline-block mt-1 text-[10px] bg-[#f7f3ed] text-[#3a2212] px-2 py-0.5 rounded-md border border-[#d7ccc8]">
                          {item.genre}
                        </span>
                      )}

                      <p className="text-[11px] text-[#3a2212] mt-2 line-clamp-1 font-medium">
                        Vlastník: <span className="font-bold">{item.ownerName || 'Čtenář'}</span>
                      </p>
                    </div>
                  </div>

                  {item.lendingTerms && (
                    <p className="text-[11px] text-[#5c3a21] bg-[#f7f3ed] p-2 rounded-xl border border-[#d7ccc8] mb-3 line-clamp-2">
                      <strong className="text-[#8b2626]">Podmínky:</strong> {item.lendingTerms}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#d7ccc8] flex items-center justify-between gap-2">
                  {isOwner ? (
                    <div className="w-full flex items-center justify-between gap-2">
                      {/* Owner controls */}
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="text-[11px] font-bold px-2.5 py-1.5 bg-[#f7f3ed] hover:bg-[#e8ddc8] text-[#3a2212] border border-[#a1887f] rounded-lg transition-colors cursor-pointer"
                        title="Kliknutím změníte stav"
                      >
                        Změnit stav
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowFormModal(true);
                          }}
                          className="p-1.5 bg-[#f7f3ed] hover:bg-[#e8ddc8] text-[#3a2212] rounded-lg border border-[#a1887f] transition-colors cursor-pointer"
                          title="Upravit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 bg-[#f7f3ed] hover:bg-red-100 text-red-700 rounded-lg border border-red-300 transition-colors cursor-pointer"
                          title="Smazat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedItemForContact(item);
                        setShowContactModal(true);
                      }}
                      className="w-full py-2 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Chci si půjčit' : 'Kontaktovat vlastníka'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <VintedContactModal
        item={selectedItemForContact}
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      <VintedBookFormModal
        isOpen={showFormModal}
        initialData={editingItem}
        userProfile={userProfile}
        onClose={() => {
          setShowFormModal(false);
          setEditingItem(null);
        }}
        onSave={handleSaveOffer}
        onOpenScanner={onOpenScanner}
      />
    </div>
  );
}
