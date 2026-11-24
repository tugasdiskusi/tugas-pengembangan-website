// ==========================================
// CAMPUSCONNECT - EVENT REGISTRATION PAGE
// Form pendaftaran kegiatan dengan validasi lengkap & tabel registrasi
// ==========================================

import { StorageService } from '../services/storage';
import { RegistrationStatus, genericSearch } from '../types';
import {
  formatDate,
  renderRegistrationStatusBadge,
  isValidEmail,
  isValidPhone,
  isValidNIM,
  showToast,
  openModal,
  closeModal,
  escapeHtml
} from '../utils/helpers';

let currentRegSearch = '';
let currentRegStatusFilter = 'all';
let currentRegEventFilter = 'all';

export function renderRegistrations(container: HTMLElement, preselectedEventId?: string): void {
  const events = StorageService.getEvents();
  const availableEvents = events.filter(e => e.status === 'Upcoming' || e.status === 'Ongoing');

  container.innerHTML = `
    <!-- Top Action Grid -->
    <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px;">
      <!-- Registration Form Card -->
      <div class="dashboard-card" style="flex: 1; min-width: 320px;">
        <div class="card-header-flex">
          <div>
            <h2 class="card-title">Formulir Pendaftaran Kegiatan</h2>
            <p class="card-subtitle">Silakan isi identitas mahasiswa dengan benar dan valid</p>
          </div>
          <span class="badge badge-upcoming">Pendaftaran Terbuka</span>
        </div>

        <form id="form-register-student">
          <div class="form-group">
            <label class="form-label">Pilih Acara Kampus <span class="required">*</span></label>
            <select id="reg-event-select" class="form-control" required>
              <option value="" disabled ${!preselectedEventId ? 'selected' : ''}>-- Pilih Acara yang Diikuti --</option>
              ${availableEvents.map(evt => {
                const isSelected = preselectedEventId === evt.id ? 'selected' : '';
                const isFull = evt.registeredCount >= evt.quota;
                const fullTag = isFull ? ' [KUOTA PENUH]' : ` (Sisa ${evt.quota - evt.registeredCount})`;
                return `
                  <option value="${evt.id}" ${isSelected} ${isFull ? 'disabled' : ''}>
                    ${escapeHtml(evt.name)} - ${formatDate(evt.date)}${fullTag}
                  </option>
                `;
              }).join('')}
            </select>
            <div id="event-quota-warning" class="form-help" style="color: var(--color-accent);"></div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Nama Lengkap Mahasiswa <span class="required">*</span></label>
              <input type="text" id="reg-student-name" class="form-control" placeholder="Contoh: Raden Muhammad Fauzan" required />
            </div>

            <div class="form-group">
              <label class="form-label">Nomor Induk Mahasiswa (NIM) <span class="required">*</span></label>
              <input type="text" id="reg-student-nim" class="form-control" placeholder="Contoh: 2301010045" required />
              <div class="form-help">Minimal 6-14 karakter alfanumerik</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Program Studi <span class="required">*</span></label>
            <select id="reg-student-prodi" class="form-control" required>
              <option value="" disabled selected>-- Pilih Program Studi --</option>
              <option value="Teknik Informatika">Teknik Informatika</option>
              <option value="Sistem Informasi">Sistem Informasi</option>
              <option value="Teknik Komputer">Teknik Komputer</option>
              <option value="Sains Data">Sains Data</option>
              <option value="Desain Komunikasi Visual">Desain Komunikasi Visual</option>
              <option value="Manajemen Bisnis">Manajemen Bisnis</option>
              <option value="Teknik Elektro">Teknik Elektro</option>
              <option value="Ilmu Komunikasi">Ilmu Komunikasi</option>
            </select>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Email Kampus / Aktif <span class="required">*</span></label>
              <input type="email" id="reg-student-email" class="form-control" placeholder="nama@student.campus.ac.id" required />
            </div>

            <div class="form-group">
              <label class="form-label">Nomor WhatsApp / Telepon <span class="required">*</span></label>
              <input type="tel" id="reg-student-phone" class="form-control" placeholder="081234567890" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Catatan Tambahan (Opsional)</label>
            <textarea id="reg-student-notes" class="form-control" rows="2" placeholder="Pertanyaan untuk pembicara atau motivasi mengikuti kegiatan..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 6px;" id="btn-submit-registration">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Kirim Pendaftaran Kegiatan
          </button>
        </form>
      </div>
    </div>

    <!-- Registrations History Table Section -->
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="reg-search-input" 
          class="search-input" 
          placeholder="Cari berdasarkan nama mahasiswa, NIM, atau acara..."
          value="${escapeHtml(currentRegSearch)}"
        />
      </div>

      <div class="filter-actions">
        <!-- Filter Acara -->
        <select id="reg-event-filter" class="select-filter">
          <option value="all">Semua Acara</option>
          ${events.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('')}
        </select>

        <!-- Filter Status -->
        <select id="reg-status-filter" class="select-filter">
          <option value="all">Semua Status Pendaftaran</option>
          <option value="Pending">Menunggu (Pending)</option>
          <option value="Approved">Disetujui (Approved)</option>
          <option value="Rejected">Ditolak (Rejected)</option>
          <option value="Cancelled">Dibatalkan (Cancelled)</option>
        </select>
      </div>
    </div>

    <div class="dashboard-card" style="padding: 0; overflow: hidden;">
      <div id="registrations-table-container"></div>
    </div>

    <!-- MODAL EDIT STATUS REGISTRASI -->
    <div id="modal-edit-registration" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">Ubah Status Pendaftaran</h2>
          <button class="modal-close-btn" id="btn-close-edit-reg-modal">&times;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="edit-reg-id" />
          <div style="margin-bottom: 16px; background: var(--color-bg-app); padding: 14px; border-radius: var(--radius-md);">
            <div style="font-weight: 700;" id="edit-reg-student-name"></div>
            <div style="font-size: 0.82rem; color: var(--color-text-muted);" id="edit-reg-event-name"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Pilih Status Baru <span class="required">*</span></label>
            <select id="edit-reg-status-select" class="form-control">
              <option value="Pending">Pending (Menunggu Verifikasi)</option>
              <option value="Approved">Approved (Disetujui & Diterima)</option>
              <option value="Rejected">Rejected (Ditolak)</option>
              <option value="Cancelled">Cancelled (Dibatalkan)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel-edit-reg">Batal</button>
          <button class="btn btn-primary" id="btn-save-edit-reg-status">Perbarui Status</button>
        </div>
      </div>
    </div>
  `;

  attachRegistrationEvents(container);
  refreshRegistrationsTable();
}

