export type UserRole = 'admin' | 'member';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  title?: string;
  dept?: string;
  role: UserRole;
  initials?: string;
  bday?: string;
  anniv?: string;
  photo?: string;
  photoPosX?: string;
  photoPosY?: string;
  notifPosts?: boolean;
  notifAnnounce?: boolean;
  notifBdays?: boolean;
  notifStories?: boolean;
}

export interface Story {
  id: number;
  title: string;
  program: string;
  date: string;
  audioUrl?: string;
  author: string;
  authorId?: number;
  notes?: string;
  hasConsent: boolean;
  consentType: string; // 'none' | 'internal' | 'external'
}

export type PostCategory = 'Announcement' | 'Kudos' | 'Update' | 'Question';

export interface PostAttachment {
  name: string;
  type: string;
  data: string;
  kind: 'file' | 'photo';
}

export interface Post {
  id: number;
  author: string;
  initials: string;
  authorId?: number | null;
  cat: PostCategory;
  text: string;
  link?: string;
  attachment?: PostAttachment | null;
  date: string;
}

export interface DocumentItem {
  id: number;
  name: string;
  displayName: string;
  size: string;
  type: string;
  date: string;
  data: string;
  cat: 'staff' | 'programs' | 'brand';
  driveLink?: string;
}
