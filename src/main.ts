// ==========================================
// CAMPUSCONNECT - MAIN APPLICATION ENTRY POINT
// Routing, Multi-Role, Auth (Login/Logout), & State Management
// ==========================================

import { StorageService } from './services/storage';
import { AuthService } from './services/auth';
import { ActivePage, ThemeMode, UserRole } from './types';
import { renderDashboard } from './pages/dashboard';
import { renderEvents } from './pages/events';
import { renderRegistrations } from './pages/registrations';
import { renderParticipants } from './pages/participants';
import { renderMyRegistrations } from './pages/myRegistrations';
import { renderSettings } from './pages/settings';
import { showToast, openModal, closeModal, escapeHtml } from './utils/helpers';

// State Aplikasi
let currentRole: UserRole = 'student';
let currentPage: ActivePage = 'catalog';

// Metadata Halaman
const PAGE_METADATA: Record<ActivePage, { title: string; desc: string }> = {
  dashboard: {
    title: 'Dashboard Admin',
    desc: 'Ringkasan metrik statistik dan aktivitas kegiatan kampus'
  },
  events: {
    title: 'Manajemen Acara',
    desc: 'Kelola seluruh daftar kegiatan dan jadwal kampus (CRUD)'
  },
  catalog: {
    title: 'Katalog Acara Kampus',
    desc: 'Jelajahi berbagai seminar, workshop, dan kompetisi kampus'
  },
  registrations: {
    title: 'Pendaftaran Kegiatan',
    desc: 'Formulir pendaftaran mahasiswa dan pemantauan status'
  },
  'my-registrations': {
    title: 'Tiket & Pendaftaran Saya',
    desc: 'Pantau status pendaftaran dan e-tiket kehadiran Anda'
  },
  participants: {
    title: 'Manajemen Peserta',
    desc: 'Data mahasiswa yang berpartisipasi dalam kegiatan kampus'
  },
  settings: {
    title: 'Pengaturan Sistem',
    desc: 'Informasi aplikasi, preferensi tema, dan manajemen database'
  }
};

/**
 * Inisialisasi Aplikasi Saat DOM Selesai Dimuat
 */
function initApp(): void {
  // 1. Inisialisasi StorageService & Dummy Data
  StorageService.initialize();

  // 2. Muat sesi login aktif (default mahasiswa aktif)
  const user = AuthService.getCurrentUser();
  if (user) {
    currentRole = user.role;
  }

  // 3. Muat preferensi tema
  const savedTheme = StorageService.getTheme();
  applyTheme(savedTheme);

  // 4. Muat Environment Variables untuk sidebar
  const appName = import.meta.env.VITE_APP_NAME || 'CampusConnect';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  const sidebarAppName = document.getElementById('sidebar-app-name');
  const sidebarAppVersion = document.getElementById('sidebar-app-version');
  if (sidebarAppName) sidebarAppName.textContent = appName;
  if (sidebarAppVersion) sidebarAppVersion.textContent = `v${appVersion}`;

  // 5. Setup Sistem Autentikasi (Login & Logout)
  setupAuthSystem();

  // 6. Setup Role Switcher & Render Sidebar Navigasi
  setupRoleSwitcher();
  renderSidebarNav();

  // 7. Setup mobile sidebar
  setupMobileSidebar();

  // 8. Setup theme toggle
  setupThemeToggle();

  // 9. Listen untuk navigasi custom event
  window.addEventListener('navigate', ((e: CustomEvent) => {
    const targetPage = e.detail?.page as ActivePage;
    const selectedEventId = e.detail?.selectedEventId as string | undefined;
    if (targetPage) {
      navigateTo(targetPage, selectedEventId);
    }
  }) as EventListener);

  // 10. Tampilkan tampilan awal (Katalog untuk mahasiswa, Dashboard untuk admin)
  currentPage = currentRole === 'student' ? 'catalog' : 'dashboard';
  navigateTo(currentPage);
}

/**
 * Setup Sistem Autentikasi (Modal Login, Register, Logout)
 */
