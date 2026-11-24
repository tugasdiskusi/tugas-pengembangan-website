// ==========================================
// CAMPUSCONNECT - MAIN APPLICATION ENTRY POINT
// Routing, State Management, Event Handling, & Lifecycle
// ==========================================

import { StorageService } from './services/storage';
import { ActivePage, ThemeMode } from './types';
import { renderDashboard } from './pages/dashboard';
import { renderEvents } from './pages/events';
import { renderRegistrations } from './pages/registrations';
import { renderParticipants } from './pages/participants';
import { renderSettings } from './pages/settings';

// State Halaman Aktif
let currentPage: ActivePage = 'dashboard';

// Metadata Halaman
const PAGE_METADATA: Record<ActivePage, { title: string; desc: string }> = {
  dashboard: {
    title: 'Dashboard',
    desc: 'Ringkasan aktivitas dan metrik kegiatan kampus'
  },
  events: {
    title: 'Manajemen Acara',
    desc: 'Kelola seluruh daftar kegiatan dan jadwal kampus (CRUD)'
  },
  catalog: {
    title: 'Katalog Acara Kampus',
    desc: 'Jelajahi dan temukan seluruh kegiatan mahasiswa yang sedang dan akan datang'
  },
  registrations: {
    title: 'Pendaftaran Kegiatan',
    desc: 'Pendaftaran mahasiswa dan pemantauan status registrasi'
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

  // 3. Muat Environment Variables untuk header & sidebar
  const appName = import.meta.env.VITE_APP_NAME || 'CampusConnect';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  const sidebarAppName = document.getElementById('sidebar-app-name');
  const sidebarAppVersion = document.getElementById('sidebar-app-version');
  if (sidebarAppName) sidebarAppName.textContent = appName;
  if (sidebarAppVersion) sidebarAppVersion.textContent = `v${appVersion}`;

  // 4. Setup event listeners navigasi
  setupNavigation();

  // 5. Setup mobile sidebar
  setupMobileSidebar();

  // 6. Setup theme toggle
  setupThemeToggle();

  // 7. Setup quick add event button di header
  document.getElementById('btn-header-quick-add')?.addEventListener('click', () => {
    navigateTo('events');
    setTimeout(() => {
      document.getElementById('btn-open-add-event')?.click();
    }, 100);
  });

  // 8. Listen untuk navigasi custom event dari komponen anak
  window.addEventListener('navigate', ((e: CustomEvent) => {
    const targetPage = e.detail?.page as ActivePage;
    const selectedEventId = e.detail?.selectedEventId as string | undefined;
    if (targetPage) {
      navigateTo(targetPage, selectedEventId);
    }
  }) as EventListener);

  // 9. Render halaman pertama
  navigateTo('dashboard');
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

  // Tutup sidebar di tampilan mobile jika terbuka
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
    case 'participants':
      renderParticipants(container);
      break;
    case 'settings':
      renderSettings(container);
      break;
    default:
      renderDashboard(container);
      break;
  }

  // Scroll ke paling atas
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Setup Navigasi Sidebar
 */
function setupNavigation(): void {
  const navItems = document.querySelectorAll<HTMLButtonElement>('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page') as ActivePage;
      if (page) {
        navigateTo(page);
      }
    });
  });
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
