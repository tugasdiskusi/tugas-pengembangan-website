# 🎓 CampusConnect – Campus Event Management System

> **Platform Pengelolaan Informasi Acara Kampus, Pendaftaran Kegiatan Mahasiswa, dan Manajemen Peserta Berbasis TypeScript, Vite, HTML5, dan Modern CSS.**

---

## 📌 1. Deskripsi Proyek

**CampusConnect** adalah aplikasi web modern dengan antarmuka bergaya **SaaS Dashboard** yang dirancang khusus untuk memfasilitasi biro kemahasiswaan, organisasi mahasiswa (BEM/HIMA), panitia acara, dan seluruh mahasiswa dalam mengelola siklus hidup kegiatan kampus secara interaktif, efisien, dan terstruktur.

Aplikasi ini dibangun menggunakan arsitektur **Vanilla TypeScript murni** tanpa ketergantungan pada framework JavaScript besar (seperti React, Vue, atau Angular), sehingga secara transparan memperlihatkan kekuatan tipe data statis, interfaces, union types, dan generics dari TypeScript.

---

## ✨ 2. Fitur Utama Aplikasi

### 📊 A. Dashboard Interaktif
- **Ringkasan Metrik Kampus**: Menampilkan total acara, total mahasiswa terdaftar, total pengajuan pendaftaran, acara yang sedang berlangsung (*Ongoing*), dan acara mendatang (*Upcoming*).
- **Grafik Visual Interaktif (Chart.js)**: Distribusi kategori kegiatan (bar chart) dan proporsi status kegiatan (doughnut chart).
- **Tabel Aktivitas Cepat**: Pratinjau acara terbaru dan log registrasi mahasiswa *real-time*.

### 📅 B. Manajemen Acara (Full CRUD)
- **Tambah Acara Baru**: Formulir modal dengan validasi komprehensif (nama acara, kategori, deskripsi, penyelenggara, lokasi, tanggal, waktu mulai, batas akhir pendaftaran, kuota peserta, dan tautan poster).
- **Edit & Perbarui Acara**: Memperbarui informasi kegiatan yang sudah ada secara instan.
- **Hapus Acara**: Penghapusan data dengan konfirmasi aman dan otomatis membersihkan relasi pendaftaran.
- **Pencarian & Filter Multi-Kriteria**: Pencarian nama/lokasi/penyelenggara, filter berdasarkan 8 kategori acara, filter berdasarkan status, dan pengurutan tanggal (terbaru/terlama).
- **Katalog Acara (Tampilan Kartu)**: Tampilan visual dengan gambar poster, indikator kapasitas kuota berbasis progress bar, dan tombol pendaftaran langsung.

### 📝 C. Pendaftaran Kegiatan Mahasiswa
- **Formulir Pendaftaran Lengkap**: Nama lengkap, NIM, Program Studi, Email Kampus, Nomor WhatsApp, dan Catatan tambahan.
- **Sistem Validasi Ketat**:
  - Validasi regex format email dan nomor telepon.
  - Validasi format NIM alfanumerik.
  - **Pencegahan Pendaftaran Ganda**: Menolak pendaftaran dengan NIM yang sama pada satu acara.
  - **Pencegahan Over-Quota**: Menolak pendaftaran jika kuota peserta sudah penuh.
  - **Pencegahan Kadaluarsa**: Menolak pendaftaran jika batas waktu pendaftaran (*deadline*) telah terlewati.
- **Status Pendaftaran Terpadu**: *Pending* (Menunggu Verifikasi), *Approved* (Disetujui), *Rejected* (Ditolak), dan *Cancelled* (Dibatalkan).

### 👥 D. Manajemen Peserta
- **Daftar Mahasiswa Terdaftar**: Menampilkan seluruh mahasiswa beserta program studi, kontak, tanggal registrasi, dan jumlah acara yang diikuti.
- **Profil & Riwayat Partisipasi**: Modal detail yang menampilkan biodata mahasiswa dan tabel riwayat acara yang pernah didaftarkan.
- **Edit & Hapus Mahasiswa**: Fitur pengubahan data kontak mahasiswa dan penghapusan data.
- **Pencarian Cepat**: Filter berdasarkan program studi dan pencarian kata kunci nama/NIM.

