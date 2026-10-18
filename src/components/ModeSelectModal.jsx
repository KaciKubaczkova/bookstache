import React from 'react';
import { Library, Users, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

export default function ModeSelectModal({ onSelectMode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#f7f3ed] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#e8ddc8] rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#d7ccc8] rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="max-w-xl w-full text-center relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="inline-flex items-center justify-center p-4 bg-[#8b2626] text-white rounded-2xl shadow-lg transform hover:rotate-2 transition-transform">
          <BookOpen className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-4xl font-serif font-bold text-[#3a2212] mb-2 tracking-tight">
            Knihovnička
          </h1>
          <p className="text-[#5c3a21] text-base italic">
            Co si přejete dnes dělat? Vyberte si ze dvou hlavních sekcí:
          </p>
        </div>

        {/* Main Section Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Option 1: Catalog of Libraries */}
          <button
            onClick={() => onSelectMode('library')}
            className="bg-[#efe6d5] hover:bg-[#e8ddc8] border-2 border-[#8b2626]/30 hover:border-[#8b2626] text-[#3a2212] p-6 rounded-3xl shadow-md transition-all flex flex-col justify-between group cursor-pointer space-y-4"
          >
            <div>
              <div className="p-3.5 bg-[#8b2626] text-white rounded-2xl inline-block mb-3 group-hover:scale-105 transition-transform">
                <Library className="w-7 h-7" />
              </div>
              <h2 className="font-serif font-bold text-xl text-[#3a2212] mb-1">
                Katalog knihoven
              </h2>
              <p className="text-xs text-[#5c3a21] leading-relaxed">
                Správa institucionálních i školních knihoven, katalogizace knih, skenování čárových kódů a výpůjční systém.
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-[#8b2626] group-hover:translate-x-1 transition-transform">
              <span>Vstoupit do knihoven</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Option 2: Neighborhood Lending */}
          <button
            onClick={() => onSelectMode('vinted')}
            className="bg-[#efe6d5] hover:bg-[#e8ddc8] border-2 border-[#5c3a21]/30 hover:border-[#5c3a21] text-[#3a2212] p-6 rounded-3xl shadow-md transition-all flex flex-col justify-between group cursor-pointer space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8b2626] bg-[#8b2626]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Komunita
              </span>
            </div>

            <div>
              <div className="p-3.5 bg-[#5c3a21] text-white rounded-2xl inline-block mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="font-serif font-bold text-xl text-[#3a2212] mb-1">
                Sousedská výpůjčka
              </h2>
              <p className="text-xs text-[#5c3a21] leading-relaxed">
                Půjčování knih přímo mezi sousedy ve vašem okolí. Nabídněte své knížky nebo si půjčte z okolí.
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-[#5c3a21] group-hover:translate-x-1 transition-transform">
              <span>Prohlížet sousedství</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        </div>

        <div className="pt-4 text-xs text-[#7d5d42] border-t border-[#d7ccc8]">
          📚 Propojujeme čtenáře a knihovny
        </div>
      </div>
    </div>
  );
}
