import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Barcode, Search, AlertCircle, Loader2, Edit3, ArrowLeft, Type, RefreshCw, Check } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { lookupBookByIsbnOrTitle } from '../services/bookLookup';
import { extractIsbnFromText } from '../services/isbnParser';
import Tesseract from 'tesseract.js';

export default function ScannerModal({ isOpen, onClose, onBookFound }) {
  // Mode hierarchy:
  // viewMode: 'barcode' | 'ocr' | 'choose_manual' | 'input_isbn' | 'input_title'
  const [viewMode, setViewMode] = useState('barcode');
  const [manualIsbn, setManualIsbn] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');

  // Barcode scanner ref
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  // OCR Camera Video stream & capture refs
  const videoRef = useRef(null);
  const ocrStreamRef = useRef(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [ocrDetectedText, setOcrDetectedText] = useState('');

  // Manage camera for barcode scanner
  useEffect(() => {
    if (isOpen && viewMode === 'barcode') {
      startBarcodeCamera();
    } else {
      stopBarcodeCamera();
    }

    return () => {
      stopBarcodeCamera();
    };
  }, [isOpen, viewMode]);

  // Manage camera for OCR text scanner
  useEffect(() => {
    if (isOpen && viewMode === 'ocr') {
      startOcrCamera();
    } else {
      stopOcrCamera();
    }

    return () => {
      stopOcrCamera();
    };
  }, [isOpen, viewMode]);

  // Reset internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('barcode');
      setError('');
      setManualIsbn('');
      setTitleQuery('');
      setOcrDetectedText('');
      setOcrProgress('');
      setOcrLoading(false);
    }
  }, [isOpen]);

  const startBarcodeCamera = async () => {
    setCameraError('');
    setTimeout(async () => {
      const element = document.getElementById('qr-reader');
      if (!element) return;

      try {
        if (scannerRef.current) {
          await stopBarcodeCamera();
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
            console.log('Naskenovaný čárový kód:', decodedText);
            stopBarcodeCamera();
            handleLookup(decodedText);
          },
          () => {}
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

  const stopBarcodeCamera = async () => {
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

  const startOcrCamera = async () => {
    setCameraError('');
    try {
      if (ocrStreamRef.current) {
        stopOcrCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      ocrStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('OCR kamera selhala:', err);
      setCameraError('Nepodařilo se spustit kameru pro čtení textu.');
    }
  };

  const stopOcrCamera = () => {
    if (ocrStreamRef.current) {
      ocrStreamRef.current.getTracks().forEach((track) => track.stop());
      ocrStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureAndRecognizeIsbn = async () => {
    if (!videoRef.current) return;
    setOcrLoading(true);
    setOcrProgress('Pořizuji snímek textu...');
    setError('');

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setOcrProgress('Rozpoznávám tištěné ISBN číslo z obrázku...');

      const result = await Tesseract.recognize(canvas, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`Rozpoznávání textu: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const fullText = result.data.text;
      console.log('OCR text rozpoznán:', fullText);
      setOcrDetectedText(fullText.trim());

      const foundIsbn = extractIsbnFromText(fullText);
      if (foundIsbn) {
        setOcrProgress(`Nalezeno ISBN: ${foundIsbn}! Načítám knihu...`);
        stopOcrCamera();
        await handleLookup(foundIsbn);
      } else {
        setError(
          'ISBN nebylo v textu rozpoznáno. Ujistěte se, že text "ISBN..." je dobře osvětlený a zaostřený, nebo zadejte kód ručně.'
        );
      }
    } catch (err) {
      console.error('OCR selhalo:', err);
      setError('Chyba při rozpoznávání textu: ' + (err.message || err));
    } finally {
      setOcrLoading(false);
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

  const closeAll = () => {
    stopBarcodeCamera();
    stopOcrCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#f7f3ed] border-2 border-[#8b2626]/30 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d7ccc8]">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#8b2626] text-white rounded-xl">
              {viewMode === 'ocr' ? <Type className="w-5 h-5" /> : <Barcode className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#3a2212]">
                Přidat novou knihu
              </h2>
              <p className="text-xs text-[#5c3a21]">
                {viewMode === 'barcode' && 'Čtení čárového kódu fotoaparátem'}
                {viewMode === 'ocr' && 'Čtení tištěného čísla ISBN bez čárového kódu (OCR)'}
                {viewMode === 'choose_manual' && 'Vyberte způsob ručního zadání'}
                {viewMode === 'input_isbn' && 'Zadejte ISBN kód knihy'}
                {viewMode === 'input_title' && 'Zadejte název knihy'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAll}
            className="p-1.5 hover:bg-[#efe6d5] text-[#5c3a21] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch for Scanning modes */}
        <div className="flex bg-[#e8ddc8] p-1 rounded-xl mt-3 text-xs font-bold border border-[#d7ccc8]">
          <button
            onClick={() => {
              stopOcrCamera();
              setViewMode('barcode');
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              viewMode === 'barcode' ? 'bg-[#8b2626] text-white shadow-xs' : 'text-[#5c3a21] hover:bg-[#efe6d5]'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Čárový kód</span>
          </button>

          <button
            onClick={() => {
              stopBarcodeCamera();
              setViewMode('ocr');
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              viewMode === 'ocr' ? 'bg-[#8b2626] text-white shadow-xs' : 'text-[#5c3a21] hover:bg-[#efe6d5]'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Čtení čísla ISBN (bez kódu)</span>
          </button>
        </div>

        {error && (
          <div className="bg-amber-100 border border-amber-300 text-amber-900 text-xs p-3 rounded-xl mt-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Main Body Content */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* 1. BARCODE MODE */}
          {viewMode === 'barcode' && (
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
                  Naměřte fotoaparát na čárový kód na zadní obálce knihy...
                </p>
              )}

              {/* Action buttons under barcode camera */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    stopBarcodeCamera();
                    setViewMode('ocr');
                  }}
                  className="py-2.5 px-3 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] font-bold text-xs rounded-xl border border-[#a1887f] shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Type className="w-4 h-4 text-[#8b2626]" />
                  <span>Přečíst číslo ISBN</span>
                </button>

                <button
                  onClick={() => {
                    stopBarcodeCamera();
                    setViewMode('choose_manual');
                  }}
                  className="py-2.5 px-3 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] font-bold text-xs rounded-xl border border-[#a1887f] shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#8b2626]" />
                  <span>Zadat ručně</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. OCR TEXT ISBN MODE (Čtení ISBN bez čárového kódu) */}
          {viewMode === 'ocr' && (
            <div className="space-y-3 text-center">
              <div className="relative w-full bg-black rounded-xl overflow-hidden min-h-[220px] max-h-[280px] flex items-center justify-center border-2 border-[#8b2626]">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Aiming guidelines */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-14 border-2 border-dashed border-amber-400 bg-amber-400/10 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-bold text-amber-300 drop-shadow-md">
                    Zaměřte na napsané číslo: ISBN ...
                  </span>
                </div>
              </div>

              {ocrProgress && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-center space-x-2">
                  {ocrLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-700" />}
                  <span>{ocrProgress}</span>
                </div>
              )}

              <p className="text-xs text-[#5c3a21]">
                Namiřte kameru na vytištěný text s číslem ISBN na obálce nebo tiráži a stiskněte tlačítko níže:
              </p>

              <button
                type="button"
                onClick={captureAndRecognizeIsbn}
                disabled={ocrLoading}
                className="w-full py-3 bg-[#8b2626] hover:bg-[#701e1e] active:scale-95 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {ocrLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rozpoznávám číslo ISBN...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Přečíst ISBN z textu</span>
                  </>
                )}
              </button>

              {ocrDetectedText && (
                <div className="text-left bg-[#efe6d5] p-2.5 rounded-xl border border-[#d7ccc8] text-[11px]">
                  <span className="font-bold text-[#5c3a21] block">Poslední rozpoznaný text:</span>
                  <p className="font-mono text-[#3a2212] truncate">{ocrDetectedText}</p>
                </div>
              )}
            </div>
          )}

          {/* 3. CHOOSE MANUAL OPTION MODE */}
          {viewMode === 'choose_manual' && (
            <div className="space-y-4 py-2">
              <p className="text-xs font-semibold text-[#5c3a21] text-center mb-2">
                Jak si přejete knihu vyhledat nebo zadat?
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
                      Zadat ISBN kód ručně
                    </h3>
                    <p className="text-xs text-[#5c3a21] mt-0.5">
                      Pro případ nečitelného nebo poškozeného čárového kódu
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
                      Zadat název nebo autora
                    </h3>
                    <p className="text-xs text-[#5c3a21] mt-0.5">
                      Vyhledání a doplnění informací z databáze podle názvu
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-3 border-t border-[#d7ccc8] flex justify-between items-center">
                <button
                  onClick={() => setViewMode('barcode')}
                  className="text-xs font-bold text-[#5c3a21] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Zpět na čárový kód</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. INPUT ISBN MODE */}
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
                  Ruční zápis čísla ISBN pro případ znečištěného čárového kódu.
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
                  onClick={() => setViewMode('barcode')}
                  className="text-xs font-bold text-[#8b2626] hover:underline cursor-pointer"
                >
                  Naskenovat kamerou
                </button>
              </div>
            </form>
          )}

          {/* 5. INPUT TITLE MODE */}
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
                  Pro knihy bez čárového kódu či bez ISBN zadejte název nebo autora.
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
                  onClick={() => setViewMode('barcode')}
                  className="text-xs font-bold text-[#8b2626] hover:underline cursor-pointer"
                >
                  Naskenovat kamerou
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Option to open blank form manually (Ruční zápis knih bez ISBN) */}
        <div className="border-t border-[#d7ccc8] pt-3 mt-1 text-center">
          <button
            onClick={() => {
              closeAll();
              onBookFound({
                isbn: manualIsbn || '',
                title: titleQuery || '',
                author: '',
                year: '',
                genre: '',
                language: ''
              });
            }}
            className="text-xs text-[#8b2626] font-bold hover:underline cursor-pointer flex items-center justify-center space-x-1 mx-auto"
          >
            <span>+ Ruční zápis knihy (i bez ISBN) od začátku</span>
          </button>
        </div>
      </div>
    </div>
  );
}
