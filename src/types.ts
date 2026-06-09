export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  title?: string;
  dept?: string;
  role: UserRole;
  initials?: string;
  bday?: string;
  anniv?: string;
  phone?: string;
  photo?: string;
  photoPosX?: string;
  photoPosY?: string;
  notifPosts?: boolean;
  notifAnnounce?: boolean;
  notifBdays?: boolean;
  notifStories?: boolean;
}

export interface Story {
  id: string;
  title: string;
  program: string;
  date: string;
  audioUrl?: string;
  author: string;
  authorId?: string;
  interviewee?: string;
  photoUrl?: string;
  waiverUrl?: string;
  notes?: string;
  hasConsent: boolean;
  consentType: string; // 'none' | 'internal' | 'external'
}

export interface Prompt {
  id: string;
  text: string;
  category?: string; // optional program tag, e.g. "Community Kitchen"
  createdAt?: string;
}

export type PostCategory = 'Announcement' | 'Kudos' | 'Update' | 'Question';

export interface PostAttachment {
  name: string;
  type: string;
  data: string;
  kind: 'file' | 'photo';
}

export interface Post {
  id: string;
  author: string;
  initials: string;
  authorId?: string | null;
  cat: PostCategory;
  text: string;
  link?: string;
  attachment?: PostAttachment | null;
  date: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  displayName: string;
  size: string;
  type: string;
  date: string;
  data?: string;
  storageUrl?: string;
  cat: 'staff' | 'programs' | 'brand';
  driveLink?: string;
}
