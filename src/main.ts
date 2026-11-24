// ==========================================
// CAMPUSCONNECT - MAIN APPLICATION ENTRY POINT
// Routing, Portal Mahasiswa vs Portal Admin, Auth (Login/Logout)
// ==========================================

import { StorageService } from './services/storage';
import { AuthService } from './services/auth';
import { ActivePage, ThemeMode } from './types';
import { renderDashboard } from './pages/dashboard';
import { renderEvents } from './pages/events';
import { renderRegistrations } from './pages/registrations';
import { renderParticipants } from './pages/participants';
import { renderMyRegistrations } from './pages/myRegistrations';
import { renderSettings } from './pages/settings';
import { showToast, openModal, closeModal, escapeHtml } from './utils/helpers';

// State Halaman Aktif
let currentPage: ActivePage = 'catalog';

// Metadata Halaman
const PAGE_METADATA: Record<ActivePage, { title: string; desc: string }> = {
  dashboard: {
    title: 'Dashboard Analitik Kampus',
    desc: 'Ringkasan metrik statistik dan aktivitas kegiatan kampus'
  },
  events: {
    title: 'Manajemen Acara Kampus',
    desc: 'Kelola seluruh daftar kegiatan dan jadwal kampus (CRUD)'
  },
  catalog: {
    title: 'Katalog Acara Kampus',
    desc: 'Jelajahi berbagai seminar, workshop, dan kompetisi mahasiswa'
  },
  registrations: {
    title: 'Pendaftaran Kegiatan',
    desc: 'Formulir pendaftaran mahasiswa dan pemantauan status registrasi'
  },
  'my-registrations': {
    title: 'Tiket & Acara Saya',
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

  // 2. Deteksi parameter portal di URL (?portal=admin atau ?portal=student)
  const urlParams = new URLSearchParams(window.location.search);
  const portalParam = urlParams.get('portal');
  if (portalParam === 'admin') {
    AuthService.loginAsAdmin();
    currentPage = 'dashboard';
  } else if (portalParam === 'student') {
    const participants = StorageService.getParticipants();
    if (participants.length > 0) {
      AuthService.loginAsStudent(participants[0].nim);
    }
    currentPage = 'catalog';
  } else {
    // Default: gunakan sesi login tersimpan atau default mahasiswa
    const user = AuthService.getCurrentUser();
    currentPage = user?.role === 'admin' ? 'dashboard' : 'catalog';
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

  // 6. Render Sidebar Navigasi
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

  // 10. Tampilkan tampilan awal
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

  // Klik badge profil membuka modal ganti akun / login
  userBadge?.addEventListener('click', () => {
    openAuthModal();
  });

  // Modal Close
  document.getElementById('btn-close-auth-modal')?.addEventListener('click', () => {
    closeModal('modal-auth');
  });

  // Tab Switcher Login Mahasiswa vs Admin vs Register
  const tabLogin = document.getElementById('tab-auth-login');
  const tabAdmin = document.getElementById('tab-auth-admin');
  const tabRegister = document.getElementById('tab-auth-register');
  const viewLogin = document.getElementById('auth-view-login');
  const viewAdmin = document.getElementById('auth-view-admin');
  const viewRegister = document.getElementById('auth-view-register');

  const resetTabs = () => {
    [tabLogin, tabAdmin, tabRegister].forEach(tab => {
      if (tab) {
        tab.style.borderBottom = 'none';
        tab.style.color = 'var(--color-text-muted)';
        tab.style.background = 'transparent';
      }
    });
    [viewLogin, viewAdmin, viewRegister].forEach(v => {
      if (v) v.style.display = 'none';
    });
  };

  tabLogin?.addEventListener('click', () => {
    resetTabs();
    tabLogin.style.borderBottom = '2px solid var(--color-primary)';
    tabLogin.style.color = 'var(--color-primary)';
    tabLogin.style.background = 'var(--color-bg-surface)';
    if (viewLogin) viewLogin.style.display = 'block';
  });

  tabAdmin?.addEventListener('click', () => {
    resetTabs();
    tabAdmin.style.borderBottom = '2px solid var(--color-primary)';
    tabAdmin.style.color = 'var(--color-primary)';
    tabAdmin.style.background = 'var(--color-bg-surface)';
    if (viewAdmin) viewAdmin.style.display = 'block';
  });

  tabRegister?.addEventListener('click', () => {
    resetTabs();
    tabRegister.style.borderBottom = '2px solid var(--color-primary)';
    tabRegister.style.color = 'var(--color-primary)';
    tabRegister.style.background = 'var(--color-bg-surface)';
    if (viewRegister) viewRegister.style.display = 'block';
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
      updateAuthUI();
      renderSidebarNav();
      closeModal('modal-auth');
      navigateTo('catalog');
    } else {
      showToast(res.message, 'error');
    }
  });

  // Tombol Konfirmasi Login Admin
  document.getElementById('btn-login-as-admin-confirm')?.addEventListener('click', () => {
    AuthService.loginAsAdmin();
    showToast('Berhasil masuk ke Dashboard Administrator Biro Kemahasiswaan.', 'success');
    updateAuthUI();
    renderSidebarNav();
    closeModal('modal-auth');
    navigateTo('dashboard');
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
      updateAuthUI();
      renderSidebarNav();
      closeModal('modal-auth');
      navigateTo('catalog');
    } else {
      showToast(res.message, 'error');
    }
  });

  updateAuthUI();
}

