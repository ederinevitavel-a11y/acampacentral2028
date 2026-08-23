import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileImage,
  RefreshCw,
  Eye,
  ShieldCheck,
  Save,
  Wand2,
  Calendar,
  Clock,
  MapPin,
  Tag,
  BookOpen,
  Bell,
  Sliders,
  Printer,
  Maximize2,
  Crop,
  Image as ImageIcon,
  X,
  Search,
  Check,
  QrCode,
  Copy,
  ExternalLink,
  Download,
  Share2,
  CalendarDays
} from 'lucide-react';
import {
  WeeklyBulletin,
  ChurchEvent,
  PastoralMessage,
  Notice,
  AuthorizedUser,
  AdminTabType,
  EventCategory
} from '../types';
import { ImageLightboxModal } from './ImageLightboxModal';
import { lookupOfflineVerse, fetchOnlineVerse } from '../utils/bibleLookup';
import { formatEventDisplayDate, formatEventFullSchedule } from '../utils/dateHelpers';

interface AdminPanelProps {
  bulletin: WeeklyBulletin;
  onUpdateBulletin: (updated: WeeklyBulletin | ((prev: WeeklyBulletin) => WeeklyBulletin)) => void;
  onOpenQrModal: () => void;
  cloudSyncStatus?: 'saved' | 'saving' | 'error';
  onSaveToCloud?: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  bulletin,
  onUpdateBulletin,
  onOpenQrModal,
  cloudSyncStatus = 'saved',
  onSaveToCloud,
}) => {
  const [adminTab, setAdminTab] = useState<AdminTabType>('editor');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [manualSaveSuccess, setManualSaveSuccess] = useState(false);

  const handleManualSave = async () => {
    if (!onSaveToCloud) return;
    setIsManualSaving(true);
    setManualSaveSuccess(false);
    try {
      await onSaveToCloud();
      setManualSaveSuccess(true);
      setTimeout(() => setManualSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsManualSaving(false);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://acampacentral2028.vercel.app';
  const bulletinUrl = currentOrigin.includes('localhost') ? currentOrigin : 'https://acampacentral2028.vercel.app';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(bulletinUrl)}&color=0f172a&bgcolor=ffffff&qzone=2`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(bulletinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = 'qrcode-boletim-ibcip.png';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cartaz Dropzone state
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cartazEvent, setCartazEvent] = useState<Partial<ChurchEvent> | null>(null);
  const [isGeneratingEventDesc, setIsGeneratingEventDesc] = useState(false);

  // AI Pastoral Text Generation
  const [pastoralPrompt, setPastoralPrompt] = useState('');
  const [isGeneratingPastoral, setIsGeneratingPastoral] = useState(false);

  // Form states for creating/editing events
  const [editingEvent, setEditingEvent] = useState<Partial<ChurchEvent> | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Form state for creating/editing notices
  const [editingNotice, setEditingNotice] = useState<Partial<Notice> | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  // Bible verse auto-fetch states
  const [isSearchingVerse, setIsSearchingVerse] = useState(false);
  const [verseAutoStatus, setVerseAutoStatus] = useState<string | null>(null);

  const handleReferenceChange = (newRef: string) => {
    // Check if there is an instant offline match
    const match = lookupOfflineVerse(newRef);
    if (match) {
      onUpdateBulletin({
        ...bulletin,
        themeVerseRef: newRef,
        themeVerse: match,
        churchName: 'IBCIP'
      });
      setVerseAutoStatus('Versículo preenchido automaticamente!');
      setTimeout(() => setVerseAutoStatus(null), 3000);
    } else {
      onUpdateBulletin({
        ...bulletin,
        themeVerseRef: newRef,
        churchName: 'IBCIP'
      });
    }
  };

  const handleSearchVerse = async (targetRef?: string) => {
    const ref = targetRef || bulletin.themeVerseRef;
    if (!ref.trim()) return;

    setIsSearchingVerse(true);
    setVerseAutoStatus(null);
    try {
      const result = await fetchOnlineVerse(ref);
      if (result && result.text) {
        onUpdateBulletin({
          ...bulletin,
          themeVerseRef: ref,
          themeVerse: result.text,
          churchName: 'IBCIP'
        });
        setVerseAutoStatus('Versículo encontrado e preenchido!');
        setTimeout(() => setVerseAutoStatus(null), 3500);
      } else {
        setVerseAutoStatus('Referência não encontrada. Você pode digitar o texto manualmente.');
        setTimeout(() => setVerseAutoStatus(null), 4000);
      }
    } catch {
      setVerseAutoStatus('Erro ao buscar versículo online. Digite o texto manualmente.');
      setTimeout(() => setVerseAutoStatus(null), 4000);
    } finally {
      setIsSearchingVerse(false);
    }
  };

  const applyVersePreset = (ref: string) => {
    handleReferenceChange(ref);
    if (!lookupOfflineVerse(ref)) {
      handleSearchVerse(ref);
    }
  };

  // Status toggle
  const toggleStatus = () => {
    onUpdateBulletin({
      ...bulletin,
      status: bulletin.status === 'Publicado' ? 'Rascunho' : 'Publicado',
    });
  };

  // Lightbox modal state for admin preview
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title?: string;
    category?: string;
    date?: string;
    time?: string;
  }>({
    isOpen: false,
    imageUrl: null,
  });

  const openLightbox = (
    imageUrl: string,
    title?: string,
    category?: string,
    date?: string,
    time?: string
  ) => {
    setLightboxState({
      isOpen: true,
      imageUrl,
      title,
      category,
      date,
      time,
    });
  };

  // Handle select / upload cartaz image
  const handleSelectCartazImage = (
    imageBase64: string,
    initialTitle?: string,
    initialDescription?: string
  ) => {
    setSelectedImage(imageBase64);
    setCartazEvent({
      id: `ev-${Date.now()}`,
      title: initialTitle || '',
      category: 'Culto',
      dayOfWeek: 'Domingo',
      date: '',
      time: '19:00',
      location: 'Templo Principal',
      description:
        initialDescription ||
        'Venha participar conosco deste momento especial na casa do Senhor com toda a sua família.',
      imageUrl: imageBase64,
      imageFit: 'contain',
      highlight: true,
      tags: ['Culto', 'Especial'],
      createdAt: new Date().toISOString(),
    });
  };

  // Handle image upload / drop
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleSelectCartazImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Helper to suggest event description with AI based on title
  const handleGenerateEventDescription = async () => {
    if (!cartazEvent?.title) return;
    setIsGeneratingEventDesc(true);
    try {
      const res = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Crie uma chamada convidativa, calorosa e breve (2 a 3 frases) para o evento da igreja intitulado "${cartazEvent.title}" (categoria: ${cartazEvent.category || 'Culto'}).`,
          type: 'event',
        }),
      });

      const data = await res.json();
      if (data.success && data.result?.content) {
        setCartazEvent((prev) => ({
          ...prev,
          description: data.result.content,
        }));
      }
    } catch (err) {
      console.error('Erro ao gerar descrição do evento:', err);
    } finally {
      setIsGeneratingEventDesc(false);
    }
  };

  // Publish Cartaz event to bulletin
  const handlePublishCartazEvent = () => {
    if (!cartazEvent || !cartazEvent.title) return;

    const newEvent: ChurchEvent = {
      id: cartazEvent.id || `ev-${Date.now()}`,
      title: cartazEvent.title,
      category: (cartazEvent.category as EventCategory) || 'Culto',
      dayOfWeek: cartazEvent.dayOfWeek || 'Domingo',
      date: cartazEvent.date || '',
      time: cartazEvent.time || '19:00',
      location: cartazEvent.location || 'Templo Principal',
      description: cartazEvent.description || '',
      imageUrl: cartazEvent.imageUrl || selectedImage || undefined,
      imageFit: cartazEvent.imageFit || 'contain',
      highlight: cartazEvent.highlight ?? true,
      tags: cartazEvent.tags || ['Especial'],
      createdAt: new Date().toISOString(),
    };

    onUpdateBulletin({
      ...bulletin,
      events: [newEvent, ...bulletin.events],
    });

    setCartazEvent(null);
    setSelectedImage(null);
    setAdminTab('editor');
  };

  // Generate Pastoral text with AI
  const handleGeneratePastoralText = async () => {
    if (!pastoralPrompt) return;
    setIsGeneratingPastoral(true);
    try {
      const res = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: pastoralPrompt,
          type: 'pastoral',
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        onUpdateBulletin({
          ...bulletin,
          pastoral: {
            ...bulletin.pastoral,
            title: data.result.title || bulletin.pastoral.title,
            verse: data.result.verse || bulletin.pastoral.verse,
            content: data.result.content || bulletin.pastoral.content,
          },
        });
        setPastoralPrompt('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPastoral(false);
    }
  };

  // Save Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.title) return;

    if (editingEvent.id) {
      // Update existing
      onUpdateBulletin({
        ...bulletin,
        events: bulletin.events.map((ev) =>
          ev.id === editingEvent.id
            ? ({
                ...ev,
                ...editingEvent,
                dayOfWeek: editingEvent.dayOfWeek || 'Domingo',
                date: editingEvent.date || '',
                time: editingEvent.time || '19:00',
                imageFit: editingEvent.imageFit || 'contain',
              } as ChurchEvent)
            : ev
        ),
      });
    } else {
      // Add new
      const newEv: ChurchEvent = {
        id: `ev-${Date.now()}`,
        title: editingEvent.title || '',
        category: (editingEvent.category as EventCategory) || 'Culto',
        dayOfWeek: editingEvent.dayOfWeek || 'Domingo',
        date: editingEvent.date || '',
        time: editingEvent.time || '19:00',
        location: editingEvent.location || 'Templo Principal',
        description: editingEvent.description || '',
        imageUrl:
          editingEvent.imageUrl ||
          'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=1000',
        imageFit: editingEvent.imageFit || 'contain',
        highlight: editingEvent.highlight ?? false,
        tags: editingEvent.tags || ['Culto'],
        createdAt: new Date().toISOString(),
      };
      onUpdateBulletin({
        ...bulletin,
        events: [newEv, ...bulletin.events],
      });
    }

    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  // Delete Event
  const handleDeleteEvent = (id: string) => {
    onUpdateBulletin({
      ...bulletin,
      events: bulletin.events.filter((ev) => ev.id !== id),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 sm:pb-20">
      
      {/* Admin Top Status & Action Bar - Highly Responsive & Mobile Optimized */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-6 py-3 sm:py-4 sticky top-12 sm:top-14 z-20 backdrop-blur-md shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          
          {/* Top row: Status, Info & Cloud Sync */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            
            {/* Status toggle button */}
            <button
              type="button"
              onClick={toggleStatus}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 touch-manipulation shrink-0 ${
                bulletin.status === 'Publicado'
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              <span className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0 ${
                bulletin.status === 'Publicado' ? 'bg-slate-950 animate-ping' : 'bg-slate-950'
              }`} />
              <span className="truncate">Status: {bulletin.status}</span>
              <span className="hidden sm:inline text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-md font-semibold">
                (Alterar)
              </span>
            </button>

            {/* Cloud Sync Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] sm:text-xs font-semibold shrink-0">
              {cloudSyncStatus === 'saving' || isManualSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                  <span className="text-amber-300">Salvando...</span>
                </>
              ) : cloudSyncStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-rose-400">Falha ao salvar</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 hidden xs:inline">Sincronizado na Nuvem</span>
                  <span className="text-slate-300 xs:hidden">Nuvem OK</span>
                </>
              )}
            </div>

            {/* Week & Church tag (Desktop) */}
            <span className="text-xs text-slate-400 hidden lg:inline font-medium ml-auto">
              IBCIP • {bulletin.weekRange}
            </span>
          </div>

          {/* Bottom row on mobile / Right row on desktop: Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 pt-1 border-t border-slate-800/60 sm:border-t-0 sm:pt-0">
            
            {/* Direct Save/Publish to Cloud Button */}
            {onSaveToCloud && (
              <button
                type="button"
                onClick={handleManualSave}
                disabled={isManualSaving}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 touch-manipulation w-full sm:w-auto"
              >
                {manualSaveSuccess ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="truncate">Publicado!</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 shrink-0" />
                    <span className="truncate">Salvar & Publicar</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenQrModal}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all active:scale-95 touch-manipulation w-full sm:w-auto"
            >
              <Printer className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">Poster Mural</span>
            </button>
          </div>

        </div>
      </div>

      {/* Admin Navigation Tabs - Horizontal Scrolling on Mobile */}
      <div className="border-b border-slate-800 bg-slate-950/90 px-3 sm:px-4 sticky top-[108px] sm:top-[128px] z-10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          
          <button
            onClick={() => setAdminTab('editor')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 touch-manipulation ${
              adminTab === 'editor'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Editor do Boletim</span>
          </button>

          <button
            onClick={() => setAdminTab('ai_upload')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 touch-manipulation ${
              adminTab === 'ai_upload'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FileImage className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Envio Rápido de Cartazes</span>
          </button>

          <button
            onClick={() => setAdminTab('qrcode')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 touch-manipulation ${
              adminTab === 'qrcode'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
            <span>QR Code & Divulgação</span>
          </button>

        </div>
      </div>

      {/* Main Admin Content Container */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">

        {/* TAB 3: QR CODE & DIVULGAÇÃO */}
        {adminTab === 'qrcode' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Main QR Card */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                
                {/* QR Code Frame */}
                <div className="flex flex-col items-center gap-3 bg-white p-5 rounded-3xl shadow-xl border-4 border-amber-400/80 shrink-0">
                  <img
                    src={qrImageUrl}
                    alt="QR Code do Boletim IBCIP"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                  />
                  <div className="flex items-center gap-2 text-slate-950 font-black text-xs tracking-tight">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>BOLETIM ONLINE IBCIP</span>
                  </div>
                </div>

                {/* Info & Action Controls */}
                <div className="flex-1 space-y-5 text-center md:text-left">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold mb-2">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Link Permanente e Dinâmico</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      QR Code Oficial do Boletim
                    </h2>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      Este QR Code aponta sempre para a versão atual do boletim publicada no Firebase. Ao salvar ou publicar alterações no painel, qualquer pessoa que escanear verá imediatamente a nova edição.
                    </p>
                  </div>

                  {/* URL Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="font-mono text-xs text-amber-300 truncate max-w-full sm:max-w-md px-2 select-all">
                      {bulletinUrl}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 active:scale-95 shrink-0"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Action Buttons Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onOpenQrModal}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                    >
                      <Printer className="w-4 h-4 shrink-0" />
                      <span>Imprimir Cartaz A4</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Baixar PNG HD</span>
                    </button>

                    <a
                      href={bulletinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-all active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Abrir no Navegador</span>
                    </a>
                  </div>

                </div>

              </div>
            </section>

            {/* Instruction Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">
                  Como funciona a atualização automática?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Você <strong>não precisa gerar ou imprimir um novo QR Code toda semana</strong>. O código acima é um identificador fixo que carrega em tempo real o que você salva na aba <strong>Editor do Boletim</strong>.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Status atual: <strong>{bulletin.status}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>Edição: <strong>{bulletin.editionNumber} ({bulletin.weekRange})</strong></span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">
                  Onde e como divulgar na igreja:
                </h3>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">1.</span>
                    <span><strong>Mural da Igreja:</strong> Use a opção "Imprimir Cartaz A4" para fixar na entrada e no hall de comunhão.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">2.</span>
                    <span><strong>Telão do Templo:</strong> Baixe o PNG do QR Code e insira nos slides de boas-vindas antes do início do culto.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">3.</span>
                    <span><strong>Grupos de WhatsApp:</strong> Clique em "Copiar Link" e envie o link direto nos grupos de ministérios e liderança.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        )}
        {adminTab === 'editor' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Bulletin Metadata Settings */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 sm:pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    <span>Configurações do Boletim da Semana</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Digite a referência bíblica para carregar o versículo automaticamente ou edite o texto livremente.
                  </p>
                </div>
                <span className="self-start sm:self-auto text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Igreja: IBCIP
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Week range */}
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Período / Semana
                    </label>
                    <input
                      type="text"
                      value={bulletin.weekRange}
                      onChange={(e) =>
                        onUpdateBulletin({ ...bulletin, weekRange: e.target.value, churchName: 'IBCIP' })
                      }
                      placeholder="Ex: 21 a 27 de Agosto de 2026"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Bible Reference with Auto-Search */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300">
                        Referência Bíblica (Busca Automática)
                      </label>
                      {verseAutoStatus && (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                          <Check className="w-3.5 h-3.5" />
                          {verseAutoStatus}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={bulletin.themeVerseRef}
                          onChange={(e) => handleReferenceChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSearchVerse();
                            }
                          }}
                          placeholder="Ex: Salmos 122:1, João 3:16, Filipenses 4:13..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchVerse()}
                        disabled={isSearchingVerse || !bulletin.themeVerseRef.trim()}
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95 shadow touch-manipulation"
                        title="Buscar texto bíblico online"
                      >
                        {isSearchingVerse ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span className="hidden sm:inline">Buscando...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>Buscar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-slate-400 font-medium">Sugestões rápidas:</span>
                      {[
                        'Salmos 122:1',
                        'Salmos 23:1',
                        'João 3:16',
                        'Filipenses 4:13',
                        'Isaías 40:31',
                        'Josué 1:9',
                        'Romanos 8:28'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => applyVersePreset(preset)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/80 transition-all active:scale-95 touch-manipulation"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Editable Verse Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Versículo Temático da Semana (Editável)
                    </label>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Você pode personalizar ou ajustar o texto livremente
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={bulletin.themeVerse}
                    onChange={(e) =>
                      onUpdateBulletin({ ...bulletin, themeVerse: e.target.value, churchName: 'IBCIP' })
                    }
                    placeholder="O texto do versículo aparecerá aqui automaticamente e pode ser editado a qualquer momento..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 resize-y leading-relaxed"
                  />
                </div>
              </div>
            </section>

            {/* Events Manager Section */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    <span>Programação e Cultos da Semana ({bulletin.events.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Adicione ou edite os eventos do boletim</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent({
                      title: '',
                      category: 'Culto',
                      dayOfWeek: 'Domingo',
                      date: '',
                      time: '19:00',
                      location: 'Templo Principal',
                      description: '',
                      highlight: false,
                      imageFit: 'contain',
                    });
                    setIsEventModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-95 touch-manipulation w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Evento</span>
                </button>
              </div>

              {/* Events List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                {bulletin.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {ev.category}
                        </span>
                        {ev.highlight && (
                          <span className="text-[10px] font-extrabold text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" /> Destaque
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-white">{ev.title}</h4>
                      <p className="text-xs text-amber-300 font-bold">
                        {formatEventFullSchedule(ev)} • <span className="text-slate-400 font-normal">{ev.location}</span>
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          let dayOfWeek = ev.dayOfWeek;
                          let date = ev.date || '';
                          if (!dayOfWeek && date) {
                            const days = [
                              'Domingo',
                              'Segunda-feira',
                              'Terça-feira',
                              'Quarta-feira',
                              'Quinta-feira',
                              'Sexta-feira',
                              'Sábado',
                            ];
                            const foundDay = days.find((d) => date.startsWith(d));
                            if (foundDay) {
                              dayOfWeek = foundDay;
                              date = date.replace(foundDay, '').replace(/^[,\s•-]+/, '').trim();
                            }
                          }
                          setEditingEvent({
                            ...ev,
                            dayOfWeek: dayOfWeek || 'Domingo',
                            date: date,
                          });
                          setIsEventModalOpen(true);
                        }}
                        className="p-2 sm:p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 px-3 touch-manipulation active:scale-95"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-2 sm:p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-all touch-manipulation active:scale-95"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pastoral Message Manager Section */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    <span>Mensagem e Reflexão Pastoral</span>
                  </h3>
                  <p className="text-xs text-slate-400">Atualize a mensagem pastoral da semana</p>
                </div>
              </div>

              {/* AI Text Refinement Assistant */}
              <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Assistente de Escrita Pastoral por IA</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={pastoralPrompt}
                    onChange={(e) => setPastoralPrompt(e.target.value)}
                    placeholder="Ex: Escreva uma palavra sobre gratidão e fé para o próximo domingo"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePastoralText}
                    disabled={isGeneratingPastoral || !pastoralPrompt}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shrink-0 flex items-center justify-center gap-1.5 touch-manipulation active:scale-95"
                  >
                    {isGeneratingPastoral ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Gerar Texto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Título da Mensagem
                  </label>
                  <input
                    type="text"
                    value={bulletin.pastoral.title}
                    onChange={(e) =>
                      onUpdateBulletin({
                        ...bulletin,
                        pastoral: { ...bulletin.pastoral, title: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome do Pastor / Pregador
                  </label>
                  <input
                    type="text"
                    value={bulletin.pastoral.pastorName}
                    onChange={(e) =>
                      onUpdateBulletin({
                        ...bulletin,
                        pastoral: { ...bulletin.pastoral, pastorName: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Versículo de Suporte
                  </label>
                  <input
                    type="text"
                    value={bulletin.pastoral.verse}
                    onChange={(e) =>
                      onUpdateBulletin({
                        ...bulletin,
                        pastoral: { ...bulletin.pastoral, verse: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Referência do Versículo
                  </label>
                  <input
                    type="text"
                    value={bulletin.pastoral.verseReference}
                    onChange={(e) =>
                      onUpdateBulletin({
                        ...bulletin,
                        pastoral: { ...bulletin.pastoral, verseReference: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Texto da Reflexão Pastoral
                  </label>
                  <textarea
                    rows={6}
                    value={bulletin.pastoral.content}
                    onChange={(e) =>
                      onUpdateBulletin({
                        ...bulletin,
                        pastoral: { ...bulletin.pastoral, content: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                </div>
              </div>
            </section>

          </div>
        )}

        {/* TAB 2: ENVIO RÁPIDO DE CARTAZES */}
        {adminTab === 'ai_upload' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <FileImage className="w-6 h-6 text-amber-400" />
                  <span>Envio Rápido de Cartazes e Flyers</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Envie a imagem do cartaz do evento e preencha as informações abaixo para publicar diretamente no boletim.
                </p>
              </div>

              {/* Amber Dropzone Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer relative overflow-hidden ${
                  dragActive
                    ? 'border-amber-400 bg-amber-500/20 scale-[0.99]'
                    : 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-400'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-3 max-w-sm mx-auto pointer-events-none">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-amber-200">
                      Arraste e solte o cartaz aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Suporta arquivos JPG, PNG e WEBP em alta definição
                    </p>
                  </div>
                </div>
              </div>

              {/* Cartaz Form & Direct Publish */}
              {cartazEvent && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-3xl p-6 space-y-5 animate-fadeIn shadow-2xl">
                  
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-black text-sm text-white">Cartaz Carregado — Preencha os Detalhes</h4>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
                      Preenchimento Manual
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Flyer Preview Image with Framing & Zoom */}
                    {cartazEvent.imageUrl && (
                      <div className="space-y-3">
                        <div
                          className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[220px] max-h-[360px] relative flex items-center justify-center cursor-pointer group shadow-xl select-none"
                          onClick={() =>
                            openLightbox(
                              cartazEvent.imageUrl!,
                              cartazEvent.title || 'Prévia do Cartaz',
                              cartazEvent.category,
                              cartazEvent.date,
                              cartazEvent.time
                            )
                          }
                        >
                          {/* Ambient glow backdrop */}
                          <div
                            className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110"
                            style={{ backgroundImage: `url(${cartazEvent.imageUrl})` }}
                          />

                          {/* Sharp flyer image */}
                          <img
                            src={cartazEvent.imageUrl}
                            alt={cartazEvent.title || 'Cartaz'}
                            className={`relative z-10 max-h-[320px] w-auto max-w-full ${
                              cartazEvent.imageFit === 'cover' ? 'w-full h-full object-cover' : 'object-contain p-2'
                            } group-hover:scale-105 transition-transform duration-300 drop-shadow-md rounded-lg`}
                          />

                          <span className="absolute top-2 left-2 z-20 bg-slate-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-800 shadow">
                            Cartaz Carregado
                          </span>

                          <span className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-slate-950/80 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 backdrop-blur-sm shadow">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </span>

                          <div className="absolute bottom-2 inset-x-2 z-20 flex justify-center">
                            <span className="bg-slate-950/80 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-800 backdrop-blur-sm">
                              Clique para ampliar
                            </span>
                          </div>
                        </div>

                        {/* Framing Mode Selector */}
                        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                            <Crop className="w-3 h-3 text-amber-400" />
                            <span>Enquadramento do Cartaz</span>
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCartazEvent({ ...cartazEvent, imageFit: 'contain' })}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                                cartazEvent.imageFit !== 'cover'
                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              Sem Cortes (Inteiro)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCartazEvent({ ...cartazEvent, imageFit: 'cover' })}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                                cartazEvent.imageFit === 'cover'
                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              Preencher Caixa
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manual Fill Form */}
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Título do Evento / Culto *
                        </label>
                        <input
                          type="text"
                          required
                          value={cartazEvent.title || ''}
                          onChange={(e) => setCartazEvent({ ...cartazEvent, title: e.target.value })}
                          placeholder="Ex: Noite de Louvor & Adoração"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Categoria
                          </label>
                          <select
                            value={cartazEvent.category || 'Culto'}
                            onChange={(e) =>
                              setCartazEvent({
                                ...cartazEvent,
                                category: e.target.value as EventCategory,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          >
                            <option value="Culto">Culto</option>
                            <option value="Jovens">Jovens</option>
                            <option value="Adolescentes">Adolescentes</option>
                            <option value="Infantil">Infantil</option>
                            <option value="Casais">Casais</option>
                            <option value="Especial">Especial</option>
                            <option value="Evento">Evento</option>
                            <option value="Aviso">Aviso</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Horário
                          </label>
                          <input
                            type="text"
                            value={cartazEvent.time || ''}
                            onChange={(e) => setCartazEvent({ ...cartazEvent, time: e.target.value })}
                            placeholder="Ex: 19:30"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-amber-300 mb-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              <span>Dia da Semana</span>
                            </label>
                            <select
                              value={cartazEvent.dayOfWeek || 'Domingo'}
                              onChange={(e) =>
                                setCartazEvent({ ...cartazEvent, dayOfWeek: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            >
                              <option value="Domingo">Domingo</option>
                              <option value="Segunda-feira">Segunda-feira</option>
                              <option value="Terça-feira">Terça-feira</option>
                              <option value="Quarta-feira">Quarta-feira</option>
                              <option value="Quinta-feira">Quinta-feira</option>
                              <option value="Sexta-feira">Sexta-feira</option>
                              <option value="Sábado">Sábado</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                              <span>Data (Dia / Mês)</span>
                            </label>
                            <input
                              type="text"
                              value={cartazEvent.date || ''}
                              onChange={(e) => setCartazEvent({ ...cartazEvent, date: e.target.value })}
                              placeholder="Ex: 24 de Agosto, 24/08..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        {/* Quick day buttons */}
                        <div className="flex items-center flex-wrap gap-1 pt-1">
                          <span className="text-[10px] text-slate-400 font-semibold mr-1">Atalho:</span>
                          {['Domingo', 'Quarta-feira', 'Sábado', 'Sexta-feira', 'Segunda-feira', 'Terça-feira', 'Quinta-feira'].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setCartazEvent({ ...cartazEvent, dayOfWeek: d })}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                                cartazEvent.dayOfWeek === d
                                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              {d.replace('-feira', '')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Local na Igreja
                        </label>
                        <input
                          type="text"
                          value={cartazEvent.location || ''}
                          onChange={(e) =>
                            setCartazEvent({ ...cartazEvent, location: e.target.value })
                          }
                          placeholder="Ex: Templo Principal"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-300">
                            Descrição / Convite para o Boletim
                          </label>
                          {cartazEvent.title && (
                            <button
                              type="button"
                              onClick={handleGenerateEventDescription}
                              disabled={isGeneratingEventDesc}
                              className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-bold disabled:opacity-50"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>{isGeneratingEventDesc ? 'Gerando texto...' : 'Sugerir texto com IA'}</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={cartazEvent.description || ''}
                          onChange={(e) =>
                            setCartazEvent({ ...cartazEvent, description: e.target.value })
                          }
                          placeholder="Escreva um breve texto convidativo para o boletim..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="cartazHighlight"
                          checked={cartazEvent.highlight ?? true}
                          onChange={(e) =>
                            setCartazEvent({ ...cartazEvent, highlight: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-0"
                        />
                        <label htmlFor="cartazHighlight" className="text-xs text-slate-300 font-semibold cursor-pointer">
                          Colocar como grande destaque da semana no início do boletim
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Publish Button */}
                  <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCartazEvent(null);
                        setSelectedImage(null);
                      }}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishCartazEvent}
                      disabled={!cartazEvent.title}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Publicar no Boletim Comunica!</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Modal for Creating / Editing Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-white">
                {editingEvent?.id ? 'Editar Evento' : 'Novo Evento no Boletim'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 overflow-y-auto pr-1 no-scrollbar flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={editingEvent?.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="Ex: Culto de Celebração & Ceia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={editingEvent?.category || 'Culto'}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        category: e.target.value as EventCategory,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Culto">Culto</option>
                    <option value="Jovens">Jovens</option>
                    <option value="Adolescentes">Adolescentes</option>
                    <option value="Infantil">Infantil</option>
                    <option value="Casais">Casais</option>
                    <option value="Especial">Especial</option>
                    <option value="Evento">Evento</option>
                    <option value="Aviso">Aviso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Horário *</label>
                  <input
                    type="text"
                    required
                    value={editingEvent?.time || '19:00'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    placeholder="Ex: 19:00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dia da Semana *</span>
                    </label>
                    <select
                      value={editingEvent?.dayOfWeek || 'Domingo'}
                      onChange={(e) => setEditingEvent({ ...editingEvent, dayOfWeek: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Domingo">Domingo</option>
                      <option value="Segunda-feira">Segunda-feira</option>
                      <option value="Terça-feira">Terça-feira</option>
                      <option value="Quarta-feira">Quarta-feira</option>
                      <option value="Quinta-feira">Quinta-feira</option>
                      <option value="Sexta-feira">Sexta-feira</option>
                      <option value="Sábado">Sábado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                      <span>Data (Dia / Mês)</span>
                    </label>
                    <input
                      type="text"
                      value={editingEvent?.date || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      placeholder="Ex: 24 de Agosto, 24/08..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Quick Day Presets */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Atalhos de dia:</span>
                  {['Domingo', 'Quarta-feira', 'Sábado', 'Sexta-feira', 'Segunda-feira', 'Terça-feira', 'Quinta-feira'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, dayOfWeek: d })}
                      className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-lg border transition-all active:scale-95 touch-manipulation ${
                        editingEvent?.dayOfWeek === d
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {d.replace('-feira', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Local na Igreja</label>
                <input
                  type="text"
                  value={editingEvent?.location || 'Templo Principal'}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  placeholder="Ex: Templo Principal, Salão Social, Auditório..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Image / Flyer Section with direct upload and framing mode */}
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Cartaz / Imagem do Evento</span>
                  </label>
                  {editingEvent?.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, imageUrl: undefined })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Remover imagem
                    </button>
                  )}
                </div>

                {/* Upload or URL input */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={editingEvent?.imageUrl || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, imageUrl: e.target.value })}
                    placeholder="Cole o link da imagem (URL) ou escolha um arquivo..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors border border-slate-700 touch-manipulation">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setEditingEvent({
                              ...editingEvent,
                              imageUrl: reader.result as string,
                              imageFit: editingEvent?.imageFit || 'contain',
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Image Preview & Framing */}
                {editingEvent?.imageUrl && (
                  <div className="mt-2 space-y-2">
                    <div
                      className="relative h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center cursor-pointer group"
                      onClick={() =>
                        openLightbox(
                          editingEvent.imageUrl!,
                          editingEvent.title || 'Cartaz do Evento',
                          editingEvent.category,
                          editingEvent.date,
                          editingEvent.time
                        )
                      }
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-30 scale-110"
                        style={{ backgroundImage: `url(${editingEvent.imageUrl})` }}
                      />
                      <img
                        src={editingEvent.imageUrl}
                        alt="Prévia"
                        className={`relative z-10 max-h-full max-w-full ${
                          editingEvent.imageFit === 'cover' ? 'w-full h-full object-cover' : 'object-contain p-1'
                        } group-hover:scale-105 transition-transform drop-shadow`}
                      />
                      <span className="absolute top-2 right-2 z-20 p-1 rounded-md bg-slate-950/80 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-400">Enquadramento:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingEvent({ ...editingEvent, imageFit: 'contain' })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            editingEvent.imageFit !== 'cover'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Sem Cortes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEvent({ ...editingEvent, imageFit: 'cover' })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            editingEvent.imageFit === 'cover'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Preencher
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={editingEvent?.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  placeholder="Breve descrição ou chamada especial..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="highlight"
                  checked={editingEvent?.highlight || false}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, highlight: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-800"
                />
                <label htmlFor="highlight" className="text-xs font-bold text-amber-300 cursor-pointer">
                  Marcar como Destaque Principal da Semana
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95 touch-manipulation"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen High-Definition Flyer Lightbox for Admin */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState({ ...lightboxState, isOpen: false })}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        category={lightboxState.category}
        date={lightboxState.date}
        time={lightboxState.time}
      />

    </div>
  );
};
