// ==========================================
// CAMPUSCONNECT - PARTICIPANT MANAGEMENT PAGE
// Manajemen Data Peserta Kegiatan Kampus
// ==========================================

import { StorageService } from '../services/storage';
import { Participant, genericSearch } from '../types';
import {
  showToast,
  openModal,
  closeModal,
  escapeHtml,
  isValidEmail,
  isValidPhone,
  isValidNIM,
  renderRegistrationStatusBadge
} from '../utils/helpers';

let currentParticipantSearch = '';
let currentProdiFilter = 'all';

export function renderParticipants(container: HTMLElement): void {
  const participants = StorageService.getParticipants();
  const events = StorageService.getEvents();
  const registrations = StorageService.getRegistrations();

  container.innerHTML = `
    <!-- Top Summary Card: Participant Distribution -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Total Mahasiswa Terdaftar</span>
          <span class="stat-value">${participants.length}</span>
          <span class="stat-trend" style="color: var(--color-success);">Tersebar di berbagai program studi</span>
        </div>
        <div class="stat-icon-wrapper stat-icon-emerald">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Total Partisipasi Kegiatan</span>
          <span class="stat-value">${registrations.length}</span>
          <span class="stat-trend" style="color: var(--color-accent);">Akumulasi seluruh acara</span>
        </div>
        <div class="stat-icon-wrapper stat-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Rata-rata Peserta / Acara</span>
          <span class="stat-value">${events.length > 0 ? (registrations.length / events.length).toFixed(1) : '0'}</span>
          <span class="stat-trend" style="color: var(--color-info);">Tingkat keikutsertaan tinggi</span>
        </div>
        <div class="stat-icon-wrapper stat-icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="participant-search-input" 
          class="search-input" 
          placeholder="Cari nama mahasiswa atau NIM..."
          value="${escapeHtml(currentParticipantSearch)}"
        />
      </div>

      <div class="filter-actions">
        <!-- Filter Program Studi -->
        <select id="participant-prodi-filter" class="select-filter">
          <option value="all">Semua Program Studi</option>
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
    </div>

    <!-- Table Container -->
    <div id="participants-table-container"></div>

    <!-- MODAL EDIT PESERTA -->
    <div id="modal-edit-participant" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">Edit Data Mahasiswa</h2>
          <button class="modal-close-btn" id="btn-close-edit-participant">&times;</button>
        </div>
        <form id="form-edit-participant">
          <div class="modal-body">
            <input type="hidden" id="edit-participant-id" />

            <div class="form-group">
              <label class="form-label">Nama Lengkap <span class="required">*</span></label>
              <input type="text" id="edit-participant-name" class="form-control" required />
            </div>

            <div class="form-group">
              <label class="form-label">NIM <span class="required">*</span></label>
              <input type="text" id="edit-participant-nim" class="form-control" required />
            </div>

            <div class="form-group">
              <label class="form-label">Program Studi <span class="required">*</span></label>
              <select id="edit-participant-prodi" class="form-control" required>
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

            <div class="form-group">
              <label class="form-label">Email Kampus <span class="required">*</span></label>
              <input type="email" id="edit-participant-email" class="form-control" required />
            </div>

            <div class="form-group">
              <label class="form-label">Nomor WhatsApp / HP <span class="required">*</span></label>
              <input type="tel" id="edit-participant-phone" class="form-control" required />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-edit-participant">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL DETAIL PESERTA -->
    <div id="modal-detail-participant" class="modal-overlay">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h2 class="modal-title">Profil &amp; Riwayat Kegiatan Mahasiswa</h2>
          <button class="modal-close-btn" id="btn-close-detail-participant">&times;</button>
        </div>
        <div class="modal-body" id="detail-participant-body"></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-close-detail-part-footer">Tutup</button>
        </div>
      </div>
    </div>
  `;

  attachParticipantEvents(container);
  refreshParticipantsTable();
}

/**
 * Filter dan render tabel peserta
 */
