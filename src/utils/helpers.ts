// ==========================================
// CAMPUSCONNECT - HELPER UTILITIES
// Formatters, Validasi, Toast Notifications, & Modals
// ==========================================

import { EventStatus, RegistrationStatus, EventCategory } from '../types';

/**
 * Format tanggal dari YYYY-MM-DD ke format lokal Indonesia (contoh: 28 November 2026)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Format waktu menjadi format bersahabat dengan WIB
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  return `${timeString} WIB`;
}

/**
 * Menghasilkan HTML badge status acara dengan styling warna yang tepat
 */
export function renderEventStatusBadge(status: EventStatus): string {
  const badgeClasses: Record<EventStatus, string> = {
    Draft: 'badge-draft',
    Upcoming: 'badge-upcoming',
    Ongoing: 'badge-ongoing',
    Completed: 'badge-completed',
    Cancelled: 'badge-cancelled'
  };

  const statusLabels: Record<EventStatus, string> = {
    Draft: 'Draft',
    Upcoming: 'Mendatang',
    Ongoing: 'Berlangsung',
    Completed: 'Selesai',
    Cancelled: 'Dibatalkan'
  };

  const cssClass = badgeClasses[status] || 'badge-default';
  const label = statusLabels[status] || status;

  return `<span class="badge ${cssClass}"><span class="badge-dot"></span>${label}</span>`;
}

/**
 * Menghasilkan HTML badge status pendaftaran
 */
export function renderRegistrationStatusBadge(status: RegistrationStatus): string {
  const badgeClasses: Record<RegistrationStatus, string> = {
    Pending: 'badge-pending',
    Approved: 'badge-approved',
    Rejected: 'badge-rejected',
    Cancelled: 'badge-cancelled'
  };

  const statusLabels: Record<RegistrationStatus, string> = {
    Pending: 'Menunggu',
    Approved: 'Disetujui',
    Rejected: 'Ditolak',
    Cancelled: 'Dibatalkan'
  };

  const cssClass = badgeClasses[status] || 'badge-default';
  const label = statusLabels[status] || status;

  return `<span class="badge ${cssClass}"><span class="badge-dot"></span>${label}</span>`;
}

/**
 * Menghasilkan badge kategori acara
 */
export function renderCategoryBadge(category: EventCategory): string {
  return `<span class="badge-category">${category}</span>`;
}

// --- VALIDATION HELPERS ---

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

export function isValidNIM(nim: string): boolean {
  // NIM umumnya 8 - 14 digit alfanumerik / angka
  const nimRegex = /^[0-9A-Za-z]{6,14}$/;
  return nimRegex.test(nim.trim());
}

// --- TOAST NOTIFICATION SYSTEM ---

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(message: string, type: ToastType = 'info', duration: number = 4000): void {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;

  const icons: Record<ToastType, string> = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  toast.innerHTML = `
    <div class="toast-content">
      ${icons[type]}
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn?.addEventListener('click', () => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => toast.remove(), 300);
  });

  toastContainer.appendChild(toast);

  // Auto remove setelah duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// --- MODAL UTILITIES ---

export function openModal(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }
}

export function closeModal(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

/**
 * Escape HTML to prevent XSS injection
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
