import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  BookOpen,
  Bell,
  Clock,
  MapPin,
  Share2,
  Filter,
  Search,
  Quote,
  CheckCircle,
  Tag,
  ChevronRight,
  ChevronLeft,
  User,
  Heart,
  MessageSquare,
  Bookmark,
  Maximize2,
  Eye,
  ZoomIn
} from 'lucide-react';
import { WeeklyBulletin, PublicTabType, EventCategory, ChurchEvent } from '../types';
import { ImageLightboxModal } from './ImageLightboxModal';

interface PublicViewProps {
  bulletin: WeeklyBulletin;
}

export const PublicView: React.FC<PublicViewProps> = ({ bulletin }) => {
  const [activeTab, setActiveTab] = useState<PublicTabType>('inicio');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  
  // Lightbox state for expanding full flyer in high definition
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

  // Toggle favorite/saved event
  const toggleSaveEvent = (eventId: string) => {
    setSavedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  // Filter events for Programação
  const filteredEvents = bulletin.events.filter((ev) => {
    const matchesCat = selectedCategory === 'Todos' || ev.category === selectedCategory;
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Share function
  const handleShareWhatsApp = (title: string, date: string, time: string) => {
    const text = encodeURIComponent(
      `*${bulletin.churchName} - Boletim Comunhão!*\n\n📌 *${title}*\n📅 ${date} às ${time}\n\nConfira a programação completa no nosso boletim digital: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const highlightEvent = bulletin.events.find((e) => e.highlight) || bulletin.events[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 sm:pb-20">
      
      {/* Hero Welcome Banner */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800/80 pt-5 pb-7 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-3.5">
          
          {/* Top Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{bulletin.weekRange}</span>
            </div>

            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Atualização Semanal
            </span>
          </div>

          {/* Title & Slogan */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Boletim</span>
              <span className="text-amber-400">Comunhão!</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Programação dos cultos, avisos e palavra pastoral da IBCIP
            </p>
          </div>

          {/* Theme Verse Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3 shadow-inner">
            <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                "{bulletin.themeVerse}"
              </p>
              <p className="text-[11px] font-bold text-amber-400 mt-1">
                {bulletin.themeVerseRef}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Main Tab Navigation Bar (Desktop & Tablet Sticky Tabs only - Hidden on Mobile) */}
      <div className="hidden sm:block sticky top-14 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-2 gap-1.5 sm:gap-2">
          
          <button
            onClick={() => setActiveTab('inicio')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all touch-manipulation ${
              activeTab === 'inicio' || activeTab === 'programacao'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Programação</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'inicio' || activeTab === 'programacao'
                ? 'bg-slate-950 text-amber-300'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {bulletin.events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pastoral')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all touch-manipulation ${
              activeTab === 'pastoral'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mensagem Pastoral</span>
          </button>

          <button
            onClick={() => setActiveTab('avisos')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all touch-manipulation ${
              activeTab === 'avisos'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Avisos</span>
            {bulletin.notices.length > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                activeTab === 'avisos'
                  ? 'bg-slate-950 text-amber-300'
                  : 'bg-amber-400 text-slate-950'
              }`}>
                {bulletin.notices.length}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Content Body Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-6 space-y-6 sm:space-y-8">

        {/* UNIFIED TAB: INÍCIO & PROGRAMAÇÃO */}
        {(activeTab === 'inicio' || activeTab === 'programacao') && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            
            {/* 1. Weekly Highlight Flyer Hero with Smart Framing */}
            {highlightEvent && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    <span>Destaque da Semana</span>
                  </h2>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Especial
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl hover:border-slate-700 transition-all group">
                  {highlightEvent.imageUrl && (
                    <div
                      className="relative w-full aspect-[4/5] sm:aspect-[16/9] max-h-[500px] overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer select-none"
                      onClick={() =>
                        openLightbox(
                          highlightEvent.imageUrl!,
                          highlightEvent.title,
                          highlightEvent.category,
                          highlightEvent.date,
                          highlightEvent.time
                        )
                      }
                    >
                      {/* Ambient Glowing Backdrop: Preserves full flyer without ugly black void */}
                      <div
                        className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-45 scale-110"
                        style={{ backgroundImage: `url(${highlightEvent.imageUrl})` }}
                      />

                      {/* Sharp Full Poster with NO CROPPED TEXT */}
                      <img
                        src={highlightEvent.imageUrl}
                        alt={highlightEvent.title}
                        className={`relative z-10 max-h-full max-w-full ${
                          highlightEvent.imageFit === 'cover' ? 'w-full h-full object-cover' : 'object-contain p-1 sm:p-2'
                        } rounded-xl group-hover:scale-[1.02] transition-transform duration-300 drop-shadow-2xl`}
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Top Overlay Badges */}
                      <div className="absolute top-3 left-3 z-20 flex gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black uppercase shadow-lg">
                          {highlightEvent.category}
                        </span>
                      </div>

                      {/* Click to expand pill */}
                      <div className="absolute top-3 right-3 z-20">
                        <span className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-amber-300 text-xs font-bold backdrop-blur-md border border-slate-700/80 flex items-center gap-1.5 shadow-lg group-hover:border-amber-400/60 transition-colors">
                          <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ampliar Cartaz HD</span>
                        </span>
                      </div>

                      {/* Bottom Date Overlay for Quick Glance */}
                      <div className="absolute bottom-3 left-3 right-3 z-20">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-300">
                          <span className="flex items-center gap-1 bg-slate-950/90 px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-800 shadow-md">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {highlightEvent.date} às {highlightEvent.time}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-950/90 px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-800 shadow-md">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {highlightEvent.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-6 space-y-3">
                    <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                      {highlightEvent.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {highlightEvent.description}
                    </p>

                    {highlightEvent.tags && highlightEvent.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {highlightEvent.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] sm:text-[11px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-800">
                      <button
                        onClick={() => toggleSaveEvent(highlightEvent.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${
                          savedEvents.includes(highlightEvent.id)
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{savedEvents.includes(highlightEvent.id) ? 'Salvo nos Lembretes' : 'Lembrar Evento'}</span>
                      </button>

                      <button
                        onClick={() =>
                          handleShareWhatsApp(
                            highlightEvent.title,
                            highlightEvent.date,
                            highlightEvent.time
                          )
                        }
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 ml-auto"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Convidar no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Search Bar with Magnifier Icon */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar culto, evento ou preletor..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                  <strong className="text-amber-400">{filteredEvents.length}</strong> evento(s)
                </span>
              </div>
            </div>

            {/* 3. Complete Programação Events List with Mobile-Optimized Framing */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <span>Programação Completa da Semana</span>
                </h2>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs sm:text-sm text-slate-400">Nenhum evento encontrado para os filtros selecionados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden p-3.5 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-5 transition-all shadow-lg group"
                    >
                      {/* Event Image on mobile: Aspect 4/5 or contained with ambient glow for maximum readability */}
                      {ev.imageUrl && (
                        <div
                          className="w-full md:w-56 aspect-[4/5] sm:aspect-square md:aspect-auto md:h-56 rounded-2xl overflow-hidden bg-slate-950 shrink-0 relative flex items-center justify-center cursor-pointer select-none shadow-md border border-slate-800"
                          onClick={() =>
                            openLightbox(
                              ev.imageUrl!,
                              ev.title,
                              ev.category,
                              ev.date,
                              ev.time
                            )
                          }
                        >
                          {/* Ambient glow backdrop */}
                          <div
                            className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110"
                            style={{ backgroundImage: `url(${ev.imageUrl})` }}
                          />

                          {/* Crisp centered image */}
                          <img
                            src={ev.imageUrl}
                            alt={ev.title}
                            className={`relative z-10 max-h-full max-w-full ${
                              ev.imageFit === 'cover' ? 'w-full h-full object-cover' : 'object-contain p-1.5'
                            } group-hover:scale-105 transition-transform duration-300 drop-shadow-md`}
                            referrerPolicy="no-referrer"
                          />

                          <span className="absolute top-2.5 left-2.5 z-20 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-md">
                            {ev.category}
                          </span>

                          <span className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-slate-950/85 text-amber-300 text-[10px] font-bold border border-slate-700 backdrop-blur-sm shadow-md flex items-center gap-1">
                            <ZoomIn className="w-3 h-3" />
                            <span>Ampliar</span>
                          </span>
                        </div>
                      )}

                      {/* Event Main Content */}
                      <div className="flex-1 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {!ev.imageUrl && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                {ev.category}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
                              <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shadow-sm">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                {ev.date}
                              </span>
                              <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                {ev.time}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                            {ev.title}
                          </h3>
                          
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {ev.description}
                          </p>

                          {ev.tags && ev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {ev.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-semibold bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer Info & Actions */}
                        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate max-w-[170px] sm:max-w-none">{ev.location}</span>
                          </span>

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => toggleSaveEvent(ev.id)}
                              className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                                savedEvents.includes(ev.id)
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                              }`}
                              title="Salvar nos meus lembretes"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleShareWhatsApp(ev.title, ev.date, ev.time)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1 active:scale-95"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Convidar</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. Quick Pastoral Preview Card */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3.5 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={bulletin.pastoral.pastorPhotoUrl}
                    alt={bulletin.pastoral.pastorName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Palavra Pastoral</span>
                    <h3 className="font-extrabold text-sm sm:text-base text-white">{bulletin.pastoral.title}</h3>
                    <p className="text-xs text-slate-300 font-medium">{bulletin.pastoral.pastorName}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('pastoral')}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all text-center"
                >
                  Ler Reflexão Completa
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 border-l-2 border-amber-500 pl-3 leading-relaxed">
                "{bulletin.pastoral.verse}" — {bulletin.pastoral.verseReference}
              </p>
            </section>

            {/* 5. Quick Notices Preview */}
            {bulletin.notices.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Avisos Importantes ({bulletin.notices.length})</span>
                  </h3>

                  <button
                    onClick={() => setActiveTab('avisos')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    Ver Todos
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {bulletin.notices.slice(0, 2).map((notice) => (
                    <div
                      key={notice.id}
                      onClick={() => setActiveTab('avisos')}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer space-y-1 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {notice.category}
                        </span>
                        <span className="text-[10px] text-slate-500">{notice.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{notice.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{notice.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* TAB 2: PASTORAL */}
        {activeTab === 'pastoral' && (
          <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
            
            {/* Pastor Profile Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                <img
                  src={bulletin.pastoral.pastorPhotoUrl}
                  alt={bulletin.pastoral.pastorName}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-amber-500 shadow-xl shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                    Mensagem Pastoral da Semana
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-white pt-1">
                    {bulletin.pastoral.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-amber-300">
                    {bulletin.pastoral.pastorName} • <span className="text-slate-400 font-normal">{bulletin.pastoral.pastorTitle}</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500">{bulletin.pastoral.date}</p>
                </div>
              </div>

              {/* Bible Verse Callout */}
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wide">
                  <BookOpen className="w-4 h-4" />
                  <span>Versículo em Destaque</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  "{bulletin.pastoral.verse}"
                </p>
                <p className="text-xs font-bold text-amber-400 text-right">
                  — {bulletin.pastoral.verseReference}
                </p>
              </div>

              {/* Pastoral Content Paragraphs */}
              <div className="text-slate-200 text-sm sm:text-base leading-relaxed space-y-4 font-sans">
                {bulletin.pastoral.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-justify sm:text-left">{paragraph}</p>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() =>
                    handleShareWhatsApp(
                      `Mensagem Pastoral: ${bulletin.pastoral.title}`,
                      bulletin.pastoral.date,
                      'Online'
                    )
                  }
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar Reflexão no WhatsApp</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: AVISOS */}
        {activeTab === 'avisos' && (
          <div className="space-y-5 sm:space-y-6 animate-fadeIn max-w-3xl mx-auto">
            
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <span>Mural de Avisos da Igreja</span>
                </h2>
                <p className="text-xs text-slate-400">Informativos gerais da semana na IBCIP</p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                {bulletin.notices.length} avisos
              </span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {bulletin.notices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                      {notice.category}
                    </span>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        notice.importance === 'Alta'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : notice.importance === 'Média'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Prioridade {notice.importance}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-white">{notice.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{notice.content}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>{notice.date}</span>
                    {notice.contactName && (
                      <span className="font-semibold text-amber-300">Contato: {notice.contactName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="mt-8 py-6 border-t border-slate-900 text-center text-xs text-slate-500 space-y-1 px-4">
        <p className="font-bold text-slate-400">
          Comunhão! • {bulletin.churchName}
        </p>
        <p className="text-[11px]">
          Acesse pelo QR Code no mural da igreja sem necessidade de instalação de aplicativo.
        </p>
      </footer>

      {/* Mobile Floating Bottom Bar for Ultra-Easy One-Thumb Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 px-3 py-2 shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          
          <button
            onClick={() => {
              setActiveTab('inicio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all touch-manipulation ${
              activeTab === 'inicio' || activeTab === 'programacao'
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Programação</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pastoral');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all touch-manipulation ${
              activeTab === 'pastoral'
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">Pastoral</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('avisos');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all touch-manipulation relative ${
              activeTab === 'avisos'
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {bulletin.notices.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
              )}
            </div>
            <span className="text-[10px]">Avisos</span>
          </button>

        </div>
      </nav>

      {/* Full-Screen High-Definition Flyer Lightbox with Zoom, Pan, and Full Touch Support */}
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
