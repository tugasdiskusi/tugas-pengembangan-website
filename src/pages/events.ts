// ==========================================
// CAMPUSCONNECT - EVENT MANAGEMENT & CATALOG PAGE
// Fitur CRUD Acara Kampus, Filter, Search, Detail, & Katalog
// ==========================================

import { StorageService } from '../services/storage';
import { CampusEvent, EventCategory, EventStatus, genericSearch, genericSort } from '../types';
import {
  formatDate,
  formatTime,
  renderEventStatusBadge,
  renderCategoryBadge,
  showToast,
  openModal,
  closeModal,
  escapeHtml
} from '../utils/helpers';

let currentSearchTerm = '';
let currentCategoryFilter = 'all';
let currentStatusFilter = 'all';
let currentSortOrder: 'desc' | 'asc' = 'desc';
let currentViewMode: 'table' | 'cards' = 'table';

export function renderEvents(container: HTMLElement, initialView: 'table' | 'cards' = 'table'): void {
  currentViewMode = initialView;

  container.innerHTML = `
    <!-- Top Action & Filter Header -->
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="event-search-input" 
          class="search-input" 
          placeholder="Cari acara berdasarkan nama, penyelenggara, atau lokasi..."
          value="${escapeHtml(currentSearchTerm)}"
        />
      </div>

      <div class="filter-actions">
        <!-- Filter Kategori -->
        <select id="event-category-filter" class="select-filter">
          <option value="all">Semua Kategori</option>
          <option value="Seminar">Seminar</option>
          <option value="Workshop">Workshop</option>
          <option value="Lomba">Lomba</option>
          <option value="Webinar">Webinar</option>
          <option value="Organisasi">Organisasi</option>
          <option value="Sosial">Sosial</option>
          <option value="Olahraga">Olahraga</option>
          <option value="Lainnya">Lainnya</option>
        </select>

        <!-- Filter Status -->
        <select id="event-status-filter" class="select-filter">
          <option value="all">Semua Status</option>
          <option value="Upcoming">Mendatang</option>
          <option value="Ongoing">Berlangsung</option>
          <option value="Completed">Selesai</option>
          <option value="Draft">Draft</option>
          <option value="Cancelled">Dibatalkan</option>
        </select>

        <!-- Sort Tanggal -->
        <select id="event-sort-order" class="select-filter">
          <option value="desc">Tanggal Terbaru</option>
          <option value="asc">Tanggal Terlama</option>
        </select>

        <!-- View Switcher -->
        <div style="display: flex; gap: 4px; background: var(--color-bg-app); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 2px;">
          <button class="btn btn-sm ${currentViewMode === 'table' ? 'btn-primary' : 'btn-secondary'}" id="btn-view-table" title="Tampilan Tabel">
            Tabel
          </button>
          <button class="btn btn-sm ${currentViewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}" id="btn-view-cards" title="Tampilan Kartu">
            Katalog
          </button>
        </div>

        <!-- Tombol Tambah Acara -->
        <button class="btn btn-primary" id="btn-open-add-event">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Acara
        </button>
      </div>
    </div>

    <!-- Container Konten Acara -->
    <div id="events-content-container"></div>

    <!-- MODAL FORM TAMBAH / EDIT ACARA -->
    <div id="event-form-modal" class="modal-overlay">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h2 class="modal-title" id="event-modal-title">Tambah Acara Baru</h2>
          <button class="modal-close-btn" id="btn-close-event-modal">&times;</button>
        </div>
        <form id="event-form">
          <div class="modal-body">
            <input type="hidden" id="event-form-id" />

            <div class="form-group">
              <label class="form-label">Nama Acara <span class="required">*</span></label>
              <input type="text" id="event-form-name" class="form-control" placeholder="Contoh: National Web Tech Summit 2026" required />
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Kategori Acara <span class="required">*</span></label>
                <select id="event-form-category" class="form-control" required>
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Lomba">Lomba</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Organisasi">Organisasi</option>
                  <option value="Sosial">Sosial</option>
                  <option value="Olahraga">Olahraga</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Status Acara <span class="required">*</span></label>
                <select id="event-form-status" class="form-control" required>
                  <option value="Upcoming">Upcoming (Mendatang)</option>
                  <option value="Ongoing">Ongoing (Berlangsung)</option>
                  <option value="Draft">Draft</option>
                  <option value="Completed">Completed (Selesai)</option>
                  <option value="Cancelled">Cancelled (Dibatalkan)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Deskripsi Acara <span class="required">*</span></label>
              <textarea id="event-form-description" class="form-control" rows="3" placeholder="Jelaskan tujuan acara, pembicara, materi, dan ketentuan peserta..." required></textarea>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Penyelenggara <span class="required">*</span></label>
                <input type="text" id="event-form-organizer" class="form-control" placeholder="Contoh: BEM Fakultas Ilmu Komputer" required />
              </div>

              <div class="form-group">
                <label class="form-label">Lokasi Acara <span class="required">*</span></label>
                <input type="text" id="event-form-location" class="form-control" placeholder="Contoh: Auditorium Lt.3 / Zoom Meeting" required />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Tanggal Pelaksanaan <span class="required">*</span></label>
                <input type="date" id="event-form-date" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label">Waktu Mulai <span class="required">*</span></label>
                <input type="time" id="event-form-time" class="form-control" required />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Batas Akhir Pendaftaran <span class="required">*</span></label>
                <input type="date" id="event-form-deadline" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label">Kuota Peserta <span class="required">*</span></label>
                <input type="number" id="event-form-quota" class="form-control" min="1" max="10000" placeholder="Contoh: 100" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">URL Poster / Gambar Acara</label>
              <input type="url" id="event-form-image" class="form-control" placeholder="https://example.com/poster.jpg (Opsional, tersedia gambar default)" />
              <div class="form-help">Biarkan kosong untuk menggunakan template banner otomatis berkualitas tinggi.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-event-form">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-save-event">Simpan Acara</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL DETAIL ACARA -->
    <div id="event-detail-modal" class="modal-overlay">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h2 class="modal-title">Detail Kegiatan Kampus</h2>
          <button class="modal-close-btn" id="btn-close-event-detail">&times;</button>
        </div>
        <div class="modal-body" id="event-detail-content"></div>
        <div class="modal-footer" id="event-detail-footer"></div>
      </div>
    </div>
  `;

  // Pasang event listener komponen kontrol
  attachEventListeners(container);

  // Render konten sesuai data saat ini
  refreshEventsView();
}

