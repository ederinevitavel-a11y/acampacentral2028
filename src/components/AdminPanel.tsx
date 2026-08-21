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
  Check
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

interface AdminPanelProps {
  bulletin: WeeklyBulletin;
  onUpdateBulletin: (updated: WeeklyBulletin) => void;
  onOpenQrModal: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  bulletin,
  onUpdateBulletin,
  onOpenQrModal,
}) => {
  const [adminTab, setAdminTab] = useState<AdminTabType>('editor');

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
      date: 'Domingo',
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
      date: cartazEvent.date || 'Domingo',
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
          ev.id === editingEvent.id ? ({ ...ev, ...editingEvent } as ChurchEvent) : ev
        ),
      });
    } else {
      // Add new
      const newEv: ChurchEvent = {
        id: `ev-${Date.now()}`,
        title: editingEvent.title || '',
        category: (editingEvent.category as EventCategory) || 'Culto',
        date: editingEvent.date || 'Domingo',
        time: editingEvent.time || '19:00',
        location: editingEvent.location || 'Templo Principal',
        description: editingEvent.description || '',
        imageUrl: editingEvent.imageUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=1000',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Admin Top Status & Action Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-4 sticky top-14 z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 ${
                bulletin.status === 'Publicado'
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                bulletin.status === 'Publicado' ? 'bg-slate-950 animate-ping' : 'bg-slate-950'
              }`} />
              <span>Status: {bulletin.status}</span>
              <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-md">
                (Clique para alterar)
              </span>
            </button>

            <span className="text-xs text-slate-400 hidden md:inline">
              IBCIP • {bulletin.weekRange}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQrModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Gerar Poster Mural</span>
            </button>
          </div>

        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-950/80 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
          
          <button
            onClick={() => setAdminTab('editor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
              adminTab === 'editor'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Editor do Boletim</span>
          </button>

          <button
            onClick={() => setAdminTab('ai_upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
              adminTab === 'ai_upload'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FileImage className="w-4 h-4 text-amber-400" />
            <span>Envio Rápido de Cartazes</span>
          </button>

        </div>
      </div>

      {/* Main Admin Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* TAB 1: EDITOR DO BOLETIM */}
        {adminTab === 'editor' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Bulletin Metadata Settings */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <span>Configurações do Boletim da Semana</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Digite a referência bíblica para carregar o versículo automaticamente ou edite o texto livremente.
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Igreja: IBCIP
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
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
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchVerse()}
                        disabled={isSearchingVerse || !bulletin.themeVerseRef.trim()}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95 shadow"
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
                          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/80 transition-colors"
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
                    <span className="text-[11px] text-slate-400">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-y leading-relaxed"
                  />
                </div>
              </div>
            </section>

            {/* Events Manager Section */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    <span>Programação e Cultos da Semana ({bulletin.events.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Adicione ou edite os eventos do boletim</p>
                </div>

                <button
                  onClick={() => {
                    setEditingEvent({});
                    setIsEventModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Evento</span>
                </button>
              </div>

              {/* Events List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {bulletin.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
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
                        {ev.date} às {ev.time} • <span className="text-slate-400 font-normal">{ev.location}</span>
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingEvent(ev);
                          setIsEventModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 px-2.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-colors"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pastoral Message Manager Section */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <span>Mensagem e Reflexão Pastoral</span>
                  </h3>
                  <p className="text-xs text-slate-400">Atualize a mensagem pastoral da semana</p>
                </div>
              </div>

              {/* AI Text Refinement Assistant */}
              <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <span>Assistente de Escrita Pastoral por IA</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pastoralPrompt}
                    onChange={(e) => setPastoralPrompt(e.target.value)}
                    placeholder="Ex: Escreva uma palavra sobre gratidão e fé para o próximo domingo"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePastoralText}
                    disabled={isGeneratingPastoral || !pastoralPrompt}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shrink-0 flex items-center gap-1.5"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed"
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
                            <option value="Infantil">Infantil</option>
                            <option value="Casais">Casais</option>
                            <option value="Especial">Especial</option>
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Data do Evento
                          </label>
                          <input
                            type="text"
                            value={cartazEvent.date || ''}
                            onChange={(e) => setCartazEvent({ ...cartazEvent, date: e.target.value })}
                            placeholder="Ex: Domingo, 24 de Agosto"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
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
                      <span>Publicar no Boletim Comunhão!</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">
              {editingEvent?.id ? 'Editar Evento' : 'Novo Evento no Boletim'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={editingEvent?.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Culto">Culto</option>
                    <option value="Jovens">Jovens</option>
                    <option value="Infantil">Infantil</option>
                    <option value="Casais">Casais</option>
                    <option value="Especial">Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Horário</label>
                  <input
                    type="text"
                    required
                    value={editingEvent?.time || '19:00'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Data</label>
                  <input
                    type="text"
                    required
                    value={editingEvent?.date || 'Domingo'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Local</label>
                  <input
                    type="text"
                    value={editingEvent?.location || 'Templo Principal'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Image / Flyer Section with direct upload and framing mode */}
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingEvent?.imageUrl || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, imageUrl: e.target.value })}
                    placeholder="Cole o link da imagem (URL) ou escolha um arquivo..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar</span>
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
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            editingEvent.imageFit !== 'cover'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Sem Cortes (Inteiro)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEvent({ ...editingEvent, imageFit: 'cover' })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
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
                <label htmlFor="highlight" className="text-xs font-bold text-amber-300">
                  Marcar como Destaque Principal da Semana
                </label>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md"
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