function setupAuthSystem(): void {
  const authBtn = document.getElementById('btn-auth-action');
  const userBadge = document.getElementById('header-user-badge');

  // Tombol Login / Logout di Header
  authBtn?.addEventListener('click', () => {
    if (AuthService.isLoggedIn()) {
      // Tindakan Logout
      AuthService.logout();
      showToast('Anda telah keluar (Logout).', 'info');
      updateAuthUI();
      renderSidebarNav();
      navigateTo('catalog');
      openAuthModal();
    } else {
      openAuthModal();
    }
  });

  // Klik badge profil juga membuka modal ganti akun
  userBadge?.addEventListener('click', () => {
    openAuthModal();
  });

  // Modal Close
  document.getElementById('btn-close-auth-modal')?.addEventListener('click', () => {
    closeModal('modal-auth');
  });

  // Tab Switcher Login vs Register
  const tabLogin = document.getElementById('tab-auth-login');
  const tabRegister = document.getElementById('tab-auth-register');
  const viewLogin = document.getElementById('auth-view-login');
  const viewRegister = document.getElementById('auth-view-register');

  tabLogin?.addEventListener('click', () => {
    tabLogin.style.borderBottom = '2px solid var(--color-primary)';
    tabLogin.style.color = 'var(--color-primary)';
    tabLogin.style.background = 'var(--color-bg-surface)';
    tabRegister!.style.borderBottom = 'none';
    tabRegister!.style.color = 'var(--color-text-muted)';
    tabRegister!.style.background = 'transparent';
    viewLogin!.style.display = 'block';
    viewRegister!.style.display = 'none';
  });

  tabRegister?.addEventListener('click', () => {
    tabRegister.style.borderBottom = '2px solid var(--color-primary)';
    tabRegister.style.color = 'var(--color-primary)';
    tabRegister.style.background = 'var(--color-bg-surface)';
    tabLogin!.style.borderBottom = 'none';
    tabLogin!.style.color = 'var(--color-text-muted)';
    tabLogin!.style.background = 'transparent';
    viewRegister!.style.display = 'block';
    viewLogin!.style.display = 'none';
  });

  // Form Submit Login Mahasiswa
  const formLogin = document.getElementById('form-login-student') as HTMLFormElement;
  formLogin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nimInput = (document.getElementById('login-input-nim') as HTMLInputElement).value.trim();
    if (!nimInput) return;

    const res = AuthService.loginAsStudent(nimInput);
    if (res.success && res.user) {
      showToast(res.message, 'success');
      currentRole = 'student';
      updateAuthUI();
      renderSidebarNav();
      closeModal('modal-auth');
      navigateTo('catalog');
    } else {
      showToast(res.message, 'error');
    }
  });

  // Form Submit Register Mahasiswa Baru
  const formRegister = document.getElementById('form-register-new-student') as HTMLFormElement;
  formRegister?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('regnew-name') as HTMLInputElement).value.trim();
    const nim = (document.getElementById('regnew-nim') as HTMLInputElement).value.trim();
    const studyProgram = (document.getElementById('regnew-prodi') as HTMLSelectElement).value;
    const email = (document.getElementById('regnew-email') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('regnew-phone') as HTMLInputElement).value.trim();

    if (!name || !nim || !studyProgram || !email || !phone) {
      showToast('Lengkapi semua data pendaftaran akun!', 'warning');
      return;
    }

    const res = AuthService.registerNewStudent({ name, nim, studyProgram, email, phone });
    if (res.success && res.user) {
      showToast(res.message, 'success');
      currentRole = 'student';
      updateAuthUI();
      renderSidebarNav();
      closeModal('modal-auth');
      navigateTo('catalog');
    } else {
      showToast(res.message, 'error');
    }
  });

  // Login sebagai Admin
  document.getElementById('btn-login-as-admin')?.addEventListener('click', () => {
    AuthService.loginAsAdmin();
    currentRole = 'admin';
    showToast('Berhasil masuk sebagai Administrator Biro Kemahasiswaan.', 'success');
    updateAuthUI();
    renderSidebarNav();
    closeModal('modal-auth');
    navigateTo('dashboard');
  });

  updateAuthUI();
}

/**
 * Buka modal autentikasi & render daftar akun demo
 */
function openAuthModal(): void {
  const container = document.getElementById('auth-demo-accounts-list');
  const participants = StorageService.getParticipants();
  const currentUser = AuthService.getCurrentUser();

  if (container) {
    container.innerHTML = participants.map(p => {
      const isCurrent = currentUser?.nim === p.nim;
      return `
        <button type="button" class="btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-secondary'} btn-quick-login-item" data-nim="${p.nim}" style="padding: 4px 10px; font-size: 0.76rem;">
          ${escapeHtml(p.name.split(' ')[0])} (${p.nim}) ${isCurrent ? '✓' : ''}
        </button>
      `;
    }).join('');

    // Listener klik akun demo cepat
    container.querySelectorAll('.btn-quick-login-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nim = (e.currentTarget as HTMLElement).getAttribute('data-nim');
        if (nim) {
          const res = AuthService.loginAsStudent(nim);
          if (res.success) {
            showToast(res.message, 'success');
            currentRole = 'student';
            updateAuthUI();
            renderSidebarNav();
            closeModal('modal-auth');
            navigateTo('catalog');
          }
        }
      });
    });
  }

  openModal('modal-auth');
}

