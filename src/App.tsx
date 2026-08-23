import React, { useState, useEffect, useRef } from 'react';
import { WeeklyBulletin, AuthorizedUser } from './types';
import { INITIAL_BULLETIN } from './data/mockData';
import { Navbar } from './components/Navbar';
import { PublicView } from './components/PublicView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { QrPosterModal } from './components/QrPosterModal';
import {
  subscribeToBulletin,
  saveBulletinToFirestore,
  observeAuthState,
  logoutFirebase,
} from './services/firebase';

export default function App() {
  // Load bulletin from localStorage or default initial
  const [bulletin, setBulletin] = useState<WeeklyBulletin>(() => {
    let data = INITIAL_BULLETIN;
    const saved = localStorage.getItem('comunica_bulletin_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.events)) {
          data = { ...parsed, churchName: 'IBCIP' };
        }
      } catch (e) {
        console.error('Erro ao ler boletim do localStorage', e);
      }
    }
    // Ensure pastorPhotoUrl uses the uploaded pastor portrait if missing or pointing to old unsplash/local
    if (data.pastoral && (!data.pastoral.pastorPhotoUrl || data.pastoral.pastorPhotoUrl.includes('unsplash.com') || data.pastoral.pastorPhotoUrl === '/pastor.jpg')) {
      data.pastoral.pastorPhotoUrl = 'https://i.imgur.com/HSPlrt0.png';
    }
    return data;
  });

  // View state
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('ibcip_admin_session');
    return !!saved;
  });
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthorizedUser | null>(() => {
    const saved = localStorage.getItem('ibcip_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Real-time Firestore sync for Bulletin
  useEffect(() => {
    const unsubscribeFirestore = subscribeToBulletin((remoteData) => {
      if (remoteData && remoteData.events) {
        if (remoteData.pastoral && (!remoteData.pastoral.pastorPhotoUrl || remoteData.pastoral.pastorPhotoUrl.includes('unsplash.com') || remoteData.pastoral.pastorPhotoUrl === '/pastor.jpg')) {
          remoteData.pastoral.pastorPhotoUrl = 'https://i.imgur.com/HSPlrt0.png';
        }
        setBulletin(remoteData);
        localStorage.setItem('comunica_bulletin_v2', JSON.stringify(remoteData));
        setCloudSyncStatus('saved');
      }
    });

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  // Real-time Firebase Auth state observer
  useEffect(() => {
    const unsubscribeAuth = observeAuthState((user) => {
      if (user) {
        setIsAdminAuthenticated(true);
        setAuthenticatedUser(user);
        localStorage.setItem('ibcip_admin_session', JSON.stringify(user));
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Save explicitly to Firestore
  const handleSaveToCloud = async (overrideData?: WeeklyBulletin) => {
    setCloudSyncStatus('saving');
    try {
      const dataToSave = overrideData || bulletin;
      await saveBulletinToFirestore(dataToSave);
      setCloudSyncStatus('saved');
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
      setCloudSyncStatus('error');
      throw err;
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle bulletin updates (local state + debounced Firestore push)
  const handleUpdateBulletin = (updated: WeeklyBulletin | ((prev: WeeklyBulletin) => WeeklyBulletin)) => {
    setBulletin((prev) => {
      const nextBulletin = typeof updated === 'function' ? updated(prev) : updated;
      localStorage.setItem('comunica_bulletin_v2', JSON.stringify(nextBulletin));
      
      // Save to Firebase Firestore (debounced)
      setCloudSyncStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveBulletinToFirestore(nextBulletin)
          .then(() => {
            setCloudSyncStatus('saved');
          })
          .catch((err) => {
            console.warn('Erro ao salvar no Firestore:', err);
            setCloudSyncStatus('error');
          });
      }, 1200);

      return nextBulletin;
    });
  };

  // Handle mode toggle
  const handleToggleViewMode = (targetMode: 'public' | 'admin') => {
    if (targetMode === 'admin' && !isAdminAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setViewMode(targetMode);
  };

  // Handle successful login
  const handleSuccessLogin = (user: AuthorizedUser) => {
    setIsAdminAuthenticated(true);
    setAuthenticatedUser(user);
    localStorage.setItem('ibcip_admin_session', JSON.stringify(user));
    setViewMode('admin');
  };

  // Handle admin logout
  const handleLogoutAdmin = async () => {
    try {
      await logoutFirebase();
    } catch (err) {
      console.warn('Erro ao deslogar do Firebase:', err);
    }
    localStorage.removeItem('ibcip_admin_session');
    setIsAdminAuthenticated(false);
    setAuthenticatedUser(null);
    setViewMode('public');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Global Navbar */}
      <Navbar
        bulletin={bulletin}
        isAdmin={isAdminAuthenticated}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        userEmail={authenticatedUser?.email}
      />

      {/* Main View Area */}
      {viewMode === 'public' ? (
        <PublicView bulletin={bulletin} />
      ) : (
        <AdminPanel
          bulletin={bulletin}
          onUpdateBulletin={handleUpdateBulletin}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          cloudSyncStatus={cloudSyncStatus}
          onSaveToCloud={handleSaveToCloud}
        />
      )}

      {/* Auth Modal for Admin Access with Google Firebase */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessLogin={handleSuccessLogin}
      />

      {/* Printable QR Code Poster Modal for Church Display */}
      <QrPosterModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        bulletin={bulletin}
      />

    </div>
  );
}