/**
 * Buka modal autentikasi & render daftar akun demo beserta tombol hapus
 */
function openAuthModal(): void {
  const container = document.getElementById('auth-demo-accounts-list');
  const participants = StorageService.getParticipants();
  const currentUser = AuthService.getCurrentUser();

  if (container) {
    if (participants.length === 0) {
      container.innerHTML = `<span style="font-size: 0.8rem; color: var(--color-text-muted);">Belum ada mahasiswa terdaftar. Silakan gunakan tab 'Daftar Akun Baru'.</span>`;
    } else {
      container.innerHTML = participants.map(p => {
        const isCurrent = currentUser?.nim === p.nim;
        return `
          <div class="demo-account-chip ${isCurrent ? 'active' : ''}">
            <span class="demo-chip-name" data-nim="${p.nim}" title="Masuk sebagai ${escapeHtml(p.name)}">
              ${escapeHtml(p.name.split(' ')[0])} (${p.nim}) ${isCurrent ? '✓' : ''}
            </span>
            <button type="button" class="demo-chip-delete" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-nim="${p.nim}" title="Hapus akun ${escapeHtml(p.name)}">
              &times;
            </button>
          </div>
        `;
      }).join('');

      // Listener klik untuk memilih dan login
      container.querySelectorAll('.demo-chip-name').forEach(el => {
        el.addEventListener('click', (e) => {
          const nim = (e.currentTarget as HTMLElement).getAttribute('data-nim');
          if (nim) {
            const res = AuthService.loginAsStudent(nim);
            if (res.success) {
              showToast(res.message, 'success');
              updateAuthUI();
              renderSidebarNav();
              closeModal('modal-auth');
              navigateTo('catalog');
            }
          }
        });
      });

      // Listener tombol hapus akun (×)
      container.querySelectorAll('.demo-chip-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
          const name = (e.currentTarget as HTMLElement).getAttribute('data-name');
          const nim = (e.currentTarget as HTMLElement).getAttribute('data-nim');

          if (id && nim && window.confirm(`Apakah Anda yakin ingin menghapus akun mahasiswa "${name}" (${nim})?`)) {
            // Hapus dari LocalStorage
            StorageService.deleteParticipant(id);

            // Jika akun yang dihapus sedang aktif login, logout
            if (currentUser?.id === id || currentUser?.nim === nim) {
              AuthService.logout();
              updateAuthUI();
              renderSidebarNav();
            }

            showToast(`Akun mahasiswa "${name}" berhasil dihapus.`, 'info');

            // Refresh daftar akun di modal
            openAuthModal();
          }
        });
      });
    }
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
  const roleIndicator = document.getElementById('sidebar-role-indicator');

  if (user) {
    if (authBtn) {
      authBtn.textContent = 'Keluar';
      authBtn.className = 'btn btn-sm btn-secondary';
      authBtn.style.color = 'var(--color-danger)';
    }

    if (user.role === 'admin') {
      if (userAvatar) userAvatar.textContent = 'ADM';
      if (userName) userName.textContent = 'Biro Kemahasiswaan';
      if (userRole) userRole.textContent = 'Admin Utama Kampus';
      if (roleIndicator) roleIndicator.textContent = 'Dashboard Administrator';
    } else {
      if (userAvatar) userAvatar.textContent = user.name.charAt(0);
      if (userName) userName.textContent = user.name;
      if (userRole) userRole.textContent = `NIM: ${user.nim}`;
      if (roleIndicator) roleIndicator.textContent = `Portal Mahasiswa (${user.studyProgram})`;
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
    if (roleIndicator) roleIndicator.textContent = 'Sistem Acara Kampus';
  }
}

/**
 * Render menu navigasi sidebar sesuai peran (Mahasiswa atau Admin)
 */
function renderSidebarNav(): void {
  const navContainer = document.getElementById('sidebar-nav-container');
  if (!navContainer) return;

  const isAdmin = AuthService.isAdmin();

  if (isAdmin) {
    // Menu Khusus Administrator
    navContainer.innerHTML = `
      <div class="nav-section-title">Menu Utama Admin</div>

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

      <div class="nav-section-title">Peserta &amp; Registrasi</div>

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

      <a href="?portal=student" target="_blank" class="nav-item" style="margin-top: 14px; background: rgba(16, 185, 129, 0.1); color: var(--color-success); font-weight: 600;">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </span>
        <span>Buka Portal Mahasiswa ↗</span>
      </a>
    `;
  } else {
    // Menu Khusus Mahasiswa
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
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </span>
        <span>Tiket &amp; Acara Saya</span>
      </button>

      <div class="nav-section-title">Lainnya</div>

      <button class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </span>
        <span>Statistik Kampus</span>
      </button>

      <button class="nav-item ${currentPage === 'settings' ? 'active' : ''}" data-page="settings">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </span>
        <span>Pengaturan</span>
      </button>

      <a href="?portal=admin" target="_blank" class="nav-item" style="margin-top: 14px; background: rgba(37, 99, 235, 0.1); color: var(--color-accent); font-weight: 600;">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </span>
        <span>Buka Portal Admin ↗</span>
      </a>
    `;
  }

  // Click listeners untuk menu navigasi
  navContainer.querySelectorAll<HTMLButtonElement>('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page') as ActivePage;
      if (page) navigateTo(page);
    });
  });
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