/**
 * Perbarui UI Header & Identitas berdasarkan status login
 */
function updateAuthUI(): void {
  const user = AuthService.getCurrentUser();
  const authBtn = document.getElementById('btn-auth-action');
  const userAvatar = document.getElementById('header-user-avatar');
  const userName = document.getElementById('header-user-name');
  const userRole = document.getElementById('header-user-role');
  const roleText = document.getElementById('role-badge-text');
  const roleIndicator = document.getElementById('sidebar-role-indicator');

  if (user) {
    if (authBtn) {
      authBtn.textContent = 'Keluar';
      authBtn.className = 'btn btn-sm btn-secondary';
      authBtn.style.color = 'var(--color-danger)';
    }

    if (user.role === 'student') {
      if (userAvatar) userAvatar.textContent = user.name.charAt(0);
      if (userName) userName.textContent = user.name;
      if (userRole) userRole.textContent = `NIM: ${user.nim}`;
      if (roleText) roleText.textContent = '🎓 Mode: Mahasiswa';
      if (roleIndicator) roleIndicator.textContent = 'Portal Mahasiswa';
      currentRole = 'student';
    } else {
      if (userAvatar) userAvatar.textContent = 'ADM';
      if (userName) userName.textContent = 'Biro Kemahasiswaan';
      if (userRole) userRole.textContent = 'Admin Utama Kampus';
      if (roleText) roleText.textContent = '🛡️ Mode: Admin';
      if (roleIndicator) roleIndicator.textContent = 'Admin Kemahasiswaan';
      currentRole = 'admin';
    }
  } else {
    // Mode Guest / Belum Login
    if (authBtn) {
      authBtn.textContent = 'Masuk';
      authBtn.className = 'btn btn-sm btn-primary';
      authBtn.style.color = 'white';
    }
    if (userAvatar) userAvatar.textContent = '?';
    if (userName) userName.textContent = 'Tamu / Mahasiswa';
    if (userRole) userRole.textContent = 'Klik untuk Masuk';
    if (roleText) roleText.textContent = '🎓 Mode: Mahasiswa';
    if (roleIndicator) roleIndicator.textContent = 'Portal Mahasiswa';
    currentRole = 'student';
  }
}

/**
 * Render menu navigasi sidebar sesuai role aktif (Mahasiswa vs Admin)
 */
function renderSidebarNav(): void {
  const navContainer = document.getElementById('sidebar-nav-container');
  if (!navContainer) return;

  if (currentRole === 'student') {
    navContainer.innerHTML = `
      <div class="nav-section-title">Portal Mahasiswa</div>

      <button class="nav-item ${currentPage === 'catalog' ? 'active' : ''}" data-page="catalog">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </span>
        <span>Katalog Acara</span>
      </button>

      <button class="nav-item ${currentPage === 'registrations' ? 'active' : ''}" data-page="registrations">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </span>
        <span>Daftar Kegiatan</span>
      </button>

      <button class="nav-item ${currentPage === 'my-registrations' ? 'active' : ''}" data-page="my-registrations">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>
        <span>Tiket &amp; Acara Saya</span>
      </button>

      <div class="nav-section-title">Lainnya</div>

      <button class="nav-item ${currentPage === 'settings' ? 'active' : ''}" data-page="settings">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </span>
        <span>Pengaturan</span>
      </button>

      <button class="nav-item" id="nav-btn-switch-admin" style="margin-top: 12px; background: rgba(37, 99, 235, 0.1); color: var(--color-accent); font-weight: 600;">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </span>
        <span>Beralih ke Panel Admin</span>
      </button>
    `;
  } else {
    // Mode Admin
    navContainer.innerHTML = `
      <div class="nav-section-title">Panel Admin Biro Kemahasiswaan</div>

      <button class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </span>
        <span>Dashboard</span>
      </button>

      <button class="nav-item ${currentPage === 'events' ? 'active' : ''}" data-page="events">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>
        <span>Manajemen Acara</span>
      </button>

      <button class="nav-item ${currentPage === 'catalog' ? 'active' : ''}" data-page="catalog">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </span>
        <span>Katalog Acara</span>
      </button>

      <div class="nav-section-title">Partisipasi &amp; Pendaftaran</div>

      <button class="nav-item ${currentPage === 'registrations' ? 'active' : ''}" data-page="registrations">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </span>
        <span>Pendaftaran Masuk</span>
      </button>

      <button class="nav-item ${currentPage === 'participants' ? 'active' : ''}" data-page="participants">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </span>
        <span>Manajemen Peserta</span>
      </button>

      <div class="nav-section-title">Sistem</div>

      <button class="nav-item ${currentPage === 'settings' ? 'active' : ''}" data-page="settings">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </span>
        <span>Pengaturan</span>
      </button>

      <button class="nav-item" id="nav-btn-switch-student" style="margin-top: 12px; background: rgba(16, 185, 129, 0.1); color: var(--color-success); font-weight: 600;">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
        </span>
        <span>Beralih ke Portal Mahasiswa</span>
      </button>
    `;
  }

  // Click listeners untuk menu navigasi
  navContainer.querySelectorAll<HTMLButtonElement>('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page') as ActivePage;
      if (page) navigateTo(page);
    });
  });

  document.getElementById('nav-btn-switch-admin')?.addEventListener('click', () => {
    AuthService.loginAsAdmin();
    setRole('admin');
  });

  document.getElementById('nav-btn-switch-student')?.addEventListener('click', () => {
    const participants = StorageService.getParticipants();
    if (participants.length > 0) {
      AuthService.loginAsStudent(participants[0].nim);
    }
    setRole('student');
  });
}