### ⚙️ E. Pengaturan & Sistem
- **Dukungan Tema Ganda**: Beralih mulus antara **Light Mode** dan **Dark Mode** dengan persistensi *LocalStorage*.
- **Informasi Environment Variables**: Menampilkan nama aplikasi dan versi sistem yang bersumber dari file `.env`.
- **Manajemen Database**: Tombol ekspor cadangan data dalam format JSON dan fitur reset data ke *dummy data* awal.
- **Sistem Notifikasi Toast**: Umpan balik visual interaktif untuk setiap aksi berhasil atau gagal tanpa mengganggu navigasi.

---

## 🛠️ 3. Teknologi yang Digunakan

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Language** | TypeScript (^7.0.0) | Bahasa pemrograman utama dengan *strict mode* |
| **Tooling & Bundler** | Vite (^8.0.0) | *Development server* dan *production builder* super cepat |
| **Markup & Styling** | HTML5 & Vanilla CSS3 | Desain responsif, CSS Variables, SaaS Dashboard styling |
| **Typography** | Inter Font (Google Fonts) | Tipografi modern yang bersih dan ergonomis |
| **Data Persistence** | Browser LocalStorage | Penyimpanan data persisten di sisi klien tanpa server database eksternal |
| **Charts** | Chart.js (^4.4.0) | Library visualisasi data statistik kegiatan |
| **Icons** | Lucide Icons / Clean SVG | Ikon vektor responsif dan konsisten |

---

## 📐 4. Penerapan Konsep TypeScript

Kode sumber mengimplementasikan konsep-konsep inti TypeScript secara nyata pada modul `src/types/index.ts` dan `src/services/storage.ts`:

1. **Primitive Types**:
   - `string`: Nama acara, deskripsi, lokasi, email, NIM, dll.
   - `number`: Kuota peserta, jumlah pendaftar (`registeredCount`), durasi toast.
   - `boolean`: Status ketersediaan kuota, hasil eksekusi generic storage (`success: boolean`).
2. **Array Types**:
   - `CampusEvent[]`: Koleksi daftar acara kampus.
   - `Participant[]`: Koleksi data mahasiswa peserta.
   - `Registration[]`: Koleksi data formulir pendaftaran.
3. **Interfaces**:
   - `CampusEvent`: Representasi objek acara kampus lengkap.
   - `Participant`: Representasi data identitas mahasiswa.
   - `Registration`: Relasi pendaftaran antara peserta dan acara.
   - `DashboardStats`: Struktur data ringkasan metrik dashboard.
   - `StorageResult<T>`: Kontainer hasil operasi generic.
4. **Type Alias & Union Types**:
   - `EventCategory`: `'Seminar' | 'Workshop' | 'Lomba' | 'Webinar' | 'Organisasi' | 'Sosial' | 'Olahraga' | 'Lainnya'`
   - `EventStatus`: `'Draft' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled'`
   - `RegistrationStatus`: `'Pending' | 'Approved' | 'Rejected' | 'Cancelled'`
   - `ThemeMode`: `'light' | 'dark'`
5. **Generic Functions**:
   - `genericSearch<T>(items: T[], searchTerm: string, searchFields: (keyof T)[]): T[]`
   - `genericSort<T>(items: T[], sortKey: keyof T, order: 'asc' | 'desc'): T[]`
   - `genericFindById<T extends { id: string }>(items: T[], id: string): T | undefined`
   - `genericUpdateItem<T extends { id: string }>(items: T[], id: string, updates: Partial<T>): T[]`
   - `genericRemoveItem<T extends { id: string }>(items: T[], id: string): T[]`
   - `loadFromStorage<T>(key: string, defaultValue: T): T`

---

## 📦 5. Dependencies, DevDependencies & Semantic Versioning

Konfigurasi dependensi pada `package.json`:

```json
{
  "dependencies": {
    "chart.js": "^4.5.1",
    "lucide": "^1.16.0"
  },
  "devDependencies": {
    "@types/node": "^26.6.6",
    "typescript": "^7.0.2",
    "vite": "^8.3.8"
  }
}
```