/**
 * Filter dan render daftar acara sesuai kriteria pencarian dan filter
 */
function refreshEventsView(): void {
  const contentContainer = document.getElementById('events-content-container');
  if (!contentContainer) return;

  let allEvents = StorageService.getEvents();

  // 1. Filter Kategori
  if (currentCategoryFilter !== 'all') {
    allEvents = allEvents.filter(e => e.category === currentCategoryFilter);
  }

  // 2. Filter Status
  if (currentStatusFilter !== 'all') {
    allEvents = allEvents.filter(e => e.status === currentStatusFilter);
  }

  // 3. Pencarian Berdasarkan Generic Helper
  if (currentSearchTerm.trim()) {
    allEvents = genericSearch(allEvents, currentSearchTerm, ['name', 'organizer', 'location', 'description']);
  }

  // 4. Pengurutan (Sort) Berdasarkan Tanggal
  allEvents = genericSort(allEvents, 'date', currentSortOrder);

  if (allEvents.length === 0) {
    contentContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h3 class="empty-state-title">Tidak Ada Acara Ditemukan</h3>
        <p class="empty-state-desc">Tidak ada kegiatan yang sesuai dengan filter atau kata kunci pencarian "${escapeHtml(currentSearchTerm)}".</p>
        <button class="btn btn-secondary btn-sm" id="btn-reset-filter">Reset Filter</button>
      </div>
    `;

    document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
      currentSearchTerm = '';
      currentCategoryFilter = 'all';
      currentStatusFilter = 'all';
      const searchInput = document.getElementById('event-search-input') as HTMLInputElement;
      const catSelect = document.getElementById('event-category-filter') as HTMLSelectElement;
      const statusSelect = document.getElementById('event-status-filter') as HTMLSelectElement;
      if (searchInput) searchInput.value = '';
      if (catSelect) catSelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      refreshEventsView();
    });
    return;
  }

  if (currentViewMode === 'table') {
    renderEventsTable(contentContainer, allEvents);
  } else {
    renderEventsCards(contentContainer, allEvents);
  }
}

/**
 * Render Tampilan Tabel
 */
function renderEventsTable(container: HTMLElement, events: CampusEvent[]): void {
  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama Acara</th>
            <th>Kategori</th>
            <th>Jadwal Pelaksanaan</th>
            <th>Penyelenggara</th>
            <th>Kuota</th>
            <th>Status</th>
            <th style="text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${events.map(event => {
            const isFull = event.registeredCount >= event.quota;
            return `
              <tr>
                <td style="font-family: monospace; font-size: 0.78rem; color: var(--color-text-muted);">${event.id}</td>
                <td>
                  <div style="font-weight: 600; color: var(--color-text-main); cursor: pointer;" class="clickable-event-name" data-id="${event.id}">
                    ${escapeHtml(event.name)}
                  </div>
                  <div style="font-size: 0.76rem; color: var(--color-text-muted);">${escapeHtml(event.location)}</div>
                </td>
                <td>${renderCategoryBadge(event.category)}</td>
                <td>
                  <div>${formatDate(event.date)}</div>
                  <div style="font-size: 0.76rem; color: var(--color-text-muted);">${formatTime(event.time)}</div>
                </td>
                <td>${escapeHtml(event.organizer)}</td>
                <td>
                  <div style="font-weight: 600; color: ${isFull ? 'var(--color-danger)' : 'inherit'};">
                    ${event.registeredCount} / ${event.quota}
                  </div>
                  <div style="font-size: 0.72rem; color: var(--color-text-muted);">
                    ${isFull ? '<span style="color: var(--color-danger); font-weight: 600;">Penuh</span>' : 'Tersedia'}
                  </div>
                </td>
                <td>${renderEventStatusBadge(event.status)}</td>
                <td>
                  <div class="table-actions" style="justify-content: flex-end;">
                    <button class="btn-icon btn-action-detail" data-id="${event.id}" title="Lihat Detail Acara">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button class="btn-icon btn-action-edit" data-id="${event.id}" title="Edit Acara">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon btn-action-delete" data-id="${event.id}" style="color: var(--color-danger);" title="Hapus Acara">
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

  attachTableAndCardEvents(container);
}

/**
 * Render Tampilan Kartu Katalog
 */
function renderEventsCards(container: HTMLElement, events: CampusEvent[]): void {
  container.innerHTML = `
    <div class="events-catalog-grid">
      ${events.map(event => {
        const percentage = Math.min(100, Math.round((event.registeredCount / event.quota) * 100));
        const defaultBanner = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
        const posterImg = event.image || defaultBanner;

        return `
          <div class="event-card">
            <div class="event-card-img-wrap">
              <img src="${posterImg}" alt="${escapeHtml(event.name)}" class="event-card-img" onerror="this.src='${defaultBanner}'" />
              <div class="event-card-badges">
                ${renderCategoryBadge(event.category)}
                ${renderEventStatusBadge(event.status)}
              </div>
            </div>
            <div class="event-card-body">
              <h3 class="event-card-title">${escapeHtml(event.name)}</h3>
              <p class="event-card-desc">${escapeHtml(event.description)}</p>

              <div class="event-meta-list">
                <div class="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>${formatDate(event.date)} &bull; ${formatTime(event.time)}</span>
                </div>
                <div class="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>${escapeHtml(event.location)}</span>
                </div>
                <div class="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                  <span>Penyelenggara: ${escapeHtml(event.organizer)}</span>
                </div>
              </div>

              <div class="event-progress-wrap">
                <div class="event-progress-label">
                  <span>Terdaftar: <strong>${event.registeredCount} / ${event.quota}</strong></span>
                  <span>${percentage}%</span>
                </div>
                <div class="event-progress-bar">
                  <div class="event-progress-fill" style="width: ${percentage}%;"></div>
                </div>
              </div>
            </div>

            <div class="event-card-footer">
              <button class="btn btn-secondary btn-sm btn-action-detail" data-id="${event.id}">Detail Acara</button>
              <button class="btn btn-primary btn-sm btn-card-register" data-id="${event.id}">Daftar Sekarang</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  attachTableAndCardEvents(container);
}

/**
 * Pasang event listener untuk tombol aksi di setiap baris atau kartu
 */
function attachTableAndCardEvents(container: HTMLElement): void {
  // Tombol Detail
  container.querySelectorAll('.btn-action-detail, .clickable-event-name').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) showEventDetailModal(id);
    });
  });

  // Tombol Edit
  container.querySelectorAll('.btn-action-edit').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) openEditEventModal(id);
    });
  });

  // Tombol Hapus
  container.querySelectorAll('.btn-action-delete').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) confirmDeleteEvent(id);
    });
  });

  // Tombol Daftar dari Kartu Katalog
  container.querySelectorAll('.btn-card-register').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        window.dispatchEvent(new CustomEvent('navigate', { 
          detail: { page: 'registrations', selectedEventId: id } 
        }));
      }
    });
  });
}

