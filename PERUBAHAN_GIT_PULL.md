# Laporan Detail Perubahan Git Pull (Commit 26e789f .. be28add)

Dokumen ini mencatat seluruh perubahan, fitur baru, dan detail-detail kecil yang terjadi di dalam codebase **Dashboard BMKG Malang** setelah eksekusi `git pull origin main`.

---

## 📊 1. Ringkasan Eksekutif Perubahan

- **Jumlah Commit Ditarik**: 4 Commit (`e80a174`, `51339f7`, `668264f`, `be28add`)
- **Total File Berubah**: 17 File (6.136 baris ditambah, 451 baris dihapus/diubah)
- **Status Kompilasi**: 
  - `npx tsc --noEmit` ➔ **PASSED (0 Error)**
  - `npm run build` ➔ **SUCCESSFUL (12/12 Static Pages Output)**

---

## 🚀 2. Penambahan Fitur Utama & Modul Baru

### A. Fitur Hari Tanpa Hujan (HTH) Monitoring
- **Route Baru**: `/hari-tanpa-hujan` ([src/app/hari-tanpa-hujan/page.tsx](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/app/hari-tanpa-hujan/page.tsx))
- **Komponen Peta**: [src/components/climate/hth-map.tsx](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/components/climate/hth-map.tsx)
- **Deskripsi**: Peta interaktif Leaflet untuk memonitoring kriteria Hari Tanpa Hujan (HTH) di wilayah Jawa Timur (Sangat Pendek 1-5 hari, Pendek 6-10 hari, Sedang 11-20 hari, Panjang 21-30 hari, Sangat Panjang 31-60 hari, Kekeringan Ekstrem >60 hari).
- **Parser Excel HTH**: [src/lib/hth-parser.ts](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/lib/hth-parser.ts) membaca file data HTH secara presisi dari format Excel.

### B. Fitur GIS Prakiraan Curah Hujan
- **Route Baru**: `/prakiraan-curah-hujan` ([src/app/prakiraan-curah-hujan/page.tsx](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/app/prakiraan-curah-hujan/page.tsx))
- **Komponen Peta GIS**: [src/components/climate/rainfall-map.tsx](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/components/climate/rainfall-map.tsx)
- **Deskripsi**: Visualisasi peta tematik GIS curah hujan berbasis kontur polygon spasial di Jawa Timur. Mendukung klasifikasi warna rentang curah hujan dasarian (mm/dasarian) dan bulanan (mm/bulan) dengan analisis `@turf/turf`.

### C. File Data Spasial GeoJSON Jawa Timur
- [public/batas_kabupaten.json](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/public/batas_kabupaten.json): Polygon spasial 38 Kabupaten/Kota Jawa Timur.
- [public/batas_kecamatan.json](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/public/batas_kecamatan.json): Polygon spasial rincian Kecamatan se-Jawa Timur.

### D. Perluasan Admin Dashboard Management
- [src/app/admin/page.tsx](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/app/admin/page.tsx):
  - Penambahan Tab Pengelolaan **Data Hari Tanpa Hujan (HTH)** dan **Prakiraan Curah Hujan**.
  - Fitur upload file Shapefile (`.zip`) dan Excel data curah hujan.
  - Pengaturan visibilitas stasiun cuaca & nama kustom `display_name` per stasiun.

### E. Script Pembersih Retained Messages Broker MQTT
- [clear_mqtt_retained.js](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/clear_mqtt_retained.js): Script Node.js untuk menghapus payload pesan lama yang tertahan (*retained*) di broker MQTT.

---

## 🔎 3. Detail-Detail Kecil & Fine-Tuning UI/UX

### 🔹 1. Navigasi Header Dropdown ([src/components/layout/header.tsx](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/components/layout/header.tsx))
- Menu **Perubahan Iklim** kini menjadi Induk Dropdown (Desktop & Mobile):
  - **Sub-Menu**:
    1. *Visualisasi Iklim* (`/perubahan-iklim`)
    2. *Prakiraan Curah Hujan* (`/prakiraan-curah-hujan`)
    3. *Hari Tanpa Hujan* (`/hari-tanpa-hujan`)
- **Detail UI Desktop**:
  - Penambahan ikon panah `expand_more`.
  - Animasi kemunculan menu dropdown memakai Framer Motion `y: 10 ➔ y: 0` dengan `duration: 0.2`.
- **Detail UI Mobile**:
  - Tampilan Accordion yang bisa di-expand/collapse dengan animasi rotasi panah 180 derajat (`rotate-180`).

### 🔹 2. Struktur Organisasi Stasiun ([src/components/profile/org-chart-viewer.tsx](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/components/profile/org-chart-viewer.tsx))
- Pembaharuan data Bagan Struktur Organisasi Stasiun Klimatologi Jawa Timur (penyesuaian nama Kepala Stasiun, Ketua Tim, & Staf Operasional).
- Penyesuaian garis penghubung hirarki dan tata letak responsif pada tampilan perangkat seluler.

### 🔹 3. Kustomisasi Nama & Visibilitas Stasiun AWS ([src/components/ui/station-slider.tsx](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/components/ui/station-slider.tsx))
- Penambahan properti `display_name` (opsional `string | null`) di mana stasiun dapat memiliki nama alias/tampilan publik tanpa mengubah nama identitas tabel database (`station_name`).
- Slider hanya menampilkan stasiun yang ditandai dengan flag `show_on_home: true` dan `show_on_realtime: true`.

### 🔹 4. Struktur Database & Konstanta ([src/lib/constants.ts](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/lib/constants.ts) & [src/lib/supabase.ts](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/src/lib/supabase.ts))
- Pengkinian array `DEFAULT_STATIONS` (23 stasiun AWS) dengan skema atribut baru `display_name: null`.
- Tambahan helper function query Supabase untuk fetching layer spasial HTH & Prakiraan Curah Hujan.

### 🔹 5. Pustaka Dependencies Baru ([package.json](file:///Users/macbookpro/Documents/Dashboard_BMKG_Malang/package.json))
- `leaflet`: `^1.9.4` & `react-leaflet`: `^5.0.0` (Engine pemetaan spasial HTH & Curah Hujan).
- `shpjs`: `^6.2.0` & `shapefile`: `^0.6.6` & `adm-zip`: `^0.6.0` (Parser file Shapefile GIS `.zip`).
- `@turf/turf`: `^7.4.0` (Analisis spasial GIS di browser).
- `sonner`: `^2.0.8` (Sistem Toast notification baru di Admin Dashboard).
- `mqtt`: `^5.15.2` (Koneksi realtime broker IoT).
- `@types/leaflet`, `@types/leaflet.heat`, `@types/geojson`, `@types/shpjs` (Type definitions TypeScript).

---

## 🛠️ 4. Status Integrasi & Verifikasi Codebase

1. **Pengecekan Tipe TypeScript (`npx tsc --noEmit`)**: ✅ Clean / No errors.
2. **Next.js Production Build (`npm run build`)**: ✅ Compiled 12 static & dynamic routes.
3. **Dev Server (`npm run dev`)**: ✅ Berjalan lancar di background.
