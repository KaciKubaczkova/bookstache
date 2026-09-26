import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Barcode, Search, AlertCircle, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { lookupBookByIsbnOrTitle } from '../services/bookLookup';

export default function ScannerModal({ isOpen, onClose, onBookFound }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual' | 'title'
  const [manualIsbn, setManualIsbn] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

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
                Použijte fotoaparát, kód ISBN nebo název
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

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 bg-[#efe6d5] p-1 rounded-xl my-4 text-xs font-bold text-[#3a2212]">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-[#8b2626] text-white shadow-xs'
                : 'hover:bg-[#e8ddc8]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#8b2626] text-white shadow-xs'
                : 'hover:bg-[#e8ddc8]'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Kód ISBN</span>
          </button>

          <button
            onClick={() => setActiveTab('title')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'title'
                ? 'bg-[#8b2626] text-white shadow-xs'
                : 'hover:bg-[#e8ddc8]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Starší knihy</span>
          </button>
        </div>

        {error && (
          <div className="bg-amber-100 border border-amber-300 text-amber-900 text-xs p-3 rounded-xl mb-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="space-y-3 text-center">
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
            </div>
          )}

          {/* MANUAL ISBN TAB */}
          {activeTab === 'manual' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(manualIsbn);
              }}
              className="space-y-4 py-2"
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
            </form>
          )}

          {/* TITLE SEARCH TAB (for older books without ISBN barcode) */}
          {activeTab === 'title' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(titleQuery);
              }}
              className="space-y-4 py-2"
            >
              <div>
                <label className="block text-xs font-bold text-[#5c3a21] mb-1">
                  Název nebo autor starší knihy
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
                  Pro starší knihy bez čárového kódu zadejte název nebo autora. Získáme obecné informace o knize z katalogů.
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
            </form>
          )}
        </div>

        {/* Option to open blank form manually */}
        <div className="border-t border-[#d7ccc8] pt-3 mt-3 text-center">
          <button
            onClick={() => {
              stopCamera();
              onBookFound({
                isbn: manualIsbn || '',
                title: titleQuery || '',
                author: '',
                year: '',
                genre: '',
                target_age: 'Všechny věkové kategorie',
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
