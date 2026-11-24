// ==========================================
// CAMPUSCONNECT - AUTHENTICATION SERVICE
// Mengelola sesi login, logout, dan otentikasi mahasiswa & admin
// ==========================================

import { AuthUser } from '../types';
import { StorageService, loadFromStorage, saveToStorage } from './storage';

const AUTH_KEY = 'campusconnect_auth_session';

// Akun default admin
const DEFAULT_ADMIN: AuthUser = {
  id: 'ADM-001',
  name: 'Biro Kemahasiswaan & Alumni',
  nim: 'ADMIN-KAMPUS',
  studyProgram: 'Direktorat Kemahasiswaan',
  email: 'kemahasiswaan@campus.ac.id',
  phone: '081122334455',
  role: 'admin'
};

export class AuthService {
  /**
   * Mengambil data pengguna yang sedang login saat ini
   */
  public static getCurrentUser(): AuthUser | null {
    const user = loadFromStorage<AuthUser | null>(AUTH_KEY, null);
    if (!user) {
      // Default auto-login sebagai mahasiswa awal (Raden Muhammad Fauzan) agar langsung bisa eksplorasi
      const participants = StorageService.getParticipants();
      if (participants.length > 0) {
        const defaultStudent = participants[0];
        const initialUser: AuthUser = {
          id: defaultStudent.id,
          name: defaultStudent.name,
          nim: defaultStudent.nim,
          studyProgram: defaultStudent.studyProgram,
          email: defaultStudent.email,
          phone: defaultStudent.phone,
          role: 'student'
        };
        this.setCurrentUser(initialUser);
        return initialUser;
      }
    }
    return user;
  }

  public static setCurrentUser(user: AuthUser | null): void {
    if (user) {
      saveToStorage(AUTH_KEY, user);
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }

  /**
   * Login Mahasiswa berdasarkan NIM
   */
  public static loginAsStudent(nim: string): { success: boolean; message: string; user?: AuthUser } {
    const participants = StorageService.getParticipants();
    const student = participants.find(p => p.nim.trim().toLowerCase() === nim.trim().toLowerCase());

    if (!student) {
      return {
        success: false,
        message: `NIM ${nim} belum terdaftar. Silakan gunakan opsi 'Daftar Akun Mahasiswa Baru'.`
      };
    }

    const authUser: AuthUser = {
      id: student.id,
      name: student.name,
      nim: student.nim,
      studyProgram: student.studyProgram,
      email: student.email,
      phone: student.phone,
      role: 'student'
    };

    this.setCurrentUser(authUser);
    return {
      success: true,
      message: `Selamat datang kembali, ${student.name}!`,
      user: authUser
    };
  }

  /**
   * Login sebagai Admin (Biro Kemahasiswaan)
   */
  public static loginAsAdmin(): AuthUser {
    this.setCurrentUser(DEFAULT_ADMIN);
    return DEFAULT_ADMIN;
  }

  /**
   * Pendaftaran Akun Mahasiswa Baru
   */
  public static registerNewStudent(params: {
    name: string;
    nim: string;
    studyProgram: string;
    email: string;
    phone: string;
  }): { success: boolean; message: string; user?: AuthUser } {
    const participants = StorageService.getParticipants();
    const existing = participants.find(p => p.nim.toLowerCase() === params.nim.trim().toLowerCase());

    if (existing) {
      return {
        success: false,
        message: `Mahasiswa dengan NIM ${params.nim} sudah terdaftar. Silakan langsung login.`
      };
    }

    const newStudentId = `PAR-${String(Date.now()).slice(-4)}`;
    const newStudent = {
      id: newStudentId,
      name: params.name.trim(),
      nim: params.nim.trim(),
      studyProgram: params.studyProgram,
      email: params.email.trim(),
      phone: params.phone.trim(),
      registeredAt: new Date().toLocaleString('sv').slice(0, 16)
    };

    participants.push(newStudent);
    saveToStorage('campusconnect_participants', participants);

    const authUser: AuthUser = {
      ...newStudent,
      role: 'student'
    };

    this.setCurrentUser(authUser);
    return {
      success: true,
      message: `Akun mahasiswa untuk ${params.name} berhasil dibuat dan langsung login!`,
      user: authUser
    };
  }

  /**
   * Logout dari sesi saat ini
   */
  public static logout(): void {
    this.setCurrentUser(null);
  }

  public static isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  public static isStudent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'student';
  }

  public static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }
}
