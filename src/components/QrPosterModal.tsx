import React, { useRef } from 'react';
import { X, Printer, Download, Sparkles, Church, Calendar, Smartphone, Share2 } from 'lucide-react';
import { WeeklyBulletin } from '../types';
import { generateQrCodeDataUrl } from '../utils/qrCode';

interface QrPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulletin: WeeklyBulletin;
}

export const QrPosterModal: React.FC<QrPosterModalProps> = ({
  isOpen,
  onClose,
  bulletin,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const appUrl = window.location.href;
  const qrDataUrl = generateQrCodeDataUrl(appUrl);
  const highlightEvents = bulletin.events.filter((e) => e.highlight || e.category === 'Culto').slice(0, 3);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto">
        
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Poster para Mural da Igreja</h3>
              <p className="text-xs text-slate-400">Pronto para imprimir e colar na recepção/mural</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Poster</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Poster Area */}
        <div className="py-4">
          <div
            ref={posterRef}
            className="print-poster bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl space-y-6"
          >
            {/* Elegant Amber Glow Top Header */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Poster Church Branding */}
            <div className="text-center space-y-1 pt-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black mb-2 shadow-lg shadow-amber-500/20">
                <Church className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                IBCIP
              </h1>
              <p className="text-amber-400 font-bold text-xs uppercase tracking-widest">
                Boletim Informativo Semanal • {bulletin.weekRange}
              </p>
            </div>

            {/* QR Code Block */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 text-center shadow-inner relative space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-amber-400 max-w-[200px] w-full aspect-square flex items-center justify-center">
                  <img
                    src={qrDataUrl}
                    alt="QR Code do Boletim Comunhão! IBCIP"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-amber-300 font-extrabold text-sm sm:text-base">
                  <Smartphone className="w-4 h-4 animate-bounce" />
                  <span>Aponte a câmera do seu celular!</span>
                </div>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Acesse instantaneamente a programação completa, cultos, avisos e reflexão pastoral sem instalar nada.
                </p>
              </div>
            </div>

            {/* Weekly Highlights Section in Poster */}
            <div>
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Destaques da Programação Desta Semana
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highlightEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-start gap-3"
                  >
                    <div className="w-2 h-full min-h-[40px] bg-amber-500 rounded-full shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                        {ev.category} • {ev.date} às {ev.time}
                      </span>
                      <h5 className="font-bold text-xs text-white line-clamp-1">{ev.title}</h5>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{ev.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme Verse Footer */}
            <div className="text-center pt-2 border-t border-slate-800">
              <p className="text-xs italic text-slate-300 font-serif">
                "{bulletin.themeVerse}" — <span className="text-amber-400 font-sans font-bold">{bulletin.themeVerseRef}</span>
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">
                Comunhão! IBCIP • Gerado para exibição presencial
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
