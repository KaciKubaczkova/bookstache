import React, { useState } from 'react';
import { X, Mail, MapPin, User, Check, AlertCircle, Calendar, BookOpen } from 'lucide-react';

export default function VintedContactModal({ item, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const handleCopyEmail = () => {
    if (item.ownerEmail) {
      navigator.clipboard.writeText(item.ownerEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAvailable = item.status === 'Dostupná k půjčení' || item.status === 'Dostupná';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#f7f3ed] border-2 border-[#8b2626]/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5c3a21] hover:text-[#8b2626] p-1 rounded-full hover:bg-[#efe6d5] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-4 mb-5 pr-6">
          {item.coverUrl ? (
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-16 h-24 object-cover rounded-xl shadow-md shrink-0 border border-[#d7ccc8]"
            />
          ) : (
            <div className="w-16 h-24 bg-[#efe6d5] border border-[#d7ccc8] rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-8 h-8 text-[#8b2626]/40" />
            </div>
          )}

          <div>
            <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full mb-1 ${
              isAvailable
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : item.status === 'Rezervovaná'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {item.status || 'Dostupná k půjčení'}
            </span>
            <h2 className="text-lg font-serif font-bold text-[#3a2212] line-clamp-2">
              {item.title}
            </h2>
            <p className="text-xs text-[#5c3a21] italic">{item.author || 'Neznámý autor'}</p>
          </div>
        </div>

        {/* Owner Info Box */}
        <div className="bg-[#efe6d5] border border-[#d7ccc8] rounded-2xl p-4 space-y-3 mb-5">
          <h3 className="text-xs font-bold text-[#8b2626] uppercase tracking-wider">
            Informace o vlastníkovi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#3a2212]">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-[#8b2626] shrink-0" />
              <div>
                <p className="text-[10px] text-[#5c3a21]">Vlastník</p>
                <p className="font-semibold">{item.ownerName || 'Registrovaný čtenář'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#8b2626] shrink-0" />
              <div>
                <p className="text-[10px] text-[#5c3a21]">Lokalita (přibližná)</p>
                <p className="font-semibold">{item.ownerLocation || 'Nespecifikováno'}</p>
              </div>
            </div>
          </div>

          {item.lendingTerms && (
            <div className="pt-2 border-t border-[#d7ccc8]">
              <p className="text-[10px] text-[#5c3a21] font-bold mb-0.5">Podmínky a místo předání:</p>
              <p className="text-xs text-[#3a2212] bg-[#f7f3ed] p-2 rounded-xl border border-[#d7ccc8]">
                {item.lendingTerms}
              </p>
            </div>
          )}
        </div>

        {/* Contact actions */}
        {!isAvailable && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tato kniha má aktuálně stav <strong>{item.status}</strong>. Můžete ale vlastníka zkusit kontaktovat ohledně budoucí výpůjčky.
            </span>
          </div>
        )}

        <div className="space-y-2">
          {item.ownerEmail ? (
            <>
              <a
                href={`mailto:${item.ownerEmail}?subject=Dotaz na výpůjčku knihy: ${encodeURIComponent(item.title)}`}
                className="w-full py-3 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Napsat e-mail vlastníkovi</span>
              </a>

              <button
                onClick={handleCopyEmail}
                className="w-full py-2 bg-[#efe6d5] hover:bg-[#e8ddc8] text-[#3a2212] font-semibold text-xs rounded-xl border border-[#a1887f] flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Mail className="w-4 h-4 text-[#8b2626]" />}
                <span>{copied ? 'E-mail zkopírován do schránky!' : `Zkopírovat e-mail (${item.ownerEmail})`}</span>
              </button>
            </>
          ) : (
            <p className="text-xs text-[#8b2626] text-center font-semibold">
              E-mail na vlastníka není k dispozici.
            </p>
          )}
        </div>

        <p className="text-[11px] text-[#5c3a21] text-center mt-4 italic">
          Kvůli ochraně soukromí se nezobrazuje přesná adresa uživatele. Domluvte si místo předání přes e-mail.
        </p>
      </div>
    </div>
  );
}