/**
 * Setup Role Switcher (Mahasiswa vs Admin)
 */
function setupRoleSwitcher(): void {
  const toggleBtn = document.getElementById('btn-toggle-role');
  toggleBtn?.addEventListener('click', () => {
    const nextRole: UserRole = currentRole === 'student' ? 'admin' : 'student';
    if (nextRole === 'admin') {
      AuthService.loginAsAdmin();
    } else {
      const participants = StorageService.getParticipants();
      if (participants.length > 0) {
        AuthService.loginAsStudent(participants[0].nim);
      }
    }
    setRole(nextRole);
  });

  updateAuthUI();
}

function setRole(role: UserRole): void {
  currentRole = role;
  updateAuthUI();
  renderSidebarNav();

  if (currentRole === 'student') {
    showToast('Beralih ke Portal Mahasiswa (Katalog & Pendaftaran).', 'info');
    navigateTo('catalog');
  } else {
    showToast('Beralih ke Panel Administrator (Dashboard Kemahasiswaan).', 'info');
    navigateTo('dashboard');
  }
}

/**
 * Berpindah ke halaman tertentu
 */
export function navigateTo(page: ActivePage, extraParam?: string): void {
  currentPage = page;

  // Update Page Title & Description
  const meta = PAGE_METADATA[page] || { title: 'CampusConnect', desc: '' };
  const titleEl = document.getElementById('current-page-title');
  const descEl = document.getElementById('current-page-desc');
  if (titleEl) titleEl.textContent = meta.title;
  if (descEl) descEl.textContent = meta.desc;

  // Update Sidebar Active state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    const pageAttr = btn.getAttribute('data-page');
    if (pageAttr === page) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Tutup sidebar di mobile jika terbuka
  const sidebar = document.getElementById('app-sidebar');
  sidebar?.classList.remove('mobile-open');

  // Mount container
  const container = document.getElementById('page-content');
  if (!container) return;

  // Render view
  switch (page) {
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'events':
      renderEvents(container, 'table');
      break;
    case 'catalog':
      renderEvents(container, 'cards');
      break;
    case 'registrations':
      renderRegistrations(container, extraParam);
      break;
    case 'my-registrations':
      renderMyRegistrations(container);
      break;
    case 'participants':
      renderParticipants(container);
      break;
    case 'settings':
      renderSettings(container);
      break;
    default:
      renderEvents(container, 'cards');
      break;
  }

  // Scroll ke paling atas
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Setup Drawer Mobile Sidebar
 */
function setupMobileSidebar(): void {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('btn-toggle-mobile-sidebar');
  const closeBtn = document.getElementById('btn-close-sidebar');

  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
  });

  closeBtn?.addEventListener('click', () => {
    sidebar?.classList.remove('mobile-open');
  });
}

/**
 * Setup Theme Mode & Icons
 */
function setupThemeToggle(): void {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  toggleBtn?.addEventListener('click', () => {
    const current = StorageService.getTheme();
    const nextTheme: ThemeMode = current === 'light' ? 'dark' : 'light';
    StorageService.setTheme(nextTheme);
    applyTheme(nextTheme);
  });
}

function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme);

  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');

  if (theme === 'dark') {
    if (sunIcon) sunIcon.style.display = 'block';
    if (moonIcon) moonIcon.style.display = 'none';
  } else {
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'block';
  }
}

// Jalankan ketika dokumen siap
document.addEventListener('DOMContentLoaded', initApp);
