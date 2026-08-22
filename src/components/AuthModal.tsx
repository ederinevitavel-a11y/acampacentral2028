import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { AuthorizedUser } from '../types';
import { loginWithGoogleFirebase } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: AuthorizedUser) => void;
}

// Google SVG Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#EA4335"
      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
    />
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
    />
    <path
      fill="#FBBC05"
      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
    />
    <path
      fill="#34A853"
      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successUser, setSuccessUser] = useState<AuthorizedUser | null>(null);

  if (!isOpen) return null;

  const loginSuccess = (user: AuthorizedUser) => {
    setSuccessUser(user);
    setTimeout(() => {
      onSuccessLogin(user);
      onClose();
      setSuccessUser(null);
      setErrorMessage('');
    }, 800);
  };

  // Real Google Sign-in with Password verification via Firebase Auth
  const handleFirebaseGoogleLogin = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const user = await loginWithGoogleFirebase();
      loginSuccess(user);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Erro na autenticação Google:', err);
      
      const errorCode = err?.code || '';
      const errorMsg = err?.message || '';

      if (errorCode === 'auth/unauthorized-domain' || errorMsg.includes('unauthorized-domain')) {
        setErrorMessage(
          'Domínio não autorizado no Firebase Console. Para liberar o login com senha do Google no link online (Vercel ou Cloud Run), adicione o domínio em: Firebase Console > Authentication > Settings > Authorized domains.'
        );
      } else if (errorCode === 'auth/popup-closed-by-user') {
        setErrorMessage('A janela de autenticação do Google foi fechada antes da confirmação da senha.');
      } else if (errorCode === 'auth/popup-blocked') {
        setErrorMessage('O navegador bloqueou a janela de login do Google. Por favor, permita pop-ups para autenticar com sua senha.');
      } else if (errorCode === 'auth/user-cancelled') {
        setErrorMessage('Autenticação cancelada pelo usuário.');
      } else {
        setErrorMessage(
          err.message || 'Falha ao autenticar com a conta Google.'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fadeIn">
        
        {/* Subtle Accent Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner text-amber-400">
            <GoogleIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">Login com Google</h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                Firebase
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Painel Admin do Boletim IBCIP
            </p>
          </div>
        </div>

        {/* Success Feedback Animation */}
        {successUser ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Senha do Google Confirmada!</h4>
              <p className="text-xs text-emerald-300 font-mono font-bold">{successUser.name} ({successUser.email})</p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Abrindo Painel Admin...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* Info Box */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                <p>
                  Para acessar o Painel Admin, entre com sua conta Google e digite sua <strong className="text-white">senha oficial do Google</strong>.
                </p>
                <p className="text-[11px] text-slate-400">
                  O acesso é exclusivo para a liderança autorizada da IBCIP.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed block">{errorMessage}</span>
              </div>
            )}

            {/* Google Login Button - Requires user to enter Google password in popup */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleFirebaseGoogleLogin}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-700" />
                  <span>Aguardando autenticação do Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span>Entrar com Google e Senha</span>
                </>
              )}
            </button>

            {/* Cancel Footer */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Voltar ao boletim
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
