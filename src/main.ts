// ==========================================
// CAMPUSCONNECT - MAIN APPLICATION ENTRY POINT
// Routing, Multi-Role (Mahasiswa & Admin), State Management
// ==========================================

import { StorageService } from './services/storage';
import { ActivePage, ThemeMode, UserRole } from './types';
import { renderDashboard } from './pages/dashboard';
import { renderEvents } from './pages/events';
import { renderRegistrations } from './pages/registrations';
import { renderParticipants } from './pages/participants';
import { renderMyRegistrations } from './pages/myRegistrations';
import { renderSettings } from './pages/settings';
import { showToast } from './utils/helpers';

// State Aplikasi
let currentRole: UserRole = 'student'; // Default Mode Mahasiswa sesuai permintaan user!
let currentPage: ActivePage = 'catalog'; // Landing page default untuk mahasiswa adalah Katalog Acara

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

  // 2. Muat preferensi tema
  const savedTheme = StorageService.getTheme();
  applyTheme(savedTheme);

  // 3. Muat Environment Variables untuk sidebar
  const appName = import.meta.env.VITE_APP_NAME || 'CampusConnect';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  const sidebarAppName = document.getElementById('sidebar-app-name');
  const sidebarAppVersion = document.getElementById('sidebar-app-version');
  if (sidebarAppName) sidebarAppName.textContent = appName;
  if (sidebarAppVersion) sidebarAppVersion.textContent = `v${appVersion}`;

  // 4. Setup Role Switcher & Render Sidebar Navigasi
  setupRoleSwitcher();
  renderSidebarNav();

  // 5. Setup mobile sidebar
  setupMobileSidebar();

  // 6. Setup theme toggle
  setupThemeToggle();

  // 7. Listen untuk navigasi custom event
  window.addEventListener('navigate', ((e: CustomEvent) => {
    const targetPage = e.detail?.page as ActivePage;
    const selectedEventId = e.detail?.selectedEventId as string | undefined;
    if (targetPage) {
      navigateTo(targetPage, selectedEventId);
    }
  }) as EventListener);

  // 8. Tampilkan tampilan awal untuk Mahasiswa
  navigateTo(currentPage);
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
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
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
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
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

  // Setup click listeners pada tombol navigasi
  navContainer.querySelectorAll<HTMLButtonElement>('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page') as ActivePage;
      if (page) navigateTo(page);
    });
  });

  document.getElementById('nav-btn-switch-admin')?.addEventListener('click', () => {
    setRole('admin');
  });

  document.getElementById('nav-btn-switch-student')?.addEventListener('click', () => {
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
    setRole(nextRole);
  });

  updateRoleUI();
}

function setRole(role: UserRole): void {
  currentRole = role;
  updateRoleUI();
  renderSidebarNav();

  if (currentRole === 'student') {
    showToast('Beralih ke Mode Mahasiswa (Portal Acara & Pendaftaran).', 'info');
    navigateTo('catalog');
  } else {
    showToast('Beralih ke Mode Admin (Dashboard Biro Kemahasiswaan).', 'info');
    navigateTo('dashboard');
  }
}

function updateRoleUI(): void {
  const roleText = document.getElementById('role-badge-text');
  const roleIndicator = document.getElementById('sidebar-role-indicator');
  const userAvatar = document.getElementById('header-user-avatar');
  const userName = document.getElementById('header-user-name');
  const userRole = document.getElementById('header-user-role');

  if (currentRole === 'student') {
    if (roleText) roleText.textContent = '🎓 Mode: Mahasiswa';
    if (roleIndicator) roleIndicator.textContent = 'Portal Mahasiswa';
    if (userAvatar) userAvatar.textContent = 'MHS';
    if (userName) userName.textContent = 'Raden M. Fauzan';
    if (userRole) userRole.textContent = 'Mahasiswa (2301010045)';
  } else {
    if (roleText) roleText.textContent = '🛡️ Mode: Admin';
    if (roleIndicator) roleIndicator.textContent = 'Admin Kemahasiswaan';
    if (userAvatar) userAvatar.textContent = 'ADM';
    if (userName) userName.textContent = 'Biro Kemahasiswaan';
    if (userRole) userRole.textContent = 'Admin Utama Kampus';
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