### Penjelasan:
- **`dependencies`**: Pustaka yang diperlukan pada saat aplikasi berjalan di peramban, seperti `chart.js` untuk grafik statistik dan pustaka ikon.
- **`devDependencies`**: Alat bantu pengembangan saat proses *coding*, *type-checking* (`typescript`), dan pengemasan berkas aset web (`vite`).
- **Semantic Versioning (SemVer: `MAJOR.MINOR.PATCH`)**:
  - Tanda sisipan (`^`) mengizinkan pembaruan versi *minor* dan *patch* yang kompatibel tanpa merusak kode (*backward compatible*).
  - Contoh: `^1.0.0` mengizinkan update ke `1.1.0` tetapi mengunci dari perubahan besar `2.0.0`.

---

## 📂 6. Struktur Direktori Proyek

```
campus-connect/
├── public/
│   ├── assets/
│   └── favicon.svg           # Ikon favicon aplikasi
├── src/
│   ├── pages/
│   │   ├── dashboard.ts      # Logika metrik & visualisasi Chart.js
│   │   ├── events.ts         # CRUD acara, filter, search, & modal
│   │   ├── participants.ts   # Pengelolaan data & profil mahasiswa
│   │   ├── registrations.ts  # Formulir registrasi & validasi kuota
│   │   └── settings.ts       # Konfigurasi env, tema, & reset DB
│   ├── services/
│   │   └── storage.ts        # Service persistensi LocalStorage & Dummy Data
│   ├── types/
│   │   └── index.ts          # Definisi interface, union types, & generics
│   ├── utils/
│   │   └── helpers.ts        # Toast notifications, modal, & form formatters
│   ├── styles/
│   │   └── style.css         # SaaS dashboard CSS, Light/Dark mode
│   ├── config.ts             # Metadata rilis aplikasi
│   ├── vite-env.d.ts         # Deklarasi tipe Environment Variables Vite
│   └── main.ts               # Router SPA & inisialisasi aplikasi
├── .env                      # Konfigurasi environment lokal (diabaikan git)
├── .env.example              # Template konfigurasi environment
├── .gitignore                # Berkas pengecualian Git
├── index.html                # Kerangka utama HTML5
├── package.json              # Manajemen paket & skrip npm
├── tsconfig.json             # Konfigurasi compiler TypeScript
├── vite.config.ts            # Konfigurasi build Vite & base path
└── README.md                 # Dokumentasi teknis proyek
```

---

## ⚙️ 7. Environment Variables

Aplikasi memanfaatkan environment variables berbasis Vite untuk mendefinisikan identitas dan versi aplikasi:

### Berkas `.env.example`:
```env
VITE_APP_NAME=CampusConnect
VITE_APP_VERSION=1.0.0
```

### Keamanan:
- Berkas `.env` telah didaftarkan pada `.gitignore` agar nilai konfigurasi lokal tidak terekspos ke repositori publik.
- Menggunakan prefix `VITE_` agar variabel dapat diakses secara aman oleh peramban melalui `import.meta.env`.

---

## 🚀 8. Panduan Menjalankan Aplikasi

### Prasyarat
- **Node.js**: Versi 18.0.0 atau yang lebih baru.
- **npm**: Versi 9.0.0 atau yang lebih baru.

### Langkah Instalasi & Menjalankan Mode Dev
1. **Salin atau Clone Repositori**:
   ```bash
   git clone <URL_REPOSITORI_ANDA>
   cd campus-connect
   ```

2. **Salin Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Pasang Dependensi**:
   ```bash
   npm install
   ```

4. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan terbuka secara otomatis pada URL lokal: `http://localhost:3000` (atau port yang dialokasikan Vite).

5. **Kompilasi & Build untuk Production**:
   ```bash
   npm run build
   ```
   Hasil build akan dibuat di dalam direktori `dist/` dengan kode teroptimasi dan bersih dari error TypeScript.

6. **Pratinjau Hasil Build**:
   ```bash
   npm run preview
   ```

---

## 🐙 9. Panduan Lengkap Git dan GitHub

Repositori ini telah disiapkan dan diuji menggunakan alur kerja Git profesional:

### Status Implementasi Git pada Repositori Ini:
- [x] Lebih dari 10 commit dengan pesan terstruktur (*Conventional Commits*).
- [x] Multi-branch (`main`, `feature/event-management`, `feature/release-config`).
- [x] Merge branch ke `main` secara bersih.
- [x] Pembuatan dan penyelesaian simulasi **Merge Conflict** nyata.
- [x] Berkas `.gitignore` aktif menyaring `node_modules/`, `dist/`, dan `.env`.

