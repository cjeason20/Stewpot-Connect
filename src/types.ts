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
  notifResources?: boolean;
  notifEvents?: boolean;
  notifTeam?: boolean;
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
  consentType: string; // 'named' | 'anonymous'
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // "YYYY-MM-DD"
  time?: string;      // "HH:MM" 24-hour, e.g. "09:00"
  endTime?: string;   // "HH:MM"
  location?: string;
  description?: string;
  category: 'Meeting' | 'Training' | 'Fundraiser' | 'Community' | 'Holiday' | 'Other';
  allDay?: boolean;
  createdBy?: string;
  status?: 'approved' | 'pending';
  submittedBy?: string;
  submitterName?: string;
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

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  uploadedBy: string;
  uploadedById: string;
  date: string; // ISO string
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