/**
 * Pasang filter listeners
 */
function attachEventListeners(container: HTMLElement): void {
  const searchInput = document.getElementById('event-search-input') as HTMLInputElement;
  const categoryFilter = document.getElementById('event-category-filter') as HTMLSelectElement;
  const statusFilter = document.getElementById('event-status-filter') as HTMLSelectElement;
  const sortOrder = document.getElementById('event-sort-order') as HTMLSelectElement;

  searchInput?.addEventListener('input', (e) => {
    currentSearchTerm = (e.target as HTMLInputElement).value;
    refreshEventsView();
  });

  categoryFilter?.addEventListener('change', (e) => {
    currentCategoryFilter = (e.target as HTMLSelectElement).value;
    refreshEventsView();
  });

  statusFilter?.addEventListener('change', (e) => {
    currentStatusFilter = (e.target as HTMLSelectElement).value;
    refreshEventsView();
  });

  sortOrder?.addEventListener('change', (e) => {
    currentSortOrder = (e.target as HTMLSelectElement).value as 'asc' | 'desc';
    refreshEventsView();
  });

  // View Switchers
  const btnTable = document.getElementById('btn-view-table');
  const btnCards = document.getElementById('btn-view-cards');

  btnTable?.addEventListener('click', () => {
    currentViewMode = 'table';
    btnTable.className = 'btn btn-sm btn-primary';
    btnCards!.className = 'btn btn-sm btn-secondary';
    refreshEventsView();
  });

  btnCards?.addEventListener('click', () => {
    currentViewMode = 'cards';
    btnCards.className = 'btn btn-sm btn-primary';
    btnTable!.className = 'btn btn-sm btn-secondary';
    refreshEventsView();
  });

  // Modal Tambah
  document.getElementById('btn-open-add-event')?.addEventListener('click', () => {
    openAddEventModal();
  });

  document.getElementById('btn-close-event-modal')?.addEventListener('click', () => {
    closeModal('event-form-modal');
  });

  document.getElementById('btn-cancel-event-form')?.addEventListener('click', () => {
    closeModal('event-form-modal');
  });

  document.getElementById('btn-close-event-detail')?.addEventListener('click', () => {
    closeModal('event-detail-modal');
  });

  // Handle Form Submit
  const form = document.getElementById('event-form') as HTMLFormElement;
  form?.addEventListener('submit', handleEventFormSubmit);
}

