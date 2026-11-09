import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Barcode, Search, AlertCircle, Loader2, Edit3, ArrowLeft, Type, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { lookupBookByIsbnOrTitle } from '../services/bookLookup';
import { extractIsbnFromText } from '../services/isbnParser';
import { cropVideoTarget } from '../services/imageProcessing';
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

  // OCR Camera Video stream & worker refs
  const videoRef = useRef(null);
  const ocrStreamRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  const autoScanIntervalRef = useRef(null);
  const isOcrProcessingRef = useRef(false);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('Namiřte obdélník na řádek s číslem ISBN');
  const [ocrDetectedText, setOcrDetectedText] = useState('');
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [ocrSuccessIsbn, setOcrSuccessIsbn] = useState('');

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

  // Manage camera and worker for OCR text scanner
  useEffect(() => {
    if (isOpen && viewMode === 'ocr') {
      startOcrCamera();
      initOcrWorker();
    } else {
      stopOcrCamera();
      terminateOcrWorker();
      stopAutoScan();
    }

    return () => {
      stopOcrCamera();
      terminateOcrWorker();
      stopAutoScan();
    };
  }, [isOpen, viewMode]);

  // Manage auto-scanning loop when in OCR mode
  useEffect(() => {
    if (isOpen && viewMode === 'ocr' && autoScanEnabled && !ocrSuccessIsbn) {
      startAutoScan();
    } else {
      stopAutoScan();
    }

    return () => {
      stopAutoScan();
    };
  }, [isOpen, viewMode, autoScanEnabled, ocrSuccessIsbn]);

  // Reset internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('barcode');
      setError('');
      setManualIsbn('');
      setTitleQuery('');
      setOcrDetectedText('');
      setOcrStatus('Namiřte obdélník na řádek s číslem ISBN');
      setOcrLoading(false);
      setOcrSuccessIsbn('');
      setAutoScanEnabled(true);
    }
  }, [isOpen]);

  const initOcrWorker = async () => {
    try {
      if (ocrWorkerRef.current) return;
      setOcrStatus('Připravuji čtečku textu...');
      const worker = await Tesseract.createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789-ISBNisbnXx:./ ',
        tessedit_pageseg_mode: '6' // Assume single uniform block/line of text
      });
      ocrWorkerRef.current = worker;
      setOcrStatus('Čtečka připravena. Držte číslo ISBN v rámečku...');
    } catch (err) {
      console.warn('Nepodařilo se přednastavit Tesseract worker, použije se výchozí recognize:', err);
    }
  };

  const terminateOcrWorker = async () => {
    if (ocrWorkerRef.current) {
      try {
        await ocrWorkerRef.current.terminate();
      } catch (e) {
        console.warn('Chyba při ukončení OCR workera:', e);
      }
      ocrWorkerRef.current = null;
    }
  };

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
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
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

  const startAutoScan = () => {
    stopAutoScan();
    autoScanIntervalRef.current = setInterval(() => {
      if (videoRef.current && !isOcrProcessingRef.current) {
        processOcrFrame(false);
      }
    }, 1200);
  };

  const stopAutoScan = () => {
    if (autoScanIntervalRef.current) {
      clearInterval(autoScanIntervalRef.current);
      autoScanIntervalRef.current = null;
    }
  };

  /**
   * Process a single cropped and enhanced frame from the video stream
   */
  const processOcrFrame = async (isManualClick = false) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || isOcrProcessingRef.current) return;

    isOcrProcessingRef.current = true;
    if (isManualClick) {
      setOcrLoading(true);
      setOcrStatus('Rozpoznávám ISBN...');
    }

    try {
      // Relative crop box coordinates: centered horizontal band
      const relBox = { x: 0.08, y: 0.35, width: 0.84, height: 0.30 };
      const processedCanvas = cropVideoTarget(video, relBox);
      if (!processedCanvas) {
        isOcrProcessingRef.current = false;
        if (isManualClick) setOcrLoading(false);
        return;
      }

      let fullText = '';
      if (ocrWorkerRef.current) {
        const result = await ocrWorkerRef.current.recognize(processedCanvas);
        fullText = result.data.text || '';
      } else {
        const result = await Tesseract.recognize(processedCanvas, 'eng');
        fullText = result.data.text || '';
      }

      const trimmedText = fullText.trim();
      if (trimmedText) {
        setOcrDetectedText(trimmedText);
      }

      const foundIsbn = extractIsbnFromText(fullText);
      if (foundIsbn) {
        setOcrSuccessIsbn(foundIsbn);
        setOcrStatus(`Nalezeno ISBN: ${foundIsbn}! Vyhledávám v katalogu...`);
        stopAutoScan();
        stopOcrCamera();
        await handleLookup(foundIsbn);
      } else if (isManualClick) {
        setOcrStatus('ISBN nebylo v rámečku nalezeno. Zkuste zaostřit a držet text přímo v rámečku.');
        setError('ISBN kód nebyl rozpoznán. Ujistěte se, že text „ISBN ...“ je přímo v rámečku a dobře osvětlen.');
      }
    } catch (err) {
      console.error('OCR selhalo:', err);
      if (isManualClick) {
        setError('Chyba při čtení textu: ' + (err.message || err));
      }
    } finally {
      isOcrProcessingRef.current = false;
      if (isManualClick) setOcrLoading(false);
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
    terminateOcrWorker();
    stopAutoScan();
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
                {viewMode === 'ocr' && 'Čtení vytištěného textu čísla ISBN (bez čárového kódu)'}
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
              stopAutoScan();
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
            <span>Čtení čísla ISBN (text)</span>
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

                {/* Shaded top and bottom overlays to highlight target strip */}
                <div className="absolute inset-x-0 top-0 h-[35%] bg-black/40 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-[35%] bg-black/40 pointer-events-none" />

                {/* Target box for ISBN text */}
                <div className="absolute inset-x-4 top-[35%] h-[30%] border-2 border-dashed border-amber-400 bg-amber-400/10 rounded-lg pointer-events-none flex flex-col items-center justify-center shadow-lg">
                  {ocrSuccessIsbn ? (
                    <div className="bg-green-700/90 text-white font-bold text-xs px-3 py-1.5 rounded-md flex items-center space-x-1.5 shadow">
                      <CheckCircle2 className="w-4 h-4 text-green-200" />
                      <span>Rozpoznáno: {ocrSuccessIsbn}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-300 drop-shadow-md px-2 text-center">
                      Umístěte řádek s číslem sem: ISBN ...
                    </span>
                  )}
                </div>

                {/* Live scanner laser line animation */}
                {!ocrSuccessIsbn && (
                  <div className="absolute inset-x-4 top-[35%] h-[30%] pointer-events-none overflow-hidden">
                    <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_red] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </div>

              {/* Status and automatic scanning indicator */}
              <div className="p-2.5 bg-[#efe6d5] border border-[#d7ccc8] text-[#3a2212] rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2 text-left">
                  {ocrLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#8b2626] shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="text-[11px] font-medium">{ocrStatus}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                  className={`text-[10px] px-2 py-1 rounded font-bold transition-colors cursor-pointer shrink-0 ${
                    autoScanEnabled ? 'bg-[#8b2626] text-white' : 'bg-stone-300 text-stone-700'
                  }`}
                  title={autoScanEnabled ? 'Vypnout automatické skenování' : 'Zapnout automatické skenování'}
                >
                  {autoScanEnabled ? 'Auto-sken: ZAP' : 'Auto-sken: VYP'}
                </button>
              </div>

              <p className="text-[11px] text-[#5c3a21] leading-tight">
                Držte telefon stabilně tak, aby tištěné číslo (např. <em>ISBN 978-80-...</em>) bylo přímo ve žlutém obdélníku. Aplikace skenuje automaticky. Pokud se nedaří, stiskněte tlačítko níže:
              </p>

              {/* Manual shutter button */}
              <button
                type="button"
                onClick={() => processOcrFrame(true)}
                disabled={ocrLoading || !!ocrSuccessIsbn}
                className="w-full py-3 bg-[#8b2626] hover:bg-[#701e1e] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {ocrLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Zpracovávám text v rámečku...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Přečíst text v rámečku ihned</span>
                  </>
                )}
              </button>

              {ocrDetectedText && (
                <div className="text-left bg-[#efe6d5]/70 p-2 rounded-xl border border-[#d7ccc8] text-[10px]">
                  <span className="font-bold text-[#5c3a21] block">Rozpoznaný text v rámečku:</span>
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
