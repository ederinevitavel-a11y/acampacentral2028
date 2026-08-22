import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Church,
  Calendar,
  Smartphone,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Edit3,
  QrCode,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { WeeklyBulletin } from '../types';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Clean public URL that opens the published bulletin
  const getInitialUrl = () => {
    if (typeof window !== 'undefined') {
      try {
        let origin = window.location.origin;
        // In AI Studio environment, the public shared URL replaces 'ais-dev-' with 'ais-pre-'
        // This ensures the QR code works for any phone camera without requiring dev credentials
        if (origin.includes('ais-dev-')) {
          origin = origin.replace('ais-dev-', 'ais-pre-');
        }
        return `${origin}${window.location.pathname}`;
      } catch {
        return window.location.href;
      }
    }
    return 'https://ibcip.com.br';
  };

  const [targetUrl, setTargetUrl] = useState<string>(getInitialUrl);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [qrRenderError, setQrRenderError] = useState<string | null>(null);

  const effectiveUrl = targetUrl.trim() || getInitialUrl();

  // Render QR Code directly into canvas whenever modal is open or targetUrl changes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (canvasRef.current) {
        setQrRenderError(null);
        QRCode.toCanvas(
          canvasRef.current,
          effectiveUrl,
          {
            width: 250,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          },
          (error) => {
            if (error) {
              console.error('Erro ao renderizar QR Code no Canvas:', error);
              setQrRenderError('Erro ao renderizar QR Code');
            }
          }
        );
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, effectiveUrl]);

  if (!isOpen) return null;

  const highlightEvents = bulletin.events
    .filter((e) => e.highlight || e.category === 'Culto')
    .slice(0, 4);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(effectiveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const handleDownloadQrPng = async () => {
    try {
      // Generate ultra high resolution 1024x1024 for sharp printing / projection
      const highResDataUrl = await QRCode.toDataURL(effectiveUrl, {
        width: 1024,
        margin: 3,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const downloadLink = document.createElement('a');
      downloadLink.href = highResDataUrl;
      downloadLink.download = `QRCode-Boletim-IBCIP-Edicao-${bulletin.editionNumber}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Erro ao gerar PNG para download:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Boletim Informativo - ${bulletin.churchName}`,
          text: `Confira o boletim da semana da ${bulletin.churchName}: ${bulletin.weekRange}`,
          url: effectiveUrl,
        });
      } catch {
        // Ignored
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] flex flex-col print:max-h-none print:border-none print:shadow-none print:p-0 print:text-black print:bg-white">
        
        {/* Modal Header Controls (Hidden on Print) */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight">
                QR Code & Cartaz de Acesso
              </h3>
              <p className="text-xs text-slate-400">
                Aponte a câmera para abrir o boletim no celular
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir Cartaz</span>
              <span className="sm:hidden">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar: URL display, Edit, Copy Link, Download (Hidden on Print) */}
        <div className="py-3 shrink-0 space-y-2 print:hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <div className="flex-1 flex items-center gap-2 px-2 min-w-0">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide shrink-0">
                Link:
              </span>
              {isEditingUrl ? (
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded-lg w-full focus:outline-none focus:border-amber-400 font-mono"
                />
              ) : (
                <span className="text-xs text-slate-300 truncate select-all font-mono">
                  {effectiveUrl}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 justify-end">
              <button
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                title={isEditingUrl ? 'Confirmar link' : 'Personalizar link'}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <a
                href={effectiveUrl}
                target="_blank"
                rel="noreferrer"
                title="Testar link (abrir em nova guia)"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              </a>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px]">Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadQrPng}
                title="Baixar imagem em PNG alta resolução"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Baixar PNG</span>
              </button>

              <button
                onClick={handleShare}
                title="Compartilhar link"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Printable Poster Preview Area */}
        <div className="overflow-y-auto pr-1 py-2 flex-1 print-poster-container print:overflow-visible">
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden shadow-2xl space-y-5 print:bg-white print:text-black print:border-4 print:border-black print:rounded-none print:shadow-none print:p-8">
            
            {/* Elegant Top Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 print:bg-black" />

            {/* Poster Church Header */}
            <div className="text-center space-y-1 pt-1">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black mb-1.5 shadow-md shadow-amber-500/20 print:bg-black print:text-white">
                <Church className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase print:text-black">
                {bulletin.churchName}
              </h1>
              <p className="text-amber-400 font-bold text-xs uppercase tracking-widest print:text-black">
                Boletim Informativo Semanal • {bulletin.weekRange}
              </p>
            </div>

            {/* High Precision Scannable QR Code Box */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 text-center shadow-inner relative space-y-3 print:bg-white print:border-2 print:border-black">
              <div className="flex justify-center">
                <div className="p-3.5 bg-white rounded-2xl shadow-xl border-4 border-amber-400 print:border-black print:shadow-none flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    className="w-48 h-48 sm:w-56 sm:h-56 block mx-auto rounded-lg select-none"
                  />
                </div>
              </div>

              {qrRenderError && (
                <p className="text-xs text-rose-400 font-bold">{qrRenderError}</p>
              )}

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-amber-300 font-extrabold text-sm sm:text-base print:text-black">
                  <Smartphone className="w-4 h-4 animate-bounce print:hidden" />
                  <span>Aponte a câmera do seu celular!</span>
                </div>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed print:text-slate-800">
                  Acesse a programação dos cultos, avisos da semana e a palavra pastoral pelo boletim digital.
                </p>
              </div>
            </div>

            {/* Weekly Highlights Section in Poster */}
            {highlightEvents.length > 0 && (
              <div className="print:border-t print:border-slate-300 print:pt-4">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 print:text-black">
                  <Calendar className="w-4 h-4 print:text-black" />
                  Destaques da Semana
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {highlightEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-start gap-2.5 print:bg-slate-50 print:border-slate-300 print:text-black"
                    >
                      <div className="w-1.5 self-stretch bg-amber-500 rounded-full shrink-0 print:bg-black" />
                      <div className="min-w-0 text-left">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block print:text-black">
                          {ev.category} • {ev.date} às {ev.time}
                        </span>
                        <h5 className="font-bold text-xs text-white truncate print:text-black">{ev.title}</h5>
                        <p className="text-[11px] text-slate-400 truncate print:text-slate-700">{ev.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Theme Verse Footer */}
            <div className="text-center pt-2 border-t border-slate-800/80 print:border-black">
              <p className="text-xs text-slate-300 font-medium leading-relaxed print:text-black">
                "{bulletin.themeVerse}" — <span className="text-amber-400 font-bold print:text-black">{bulletin.themeVerseRef}</span>
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-mono mt-1 print:text-black">
                {bulletin.churchAddress}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