/**
 * Buka modal tambah acara
 */
function openAddEventModal(): void {
  const title = document.getElementById('event-modal-title');
  const formId = document.getElementById('event-form-id') as HTMLInputElement;
  const form = document.getElementById('event-form') as HTMLFormElement;

  if (title) title.textContent = 'Tambah Acara Kampus Baru';
  if (formId) formId.value = '';
  form.reset();

  // Set default deadline besok
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const deadlineInput = document.getElementById('event-form-deadline') as HTMLInputElement;
  const dateInput = document.getElementById('event-form-date') as HTMLInputElement;
  if (deadlineInput) deadlineInput.value = tomorrow.toISOString().split('T')[0];
  if (dateInput) dateInput.value = tomorrow.toISOString().split('T')[0];

  openModal('event-form-modal');
}

/**
 * Buka modal edit acara
 */
function openEditEventModal(id: string): void {
  const event = StorageService.getEventById(id);
  if (!event) {
    showToast('Acara tidak ditemukan!', 'error');
    return;
  }

  const title = document.getElementById('event-modal-title');
  if (title) title.textContent = `Edit Acara: ${event.name}`;

  (document.getElementById('event-form-id') as HTMLInputElement).value = event.id;
  (document.getElementById('event-form-name') as HTMLInputElement).value = event.name;
  (document.getElementById('event-form-category') as HTMLSelectElement).value = event.category;
  (document.getElementById('event-form-status') as HTMLSelectElement).value = event.status;
  (document.getElementById('event-form-description') as HTMLTextAreaElement).value = event.description;
  (document.getElementById('event-form-organizer') as HTMLInputElement).value = event.organizer;
  (document.getElementById('event-form-location') as HTMLInputElement).value = event.location;
  (document.getElementById('event-form-date') as HTMLInputElement).value = event.date;
  (document.getElementById('event-form-time') as HTMLInputElement).value = event.time;
  (document.getElementById('event-form-deadline') as HTMLInputElement).value = event.registrationDeadline;
  (document.getElementById('event-form-quota') as HTMLInputElement).value = String(event.quota);
  (document.getElementById('event-form-image') as HTMLInputElement).value = event.image || '';

  openModal('event-form-modal');
}

