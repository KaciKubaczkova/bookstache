import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Barcode, Search, AlertCircle, Loader2, Edit3, ArrowLeft } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { lookupBookByIsbnOrTitle } from '../services/bookLookup';

export default function ScannerModal({ isOpen, onClose, onBookFound }) {
  // Mode hierarchy:
  // viewMode: 'camera' | 'choose_manual' | 'input_isbn' | 'input_title'
  const [viewMode, setViewMode] = useState('camera');
  const [manualIsbn, setManualIsbn] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (isOpen && viewMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, viewMode]);

  // Reset internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('camera');
      setError('');
      setManualIsbn('');
      setTitleQuery('');
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    setTimeout(async () => {
      const element = document.getElementById('qr-reader');
      if (!element) return;

      try {
        if (scannerRef.current) {
          await stopCamera();
        }

        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.5,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            console.log('Naskenovaný kód:', decodedText);
            stopCamera();
            handleLookup(decodedText);
          },
          () => {
            // Ignore scan errors per frame
          }
        );
        isScanningRef.current = true;
      } catch (err) {
        console.error('Kamera selhala:', err);
        setCameraError(
          'Nepodařilo se přistoupit ke kameře. Můžete zadat ISBN kód nebo název knihy ručně.'
        );
      }
    }, 100);
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        isScanningRef.current = false;
      } catch (e) {
        console.error('Chyba při zastavení kamery:', e);
      }
    }
  };

  const handleLookup = async (query) => {
    if (!query || !query.trim()) return;
    setLoading(true);
    setError('');

    try {
      const bookData = await lookupBookByIsbnOrTitle(query.trim());
      onBookFound(bookData);
    } catch (err) {
      setError(err.message || 'Kniha nebyla nalezena. Můžete zadat údaje ručně.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#f7f3ed] border-2 border-[#8b2626]/30 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d7ccc8]">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#8b2626] text-white rounded-xl">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#3a2212]">
                Skenovat nebo vyhledat knihu
              </h2>
              <p className="text-xs text-[#5c3a21]">
                {viewMode === 'camera' && 'Naskenujte čárový kód fotoaparátem'}
                {viewMode === 'choose_manual' && 'Vyberte způsob ručního zadání'}
                {viewMode === 'input_isbn' && 'Zadejte ISBN kód knihy'}
                {viewMode === 'input_title' && 'Zadejte název knihy'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 hover:bg-[#efe6d5] text-[#5c3a21] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-amber-100 border border-amber-300 text-amber-900 text-xs p-3 rounded-xl mt-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Main Body Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* CAMERA MODE */}
          {viewMode === 'camera' && (
            <div className="space-y-4 text-center">
              <div
                id="qr-reader"
                className="w-full bg-black rounded-xl overflow-hidden min-h-[220px] flex items-center justify-center relative border-2 border-[#8b2626]"
              ></div>

              {cameraError ? (
                <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs">
                  {cameraError}
                </div>
              ) : (
                <p className="text-xs text-[#5c3a21] italic">
                  Naměřte fotoaparát na čárový kód nebo ISBN číslo knihy...
                </p>
              )}

              {/* Main "Zadat ručně" action button under camera */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    stopCamera();
                    setViewMode('choose_manual');
                  }}
                  className="w-full py-3 px-4 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] font-bold text-sm rounded-xl border border-[#a1887f] shadow-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#8b2626]" />
                  <span>Zadat ručně</span>
                </button>
              </div>
            </div>
          )}

          {/* CHOOSE MANUAL OPTION MODE */}
          {viewMode === 'choose_manual' && (
            <div className="space-y-4 py-2">
              <p className="text-xs font-semibold text-[#5c3a21] text-center mb-2">
                Jak si přejete knihu vyhledat?
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setViewMode('input_isbn')}
                  className="p-4 bg-[#efe6d5] hover:bg-[#e8ddc8] border border-[#a1887f] rounded-xl flex items-center space-x-3 transition-colors cursor-pointer text-left group"
                >
                  <div className="p-2.5 bg-[#8b2626] text-white rounded-lg shrink-0">
                    <Barcode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#3a2212] group-hover:text-[#8b2626] transition-colors">
                      Zadat ISBN kód
                    </h3>
                    <p className="text-xs text-[#5c3a21] mt-0.5">
                      Vyhledání podle čísla ISBN ze zadní obálky
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setViewMode('input_title')}
                  className="p-4 bg-[#efe6d5] hover:bg-[#e8ddc8] border border-[#a1887f] rounded-xl flex items-center space-x-3 transition-colors cursor-pointer text-left group"
                >
                  <div className="p-2.5 bg-[#8b2626] text-white rounded-lg shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#3a2212] group-hover:text-[#8b2626] transition-colors">
                      Zadat název knihy
                    </h3>
                    <p className="text-xs text-[#5c3a21] mt-0.5">
                      Vyhledání podle názvu nebo autora knihy
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-3 border-t border-[#d7ccc8] flex justify-between items-center">
                <button
                  onClick={() => setViewMode('camera')}
                  className="text-xs font-bold text-[#5c3a21] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Zpět na kameru</span>
                </button>
              </div>
            </div>
          )}

          {/* INPUT ISBN MODE */}
          {viewMode === 'input_isbn' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(manualIsbn);
              }}
              className="space-y-4 py-1"
            >
              <div>
                <label className="block text-xs font-bold text-[#5c3a21] mb-1">
                  ISBN kód knihy
                </label>
                <input
                  type="text"
                  value={manualIsbn}
                  onChange={(e) => setManualIsbn(e.target.value)}
                  placeholder="např. 9788000000001 nebo 8020400000"
                  className="w-full p-3 text-sm bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                  autoFocus
                />
                <p className="text-[11px] text-[#7d5d42] mt-1">
                  ISBN číslo naleznete na zadní straně obálky knihy nebo na úvodních stránkách.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !manualIsbn.trim()}
                className="w-full py-3 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vyhledávám v katalozích...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Vyhledat podle ISBN</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex justify-between items-center border-t border-[#d7ccc8]">
                <button
                  type="button"
                  onClick={() => setViewMode('choose_manual')}
                  className="text-xs font-bold text-[#5c3a21] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Zpět na výběr zadání</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('camera')}
                  className="text-xs font-bold text-[#8b2626] hover:underline cursor-pointer"
                >
                  Naskenovat kamerou
                </button>
              </div>
            </form>
          )}

          {/* INPUT TITLE MODE */}
          {viewMode === 'input_title' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(titleQuery);
              }}
              className="space-y-4 py-1"
            >
              <div>
                <label className="block text-xs font-bold text-[#5c3a21] mb-1">
                  Název nebo autor knihy
                </label>
                <input
                  type="text"
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                  placeholder="např. Babička Božena Němcová"
                  className="w-full p-3 text-sm bg-[#efe6d5] border border-[#a1887f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                  autoFocus
                />
                <p className="text-[11px] text-[#7d5d42] mt-1">
                  Pro knihy bez čárového kódu zadejte název nebo autora. Získáme obecné informace o knize z katalogů.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !titleQuery.trim()}
                className="w-full py-3 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vyhledávám informace...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Vyhledat podle názvu</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex justify-between items-center border-t border-[#d7ccc8]">
                <button
                  type="button"
                  onClick={() => setViewMode('choose_manual')}
                  className="text-xs font-bold text-[#5c3a21] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Zpět na výběr zadání</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('camera')}
                  className="text-xs font-bold text-[#8b2626] hover:underline cursor-pointer"
                >
                  Naskenovat kamerou
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Option to open blank form manually */}
        <div className="border-t border-[#d7ccc8] pt-3 mt-1 text-center">
          <button
            onClick={() => {
              stopCamera();
              onBookFound({
                isbn: manualIsbn || '',
                title: titleQuery || '',
                author: '',
                year: '',
                genre: '',
                language: 'Čeština'
              });
            }}
            className="text-xs text-[#8b2626] font-bold hover:underline cursor-pointer"
          >
            + Nebo zadat všechny informace o knize ručně od začátku
          </button>
        </div>
      </div>
    </div>
  );
}
