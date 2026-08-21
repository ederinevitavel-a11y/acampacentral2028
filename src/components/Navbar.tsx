import React from 'react';
import { Church, QrCode, ShieldCheck, LogOut, Eye, Settings } from 'lucide-react';
import { WeeklyBulletin } from '../types';

interface NavbarProps {
  bulletin: WeeklyBulletin;
  isAdmin: boolean;
  viewMode: 'public' | 'admin';
  onToggleViewMode: (mode: 'public' | 'admin') => void;
  onOpenQrModal: () => void;
  onOpenAuthModal: () => void;
  onLogoutAdmin: () => void;
  userEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  bulletin,
  isAdmin,
  viewMode,
  onToggleViewMode,
  onOpenQrModal,
  onOpenAuthModal,
  onLogoutAdmin,
  userEmail,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & Church Name */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none shrink-0"
            onClick={() => onToggleViewMode('public')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
              <Church className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-lg tracking-tight text-white">
                  Comunhão<span className="text-amber-400">!</span>
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 shadow-sm">
                  IBCIP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Boletim Semanal
              </p>
            </div>
          </div>

          {/* Action Buttons Container */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Status indicator (Desktop only) */}
            <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              bulletin.status === 'Publicado'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                bulletin.status === 'Publicado' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              {bulletin.status}
            </div>

            {/* QR Poster Button */}
            <button
              onClick={onOpenQrModal}
              title="Cartaz para Mural com QR Code"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all active:scale-95 shadow-sm touch-manipulation"
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Cartaz QR</span>
              <span className="sm:hidden text-[11px]">QR</span>
            </button>

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-700">
                
                {/* Switch Mode: Public vs Admin Panel */}
                <button
                  onClick={() => onToggleViewMode('public')}
                  title="Modo Visualização Pública"
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                    viewMode === 'public'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Ver Público</span>
                </button>

                <button
                  onClick={() => onToggleViewMode('admin')}
                  title="Modo Painel Gestor"
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                    viewMode === 'admin'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Painel</span>
                </button>

                {/* Email Tag (Desktop only) */}
                {userEmail && (
                  <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-slate-950/60 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="max-w-[110px] truncate">{userEmail}</span>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogoutAdmin}
                  title="Sair da Conta Gestor"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center touch-manipulation"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all active:scale-95 touch-manipulation"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Gestor</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