/**
 * Simpan data form acara (Tambah / Edit)
 */
function handleEventFormSubmit(e: SubmitEvent): void {
  e.preventDefault();

  const id = (document.getElementById('event-form-id') as HTMLInputElement).value;
  const name = (document.getElementById('event-form-name') as HTMLInputElement).value.trim();
  const category = (document.getElementById('event-form-category') as HTMLSelectElement).value as EventCategory;
  const status = (document.getElementById('event-form-status') as HTMLSelectElement).value as EventStatus;
  const description = (document.getElementById('event-form-description') as HTMLTextAreaElement).value.trim();
  const organizer = (document.getElementById('event-form-organizer') as HTMLInputElement).value.trim();
  const location = (document.getElementById('event-form-location') as HTMLInputElement).value.trim();
  const date = (document.getElementById('event-form-date') as HTMLInputElement).value;
  const time = (document.getElementById('event-form-time') as HTMLInputElement).value;
  const registrationDeadline = (document.getElementById('event-form-deadline') as HTMLInputElement).value;
  const quota = parseInt((document.getElementById('event-form-quota') as HTMLInputElement).value, 10);
  let image = (document.getElementById('event-form-image') as HTMLInputElement).value.trim();

  // Validasi
  if (!name || !description || !organizer || !location || !date || !time || !registrationDeadline || isNaN(quota)) {
    showToast('Mohon lengkapi semua kolom bertanda bintang (*)!', 'warning');
    return;
  }

  if (quota <= 0) {
    showToast('Kuota peserta minimal 1 orang.', 'warning');
    return;
  }

  if (registrationDeadline > date) {
    showToast('Batas akhir pendaftaran tidak boleh melebihi tanggal acara!', 'warning');
    return;
  }

  if (!image) {
    image = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
  }

  if (id) {
    // Mode Update
    const success = StorageService.updateEvent(id, {
      name,
      category,
      status,
      description,
      organizer,
      location,
      date,
      time,
      registrationDeadline,
      quota,
      image
    });

    if (success) {
      showToast('Acara berhasil diperbarui!', 'success');
      closeModal('event-form-modal');
      refreshEventsView();
    } else {
      showToast('Gagal memperbarui acara.', 'error');
    }
  } else {
    // Mode Create
    StorageService.createEvent({
      name,
      category,
      status,
      description,
      organizer,
      location,
      date,
      time,
      registrationDeadline,
      quota,
      image
    });

    showToast('Acara kampus berhasil ditambahkan!', 'success');
    closeModal('event-form-modal');
    refreshEventsView();
  }
}

/**
 * Hapus acara dengan konfirmasi
 */
