// ==========================================
// CAMPUSCONNECT - SETTINGS PAGE
// Informasi Aplikasi, Environment Variables, Dark/Light Mode, & Database Reset
// ==========================================

import { StorageService } from '../services/storage';
import { ThemeMode } from '../types';
import { showToast } from '../utils/helpers';

export function renderSettings(container: HTMLElement): void {
  // Membaca environment variables melalui import.meta.env
  const appName = import.meta.env.VITE_APP_NAME || 'CampusConnect';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const currentTheme = StorageService.getTheme();

  const events = StorageService.getEvents();
  const participants = StorageService.getParticipants();
  const registrations = StorageService.getRegistrations();

  container.innerHTML = `
    <div style="max-width: 800px;">
      <!-- Section: Informasi Aplikasi (Env Variables) -->
      <div class="settings-section">
        <h2 class="settings-section-title">Informasi Aplikasi &amp; Environment</h2>
        <p class="settings-section-desc">Data konfigurasi sistem dibaca secara otomatis dari environment variables Vite (.env).</p>

        <div class="settings-row">
          <div>
            <div style="font-weight: 600;">Nama Aplikasi (VITE_APP_NAME)</div>
            <div style="font-size: 0.8rem; color: var(--color-text-muted);">Nama platform sistem manajemen acara</div>
          </div>
          <span style="font-weight: 700; color: var(--color-primary); background: var(--color-primary-light); padding: 4px 12px; border-radius: var(--radius-sm);">
            ${appName}
          </span>
        </div>

        <div class="settings-row">
          <div>
            <div style="font-weight: 600;">Versi Sistem (VITE_APP_VERSION)</div>
            <div style="font-size: 0.8rem; color: var(--color-text-muted);">Versi rilis semantic versioning</div>
          </div>
          <span style="font-weight: 700; font-family: monospace; background: var(--color-border-subtle); padding: 4px 12px; border-radius: var(--radius-sm);">
            v${appVersion}
          </span>
        </div>

        <div class="settings-row">
          <div>
            <div style="font-weight: 600;">Arsitektur &amp; Teknologi</div>
            <div style="font-size: 0.8rem; color: var(--color-text-muted);">Teknologi pemrograman inti yang digunakan</div>
          </div>
          <div style="text-align: right; font-size: 0.85rem; font-weight: 500;">
            TypeScript, Vite, HTML5, Modern CSS, LocalStorage
          </div>
        </div>
      </div>

      <!-- Section: Tampilan & Tema -->
      <div class="settings-section">
        <h2 class="settings-section-title">Pengaturan Tampilan &amp; Tema</h2>
        <p class="settings-section-desc">Kustomisasi preferensi visual sesuai kenyamanan kerja Anda.</p>

        <div class="settings-row">
          <div>
            <div style="font-weight: 600;">Mode Tampilan (Theme Mode)</div>
            <div style="font-size: 0.8rem; color: var(--color-text-muted);">Pilih antara mode terang (Light) atau gelap (Dark)</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm ${currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}" id="btn-theme-light">
              Mode Terang (Light)
            </button>
            <button class="btn btn-sm ${currentTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}" id="btn-theme-dark">
              Mode Gelap (Dark)
            </button>
          </div>
        </div>
      </div>

      <!-- Section: Manajemen Data & LocalStorage -->
      <div class="settings-section">
        <h2 class="settings-section-title">Manajemen Data &amp; Penyimpanan</h2>
        <p class="settings-section-desc">Data tersimpan secara lokal dan persisten di browser LocalStorage.</p>

        <div class="settings-row">
          <div>
            <div style="font-weight: 600;">Status Penyimpanan Lokal</div>
            <div style="font-size: 0.8rem; color: var(--color-text-muted);">
              Tersimpan: <strong>${events.length}</strong> Acara, <strong>${participants.length}</strong> Mahasiswa, <strong>${registrations.length}</strong> Pendaftaran
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-export-json">
            Unduh Cadangan JSON
          </button>
        </div>

        <div class="settings-row">
          <div>
            <div style="font-weight: 600; color: var(--color-danger);">Reset Database ke Data Contoh Awal</div>
            <div style="font-size: 0.8rem; color: var(--color-text-muted);">
              Mengembalikan seluruh data acara, peserta, dan pendaftaran ke kondisi dummy awal kampus.
            </div>
          </div>
          <button class="btn btn-danger btn-sm" id="btn-reset-database">
            Reset Data Default
          </button>
        </div>
      </div>

      <!-- Section: Informasi Pengembang / Tugas -->
      <div class="settings-section">
        <h2 class="settings-section-title">Tentang Proyek</h2>
        <p style="font-size: 0.88rem; line-height: 1.6; color: var(--color-text-muted);">
          Aplikasi <strong>${appName}</strong> dikembangkan sebagai pemenuhan tugas pembuatan sistem manajemen acara kampus berbasis Vanilla TypeScript dan Vite. Sistem ini dibangun secara modular, menerapkan tipe data kuat (strict type checking, generics, union types, interfaces), dan mendukung responsivitas penuh dari smartphone hingga desktop.
        </p>
      </div>
    </div>
  `;

  // Listeners
  document.getElementById('btn-theme-light')?.addEventListener('click', () => {
    StorageService.setTheme('light');
    showToast('Mode terang diaktifkan.', 'info');
    renderSettings(container);
  });

  document.getElementById('btn-theme-dark')?.addEventListener('click', () => {
    StorageService.setTheme('dark');
    showToast('Mode gelap diaktifkan.', 'info');
    renderSettings(container);
  });

  document.getElementById('btn-reset-database')?.addEventListener('click', () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh database ke data contoh awal?')) {
      StorageService.resetToDefault();
      showToast('Database berhasil direset ke data contoh awal!', 'success');
      renderSettings(container);
    }
  });

  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const backupData = {
      appName,
      appVersion,
      exportedAt: new Date().toISOString(),
      events: StorageService.getEvents(),
      participants: StorageService.getParticipants(),
      registrations: StorageService.getRegistrations()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campusconnect-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Cadangan data JSON berhasil diunduh.', 'success');
  });
}