function refreshParticipantsTable(): void {
  const container = document.getElementById('participants-table-container');
  if (!container) return;

  let participants = StorageService.getParticipants();
  const registrations = StorageService.getRegistrations();

  // Filter Prodi
  if (currentProdiFilter !== 'all') {
    participants = participants.filter(p => p.studyProgram === currentProdiFilter);
  }

  // Pencarian Generic
  if (currentParticipantSearch.trim()) {
    participants = genericSearch(participants, currentParticipantSearch, [
      'name', 'nim', 'studyProgram', 'email', 'phone'
    ]);
  }

  if (participants.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
        </div>
        <h3 class="empty-state-title">Peserta Tidak Ditemukan</h3>
        <p class="empty-state-desc">Tidak ada mahasiswa yang sesuai dengan pencarian "${escapeHtml(currentParticipantSearch)}".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>NIM</th>
            <th>Program Studi</th>
            <th>Kontak</th>
            <th>Acara Diikuti</th>
            <th>Terdaftar Sejak</th>
            <th style="text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${participants.map(part => {
            const userRegs = registrations.filter(r => r.participantId === part.id || r.participantNim === part.nim);
            return `
              <tr>
                <td>
                  <div style="font-weight: 600; color: var(--color-text-main); cursor: pointer;" class="clickable-part-name" data-id="${part.id}">
                    ${escapeHtml(part.name)}
                  </div>
                  <div style="font-size: 0.76rem; color: var(--color-text-muted); font-family: monospace;">ID: ${part.id}</div>
                </td>
                <td style="font-family: monospace; font-weight: 600;">${escapeHtml(part.nim)}</td>
                <td><span class="badge-category">${escapeHtml(part.studyProgram)}</span></td>
                <td>
                  <div style="font-size: 0.82rem;">${escapeHtml(part.email)}</div>
                  <div style="font-size: 0.76rem; color: var(--color-text-muted);">${escapeHtml(part.phone)}</div>
                </td>
                <td>
                  <span class="badge badge-upcoming" style="cursor: pointer;" title="Lihat riwayat">${userRegs.length} Acara</span>
                </td>
                <td style="font-size: 0.8rem; color: var(--color-text-muted);">${part.registeredAt}</td>
                <td>
                  <div class="table-actions" style="justify-content: flex-end;">
                    <button class="btn-icon btn-detail-participant" data-id="${part.id}" title="Lihat Profil Lengkap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </button>
                    <button class="btn-icon btn-edit-participant" data-id="${part.id}" title="Edit Data Mahasiswa">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon btn-delete-participant" data-id="${part.id}" style="color: var(--color-danger);" title="Hapus Mahasiswa">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  attachTableParticipantEvents(container);
}

/**
 * Pasang action buttons di baris tabel peserta
 */
function attachTableParticipantEvents(container: HTMLElement): void {
  // Detail
  container.querySelectorAll('.btn-detail-participant, .clickable-part-name').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) showParticipantDetailModal(id);
    });
  });

  // Edit
  container.querySelectorAll('.btn-edit-participant').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) openEditParticipantModal(id);
    });
  });

  // Delete
  container.querySelectorAll('.btn-delete-participant').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) confirmDeleteParticipant(id);
    });
  });
}

/**
 * Attach form submit & filter listeners
 */
function attachParticipantEvents(container: HTMLElement): void {
  const searchInput = document.getElementById('participant-search-input') as HTMLInputElement;
  const prodiFilter = document.getElementById('participant-prodi-filter') as HTMLSelectElement;

  searchInput?.addEventListener('input', (e) => {
    currentParticipantSearch = (e.target as HTMLInputElement).value;
    refreshParticipantsTable();
  });

  prodiFilter?.addEventListener('change', (e) => {
    currentProdiFilter = (e.target as HTMLSelectElement).value;
    refreshParticipantsTable();
  });

  // Modal Edit listeners
  document.getElementById('btn-close-edit-participant')?.addEventListener('click', () => {
    closeModal('modal-edit-participant');
  });

  document.getElementById('btn-cancel-edit-participant')?.addEventListener('click', () => {
    closeModal('modal-edit-participant');
  });

  document.getElementById('btn-close-detail-participant')?.addEventListener('click', () => {
    closeModal('modal-detail-participant');
  });

  document.getElementById('btn-close-detail-part-footer')?.addEventListener('click', () => {
    closeModal('modal-detail-participant');
  });

  // Submit edit form
  const editForm = document.getElementById('form-edit-participant') as HTMLFormElement;
  editForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = (document.getElementById('edit-participant-id') as HTMLInputElement).value;
    const name = (document.getElementById('edit-participant-name') as HTMLInputElement).value.trim();
    const nim = (document.getElementById('edit-participant-nim') as HTMLInputElement).value.trim();
    const studyProgram = (document.getElementById('edit-participant-prodi') as HTMLSelectElement).value;
    const email = (document.getElementById('edit-participant-email') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('edit-participant-phone') as HTMLInputElement).value.trim();

    if (!name || !nim || !studyProgram || !email || !phone) {
      showToast('Harap lengkapi semua kolom!', 'warning');
      return;
    }

    if (!isValidNIM(nim)) {
      showToast('NIM tidak valid!', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('Format email tidak valid!', 'error');
      return;
    }

    if (!isValidPhone(phone)) {
      showToast('Format nomor telepon tidak valid!', 'error');
      return;
    }

    const success = StorageService.updateParticipant(id, {
      name,
      nim,
      studyProgram,
      email,
      phone
    });

    if (success) {
      showToast('Data mahasiswa berhasil diperbarui!', 'success');
      closeModal('modal-edit-participant');
      refreshParticipantsTable();
    } else {
      showToast('Gagal memperbarui data.', 'error');
    }
  });
}

function openEditParticipantModal(id: string): void {
  const p = StorageService.getParticipantById(id);
  if (!p) return;

  (document.getElementById('edit-participant-id') as HTMLInputElement).value = p.id;
  (document.getElementById('edit-participant-name') as HTMLInputElement).value = p.name;
  (document.getElementById('edit-participant-nim') as HTMLInputElement).value = p.nim;
  (document.getElementById('edit-participant-prodi') as HTMLSelectElement).value = p.studyProgram;
  (document.getElementById('edit-participant-email') as HTMLInputElement).value = p.email;
  (document.getElementById('edit-participant-phone') as HTMLInputElement).value = p.phone;

  openModal('modal-edit-participant');
}

function confirmDeleteParticipant(id: string): void {
  const p = StorageService.getParticipantById(id);
  if (!p) return;

  if (window.confirm(`Hapus data mahasiswa ${p.name} (${p.nim})?\nSemua riwayat pendaftaran mahasiswa ini juga akan terhapus.`)) {
    StorageService.deleteParticipant(id);
    showToast('Data mahasiswa berhasil dihapus.', 'info');
    refreshParticipantsTable();
  }
}

function showParticipantDetailModal(id: string): void {
  const p = StorageService.getParticipantById(id);
  if (!p) return;

  const registrations = StorageService.getRegistrations().filter(r => r.participantId === p.id || r.participantNim === p.nim);
  const detailBody = document.getElementById('detail-participant-body');

  if (detailBody) {
    detailBody.innerHTML = `
      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border);">
        <div style="width: 64px; height: 64px; border-radius: var(--radius-full); background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700;">
          ${escapeHtml(p.name.charAt(0))}
        </div>
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 700;">${escapeHtml(p.name)}</h3>
          <div style="font-size: 0.85rem; color: var(--color-text-muted); font-family: monospace;">NIM: ${escapeHtml(p.nim)}</div>
          <div style="margin-top: 4px;"><span class="badge-category">${escapeHtml(p.studyProgram)}</span></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: var(--color-bg-app); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Email Kampus</div>
          <div style="font-weight: 500; margin-top: 2px;">${escapeHtml(p.email)}</div>
        </div>

        <div style="background: var(--color-bg-app); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">WhatsApp / No. Telp</div>
          <div style="font-weight: 500; margin-top: 2px;">${escapeHtml(p.phone)}</div>
        </div>
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px;">Riwayat Keikutsertaan Acara (${registrations.length})</h4>
      
      ${registrations.length === 0 ? `
        <p style="font-size: 0.85rem; color: var(--color-text-muted);">Mahasiswa ini belum memiliki riwayat pendaftaran kegiatan.</p>
      ` : `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama Acara</th>
                <th>Tanggal Daftar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${registrations.map(r => `
                <tr>
                  <td><strong>${escapeHtml(r.eventName || 'Acara')}</strong></td>
                  <td style="font-size: 0.8rem; color: var(--color-text-muted);">${r.registrationDate}</td>
                  <td>${renderRegistrationStatusBadge(r.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  }

  openModal('modal-detail-participant');
}