function confirmDeleteEvent(id: string): void {
  const event = StorageService.getEventById(id);
  if (!event) return;

  const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus acara "${event.name}"?\nSemua data pendaftaran pada acara ini juga akan dihapus.`);
  if (confirmed) {
    StorageService.deleteEvent(id);
    showToast('Acara berhasil dihapus.', 'info');
    refreshEventsView();
  }
}

/**
 * Tampilkan modal detail lengkap untuk acara
 */
export function showEventDetailModal(id: string): void {
  const event = StorageService.getEventById(id);
  if (!event) {
    showToast('Acara tidak ditemukan!', 'error');
    return;
  }

  const detailContent = document.getElementById('event-detail-content');
  const detailFooter = document.getElementById('event-detail-footer');

  const defaultBanner = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
  const banner = event.image || defaultBanner;
  const isExpired = new Date().toISOString().split('T')[0] > event.registrationDeadline;
  const isFull = event.registeredCount >= event.quota;

  if (detailContent) {
    detailContent.innerHTML = `
      <div style="margin-bottom: 20px; border-radius: var(--radius-md); overflow: hidden; max-height: 260px;">
        <img src="${banner}" alt="${escapeHtml(event.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${defaultBanner}'" />
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
        ${renderCategoryBadge(event.category)}
        ${renderEventStatusBadge(event.status)}
        <span style="font-family: monospace; font-size: 0.78rem; color: var(--color-text-muted); margin-left: auto;">ID: ${event.id}</span>
      </div>

      <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 14px; line-height: 1.3;">
        ${escapeHtml(event.name)}
      </h2>

      <p style="font-size: 0.92rem; color: var(--color-text-main); line-height: 1.6; margin-bottom: 24px;">
        ${escapeHtml(event.description)}
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; background: var(--color-bg-app); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Jadwal Pelaksanaan</div>
          <div style="font-weight: 600; margin-top: 2px;">${formatDate(event.date)}</div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted);">${formatTime(event.time)}</div>
        </div>

        <div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Lokasi Acara</div>
          <div style="font-weight: 600; margin-top: 2px;">${escapeHtml(event.location)}</div>
        </div>

        <div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Penyelenggara</div>
          <div style="font-weight: 600; margin-top: 2px;">${escapeHtml(event.organizer)}</div>
        </div>

        <div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Batas Pendaftaran</div>
          <div style="font-weight: 600; margin-top: 2px; color: ${isExpired ? 'var(--color-danger)' : 'inherit'};">
            ${formatDate(event.registrationDeadline)}
          </div>
          <div style="font-size: 0.76rem; color: var(--color-text-muted);">
            ${isExpired ? 'Pendaftaran Ditutup' : 'Pendaftaran Dibuka'}
          </div>
        </div>

        <div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Kapasitas Peserta</div>
          <div style="font-weight: 700; margin-top: 2px; font-size: 1.1rem; color: var(--color-accent);">
            ${event.registeredCount} / ${event.quota}
          </div>
          <div style="font-size: 0.76rem; color: var(--color-text-muted);">
            Sisa Kuota: <strong>${Math.max(0, event.quota - event.registeredCount)}</strong> kursi
          </div>
        </div>
      </div>
    `;
  }

  if (detailFooter) {
    const canRegister = !isExpired && !isFull && (event.status === 'Upcoming' || event.status === 'Ongoing');
    detailFooter.innerHTML = `
      <button class="btn btn-secondary" id="btn-close-detail-modal-action">Tutup</button>
      ${canRegister ? `
        <button class="btn btn-primary" id="btn-modal-register-action">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Daftar Kegiatan Sekarang
        </button>
      ` : `
        <button class="btn btn-secondary" disabled style="opacity: 0.6; cursor: not-allowed;">
          ${isFull ? 'Kuota Penuh' : isExpired ? 'Pendaftaran Ditutup' : 'Tidak Menerima Pendaftaran'}
        </button>
      `}
    `;

    document.getElementById('btn-close-detail-modal-action')?.addEventListener('click', () => {
      closeModal('event-detail-modal');
    });

    document.getElementById('btn-modal-register-action')?.addEventListener('click', () => {
      closeModal('event-detail-modal');
      window.dispatchEvent(new CustomEvent('navigate', { 
        detail: { page: 'registrations', selectedEventId: event.id } 
      }));
    });
  }

  openModal('event-detail-modal');
}
