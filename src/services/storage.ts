// ==========================================
// CAMPUSCONNECT - STORAGE SERVICE
// Mengelola persistensi data menggunakan LocalStorage
// Memanfaatkan Generic Function dan Type Safety
// ==========================================

import {
  CampusEvent,
  Participant,
  Registration,
  ThemeMode,
  AppConfig,
  RegistrationStatus,
  genericFindById,
  genericUpdateItem,
  genericRemoveItem
} from '../types';

// Key Penyimpanan LocalStorage
const STORAGE_KEYS = {
  EVENTS: 'campusconnect_events',
  PARTICIPANTS: 'campusconnect_participants',
  REGISTRATIONS: 'campusconnect_registrations',
  THEME: 'campusconnect_theme',
  INITIALIZED: 'campusconnect_initialized_v1'
} as const;

/**
 * Generic function untuk membaca data dari LocalStorage dengan validasi dan error handling
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    const parsed = JSON.parse(serialized);
    return parsed as T;
  } catch (error) {
    console.error(`Gagal membaca LocalStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Generic function untuk menyimpan data ke LocalStorage dengan error handling
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Gagal menyimpan ke LocalStorage key "${key}":`, error);
    return false;
  }
}

// --- DUMMY DATA INISIALISASI ---

const INITIAL_EVENTS: CampusEvent[] = [
  {
    id: 'EVT-001',
    name: 'National Tech Symposium: AI & Future Career',
    category: 'Seminar',
    description: 'Seminar teknologi nasional yang membahas tren artificial intelligence terkini, peluang karir di era otomatisasi, dan workshop praktis implementasi model AI.',
    organizer: 'BEM Fakultas Ilmu Komputer',
    location: 'Auditorium Utama Lantai 3',
    date: '2026-11-28',
    time: '09:00',
    registrationDeadline: '2026-11-27',
    quota: 150,
    registeredCount: 42,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    status: 'Upcoming',
    createdAt: '2026-11-01'
  },
  {
    id: 'EVT-002',
    name: 'Hands-on Web Dev Workshop: Modern TypeScript & Vite',
    category: 'Workshop',
    description: 'Workshop intensif coding frontend modern menggunakan TypeScript, arsitektur modular, dan teknik optimasi build Vite untuk mahasiswa tingkat lanjut.',
    organizer: 'Himpunan Mahasiswa Informatika (HMI)',
    location: 'Laboratorium Rekayasa Perangkat Lunak Gedung C',
    date: '2026-11-30',
    time: '13:00',
    registrationDeadline: '2026-11-29',
    quota: 40,
    registeredCount: 38,
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    status: 'Upcoming',
    createdAt: '2026-11-03'
  },
  {
    id: 'EVT-003',
    name: 'Campus Hackathon 2026: Smart Campus Solutions',
    category: 'Lomba',
    description: 'Kompetisi hackathon 24 jam untuk menciptakan solusi digital kampus ramah lingkungan dan sistem manajemen akademik inovatif.',
    organizer: 'Google Developer Student Club (GDSC)',
    location: 'Hall Kreatif Kampus Barat',
    date: '2026-12-05',
    time: '08:30',
    registrationDeadline: '2026-12-01',
    quota: 60,
    registeredCount: 55,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    status: 'Upcoming',
    createdAt: '2026-11-05'
  },
  {
    id: 'EVT-004',
    name: 'Career Talk: Menembus Startup Unicorn & Big Tech',
    category: 'Webinar',
    description: 'Sesi webinar eksklusif bersama alumni senior yang sukses berkarir sebagai Software Engineer dan Product Manager di perusahaan teknologi global.',
    organizer: 'Pusat Karir & Alumni',
    location: 'Zoom Cloud Meetings (Online)',
    date: '2026-11-24',
    time: '19:30',
    registrationDeadline: '2026-11-24',
    quota: 300,
    registeredCount: 285,
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    status: 'Ongoing',
    createdAt: '2026-11-10'
  },
  {
    id: 'EVT-005',
    name: 'Bakti Sosial & Donor Darah Peduli Kampus',
    category: 'Sosial',
    description: 'Kegiatan donor darah bekerja sama dengan PMI serta pembagian sembako untuk masyarakat sekitar lingkungan universitas.',
    organizer: 'KSR PMI Unit Kampus',
    location: 'Gedung Serba Guna Kampus Pusat',
    date: '2026-12-10',
    time: '08:00',
    registrationDeadline: '2026-12-08',
    quota: 100,
    registeredCount: 65,
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80',
    status: 'Upcoming',
    createdAt: '2026-11-12'
  },
  {
    id: 'EVT-006',
    name: 'Rektor Cup: Turnamen Futsal & Badminton Antar Prodi',
    category: 'Olahraga',
    description: 'Ajang kompetisi olahraga tahunan memperebutkan piala bergilir Rektor dengan cabang olahraga Futsal, Badminton, dan Basket.',
    organizer: 'Unit Kegiatan Mahasiswa Olahraga',
    location: 'Gelanggang Olahraga Kampus',
    date: '2026-12-15',
    time: '07:30',
    registrationDeadline: '2026-12-05',
    quota: 120,
    registeredCount: 110,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    status: 'Draft',
    createdAt: '2026-11-15'
  },
  {
    id: 'EVT-007',
    name: 'Musyawarah Besar & Pelantikan Pengurus Ormawa',
    category: 'Organisasi',
    description: 'Sidang tahunan evaluasi kinerja kepengurusan serta pelantikan presidium ormawa periode 2026/2027.',
    organizer: 'Dewan Perwakilan Mahasiswa',
    location: 'Ruang Sidang Graha Mahasiswa',
    date: '2026-11-18',
    time: '10:00',
    registrationDeadline: '2026-11-15',
    quota: 80,
    registeredCount: 78,
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    status: 'Completed',
    createdAt: '2026-10-25'
  }
];

const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'PAR-001',
    name: 'Raden Muhammad Fauzan',
    nim: '2301010045',
    studyProgram: 'Teknik Informatika',
    email: 'fauzan@student.campus.ac.id',
    phone: '081234567890',
    registeredAt: '2026-11-15 10:20'
  },
  {
    id: 'PAR-002',
    name: 'Anisa Siti Rahmawati',
    nim: '2301020089',
    studyProgram: 'Sistem Informasi',
    email: 'anisa.siti@student.campus.ac.id',
    phone: '081987654321',
    registeredAt: '2026-11-16 11:35'
  },
  {
    id: 'PAR-003',
    name: 'Dimas Bagus Wicaksono',
    nim: '2201010112',
    studyProgram: 'Teknik Komputer',
    email: 'dimas.bagus@student.campus.ac.id',
    phone: '082145678901',
    registeredAt: '2026-11-17 14:15'
  },
  {
    id: 'PAR-004',
    name: 'Clara Bella Putri',
    nim: '2302010033',
    studyProgram: 'Desain Komunikasi Visual',
    email: 'clara.putri@student.campus.ac.id',
    phone: '085712345678',
    registeredAt: '2026-11-18 09:00'
  },
  {
    id: 'PAR-005',
    name: 'Kevin Jonathan Arifin',
    nim: '2101010008',
    studyProgram: 'Manajemen Bisnis',
    email: 'kevin.jonathan@student.campus.ac.id',
    phone: '087812983746',
    registeredAt: '2026-11-19 16:40'
  }
];

const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'REG-101',
    eventId: 'EVT-001',
    eventName: 'National Tech Symposium: AI & Future Career',
    participantId: 'PAR-001',
    participantName: 'Raden Muhammad Fauzan',
    participantNim: '2301010045',
    studyProgram: 'Teknik Informatika',
    participantEmail: 'fauzan@student.campus.ac.id',
    participantPhone: '081234567890',
    status: 'Approved',
    registrationDate: '2026-11-15 10:20',
    notes: 'Tertarik dengan sesi LLM dan Computer Vision'
  },
  {
    id: 'REG-102',
    eventId: 'EVT-002',
    eventName: 'Hands-on Web Dev Workshop: Modern TypeScript & Vite',
    participantId: 'PAR-002',
    participantName: 'Anisa Siti Rahmawati',
    participantNim: '2301020089',
    studyProgram: 'Sistem Informasi',
    participantEmail: 'anisa.siti@student.campus.ac.id',
    participantPhone: '081987654321',
    status: 'Approved',
    registrationDate: '2026-11-16 11:35',
    notes: 'Membawa laptop pribadi dengan Node.js terinstall'
  },
  {
    id: 'REG-103',
    eventId: 'EVT-003',
    eventName: 'Campus Hackathon 2026: Smart Campus Solutions',
    participantId: 'PAR-003',
    participantName: 'Dimas Bagus Wicaksono',
    participantNim: '2201010112',
    studyProgram: 'Teknik Komputer',
    participantEmail: 'dimas.bagus@student.campus.ac.id',
    participantPhone: '082145678901',
    status: 'Pending',
    registrationDate: '2026-11-17 14:15',
    notes: 'Mendaftar tim: CyberWolf Team'
  },
  {
    id: 'REG-104',
    eventId: 'EVT-004',
    eventName: 'Career Talk: Menembus Startup Unicorn & Big Tech',
    participantId: 'PAR-004',
    participantName: 'Clara Bella Putri',
    participantNim: '2302010033',
    studyProgram: 'Desain Komunikasi Visual',
    participantEmail: 'clara.putri@student.campus.ac.id',
    participantPhone: '085712345678',
    status: 'Approved',
    registrationDate: '2026-11-18 09:00',
    notes: 'Ingin konsultasi portofolio UI/UX'
  },
  {
    id: 'REG-105',
    eventId: 'EVT-005',
    eventName: 'Bakti Sosial & Donor Darah Peduli Kampus',
    participantId: 'PAR-005',
    participantName: 'Kevin Jonathan Arifin',
    participantNim: '2101010008',
    studyProgram: 'Manajemen Bisnis',
    participantEmail: 'kevin.jonathan@student.campus.ac.id',
    participantPhone: '087812983746',
    status: 'Approved',
    registrationDate: '2026-11-19 16:40',
    notes: 'Golongan darah O positif'
  }
];

/**
 * Kelas Pengelola Data Terpadu
 */
