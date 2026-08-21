import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Lock, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { AuthorizedUser } from '../types';
import { AUTHORIZED_GOOGLE_EMAILS, INITIAL_AUTHORIZED_USERS } from '../data/mockData';

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
  const [googleEmail, setGoogleEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successUser, setSuccessUser] = useState<AuthorizedUser | null>(null);

  if (!isOpen) return null;

  const handleAuthorizeEmail = (emailToVerify: string) => {
    setErrorMessage('');
    setIsLoading(true);

    const formattedEmail = emailToVerify.trim().toLowerCase();

    // Check if the email exists in the server-configured whitelist
    const isAuthorized = AUTHORIZED_GOOGLE_EMAILS.some(
      (authorized) => authorized.trim().toLowerCase() === formattedEmail
    );

    setTimeout(() => {
      setIsLoading(false);
      if (isAuthorized) {
        const authorizedObj: AuthorizedUser = INITIAL_AUTHORIZED_USERS.find(
          (u) => u.email.toLowerCase() === formattedEmail
        ) || {
          id: `user-${Date.now()}`,
          email: formattedEmail,
          name: formattedEmail.split('@')[0],
          role: 'Administrador',
          addedAt: new Date().toISOString().split('T')[0],
        };

        setSuccessUser(authorizedObj);
        setTimeout(() => {
          onSuccessLogin(authorizedObj);
          onClose();
          setSuccessUser(null);
          setGoogleEmail('');
        }, 900);
      } else {
        setErrorMessage(
          `Acesso não autorizado para "${emailToVerify}". Apenas contas Google autorizadas pela administração da IBCIP têm permissão de acesso.`
        );
      }
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    handleAuthorizeEmail(googleEmail);
  };

  // Quick 1-click Google Sign-in for current manager (admissclick@gmail.com)
  const handleQuickGoogleSignIn = () => {
    handleAuthorizeEmail('admissclick@gmail.com');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fadeIn">
        
        {/* Ambient Subtle Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
            <GoogleIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">Login com Google</h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                IBCIP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Painel Gestor do Boletim Comunhão!
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
              <h4 className="text-base font-bold text-white">Conta Google Autorizada!</h4>
              <p className="text-xs text-emerald-300 font-mono">{successUser.email}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Abrindo o Painel Gestor...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* Info Badge */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                O acesso ao painel de edição do <strong className="text-white">Comunhão!</strong> é restrito a e-mails Google autorizados.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Fast Google Login Button */}
            <div className="space-y-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleQuickGoogleSignIn}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>Continuar com Google</span>
                <ArrowRight className="w-4 h-4 text-slate-500 ml-auto" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  ou digite o e-mail Google
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Email Verification Form */}
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="relative">
                  <GoogleIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="seu.email@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !googleEmail.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validando autorização...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Entrar no Painel Gestor</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Cancel Footer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
              >
                Voltar à visualização do boletim
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