/**
 * Pasang listeners untuk submit pendaftaran & filter
 */
function attachRegistrationEvents(container: HTMLElement): void {
  const form = document.getElementById('form-register-student') as HTMLFormElement;
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const eventId = (document.getElementById('reg-event-select') as HTMLSelectElement).value;
    const participantName = (document.getElementById('reg-student-name') as HTMLInputElement).value.trim();
    const participantNim = (document.getElementById('reg-student-nim') as HTMLInputElement).value.trim();
    const studyProgram = (document.getElementById('reg-student-prodi') as HTMLSelectElement).value;
    const participantEmail = (document.getElementById('reg-student-email') as HTMLInputElement).value.trim();
    const participantPhone = (document.getElementById('reg-student-phone') as HTMLInputElement).value.trim();
    const notes = (document.getElementById('reg-student-notes') as HTMLTextAreaElement).value.trim();

    // Validasi form lengkap
    if (!eventId || !participantName || !participantNim || !studyProgram || !participantEmail || !participantPhone) {
      showToast('Harap lengkapi semua isian formulir pendaftaran!', 'warning');
      return;
    }

    if (!isValidNIM(participantNim)) {
      showToast('Format NIM tidak valid! Masukkan 6-14 digit angka/huruf.', 'error');
      return;
    }

    if (!isValidEmail(participantEmail)) {
      showToast('Format email tidak valid!', 'error');
      return;
    }

    if (!isValidPhone(participantPhone)) {
      showToast('Format nomor WhatsApp/telepon tidak valid!', 'error');
      return;
    }

    // Eksekusi Pendaftaran
    const result = StorageService.createRegistration({
      eventId,
      participantName,
      participantNim,
      studyProgram,
      participantEmail,
      participantPhone,
      notes
    });

    if (result.success) {
      showToast(result.message, 'success');
      form.reset();
      refreshRegistrationsTable();
    } else {
      showToast(result.message, 'error');
    }
  });

  // Filter Listeners
  const searchInput = document.getElementById('reg-search-input') as HTMLInputElement;
  const eventFilter = document.getElementById('reg-event-filter') as HTMLSelectElement;
  const statusFilter = document.getElementById('reg-status-filter') as HTMLSelectElement;

  searchInput?.addEventListener('input', (e) => {
    currentRegSearch = (e.target as HTMLInputElement).value;
    refreshRegistrationsTable();
  });

  eventFilter?.addEventListener('change', (e) => {
    currentRegEventFilter = (e.target as HTMLSelectElement).value;
    refreshRegistrationsTable();
  });

  statusFilter?.addEventListener('change', (e) => {
    currentRegStatusFilter = (e.target as HTMLSelectElement).value;
    refreshRegistrationsTable();
  });

  // Modal Update Status
  document.getElementById('btn-close-edit-reg-modal')?.addEventListener('click', () => {
    closeModal('modal-edit-registration');
  });

  document.getElementById('btn-cancel-edit-reg')?.addEventListener('click', () => {
    closeModal('modal-edit-registration');
  });

  document.getElementById('btn-save-edit-reg-status')?.addEventListener('click', () => {
    const regId = (document.getElementById('edit-reg-id') as HTMLInputElement).value;
    const newStatus = (document.getElementById('edit-reg-status-select') as HTMLSelectElement).value as RegistrationStatus;

    if (regId && newStatus) {
      StorageService.updateRegistrationStatus(regId, newStatus);
      showToast(`Status pendaftaran berhasil diubah menjadi ${newStatus}!`, 'success');
      closeModal('modal-edit-registration');
      refreshRegistrationsTable();
    }
  });
}

