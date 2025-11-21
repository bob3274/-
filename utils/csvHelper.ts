
import { JapaneseWord, TravelSpot, TravelStatus, MusicItem, MediaItem, ExperienceItem, DiaryEntry, MediaType } from '../types';

// --- Helper: Escape fields for CSV (wrap in quotes if contains comma/newline) ---
const escapeCSV = (str: string | undefined | number) => {
  if (str === undefined || str === null) return '';
  const stringified = String(str);
  if (stringified.includes(',') || stringified.includes('\n') || stringified.includes('"')) {
    return `"${stringified.replace(/"/g, '""')}"`;
  }
  return stringified;
};

// --- Helper: Parse CSV Line (handling quotes) ---
const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

// --- JAPANESE SECTION ---
export const generateJapaneseCSV = (items: JapaneseWord[]): string => {
  const headers = ['ID', 'Word', 'Reading', 'Meaning (CH)', 'Meaning (JP)', 'Example', 'Example Translation', 'AddedAt'];
  const rows = items.map(item => [
    item.id, item.word, item.reading, item.meaning, item.meaningJP, item.exampleSentence, item.exampleTranslation, item.addedAt
  ].map(escapeCSV).join(','));
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
};

export const parseJapaneseCSV = (csvText: string): JapaneseWord[] => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  const items: JapaneseWord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 7) continue;
    items.push({
      id: cols[0] || Date.now().toString() + i,
      word: cols[1], reading: cols[2], meaning: cols[3], meaningJP: cols[4], exampleSentence: cols[5], exampleTranslation: cols[6],
      addedAt: Number(cols[7]) || Date.now()
    });
  }
  return items;
};

// --- TRAVEL SECTION ---
export const generateTravelCSV = (items: TravelSpot[]): string => {
  const headers = ['ID', 'Name', 'Address', 'Status', 'GoogleMapsUri', 'Rating', 'UserNotes', 'AddedAt'];
  const rows = items.map(item => [
    item.id, item.name, item.address, item.status, item.googleMapsUri, item.rating, item.userNotes, item.addedAt
  ].map(escapeCSV).join(','));
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
};

export const parseTravelCSV = (csvText: string): TravelSpot[] => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  const items: TravelSpot[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 3) continue;
    let status = TravelStatus.WANT_TO_GO;
    if (cols[3] === 'Visited' || cols[3] === '去過' || cols[3] === '行った') status = TravelStatus.VISITED;
    items.push({
      id: cols[0] || Date.now().toString() + i,
      name: cols[1], address: cols[2], status: status, googleMapsUri: cols[4], rating: cols[5] ? Number(cols[5]) : undefined, userNotes: cols[6],
      addedAt: Number(cols[7]) || Date.now()
    });
  }
  return items;
};

// --- MUSIC SECTION ---
export const generateMusicCSV = (items: MusicItem[]): string => {
  const headers = ['ID', 'Artist', 'Song', 'URL', 'AddedAt'];
  const rows = items.map(item => [
    item.id, item.artist, item.song, item.url, item.addedAt
  ].map(escapeCSV).join(','));
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
};

export const parseMusicCSV = (csvText: string): MusicItem[] => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  const items: MusicItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 3) continue;
    items.push({
      id: cols[0] || Date.now().toString() + i,
      artist: cols[1], song: cols[2], url: cols[3],
      addedAt: Number(cols[4]) || Date.now()
    });
  }
  return items;
};

// --- ENTERTAINMENT SECTION ---
export const generateMediaCSV = (items: MediaItem[]): string => {
  const headers = ['ID', 'Type', 'Title', 'Status', 'Link', 'Rating', 'Notes', 'AddedAt'];
  const rows = items.map(item => [
    item.id, item.type, item.title, item.status, item.link, item.rating, item.notes, item.addedAt
  ].map(escapeCSV).join(','));
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
};

export const parseMediaCSV = (csvText: string): MediaItem[] => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  const items: MediaItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 4) continue;
    
    const statusStr = cols[3];
    const status = (statusStr === 'Completed' ? 'Completed' : statusStr === 'Plan to Watch' ? 'Plan to Watch' : 'Watching') as MediaItem['status'];

    items.push({
      id: cols[0] || Date.now().toString() + i,
      type: cols[1] as MediaType,
      title: cols[2],
      status: status,
      link: cols[4],
      rating: Number(cols[5]) || undefined,
      notes: cols[6],
      addedAt: Number(cols[7]) || Date.now()
    });
  }
  return items;
};

// --- EXPERIENCE SECTION ---
export const generateExperienceCSV = (items: ExperienceItem[]): string => {
  const headers = ['ID', 'Title', 'Company', 'Period', 'Description', 'Tags'];
  const rows = items.map(item => [
    item.id, item.title, item.company, item.period, item.description, item.tags.join(';')
  ].map(escapeCSV).join(','));
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
};

export const parseExperienceCSV = (csvText: string): ExperienceItem[] => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  const items: ExperienceItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue;
    items.push({
      id: cols[0] || Date.now().toString() + i,
      title: cols[1], company: cols[2], period: cols[3], description: cols[4],
      tags: cols[5] ? cols[5].split(';').map(t => t.trim()) : []
    });
  }
  return items;
};

// --- DIARY SECTION ---
export const generateDiaryCSV = (items: DiaryEntry[]): string => {
  const headers = ['ID', 'Date', 'Content', 'Mood', 'Images(Base64;)', 'AddedAt'];
  const rows = items.map(item => [
    item.id, item.date, item.content, item.mood, item.images.join(';;;'), item.addedAt
  ].map(escapeCSV).join(','));
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
};

export const parseDiaryCSV = (csvText: string): DiaryEntry[] => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  const items: DiaryEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 3) continue;
    items.push({
      id: cols[0] || Date.now().toString() + i,
      date: cols[1],
      content: cols[2],
      mood: cols[3],
      images: cols[4] ? cols[4].split(';;;') : [],
      addedAt: Number(cols[5]) || Date.now()
    });
  }
  return items;
};

// --- COMMON ---
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
