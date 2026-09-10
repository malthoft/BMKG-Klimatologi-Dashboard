# 📘 Panduan Lengkap Instalasi, Konfigurasi, dan Deployment
## Website Dashboard Stasiun Klimatologi Kelas I Jawa Timur

Panduan ini disusun secara komprehensif untuk memandu pihak pengembang, staf BMKG, atau tim penguji dalam menjalankan proyek ini mulai dari tahap kloning repositori di komputer lokal, penyusunan database Supabase, konfigurasi otomatisasi n8n di SumoPod, penggunaan Custom API, hingga deployment ke cloud platform Vercel.

---

## 📑 Daftar Isi
1. [Prasyarat Sistem (Prerequisites)](#1-prasyarat-sistem-prerequisites)
2. [Kloning Repositori & Menjalankan Proyek Lokal](#2-kloning-repositori--menjalankan-proyek-lokal)
3. [Setup Database Supabase dari Awal (Turnkey Setup)](#3-setup-database-supabase-dari-awal-turnkey-setup)
4. [Setup SumoPod & Otomatisasi n8n](#4-setup-sumopod--otomatisasi-n8n)
5. [Integrasi Custom API (`althof.site/api.php`)](#5-integrasi-custom-api-althofsiteapiphp)
6. [Konfigurasi Environment Variables (`.env.local`)](#6-konfigurasi-environment-variables-envlocal)
7. [Panduan Deployment ke Vercel](#7-panduan-deployment-ke-vercel)
8. [Panduan Prompting di Antigravity IDE](#8-panduan-prompting-di-antigravity-ide)

---

## 1. Prasyarat Sistem (Prerequisites)

Sebelum memulai, pastikan perangkat Anda telah terpasang perangkat lunak berikut:
- **Node.js**: Versi `20.x` atau lebih baru (Disarankan versi LTS, misal Node `v20.x` atau `v22.x`). Unduh di [nodejs.org](https://nodejs.org/).
- **Git**: Versi terbaru untuk kloning repositori. Unduh di [git-scm.com](https://git-scm.com/).
- **Web Browser Modern**: Google Chrome, Mozilla Firefox, atau Microsoft Edge.
- **Akun Layanan Cloud** (Gratis):
  - Akun [GitHub](https://github.com/)
  - Akun [Supabase](https://supabase.com/)
  - Akun [SumoPod](https://sumopod.com/) (untuk hosting n8n)
  - Akun [Vercel](https://vercel.com/) (untuk hosting frontend & serverless API)

---

## 2. Kloning Repositori & Menjalankan Proyek Lokal

### Langkah 1: Kloning Repositori dari GitHub
Buka Terminal (Linux/macOS) atau PowerShell / Command Prompt (Windows), lalu arahkan ke direktori kerja Anda (misalnya `c:\xampp\htdocs\`):

> [!TIP]
> **Nama Folder Tujuan Bersifat Bebas:**
> Anda **tidak wajib** menggunakan nama folder `BMKG-Klimatologi-Dashboard`. Anda dapat menentukan sendiri nama folder lokal tujuan di akhir perintah `git clone` sesuai preferensi Anda (misalnya: `staklim-jatim`, `klimatologi-jatim`, atau `dashboard-klimatologi-jatim`).

```bash
# Format perintah: git clone <URL_REPO> [nama-folder-bebas]
git clone https://github.com/malthoft/BMKG-Klimatologi-Dashboard.git bmkg-web
```
*(Jika Anda tidak menuliskan nama folder di ujung perintah, Git secara otomatis akan membuat folder bernama `BMKG-Klimatologi-Dashboard`).*

### Langkah 2: Masuk ke Folder Proyek
Masuk ke dalam folder yang baru saja dibuat:
```bash
# Ganti dengan nama folder yang Anda tentukan sebelumnya:
cd bmkg-web
```

### Langkah 3: Install Seluruh Dependensi
Jalankan perintah berikut untuk mengunduh dan memasang semua pustaka yang tercantum di `package.json`:
```bash
npm install
```

### Langkah 4: Menjalankan Server Development Lokal
```bash
npm run dev
```
Setelah proses kompilasi selesai, buka browser Anda dan akses:
👉 **`http://localhost:3000`**

---

### Langkah 5: Membuat Repositori GitHub Baru Milik Teknisi & Push Proyek

Setelah mengunduh kode, teknisi atau staf BMKG disarankan memiliki repositori GitHub mandiri di akun pribadi atau organisasi instansi BMKG agar seluruh riwayat perubahan tersimpan dengan aman:

1. **Buat Repository Baru di GitHub**:
   - Buka dan login ke [github.com](https://github.com) dengan akun Anda/BMKG.
   - Di pojok kanan atas, klik tombol **+** lalu pilih **New repository**.
   - Masukkan **Repository name** (contoh: `bmkg-klimatologi-dashboard` atau nama lain yang bebas).
   - Pilih visibilitas: **Private** (disarankan untuk instansi) atau **Public**.
   - ⚠️ **Penting:** Biarkan opsi *"Add a README file"*, *".gitignore"*, dan *"license"* **TIDAK DICENTANG** (karena kita sudah memiliki kode lokal lengkap).
   - Klik tombol hijau **Create repository**.

2. **Alihkan Remote Git Lokal ke Repositori Baru Anda**:
   Kembali ke terminal di dalam folder proyek lokal Anda, lalu jalankan perintah berikut:
   ```bash
   # 1. Cek remote lama yang masih mengarah ke repo pengembang
   git remote -v

   # 2. Ubah URL remote origin ke repositori baru milik Anda:
   git remote set-url origin https://github.com/<USERNAME-GITHUB-ANDA>/<NAMA-REPO-BARU-ANDA>.git

   # 3. Pastikan branch utama aktif bernama 'main'
   git branch -M main

   # 4. Push seluruh kode proyek ke repositori baru Anda:
   git push -u origin main
   ```
   *Sekarang repositori proyek telah resmi berpindah 100% ke akun GitHub Anda/BMKG!*

## 3. Setup Database Supabase dari Awal (Turnkey Setup)

Seluruh struktur database, 53 tabel, 8 storage bucket, triggers, stored functions, jadwal cron, dan data master telah dirangkum dalam file **`bmkg_database_complete.sql`**.

### Langkah 1: Membuat Proyek Baru di Supabase
1. Masuk ke [supabase.com](https://supabase.com) dan klik tombol **Sign In** atau **Start your project**.
2. Di halaman Dashboard utama, klik tombol **New project**.
3. Pilih **Organization** Anda.
4. Isi form pembuatan database:
   - **Name**: `BMKG-Klimatologi-Jatim` (atau nama lain yang diinginkan).
   - **Database Password**: Buat password yang kuat (contoh: `BmkgJatim2026!`), **CATAT password ini**.
   - **Region**: Pilih **Singapore (ap-southeast-1)** untuk performa latensi tercepat dari Indonesia.
   - **Pricing Plan**: Pilih **Free Plan**.
5. Klik **Create new project** dan tunggu 1–2 menit hingga database selesai disiapkan.

### Langkah 2: Menjalankan Script Database Lengkap
1. Pada menu sidebar kiri dashboard Supabase, klik ikon **SQL Editor** (ikon tanda `>_`).
2. Di pojok atas, klik **+ New query**.
3. Buka file **`bmkg_database_complete.sql`** yang ada di repositori lokal Anda, salin seluruh isinya (Ctrl+A, Ctrl+C), lalu tempelkan (Ctrl+V) ke SQL Editor Supabase.
   *(Atau klik tombol **Upload file** dan pilih file `bmkg_database_complete.sql`).*
4. Klik tombol **Run** (ikon segitiga hijau di pojok kanan bawah).
5. Tunggu ~5 detik hingga muncul pesan `Success. No rows returned`.
 
> [!NOTE]
> Setelah langkah ini selesai, seluruh 53 tabel, 8 storage bucket publik, triggers status AWS, fungsi pembersihan data, dan data master telah terpasang secara otomatis!

### Langkah 3: Mengambil Kredensial API Supabase
1. Di sidebar kiri, klik ikon **Project Settings** (ikon roda gigi di kiri bawah).
2. Pilih submenu **APIKeys**, lalu pindah ke tab Legacy anon, service_role API keys
3. Di panel **API keys**, catat informasi penting berikut:
   - **Project URL** (misal: `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`)
   - **anon / public key** (kunci panjang berformat JWT)
   - **service_role key** (kunci rahasia untuk administrasi dan upload aset)

### Langkah 4: (Opsional) Mengunggah Seluruh File Aset ke Storage Baru
Jika Anda ingin seluruh 110 file aset (PDF LAKIP, PDF E-Buletin, peta suhu 1991–2027, foto pegawai) terunggah ke Supabase baru:
1. Buka file `upload_storage_assets.mjs` di text editor.
2. Ganti nilai `TARGET_SUPABASE_URL` dan `TARGET_SERVICE_ROLE_KEY` dengan kredensial proyek baru Anda.
3. Jalankan perintah di terminal:
   ```bash
   node upload_storage_assets.mjs
   ```
4. Seluruh 110 file di folder `storage_assets/` akan otomatis ter-upload ke bucket masing-masing.

---

## 4. Setup SumoPod & Otomatisasi n8n

n8n digunakan sebagai *workflow engine* otomatis untuk mengambil data mentah cuaca/iklim dari FTP atau sumber eksternal, mengolahnya, dan meneruskannya ke dashboard. SumoPod digunakan sebagai penyedia *cloud container hosting* yang sangat ringan dan ekonomis untuk menjalankan n8n.

### Langkah 1: Registrasi Akun SumoPod
1. Buka situs [sumopod.com](https://sumopod.com).
2. Klik tombol **Sign Up** / **Daftar**.
3. Masukkan Email dan Password Anda, lalu lakukan verifikasi email.

### Langkah 2: Deploy Container n8n di SumoPod
1. Setelah login di dashboard SumoPod, klik **Apps (Services)** lalu klik **Add App**.
2. Pilih template aplikasi **n8n** (atau gunakan Docker image resmi: `docker.n8n.io/n8nio/n8n`).
3. Pilih lokasi/region server (disarankan **Jakarta > EU > Yang Murah**).
4. Klik **Deploy App/ Launch**.
5. Tunggu beberapa saat hingga pod berstatus **Running**.
6. Klik pada Pod Anda untuk melihat **Public URL** (contoh: `https://n8n-zitzfawfh3ilzce9.jkt6.sumopod.my.id`).

### Langkah 3: Setup Akun Owner n8n
1. Buka Public URL n8n Anda di browser.
2. Saat pertama kali dibuka, buat akun **Owner** n8n (masukkan nama, email, dan password admin).
3. Setelah masuk ke kanvas utama n8n, n8n siap digunakan!

### Langkah 4: Membuat API Key n8n
1. Di pojok kiri bawah dashboard n8n, klik **Settings** (ikon roda gigi).
2. Pilih menu **n8n API**.
3. Klik tombol **Create an API key**.
4. Beri label nama (misal: `BMKG Website Key`).
5. Salin API Key yang dihasilkan (contoh: `eyJhbGciOiJIUzI1Ni...`). **Simpan key ini dengan aman**.

### Langkah 5: Mengambil Workflow ID
1. Di sidebar n8n, klik **Workflows** -> klik **Add workflow** (atau import workflow BMKG).
2. Perhatikan URL pada browser Anda:
   `https://n8n-xxxx.sumopod.my.id/workflow/PV7ej8QYxSOJ02wk`
3. Karakter di ujung URL tersebut (`PV7ej8QYxSOJ02wk`) adalah **Workflow ID** Anda.
4. Jangan lupa aktifkan saklar **Active** (di kanan atas kanvas workflow) agar alur berjalan terjadwal.

---

## 5. Integrasi Custom API (`api.php`) & Migrasi ke Hosting Instansi BMKG

### Status Kepemilikan Domain Saat Ini
> [!IMPORTANT]
> Domain **`https://althof.site/api.php`** yang saat ini terpasang di kode adalah **domain hosting pribadi milik mahasiswa pengembang** yang digunakan selama proses riset, pengujian, dan pengembangan proyek PKN.
> 
> Agar sistem mandiri seutuhnya dan berkelanjutan (*sustainable*), file **`api.php`** ini **wajib diunggah ke server web / hosting domain resmi milik instansi Stasiun Klimatologi Jawa Timur** (misalnya `https://staklim-jatim.bmkg.go.id/api.php` atau subdomain resmi instansi).

---

### Mengapa Proyek Ini Menggunakan Custom API Proxy?
Stasiun cuaca otomatis (AWS) BMKG mengirimkan data pengamatan setiap beberapa menit dalam frekuensi tinggi. Jika website melakukan query ratusan ribu baris ke database Supabase secara terus-menerus:
1. Kuota bandwidth & batasan koneksi database cloud akan cepat terkuras.
2. Waktu render grafik di dashboard pengunjung dapat menjadi lambat.

Oleh karena itu, dibuatlah script perantara ringan (**PHP Proxy & Cache API**) yang bertugas mengambil data JSON dari database lalu menyajikannya secara cepat dan aman ke website frontend. File script ini telah tersedia di dalam repositori proyek pada direktori:
📁 **`public/api.php`**

---

### Tutorial Mengunggah `api.php` ke Hosting Instansi BMKG Jawa Timur

Ikuti langkah-langkah berikut untuk memindahkan API ke server resmi instansi:

#### Langkah 1: Sesuaikan Kredensial di File `public/api.php`
Buka file `public/api.php` dengan text editor. Pada baris 69–70, sesuaikan URL dan Anon Key database Supabase yang digunakan oleh instansi:
```php
// Ganti dengan URL dan Anon Key Supabase milik instansi BMKG:
$supabaseUrl = 'https://<PROJECT-ID-SUPABASE-BMKG>.supabase.co/rest/v1/';
$supabaseAnonKey = '<ANON-KEY-SUPABASE-BMKG>';
```
*Simpan perubahan file tersebut.*

#### Langkah 2: Upload File ke cPanel Hosting Instansi
1. Buka dan login ke panel hosting instansi (**cPanel** Stasiun Klimatologi Jawa Timur).
2. Masuk ke menu **File Manager**.
3. Buka folder root web publik (biasanya folder **`public_html/`** atau folder root subdomain yang ditunjuk).
4. Klik tombol **Upload** di bilah atas.
5. Pilih dan unggah file **`public/api.php`** dari komputer Anda.
6. Pastikan permission file diatur ke `0644` (standar file PHP).

#### Langkah 3: Uji Coba Custom API di Browser
Buka tab browser baru dan uji URL domain instansi Anda:
```text
https://<DOMAIN-HOSTING-INSTANSI-BMKG>/api.php?station=aws_malang&limit=5
```
- Jika browser menampilkan balasan data cuaca berformat JSON array (seperti `temp`, `rh`, `ws`, `timestamp`), maka API proxy telah **sukses 100% aktif di server resmi BMKG**!
- Jika diakses tanpa parameter (`https://<DOMAIN-HOSTING-INSTANSI-BMKG>/api.php`), halaman dokumentasi interaktif API terbuka akan otomatis ditampilkan.

#### Langkah 4: Hubungkan Domain Baru ke Dashboard Next.js
Buka file **`src/lib/supabase.ts`** di proyek dashboard Anda. Pada fungsi `supabaseFetch` (sekitar baris 17), ubah URL domain target:

```typescript
// Ganti dari domain lama:
// const apiUrl = `https://althof.site/api.php?station=${tableName}&limit=${limit}`;

// Menjadi domain hosting resmi instansi BMKG Jawa Timur:
const apiUrl = `https://<DOMAIN-HOSTING-INSTANSI-BMKG>/api.php?station=${tableName}&limit=${limit}`;
```

> [!NOTE]
> **Fitur Fallback Cerdas:**
> Di dalam file `src/lib/supabase.ts` sudah terdapat proteksi *try-catch fallback*. Jika sewaktu-waktu server hosting PHP mengalami gangguan (*down* atau *timeout*), dashboard secara otomatis akan mengalihkan query (*fallback*) langsung ke database Supabase tanpa membuat grafik atau tampilan web terhenti.

---

## 6. Konfigurasi Environment Variables (`.env.local`)

Buat file baru bernama **`.env.local`** di direktori utama proyek Anda (`c:\xampp\htdocs\[nama-folder-proyek-anda]\.env.local`). 

Isi file tersebut dengan format konfigurasi berikut:

```env
# ==============================================================================
# 1. KONFIGURASI DATABASE SUPABASE
# ==============================================================================
# URL API proyek Supabase Anda.
# Cara mendapatkan: Masuk ke Supabase Dashboard -> Project Settings -> APIKeys -> salin Project URL.
# Contoh format: https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT-ID-ANDA>.supabase.co

# Kunci publik (Anon Key) Supabase untuk autentikasi client.
# Cara mendapatkan: Masuk ke Supabase Dashboard -> Project Settings -> APIKeys -> tab Legacy anon, service_role API keys -> salin anon public key.
# Format: String JWT panjang yang berawalan eyJhbGciOi...
NEXT_PUBLIC_SUPABASE_ANON_KEY=<MASUKKAN_ANON_PUBLIC_KEY_SUPABASE_ANDA>

# ==============================================================================
# 2. KONFIGURASI OTOMATISASI N8N (SUMOPOD / HOSTING CONTAINER)
# ==============================================================================
# URL dasar endpoint REST API n8n Anda.
# Cara mendapatkan: Salin Public URL n8n dari dashboard SumoPod (Apps/Services) lalu tambahkan akhiran '/api/v1'.
# Contoh format: https://n8n-xxxxxx.jkt6.sumopod.my.id/api/v1
N8N_BASE_URL=https://<SUBDOMAIN-N8N-SUMOPOD-ANDA>/api/v1

# Identifier unik untuk workflow sinkronisasi data cuaca yang aktif di n8n.
# Cara mendapatkan: Buka kanvas workflow di n8n, salin kode unik di ujung URL browser (setelah /workflow/...).
# Contoh format: PV7ej8QYxSOJ02wk
N8N_WORKFLOW_ID=<MASUKKAN_WORKFLOW_ID_N8N_ANDA>

# Kunci API rahasia untuk mengizinkan website memicu eksekusi workflow n8n.
# Cara mendapatkan: Buka n8n -> Settings (roda gigi) -> n8n API -> Create an API key.
# Format: Token rahasia n8n berawalan eyJhbGciOi...
N8N_API_KEY=<MASUKKAN_N8N_API_KEY_ANDA>

# ==============================================================================
# 3. AUTENTIKASI & KEAMANAN SISTEM
# ==============================================================================
# Kunci rahasia untuk enkripsi token session login admin (JWT).
# Nilai: String acak yang kuat dan unik dengan panjang minimal 32 karakter.
# Anda dapat membuat teks acak bebas sendiri.
JWT_SECRET=<MASUKKAN_STRING_RAHASIA_BEBAS_MINIMAL_32_KARAKTER>
```

---

## 7. Panduan Deployment ke Vercel (Auto CI/CD & Production)

### ⚠️ Disclaimer Penggunaan Vercel & Alternatif Hosting Instansi
> [!IMPORTANT]
> **Tujuan Penggunaan Vercel:**
> Layanan cloud Vercel pada panduan ini digunakan sebagai solusi **Free Access / Free Tier Cloud Deployment** yang sangat cepat, handal, dan tanpa biaya server untuk tahap pengujian, evaluasi akademik, demonstrasi, maupun operasional awal.
> 
> **Penyesuaian untuk Server / Hosting Mandiri Milik BMKG:**
> Apabila di masa mendatang pihak instansi Stasiun Klimatologi Jawa Timur telah memiliki infrastruktur server atau hosting mandiri yang mendukung *tech stack* proyek ini (misalnya VPS Linux Ubuntu dengan runtime Node.js v20+, server berbasis Docker, cPanel Node.js Selector, atau Cloud On-Premise BMKG), sistem ini dapat dengan mudah disesuaikan dan di-deploy ke server lokal instansi menggunakan:
> - Production server bawaan Node.js: `npm run build` lalu `npm run start`
> - Process Manager seperti **PM2**: `pm2 start npm --name "bmkg-klimatologi" -- start`
> - Kontainerisasi **Docker** (menggunakan template `Dockerfile` standar Next.js)
> - Reverse proxy menggunakan web server Nginx atau Apache ke port aplikasi (misal port `3000`).

---

### Langkah-langkah Deployment ke Vercel:

#### Langkah 1: Pastikan Kode Sudah di-Push ke Repositori GitHub Baru
Sesuai dengan **Langkah 5 pada Bagian 2**, pastikan seluruh file proyek lokal Anda sudah ter-push ke repositori GitHub baru milik teknisi/instansi:
```bash
git add .
git commit -m "siap deploy ke vercel"
git push origin main
```

#### Langkah 2: Import Repositori di Vercel
1. Buka [vercel.com](https://vercel.com) dan klik **Sign Up** atau **Log In** dengan memilih opsi **Continue with GitHub**.
2. Di halaman Vercel Dashboard, klik tombol biru **Add New...** di pojok kanan atas -> pilih **Project**.
3. Di daftar repositori GitHub yang muncul, temukan repositori baru milik Anda/BMKG, lalu klik tombol **Import**.

#### Langkah 3: Konfigurasi Build & Environment Variables
1. Pada bagian **Framework Preset**, Vercel akan otomatis mendeteksi **Next.js**. Biarkan nilai default.
2. Pada bagian **Root Directory**, biarkan `./`.
3. Buka bagian **Environment Variables** (klik tanda panah untuk memperluas).
4. Tambahkan 6 variabel lingkungan berikut (sesuai yang ada di file `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL` : *(Isikan Project URL Supabase)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` : *(Isikan Anon Key Supabase)*
   - `N8N_BASE_URL` : *(Isikan URL API n8n SumoPod)*
   - `N8N_WORKFLOW_ID` : *(Isikan Workflow ID n8n)*
   - `N8N_API_KEY` : *(Isikan API Key n8n)*
   - `JWT_SECRET` : *(Isikan string rahasia enkripsi token admin)*
5. Klik tombol biru **Deploy** di bagian bawah.

#### Langkah 4: Selesai & Mendapatkan Domain Publik
Vercel akan menjalankan proses build otomatis selama ~1–2 menit. Setelah selesai, akan muncul animasi konfeti dan tautan domain publik aktif (contoh: `https://bmkg-klimatologi-dashboard.vercel.app`).

---

### 🔄 Otomatisasi CI/CD (Setiap Push ke GitHub Otomatis Deploy ke Vercel)
Keunggulan utama menghubungkan GitHub dengan Vercel adalah adanya fitur **Continuous Deployment (CI/CD) Otomatis**:
1. Setiap kali teknisi melakukan perbaikan bug, penambahan artikel, atau pembaruan fitur di laptop/komputer lokal, teknisi cukup menjalankan:
   ```bash
   git add .
   git commit -m "update konten atau perbaikan fitur"
   git push origin main
   ```
2. **Vercel akan secara otomatis mendeteksi perubahan pada branch `main` tersebut**, langsung melakukan proses build ulang di cloud secara instan, dan memperbarui website secara *live* dalam 1–2 menit.
3. Teknisi **tidak perlu lagi membuka dashboard Vercel atau mengunggah file manual**, semuanya berjalan otomatis secara berkelanjutan!

---

## 8. Panduan Prompting di Antigravity IDE

Bagian ini dibuat khusus untuk memandu pengembang yang menggunakan **Antigravity IDE** agar asisten AI dapat melakukan instalasi tech stack dan menghubungkan kredensial secara otomatis, tepat, dan tanpa terjadi *error*.

---

### 💬 Skenario 1: Prompting untuk Install Tech Stack & Library Lengkap

Salin dan kirimkan prompt berikut ke chat Antigravity IDE saat Anda baru saja membuat atau membuka proyek kosong:

```text
Halo Antigravity! Saya sedang mengembangkan proyek Website Stasiun Klimatologi BMKG Jawa Timur berbasis Next.js App Router, Tailwind CSS, dan TypeScript.

Tolong bantu saya menginstall seluruh tech stack dan dependensi yang diperlukan oleh proyek ini dengan menjalankan perintah npm install. Berikut adalah daftar library yang wajib terpasang:

1. Framework & Core:
   - next (versi terbaru / Next 16)
   - react dan react-dom (React 19)
   - typescript dan @types/node, @types/react, @types/react-dom

2. Styling & Desain UI:
   - tailwindcss dan @tailwindcss/postcss
   - lucide-react (ikon sistem)
   - framer-motion (animasi modern)
   - sonner (komponen toast notifikasi)

3. Visualisasi Data, Grafik, & Peta Geografis:
   - chart.js dan react-chartjs-2
   - recharts
   - leaflet dan react-leaflet beserta @types/leaflet
   - leaflet.heat dan @types/leaflet.heat (peta panas cuaca)
   - @turf/turf dan @types/geojson (analisis spasial GIS)
   - shapefile, shpjs, dan @types/shpjs (pembaca file peta BMKG)

4. Otomatisasi, Realtime, & Pengolahan Berkas:
   - mqtt (koneksi data sensor AWS realtime)
   - xlsx (impor ekspor laporan Excel)
   - adm-zip (ekstraksi file zip data iklim)
   - react-quill-new (editor teks CMS berita & pengumuman)

5. Keamanan & Database:
   - pg dan @types/pg (PostgreSQL client)
   - bcryptjs dan @types/bcryptjs (hashing password admin)
   - jose (manajemen JWT token autentikasi)

Mohon jalankan instalasi dependensi di atas secara otomatis di terminal dan pastikan tidak ada dependensi yang bentrok. Terima kasih!
```

---

### 💬 Skenario 2: Prompting untuk Menghubungkan Identitas Supabase, n8n, & Custom API

Gunakan format prompt berikut saat Anda ingin meminta Antigravity IDE menyambungkan seluruh backend dan kredensial layanan. Cukup isi bagian di dalam kurung siku `<...>` dengan nilai yang Anda miliki:

```text
Halo Antigravity! Tolong bantu saya mengonfigurasi integrasi backend untuk proyek Website BMKG ini. 

Berikut adalah kredensial dan konfigurasi layanan yang saya gunakan:

1. Layanan Supabase:
   - Project URL: <MASUKKAN_PROJECT_URL_DARI_SUPABASE_SETTINGS_APIKEYS>
   - Anon / Public Key: <MASUKKAN_ANON_PUBLIC_KEY_DARI_SUPABASE_LEGACY_TAB>
   - File Restore Database: bmkg_database_complete.sql

2. Layanan Otomatisasi n8n (SumoPod / Server Container):
   - Base URL: https://<SUBDOMAIN-POD-N8N-ANDA>/api/v1
   - Workflow ID: <MASUKKAN_WORKFLOW_ID_N8N_ANDA>
   - API Key: <MASUKKAN_API_KEY_DARI_N8N_SETTINGS>

3. Custom API Proxy untuk AWS Real-Time:
   - URL: https://<DOMAIN-HOSTING-INSTANSI-BMKG>/api.php?station={station}&limit={limit}
   - Mekanisme: Request data AWS real-time diarahkan ke endpoint custom API ini terlebih dahulu, dengan fallback otomatis ke database Supabase langsung jika custom API mengalami kendala jaringan.

4. Keamanan & JWT:
   - JWT Secret: <MASUKKAN_STRING_RAHASIA_MINIMAL_32_KARAKTER>

Tolong lakukan langkah-langkah berikut:
1. Buat atau perbarui file .env.local dengan konfigurasi di atas.
2. Pastikan file src/lib/supabase.ts menggunakan URL dan Key tersebut dengan benar dan mendukung mekanisme custom API caching serta fallback.
3. Pastikan API route sinkronisasi n8n (src/app/api/n8n/sync/route.ts) membaca kredensial n8n dari process.env.
4. Lakukan verifikasi apakah kode bebas dari type error dengan menjalankan validasi TypeScript (npx tsc --noEmit). Terima kasih!
```

---

*Dokumentasi ini dibuat untuk mempermudah alih kelola, pemeliharaan jangka panjang, dan deployment sistem Dashboard Klimatologi BMKG Jawa Timur.*
