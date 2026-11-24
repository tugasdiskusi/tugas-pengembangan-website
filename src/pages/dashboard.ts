// ==========================================
// CAMPUSCONNECT - DASHBOARD PAGE
// Halaman utama ringkasan statistik & visualisasi data
// ==========================================

import { StorageService } from '../services/storage';
import { formatDate, renderEventStatusBadge, renderRegistrationStatusBadge, escapeHtml } from '../utils/helpers';
import { Chart, registerables } from 'chart.js';

// Daftarkan komponen Chart.js
Chart.register(...registerables);

let dashboardChartInstance: Chart | null = null;

export function renderDashboard(container: HTMLElement): void {
  const events = StorageService.getEvents();
  const participants = StorageService.getParticipants();
  const registrations = StorageService.getRegistrations();

  const totalEvents = events.length;
  const totalParticipants = participants.length;
  const totalRegistrations = registrations.length;
  const ongoingEvents = events.filter(e => e.status === 'Ongoing').length;
  const upcomingEvents = events.filter(e => e.status === 'Upcoming').length;
  const completedEvents = events.filter(e => e.status === 'Completed').length;

  // Acara terbaru (3 teratas)
  const recentEvents = [...events].slice(0, 4);

  // Aktivitas pendaftaran terbaru (5 teratas)
  const recentRegistrations = [...registrations].slice(0, 5);

  container.innerHTML = `
    <!-- Top Summary Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Total Acara Kampus</span>
          <span class="stat-value">${totalEvents}</span>
          <span class="stat-trend" style="color: var(--color-accent);">
            <strong>${ongoingEvents}</strong> Sedang Berlangsung
          </span>
        </div>
        <div class="stat-icon-wrapper stat-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Total Mahasiswa Terdaftar</span>
          <span class="stat-value">${totalParticipants}</span>
          <span class="stat-trend" style="color: var(--color-success);">
            Aktif berpartisipasi
          </span>
        </div>
        <div class="stat-icon-wrapper stat-icon-emerald">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Total Pengajuan Pendaftaran</span>
          <span class="stat-value">${totalRegistrations}</span>
          <span class="stat-trend" style="color: var(--color-warning);">
            <strong>${registrations.filter(r => r.status === 'Pending').length}</strong> Menunggu Konfirmasi
          </span>
        </div>
        <div class="stat-icon-wrapper stat-icon-amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Acara Mendatang</span>
          <span class="stat-value">${upcomingEvents}</span>
          <span class="stat-trend" style="color: var(--color-info);">
            <strong>${completedEvents}</strong> Acara Telah Selesai
          </span>
        </div>
        <div class="stat-icon-wrapper stat-icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
        </div>
      </div>
    </div>

    <!-- Charts & Quick Overview -->
    <div class="dashboard-grid-2">
      <!-- Chart Card -->
      <div class="chart-card">
        <div class="card-header-flex">
          <div>
            <h2 class="card-title">Statistik Distribusi Kategori Acara</h2>
            <p class="card-subtitle">Perbandingan jumlah kegiatan berdasarkan kategori</p>
          </div>
          <span class="badge badge-upcoming">Aktif</span>
        </div>
        <div class="chart-container-box">
          <canvas id="categoryChart"></canvas>
        </div>
      </div>

      <!-- Quick Action / Status Distribution -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div>
            <h2 class="card-title">Status Kegiatan</h2>
            <p class="card-subtitle">Proporsi status acara kampus</p>
          </div>
        </div>
        <div class="chart-container-box" style="height: 240px;">
          <canvas id="statusChart"></canvas>
        </div>
        <div style="margin-top: 14px; display: flex; justify-content: space-around; text-align: center;">
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Mendatang</div>
            <div style="font-weight: 700; color: #0284c7;">${upcomingEvents}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Berlangsung</div>
            <div style="font-weight: 700; color: #059669;">${ongoingEvents}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Selesai</div>
            <div style="font-weight: 700; color: #64748b;">${completedEvents}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Lists Grid -->
    <div class="dashboard-grid-2">
      <!-- Recent Events -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div>
            <h2 class="card-title">Acara Kampus Terbaru</h2>
            <p class="card-subtitle">Daftar kegiatan yang baru ditambahkan</p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-view-all-events">Lihat Semua</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama Acara</th>
                <th>Kategori</th>
                <th>Tanggal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recentEvents.map(evt => `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: var(--color-text-main);">${escapeHtml(evt.name)}</div>
                    <div style="font-size: 0.78rem; color: var(--color-text-muted);">${escapeHtml(evt.organizer)}</div>
                  </td>
                  <td><span class="badge-category">${evt.category}</span></td>
                  <td>${formatDate(evt.date)}</td>
                  <td>${renderEventStatusBadge(evt.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Registrations -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div>
            <h2 class="card-title">Aktivitas Pendaftaran</h2>
            <p class="card-subtitle">Pengajuan mahasiswa terkini</p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-view-all-reg">Kelola</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mahasiswa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recentRegistrations.length === 0 ? `
                <tr><td colspan="2" style="text-align: center; color: var(--color-text-muted);">Belum ada pendaftaran</td></tr>
              ` : recentRegistrations.map(reg => `
                <tr>
                  <td>
                    <div style="font-weight: 600;">${escapeHtml(reg.participantName)}</div>
                    <div style="font-size: 0.76rem; color: var(--color-text-muted);">${escapeHtml(reg.eventName || 'Acara')}</div>
                  </td>
                  <td>${renderRegistrationStatusBadge(reg.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Inisialisasi Chart.js
  initDashboardCharts(events);

  // Event Listeners tombol navigasi pintas
  document.getElementById('btn-view-all-events')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'events' } }));
  });

  document.getElementById('btn-view-all-reg')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'registrations' } }));
  });
}

/**
 * Render visual chart grafik statistik menggunakan Chart.js
 */
function initDashboardCharts(events: ReturnType<typeof StorageService.getEvents>): void {
  // Hitung jumlah acara per kategori
  const categories = ['Seminar', 'Workshop', 'Lomba', 'Webinar', 'Organisasi', 'Sosial', 'Olahraga', 'Lainnya'];
  const categoryCounts = categories.map(cat => events.filter(e => e.category === cat).length);

  const ctxCategory = document.getElementById('categoryChart') as HTMLCanvasElement;
  if (ctxCategory) {
    if (dashboardChartInstance) {
      dashboardChartInstance.destroy();
    }

    dashboardChartInstance = new Chart(ctxCategory, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Jumlah Acara',
          data: categoryCounts,
          backgroundColor: [
            '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
            '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  // Chart Status (Doughnut)
  const ctxStatus = document.getElementById('statusChart') as HTMLCanvasElement;
  if (ctxStatus) {
    const upcoming = events.filter(e => e.status === 'Upcoming').length;
    const ongoing = events.filter(e => e.status === 'Ongoing').length;
    const completed = events.filter(e => e.status === 'Completed').length;
    const draft = events.filter(e => e.status === 'Draft').length;

    new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Mendatang', 'Berlangsung', 'Selesai', 'Draft'],
        datasets: [{
          data: [upcoming, ongoing, completed, draft],
          backgroundColor: ['#0284c7', '#10b981', '#64748b', '#f59e0b'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        cutout: '65%'
      }
    });
  }
}
