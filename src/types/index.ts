// ==========================================
// CAMPUSCONNECT - TYPE DEFINITIONS
// Memenuhi penerapan:
// 1. Primitive types (string, number, boolean)
// 2. Type Alias & Union Types (EventCategory, EventStatus, RegistrationStatus, ThemeMode)
// 3. Interfaces (CampusEvent, Participant, Registration, DashboardStats)
// 4. Array types (CampusEvent[], Participant[], Registration[])
// 5. Generics (StorageResult<T>, FilterOptions<T>, Generic CRUD helpers)
// ==========================================

// --- Type Alias & Union Types ---
export type EventCategory = 
  | 'Seminar' 
  | 'Workshop' 
  | 'Lomba' 
  | 'Webinar' 
  | 'Organisasi' 
  | 'Sosial' 
  | 'Olahraga' 
  | 'Lainnya';

export type EventStatus = 
  | 'Draft' 
  | 'Upcoming' 
  | 'Ongoing' 
  | 'Completed' 
  | 'Cancelled';

export type RegistrationStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'Cancelled';

export type ThemeMode = 'light' | 'dark';

export type UserRole = 'student' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  nim: string;
  studyProgram: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

export type ActivePage = 
  | 'dashboard' 
  | 'events' 
  | 'catalog' 
  | 'registrations' 
  | 'participants' 
  | 'my-registrations'
  | 'settings';

export type SortOrder = 'asc' | 'desc';

// --- Interfaces ---

/**
 * Interface Acara Kampus (menggunakan CampusEvent untuk menghindari konflik nama dengan Event DOM)
 */
export interface CampusEvent {
  id: string;
  name: string;
  category: EventCategory;
  description: string;
  organizer: string;
  location: string;
  date: string;                  // Format: YYYY-MM-DD
  time: string;                  // Format: HH:MM
  registrationDeadline: string;  // Format: YYYY-MM-DD
  quota: number;
  registeredCount: number;
  image: string;
  status: EventStatus;
  createdAt: string;
}

/**
 * Interface Peserta Kampus
 */
export interface Participant {
  id: string;
  name: string;
  nim: string;
  studyProgram: string;
  email: string;
  phone: string;
  registeredAt: string;
}

/**
 * Interface Pendaftaran Kegiatan Mahasiswa
 */
export interface Registration {
  id: string;
  eventId: string;
  eventName?: string;
  participantId: string;
  participantName: string;
  participantNim: string;
  studyProgram: string;
  participantEmail: string;
  participantPhone: string;
  status: RegistrationStatus;
  registrationDate: string;
  notes?: string;
}

/**
 * Interface Statistik Dashboard
 */
export interface DashboardStats {
  totalEvents: number;
  totalParticipants: number;
  totalRegistrations: number;
  ongoingEvents: number;
  upcomingEvents: number;
  completedEvents: number;
}

/**
 * Interface Konfigurasi Aplikasi (Environment Variables & Settings)
 */
export interface AppConfig {
  appName: string;
  appVersion: string;
  theme: ThemeMode;
  notificationsEnabled: boolean;
}

// --- Generics Sederhana ---

/**
 * Generic response container untuk operasi data storage
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  message: string;
}

/**
 * Generic Filter & Sort Options
 */
export interface QueryOptions<T> {
  searchTerm?: string;
  searchFields?: (keyof T)[];
  filter?: Partial<Record<keyof T, any>>;
  sortBy?: keyof T;
  sortOrder?: SortOrder;
}

/**
 * Generic function untuk menyaring array data berdasarkan kata kunci pencarian
 */
export function genericSearch<T>(
  items: T[], 
  searchTerm: string, 
  searchFields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;
  const lowerTerm = searchTerm.toLowerCase();

  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerTerm);
    });
  });
}

/**
 * Generic function untuk mengurutkan array data
 */
export function genericSort<T>(
  items: T[], 
  sortKey: keyof T, 
  order: SortOrder = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (valA === valB) return 0;
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    let comparison = 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      comparison = valA - valB;
    } else {
      comparison = String(valA).localeCompare(String(valB));
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Generic function untuk menemukan item berdasarkan id
 */
export function genericFindById<T extends { id: string }>(
  items: T[], 
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

/**
 * Generic function untuk memperbarui item dalam array
 */
export function genericUpdateItem<T extends { id: string }>(
  items: T[], 
  id: string, 
  updates: Partial<T>
): T[] {
  return items.map(item => (item.id === id ? { ...item, ...updates } : item));
}

/**
 * Generic function untuk menghapus item dari array
 */
export function genericRemoveItem<T extends { id: string }>(
  items: T[], 
  id: string
): T[] {
  return items.filter(item => item.id !== id);
}
