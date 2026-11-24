// ==========================================
// CAMPUSCONNECT - MY REGISTRATIONS (PORTAL MAHASISWA)
// Halaman khusus mahasiswa untuk memantau status pendaftaran & tiket kegiatan
// ==========================================

import { StorageService } from '../services/storage';
import { AuthService } from '../services/auth';
import { formatDate, formatTime, renderRegistrationStatusBadge, showToast, escapeHtml } from '../utils/helpers';

export function renderMyRegistrations(container: HTMLElement): void {
  const allRegistrations = StorageService.getRegistrations();
  const allEvents = StorageService.getEvents();
  const participants = StorageService.getParticipants();
  const currentUser = AuthService.getCurrentUser();

  // Ambil data mahasiswa aktif dari sesi login
  let currentStudentNim = currentUser?.nim || '2301010045';
  let currentParticipant = participants.find(p => p.nim === currentStudentNim) || participants[0];

  const myRegistrations = allRegistrations.filter(r => r.participantNim === currentStudentNim);

  container.innerHTML = `
    <!-- Kartu Identitas Mahasiswa Aktif -->
    <div class="dashboard-card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(30, 64, 175, 0.03)); border: 1px solid var(--color-accent-subtle);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 56px; height: 56px; border-radius: var(--radius-full); background: linear-gradient(135deg, #2563eb, #1e40af); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
            ${currentParticipant ? currentParticipant.name.charAt(0) : 'M'}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-size: 1.2rem; font-weight: 700; color: var(--color-text-main); margin: 0;">
                ${escapeHtml(currentParticipant ? currentParticipant.name : 'Mahasiswa')}
              </h2>
              <span class="badge badge-approved">Mahasiswa Aktif</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 3px;">
              NIM: <strong style="font-family: monospace; color: var(--color-text-main);">${escapeHtml(currentStudentNim)}</strong> &bull; ${escapeHtml(currentParticipant ? currentParticipant.studyProgram : 'Teknik Informatika')}
            </div>
          </div>
        </div>

        <!-- Pemilih Akun Mahasiswa untuk Simulasi Uji Coba -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">Ganti Akun Demo:</span>
          <select id="select-demo-student" class="select-filter" style="padding: 6px 12px; font-size: 0.82rem;">
            ${participants.map(p => `
              <option value="${p.nim}" ${p.nim === currentStudentNim ? 'selected' : ''}>
                ${escapeHtml(p.name)} (${p.nim})
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- Statistik Partisipasi Mahasiswa -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Total Kegiatan Didaftar</span>
          <span class="stat-value">${myRegistrations.length}</span>
          <span class="stat-trend" style="color: var(--color-accent);">Sepanjang semester aktif</span>
        </div>
        <div class="stat-icon-wrapper stat-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Pendaftaran Disetujui (Tiket Aktif)</span>
          <span class="stat-value">${myRegistrations.filter(r => r.status === 'Approved').length}</span>
          <span class="stat-trend" style="color: var(--color-success);">Siap hadir di kegiatan</span>
        </div>
        <div class="stat-icon-wrapper stat-icon-emerald">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Menunggu Konfirmasi</span>
          <span class="stat-value">${myRegistrations.filter(r => r.status === 'Pending').length}</span>
          <span class="stat-trend" style="color: var(--color-warning);">Dalam antrean verifikasi</span>
        </div>
        <div class="stat-icon-wrapper stat-icon-amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
        </div>
      </div>
    </div>

    <!-- Daftar Tiket & Pendaftaran Kegiatan -->
    <div class="dashboard-card">
      <div class="card-header-flex">
        <div>
          <h2 class="card-title">Tiket Acara &amp; Status Pendaftaran Saya</h2>
          <p class="card-subtitle">Berikut daftar kegiatan kampus yang telah Anda daftarkan</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-browse-more-events">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Jelajahi Acara Lainnya
        </button>
      </div>

      ${myRegistrations.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <h3 class="empty-state-title">Belum Mendaftar Acara Apapun</h3>
          <p class="empty-state-desc">Anda belum terdaftar dalam kegiatan kampus manapun saat ini. Temukan seminar, workshop, atau lomba menarik di Katalog Acara!</p>
          <button class="btn btn-primary" id="btn-empty-browse-events">Buka Katalog Acara Sekarang</button>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
          ${myRegistrations.map(reg => {
            const event = allEvents.find(e => e.id === reg.eventId);
            const isApproved = reg.status === 'Approved';
            const defaultImg = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
            const poster = event ? (event.image || defaultImg) : defaultImg;

            return `
              <div class="event-card" style="box-shadow: var(--shadow-sm); border: 1px solid var(--color-border);">
                <div class="event-card-img-wrap" style="height: 140px;">
                  <img src="${poster}" alt="${escapeHtml(reg.eventName || 'Acara')}" class="event-card-img" />
                  <div class="event-card-badges">
                    <span class="badge-category">${event ? event.category : 'Kegiatan'}</span>
                    ${renderRegistrationStatusBadge(reg.status)}
                  </div>
                </div>

                <div class="event-card-body" style="padding: 18px;">
                  <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 8px;">
                    ${escapeHtml(reg.eventName || 'Acara Kampus')}
                  </h3>

                  <div style="font-size: 0.8rem; color: var(--color-text-muted); display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
                    <div>📅 Jadwal: <strong>${event ? formatDate(event.date) : '-'} (${event ? formatTime(event.time) : '-'})</strong></div>
                    <div>📍 Lokasi: <strong>${event ? escapeHtml(event.location) : '-'}</strong></div>
                    <div>🕒 Tanggal Daftar: ${reg.registrationDate}</div>
                    <div style="font-family: monospace; font-size: 0.75rem; color: var(--color-text-light);">No. Registrasi: ${reg.id}</div>
                  </div>

                  ${isApproved ? `
                    <div style="background: var(--color-success-bg); border: 1px dashed var(--color-success); border-radius: var(--radius-md); padding: 12px; text-align: center; margin-top: auto;">
                      <div style="font-size: 0.76rem; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em;">E-TIKET KEHADIRAN AKTIF</div>
                      <div style="font-size: 0.8rem; color: #047857; margin-top: 4px;">Tunjukkan identitas &amp; nomor registrasi ini kepada panitia di lokasi acara.</div>
                    </div>
                  ` : reg.status === 'Pending' ? `
                    <div style="background: var(--color-warning-bg); border: 1px dashed var(--color-warning); border-radius: var(--radius-md); padding: 10px; text-align: center; font-size: 0.8rem; color: #b45309; margin-top: auto;">
                      Pendaftaran Anda sedang ditinjau oleh panitia acara.
                    </div>
                  ` : `
                    <div style="background: var(--color-danger-bg); border-radius: var(--radius-md); padding: 10px; text-align: center; font-size: 0.8rem; color: #b91c1c; margin-top: auto;">
                      Pendaftaran berstatus: ${reg.status}
                    </div>
                  `}
                </div>

                <div class="event-card-footer" style="padding: 12px 18px;">
                  <button class="btn btn-secondary btn-sm btn-view-event-detail" data-id="${reg.eventId}" style="width: 100%;">
                    Lihat Detail Acara
                  </button>
                  ${reg.status === 'Pending' ? `
                    <button class="btn btn-danger btn-sm btn-cancel-my-reg" data-id="${reg.id}" title="Batalkan Pendaftaran">
                      Batalkan
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  // Listeners
  document.getElementById('select-demo-student')?.addEventListener('change', (e) => {
    currentStudentNim = (e.target as HTMLSelectElement).value;
    renderMyRegistrations(container);
  });

  document.getElementById('btn-browse-more-events')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'catalog' } }));
  });

  document.getElementById('btn-empty-browse-events')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'catalog' } }));
  });

  container.querySelectorAll('.btn-view-event-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const eventId = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (eventId) {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'catalog' } }));
      }
    });
  });

  container.querySelectorAll('.btn-cancel-my-reg').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const regId = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (regId && window.confirm('Apakah Anda yakin ingin membatalkan pendaftaran ini?')) {
        StorageService.updateRegistrationStatus(regId, 'Cancelled');
        showToast('Pendaftaran Anda berhasil dibatalkan.', 'info');
        renderMyRegistrations(container);
      }
    });
  });
}