/**
 * Render ulang tabel daftar registrasi
 */
function refreshRegistrationsTable(): void {
  const container = document.getElementById('registrations-table-container');
  if (!container) return;

  let registrations = StorageService.getRegistrations();

  // Filter Acara
  if (currentRegEventFilter !== 'all') {
    registrations = registrations.filter(r => r.eventId === currentRegEventFilter);
  }

  // Filter Status
  if (currentRegStatusFilter !== 'all') {
    registrations = registrations.filter(r => r.status === currentRegStatusFilter);
  }

  // Pencarian Generic
  if (currentRegSearch.trim()) {
    registrations = genericSearch(registrations, currentRegSearch, [
      'participantName', 'participantNim', 'eventName', 'studyProgram', 'participantEmail'
    ]);
  }

  if (registrations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <h3 class="empty-state-title">Belum Ada Data Pendaftaran</h3>
        <p class="empty-state-desc">Pendaftaran mahasiswa yang masuk akan ditampilkan pada tabel ini.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive" style="border: none; border-radius: 0;">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID Registrasi</th>
            <th>Nama Mahasiswa</th>
            <th>NIM &amp; Prodi</th>
            <th>Acara Tujuan</th>
            <th>Waktu Daftar</th>
            <th>Status</th>
            <th style="text-align: right;">Kelola</th>
          </tr>
        </thead>
        <tbody>
          ${registrations.map(reg => `
            <tr>
              <td style="font-family: monospace; font-size: 0.78rem; color: var(--color-text-muted);">${reg.id}</td>
              <td>
                <div style="font-weight: 600;">${escapeHtml(reg.participantName)}</div>
                <div style="font-size: 0.76rem; color: var(--color-text-muted);">${escapeHtml(reg.participantEmail)} &bull; ${escapeHtml(reg.participantPhone)}</div>
              </td>
              <td>
                <div style="font-weight: 600; font-family: monospace;">${escapeHtml(reg.participantNim)}</div>
                <div style="font-size: 0.78rem; color: var(--color-text-muted);">${escapeHtml(reg.studyProgram)}</div>
              </td>
              <td>
                <div style="font-weight: 500;">${escapeHtml(reg.eventName || 'Acara')}</div>
              </td>
              <td style="font-size: 0.82rem; color: var(--color-text-muted);">
                ${reg.registrationDate}
              </td>
              <td>${renderRegistrationStatusBadge(reg.status)}</td>
              <td>
                <div class="table-actions" style="justify-content: flex-end;">
                  <button class="btn btn-secondary btn-sm btn-edit-reg-status" data-id="${reg.id}" data-name="${escapeHtml(reg.participantName)}" data-event="${escapeHtml(reg.eventName || '')}" data-status="${reg.status}">
                    Ubah Status
                  </button>
                  <button class="btn-icon btn-delete-reg" data-id="${reg.id}" style="color: var(--color-danger);" title="Hapus Data">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach button events
  container.querySelectorAll('.btn-edit-reg-status').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement;
      const id = el.getAttribute('data-id');
      const name = el.getAttribute('data-name');
      const eventName = el.getAttribute('data-event');
      const status = el.getAttribute('data-status');

      if (id) {
        (document.getElementById('edit-reg-id') as HTMLInputElement).value = id;
        document.getElementById('edit-reg-student-name')!.textContent = name || '';
        document.getElementById('edit-reg-event-name')!.textContent = `Acara: ${eventName}`;
        (document.getElementById('edit-reg-status-select') as HTMLSelectElement).value = status || 'Pending';
        openModal('modal-edit-registration');
      }
    });
  });

  container.querySelectorAll('.btn-delete-reg').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id && window.confirm('Apakah Anda yakin ingin membatalkan dan menghapus data pendaftaran ini?')) {
        StorageService.deleteRegistration(id);
        showToast('Data pendaftaran berhasil dihapus.', 'info');
        refreshRegistrationsTable();
      }
    });
  });
}
