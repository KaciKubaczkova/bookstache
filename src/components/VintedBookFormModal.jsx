import React, { useState, useEffect } from 'react';
import { X, Book, Scan, Search, Upload, Image } from 'lucide-react';
import { lookupBookByIsbnOrTitle } from '../services/bookLookup';
import { uploadBookCoverImage } from '../services/storageService';

export default function VintedBookFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
  userProfile,
  onOpenScanner
}) {
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [targetAge, setTargetAge] = useState('Všechny věkové kategorie');
  const [language, setLanguage] = useState('Čeština');
  const [status, setStatus] = useState('Dostupná k půjčení');
  const [lendingTerms, setLendingTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);

  const [loadingLookup, setLoadingLookup] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setIsbn(initialData.isbn || '');
      setTitle(initialData.title || '');
      setAuthor(initialData.author || '');
      setGenre(initialData.genre || '');
      setYear(initialData.year || '');
      setTargetAge(initialData.target_age || 'Všechny věkové kategorie');
      setLanguage(initialData.language || 'Čeština');
      setStatus(initialData.status || 'Dostupná k půjčení');
      setLendingTerms(initialData.lendingTerms || '');
      setNotes(initialData.notes || '');
      setCoverUrl(initialData.coverUrl || '');
      setCoverFile(null);
    } else {
      setIsbn('');
      setTitle('');
      setAuthor('');
      setGenre('');
      setYear('');
      setTargetAge('Všechny věkové kategorie');
      setLanguage('Čeština');
      setStatus('Dostupná k půjčení');
      setLendingTerms('Půjčím na 1 měsíc zdarma, osobní předání.');
      setNotes('');
      setCoverUrl('');
      setCoverFile(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleLookup = async () => {
    if (!isbn.trim()) return;
    setLoadingLookup(true);
    setLookupError('');
    try {
      const data = await lookupBookByIsbnOrTitle(isbn.trim());
      if (data) {
        if (data.title) setTitle(data.title);
        if (data.author) setAuthor(data.author);
        if (data.genre) setGenre(data.genre);
        if (data.year) setYear(data.year);
        if (data.coverUrl) setCoverUrl(data.coverUrl);
      } else {
        setLookupError('Kniha nebyla v online databázích nalezena. Vyplňte údaje ručně.');
      }
    } catch (e) {
      setLookupError('Chyba při vyhledávání knihy.');
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadBookCoverImage(file);
      if (uploadedUrl) {
        setCoverUrl(uploadedUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      let finalCoverUrl = coverUrl.trim();
      if (coverFile && !finalCoverUrl) {
        finalCoverUrl = await uploadBookCoverImage(coverFile);
      }

      await onSave({
        isbn: isbn.trim(),
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim(),
        year: year.trim(),
        target_age: targetAge,
        language,
        status,
        lendingTerms: lendingTerms.trim(),
        notes: notes.trim(),
        coverUrl: finalCoverUrl
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#f7f3ed] border-2 border-[#8b2626]/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5c3a21] hover:text-[#8b2626] p-1 rounded-full hover:bg-[#efe6d5] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 bg-[#8b2626]/10 text-[#8b2626] rounded-2xl">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#3a2212]">
              {initialData ? 'Upravit nabídku knihy' : 'Nabídnout knihu k půjčení'}
            </h2>
            <p className="text-xs text-[#5c3a21]">
              Knižní Vinted • Lokalita: <span className="font-semibold text-[#8b2626]">{userProfile?.location || 'Ostrava-Poruba'}</span>
            </p>
          </div>
        </div>

        {/* ISBN & Scanner lookup bar */}
        <div className="mb-5 bg-[#efe6d5] p-3.5 rounded-2xl border border-[#d7ccc8] space-y-2">
          <label className="block text-xs font-bold text-[#3a2212]">
            Rychlé načtení podle ISBN čárového kódu
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="Naskenujte nebo zadejte ISBN"
              className="flex-1 px-3 py-2 bg-[#f7f3ed] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
            />
            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="px-3 py-2 bg-[#5c3a21] hover:bg-[#3a2212] text-white text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer transition-colors"
                title="Otevřít fotoaparát"
              >
                <Scan className="w-4 h-4" />
                <span className="hidden sm:inline">Skenovat</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLookup}
              disabled={loadingLookup || !isbn.trim()}
              className="px-3 py-2 bg-[#8b2626] hover:bg-[#701e1e] text-white text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>Načíst</span>
            </button>
          </div>
          {lookupError && <p className="text-[11px] text-red-700">{lookupError}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#3a2212] mb-1">
              Název knihy <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Např. Harry Potter a Kámen mudrců"
              className="w-full px-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3a2212] mb-1">Autor</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Např. J. K. Rowling"
                className="w-full px-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3a2212] mb-1">Žánr</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Např. Fantasy, Detektivka..."
                className="w-full px-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3a2212] mb-1">Stav nabídky</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626] font-semibold"
              >
                <option value="Dostupná k půjčení">Dostupná k půjčení</option>
                <option value="Rezervovaná">Rezervovaná</option>
                <option value="Půjčená">Půjčená</option>
                <option value="Nedostupná">Nedostupná</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3a2212] mb-1">Rok vydání</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Např. 2000"
                className="w-full px-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3a2212] mb-1">
              Podmínky výpůjčky & místo předání
            </label>
            <textarea
              rows="2"
              value={lendingTerms}
              onChange={(e) => setLendingTerms(e.target.value)}
              placeholder="Např. Půjčím na 1 měsíc, osobní předání v Ostravě u VŠB..."
              className="w-full px-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
            ></textarea>
          </div>

          {/* Cover upload / URL */}
          <div>
            <label className="block text-xs font-bold text-[#3a2212] mb-1">
              Obálka / Fotka knihy (Nahrát soubor nebo vložit URL)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <label className="flex-1 px-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] cursor-pointer hover:bg-[#e8ddc8] transition-colors flex items-center justify-center space-x-2">
                <Upload className="w-4 h-4 text-[#8b2626]" />
                <span>{uploadingImage ? 'Nahrávám obrázek...' : coverFile ? coverFile.name : 'Vybrat fotku z zařízení'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="Nebo vložte URL obrázku (https://...)"
              className="w-full px-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
            />
          </div>

          <div className="pt-3 border-t border-[#d7ccc8] flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] font-semibold text-xs rounded-xl border border-[#a1887f] transition-colors cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Ukládám...' : initialData ? 'Uložit změny' : 'Zveřejnit nabídku'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