### Panduan Langkah demi Langkah untuk Mahasiswa:

#### 1. Menghubungkan ke Repositori GitHub Pribadi
```bash
# Tambahkan remote repository GitHub Anda
git remote add origin https://github.com/<username-anda>/campus-connect.git

# Ganti branch utama menjadi main
git branch -M main

# Unggah seluruh commit ke GitHub
git push -u origin main
```

#### 2. Membuat Fitur Baru di Branch Terpisah
```bash
# Buat branch baru untuk fitur
git checkout -b feature/nama-fitur

# Lakukan perubahan kode, lalu stage dan commit
git add .
git commit -m "feat: tambahkan fitur baru"

# Push branch fitur ke GitHub
git push origin feature/nama-fitur
```

#### 3. Membuat Pull Request (PR) di GitHub
1. Buka repositori Anda di situs **GitHub**.
2. Anda akan melihat notifikasi *“Compare & pull request”* untuk branch yang baru di-push.
3. Klik **Compare & pull request**.
4. Isi judul PR (contoh: `feat: integrasi modul analitik acara`) dan deskripsi perubahan yang dilakukan.
5. Klik **Create pull request**.
6. Setelah ditinjau, klik **Merge pull request** lalu **Confirm merge**.

#### 4. Menarik Perubahan Terbaru (Pull) ke Lokal
```bash
git checkout main
git pull origin main
```

#### 5. Cara Menyelesaikan Merge Conflict jika Terjadi
Jika dua orang atau dua branch mengedit baris kode yang sama:
```bash
git merge feature/cabang-lain
# Git akan menampilkan: CONFLICT (content): Merge conflict in ...
```
1. Buka berkas yang berkonflik di editor teks (kode diapit tanda `<<<<<<< HEAD`, `=======`, dan `>>>>>>>`).
2. Pilih kode yang benar atau gabungkan keduanya, lalu hapus tanda pemisah konflik.
3. Simpan berkas, lalu jalankan:
   ```bash
   git add <nama-berkas>
   git commit -m "fix(merge-conflict): selesaikan konflik penggabungan"
   ```

---

## 🌐 10. Panduan Deployment

### Opsi A: Deployment ke Vercel (Sangat Direkomendasikan)
1. Buat akun di [Vercel](https://vercel.com).
2. Hubungkan akun GitHub Anda.
3. Klik **Add New Project** > pilih repositori `campus-connect`.
4. Vercel akan secara otomatis mendeteksi konfigurasi Vite:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Pada bagian **Environment Variables**, tambahkan:
   - `VITE_APP_NAME` = `CampusConnect`
   - `VITE_APP_VERSION` = `1.0.0`
6. Klik **Deploy**. Website akan langsung online dengan domain HTTPS (contoh: `campus-connect-sample.vercel.app`).

### Opsi B: Deployment ke GitHub Pages
Konfigurasi `vite.config.ts` sudah disiapkan dengan `base: './'` sehingga mendukung *relative assets path* pada GitHub Pages:
1. Buka berkas `package.json` dan tambahkan script deploy:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
2. Pasang paket `gh-pages`:
   ```bash
   npm install -D gh-pages
   ```
3. Jalankan:
   ```bash
   npm run deploy
   ```
4. Buka menu **Settings** > **Pages** di repositori GitHub, pastikan *Source* diarahkan ke branch `gh-pages`.

---

## 📋 11. Standar Kualitas & Verifikasi

- ✅ **Fungsional 100%**: Seluruh tombol, modal, link navigasi, dan formulir berjalan secara interaktif.
- ✅ **Zero TypeScript Error**: Berhasil dikompilasi dengan konfigurasi TypeScript ketat (`strict: true`).
- ✅ **Clean Code**: Pemisahan logika terstruktur antara halaman (*pages*), servis penyimpanan (*services*), tipe data (*types*), utilitas (*utils*), dan gaya (*styles*).
- ✅ **Data Persisten**: Data tersimpan aman di *LocalStorage* dan tidak hilang saat halaman di-refresh.
- ✅ **Responsif**: Tampilan tetap rapi dan nyaman digunakan pada layar ponsel (360px) hingga monitor desktop (1920px).

---

*Dikembangkan dengan dedikasi untuk sistem kemahasiswaan modern yang andal, rapi, dan profesional.*
