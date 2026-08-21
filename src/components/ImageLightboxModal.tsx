import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Share2, Download, Maximize2 } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  category?: string;
  date?: string;
  time?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  category,
  date,
  time,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') handleResetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomLevel]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(2);
    }
  };

  // Drag handling for pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handling for mobile pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - pan.x,
      y: e.touches[0].clientY - pan.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomLevel <= 1 || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleShare = () => {
    const text = encodeURIComponent(
      `Confira o cartaz do evento *${title || 'Evento'}* na IBCIP (${date || ''} ${time ? `às ${time}` : ''})\n\nAcesse o boletim completo: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadImage = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `cartaz-ibcip-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 animate-fadeIn select-none"
      onClick={onClose}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Controls Bar */}
      <div
        className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 px-2 text-white z-20 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {category && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider shrink-0 shadow-md">
              {category}
            </span>
          )}
          {title && (
            <h3 className="font-extrabold text-xs sm:text-base text-white truncate">
              {title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg transition-colors"
              title="Diminuir Zoom (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-amber-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg transition-colors"
              title="Aumentar Zoom (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 text-amber-400 hover:text-amber-300 rounded-lg transition-colors"
                title="Redefinir Zoom (0)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            title="Compartilhar no WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden md:inline">WhatsApp</span>
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownloadImage}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
            title="Salvar Imagem no Celular"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage with Ambient Backdrop & Zoom Pan Support */}
      <div
        className="relative flex-1 w-full max-w-5xl mx-auto flex items-center justify-center overflow-hidden rounded-3xl bg-slate-950/80 border border-slate-800/80 my-1 p-2 sm:p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        {/* Ambient Blur Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />

        {/* High-Definition Poster Image */}
        <img
          src={imageUrl}
          alt={title || 'Cartaz do Evento IBCIP'}
          onDoubleClick={handleDoubleClick}
          className="relative z-10 max-h-[76vh] w-auto max-w-full object-contain rounded-xl drop-shadow-2xl transition-transform duration-150 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
          }}
          referrerPolicy="no-referrer"
          draggable={false}
        />

        {/* Mobile Zoom Helper Pill */}
        <div className="absolute bottom-3 left-3 right-3 sm:hidden z-20 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-slate-900/90 text-[10px] font-bold text-amber-300 border border-slate-700/80 backdrop-blur-md shadow-lg">
            {zoomLevel > 1 ? `Zoom ${Math.round(zoomLevel * 100)}% (Arraste para mover)` : 'Toque 2x para aproximar'}
          </span>

          <div className="flex items-center gap-1 pointer-events-auto">
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-2 bg-slate-900/90 text-amber-400 rounded-xl border border-slate-700 shadow-md active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => (zoomLevel > 1 ? handleZoomOut() : handleZoomIn())}
              className="p-2 bg-slate-900/90 text-white rounded-xl border border-slate-700 shadow-md active:scale-95"
            >
              {zoomLevel > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Caption & Date Footer Bar */}
      <div
        className="w-full max-w-5xl mx-auto flex items-center justify-between py-1.5 px-2 text-slate-400 text-xs shrink-0 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {(date || time) && (
            <span className="font-bold text-amber-300 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-xl text-[11px] sm:text-xs">
              📅 {date} {time ? `às ${time}` : ''}
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
          Comunhão! • IBCIP
        </span>
      </div>
    </div>
  );
};