export class StorageService {
  /**
   * Inisialisasi awal aplikasi: memuat data dummy jika LocalStorage masih kosong
   */
  public static initialize(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      saveToStorage(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
      saveToStorage(STORAGE_KEYS.PARTICIPANTS, INITIAL_PARTICIPANTS);
      saveToStorage(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
      saveToStorage(STORAGE_KEYS.THEME, 'light');
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  // --- ACARA (EVENTS) CRUD ---

  public static getEvents(): CampusEvent[] {
    return loadFromStorage<CampusEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  }

  public static getEventById(id: string): CampusEvent | undefined {
    const events = this.getEvents();
    return genericFindById(events, id);
  }

  public static createEvent(eventData: Omit<CampusEvent, 'id' | 'createdAt' | 'registeredCount'>): CampusEvent {
    const events = this.getEvents();
    const newId = `EVT-${String(Date.now()).slice(-4)}`;
    
    const newEvent: CampusEvent = {
      ...eventData,
      id: newId,
      registeredCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    events.unshift(newEvent);
    saveToStorage(STORAGE_KEYS.EVENTS, events);
    return newEvent;
  }

  public static updateEvent(id: string, updates: Partial<CampusEvent>): boolean {
    const events = this.getEvents();
    const existing = genericFindById(events, id);
    if (!existing) return false;

    const updatedEvents = genericUpdateItem(events, id, updates);
    return saveToStorage(STORAGE_KEYS.EVENTS, updatedEvents);
  }

  public static deleteEvent(id: string): boolean {
    const events = this.getEvents();
    const updatedEvents = genericRemoveItem(events, id);
    saveToStorage(STORAGE_KEYS.EVENTS, updatedEvents);

    // Hapus juga pendaftaran yang terkait dengan acara ini
    const registrations = this.getRegistrations().filter(r => r.eventId !== id);
    saveToStorage(STORAGE_KEYS.REGISTRATIONS, registrations);

    return true;
  }

  // --- PENDAFTARAN (REGISTRATIONS) ---

  public static getRegistrations(): Registration[] {
    return loadFromStorage<Registration[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
  }

  public static isAlreadyRegistered(eventId: string, nim: string): boolean {
    const registrations = this.getRegistrations();
    return registrations.some(
      r => r.eventId === eventId && r.participantNim.toLowerCase() === nim.toLowerCase() && r.status !== 'Cancelled'
    );
  }

  public static createRegistration(params: {
    eventId: string;
    participantName: string;
    participantNim: string;
    studyProgram: string;
    participantEmail: string;
    participantPhone: string;
    notes?: string;
  }): { success: boolean; message: string; registration?: Registration } {
    const event = this.getEventById(params.eventId);
    if (!event) {
      return { success: false, message: 'Acara tidak ditemukan.' };
    }

    // 1. Cek batas waktu pendaftaran
    const today = new Date().toISOString().split('T')[0];
    if (event.registrationDeadline < today) {
      return { success: false, message: 'Batas waktu pendaftaran untuk acara ini telah berakhir.' };
    }

    // 2. Cek status acara
    if (event.status === 'Completed' || event.status === 'Cancelled') {
      return { success: false, message: `Acara tidak menerima pendaftaran karena berstatus ${event.status}.` };
    }

    // 3. Cek kuota
    if (event.registeredCount >= event.quota) {
      return { success: false, message: 'Mohon maaf, kuota peserta untuk acara ini sudah penuh.' };
    }

    // 4. Cek pendaftaran ganda berdasarkan NIM
    if (this.isAlreadyRegistered(params.eventId, params.participantNim)) {
      return { success: false, message: `NIM ${params.participantNim} sudah terdaftar pada acara ini!` };
    }

    // Daftarkan atau update data peserta
    let participants = this.getParticipants();
    let participant = participants.find(p => p.nim.toLowerCase() === params.participantNim.toLowerCase());

    if (!participant) {
      participant = {
        id: `PAR-${String(Date.now()).slice(-4)}`,
        name: params.participantName,
        nim: params.participantNim,
        studyProgram: params.studyProgram,
        email: params.participantEmail,
        phone: params.participantPhone,
        registeredAt: new Date().toLocaleString('sv').slice(0, 16)
      };
      participants.push(participant);
      saveToStorage(STORAGE_KEYS.PARTICIPANTS, participants);
    }

    // Buat data pendaftaran
    const newRegistration: Registration = {
      id: `REG-${String(Date.now()).slice(-4)}`,
      eventId: event.id,
      eventName: event.name,
      participantId: participant.id,
      participantName: params.participantName,
      participantNim: params.participantNim,
      studyProgram: params.studyProgram,
      participantEmail: params.participantEmail,
      participantPhone: params.participantPhone,
      status: 'Pending',
      registrationDate: new Date().toLocaleString('sv').slice(0, 16),
      notes: params.notes || ''
    };

    const registrations = this.getRegistrations();
    registrations.unshift(newRegistration);
    saveToStorage(STORAGE_KEYS.REGISTRATIONS, registrations);

    // Tambah jumlah pendaftar di acara
    this.updateEvent(event.id, { registeredCount: event.registeredCount + 1 });

    return {
      success: true,
      message: 'Pendaftaran berhasil dikirim! Silakan menunggu konfirmasi panitia.',
      registration: newRegistration
    };
  }

  public static updateRegistrationStatus(registrationId: string, newStatus: RegistrationStatus): boolean {
    const registrations = this.getRegistrations();
    const reg = genericFindById(registrations, registrationId);
    if (!reg) return false;

    const oldStatus = reg.status;
    const updated = genericUpdateItem(registrations, registrationId, { status: newStatus });
    saveToStorage(STORAGE_KEYS.REGISTRATIONS, updated);

    // Kelola hitungan kuota jika status dibatalkan/ditolak
    if ((newStatus === 'Cancelled' || newStatus === 'Rejected') && oldStatus !== 'Cancelled' && oldStatus !== 'Rejected') {
      const event = this.getEventById(reg.eventId);
      if (event && event.registeredCount > 0) {
        this.updateEvent(event.id, { registeredCount: event.registeredCount - 1 });
      }
    } else if ((oldStatus === 'Cancelled' || oldStatus === 'Rejected') && (newStatus === 'Approved' || newStatus === 'Pending')) {
      const event = this.getEventById(reg.eventId);
      if (event) {
        this.updateEvent(event.id, { registeredCount: event.registeredCount + 1 });
      }
    }

    return true;
  }

  public static deleteRegistration(id: string): boolean {
    const registrations = this.getRegistrations();
    const reg = genericFindById(registrations, id);
    if (!reg) return false;

    // Kurangi kuota jika statusnya bukan Cancelled/Rejected
    if (reg.status !== 'Cancelled' && reg.status !== 'Rejected') {
      const event = this.getEventById(reg.eventId);
      if (event && event.registeredCount > 0) {
        this.updateEvent(event.id, { registeredCount: event.registeredCount - 1 });
      }
    }

    const updated = genericRemoveItem(registrations, id);
    return saveToStorage(STORAGE_KEYS.REGISTRATIONS, updated);
  }

  // --- PESERTA (PARTICIPANTS) CRUD ---

  public static getParticipants(): Participant[] {
    return loadFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, INITIAL_PARTICIPANTS);
  }

  public static getParticipantById(id: string): Participant | undefined {
    const participants = this.getParticipants();
    return genericFindById(participants, id);
  }

  public static updateParticipant(id: string, updates: Partial<Participant>): boolean {
    const participants = this.getParticipants();
    const existing = genericFindById(participants, id);
    if (!existing) return false;

    const updatedList = genericUpdateItem(participants, id, updates);
    saveToStorage(STORAGE_KEYS.PARTICIPANTS, updatedList);

    // Sinkronisasikan perubahan nama atau kontak ke pendaftaran terkait
    const registrations = this.getRegistrations().map(reg => {
      if (reg.participantId === id) {
        return {
          ...reg,
          participantName: updates.name ?? reg.participantName,
          participantNim: updates.nim ?? reg.participantNim,
          studyProgram: updates.studyProgram ?? reg.studyProgram,
          participantEmail: updates.email ?? reg.participantEmail,
          participantPhone: updates.phone ?? reg.participantPhone
        };
      }
      return reg;
    });
    saveToStorage(STORAGE_KEYS.REGISTRATIONS, registrations);

    return true;
  }

  public static deleteParticipant(id: string): boolean {
    const participants = this.getParticipants();
    const updated = genericRemoveItem(participants, id);
    saveToStorage(STORAGE_KEYS.PARTICIPANTS, updated);

    // Hapus juga pendaftaran peserta terkait
    const registrations = this.getRegistrations();
    const regToDelete = registrations.filter(r => r.participantId === id);
    
    // Perbarui kuota acara terkait
    regToDelete.forEach(r => {
      if (r.status !== 'Cancelled' && r.status !== 'Rejected') {
        const event = this.getEventById(r.eventId);
        if (event && event.registeredCount > 0) {
          this.updateEvent(event.id, { registeredCount: event.registeredCount - 1 });
        }
      }
    });

    const updatedRegs = registrations.filter(r => r.participantId !== id);
    saveToStorage(STORAGE_KEYS.REGISTRATIONS, updatedRegs);

    return true;
  }

  // --- TEMA & PENGATURAN ---

  public static getTheme(): ThemeMode {
    return loadFromStorage<ThemeMode>(STORAGE_KEYS.THEME, 'light');
  }

  public static setTheme(theme: ThemeMode): void {
    saveToStorage(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  public static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
    localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    this.initialize();
  }
}
