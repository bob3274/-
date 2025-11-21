
// Enums
export enum MediaType {
  YOUTUBE = 'YouTube',
  ANIME = 'Anime',
  MANGA = 'Manga',
  DRAMA = 'Drama',
}

export enum Language {
  ZH_TW = 'zh-TW',
  JA_JP = 'ja-JP',
}

export enum TravelStatus {
  WANT_TO_GO = 'Want to Go',
  VISITED = 'Visited',
}

// Interfaces
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  pin?: string; // 4-digit security PIN
}

export interface MusicItem {
  id: string;
  artist: string;
  song: string;
  url: string;
  addedAt: number;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  status: 'Watching' | 'Completed' | 'Plan to Watch';
  rating?: number; // 1-5
  notes?: string;
  link?: string;
  addedAt: number;
}

export interface JapaneseWord {
  id: string;
  word: string;
  reading: string;
  meaning: string; // Traditional Chinese
  meaningJP: string; // Japanese Definition
  exampleSentence: string;
  exampleTranslation: string;
  addedAt: number;
}

export interface TravelSpot {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  userNotes?: string;
  googleMapsUri?: string;
  status: TravelStatus;
  addedAt: number;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  tags: string[];
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  images: string[]; // Base64 strings
  mood?: string;
  addedAt: number;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  expiresAt?: number; // Timestamp when message should be deleted
}

export enum View {
  DASHBOARD = 'Dashboard',
  MUSIC = 'Music',
  ENTERTAINMENT = 'Entertainment',
  TRAVEL = 'Travel',
  JAPANESE = 'Japanese',
  EXPERIENCE = 'Experience',
  DIARY = 'Diary',
  MESSAGES = 'Messages',
}
