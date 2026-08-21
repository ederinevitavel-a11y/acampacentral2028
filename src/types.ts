export type BulletinStatus = 'Publicado' | 'Rascunho';

export type EventCategory = 'Culto' | 'Jovens' | 'Infantil' | 'Casais' | 'Especial' | 'Aviso';

export interface ChurchEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl?: string;
  imageFit?: 'contain' | 'cover';
  highlight?: boolean;
  tags?: string[];
  createdAt: string;
}

export interface PastoralMessage {
  id: string;
  title: string;
  pastorName: string;
  pastorTitle: string;
  pastorPhotoUrl: string;
  verse: string;
  verseReference: string;
  content: string;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  category: string;
  content: string;
  importance: 'Baixa' | 'Média' | 'Alta';
  date: string;
  contactName?: string;
}

export interface WeeklyBulletin {
  id: string;
  editionNumber: string;
  weekRange: string;
  themeVerse: string;
  themeVerseRef: string;
  status: BulletinStatus;
  publishedAt: string;
  churchName: string;
  churchAddress: string;
  churchLogoUrl?: string;
  events: ChurchEvent[];
  pastoral: PastoralMessage;
  notices: Notice[];
}

export interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  role: 'Administrador' | 'Editor' | 'Pastor';
  addedAt: string;
  avatarUrl?: string;
}

export type PublicTabType = 'inicio' | 'pastoral' | 'programacao' | 'avisos';

export type AdminTabType = 'editor' | 'ai_upload';
