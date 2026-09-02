const fs = require('fs');
const path = require('path');

const pages = [
  // Profil
  { route: '/profil/sejarah', title: 'Sejarah BMKG' },
  
  // Iklim -> Peringatan Dini
  { route: '/iklim/peringatan-dini', title: 'Peringatan Dini Cuaca dan Iklim' },
  
  // Iklim -> Prediksi Musim
  { route: '/iklim/prediksi-musim/awal', title: 'Prediksi Awal Musim' },
  { route: '/iklim/prediksi-musim/perbandingan', title: 'Prediksi Perbandingan Musim' },
  { route: '/iklim/prediksi-musim/sifat', title: 'Prediksi Sifat Musim' },
  { route: '/iklim/prediksi-musim/durasi', title: 'Prediksi Durasi Musim' },
  { route: '/iklim/prediksi-musim/puncak', title: 'Prediksi Puncak Musim' },
  { route: '/iklim/prediksi-musim/curah-hujan', title: 'Prediksi Curah Hujan Musim' },
  
  // Iklim -> Prediksi Bulanan
  { route: '/iklim/prediksi-bulanan/sifat', title: 'Prediksi Sifat Hujan' },
  { route: '/iklim/prediksi-bulanan/hujan-6-bulan', title: 'Prediksi Hujan 6 Bulan' },
  
  // Iklim -> Analisis Iklim
  { route: '/iklim/analisis-iklim/kondisi-atmosfer', title: 'Kondisi Atmosfer' },
  { route: '/iklim/analisis-iklim/hujan-bulanan', title: 'Analisis Hujan Bulanan' },
  
  // Pelayanan Publik -> Dokumen Kinerja
  { route: '/pelayanan-publik/dokumen-kinerja/pk', title: 'Perjanjian Kinerja (PK)' },
  { route: '/pelayanan-publik/dokumen-kinerja/lkjip', title: 'LKJIP' },
  { route: '/pelayanan-publik/dokumen-kinerja/rkt', title: 'RKT' },
  
  // Pelayanan Publik -> Informasi Layanan
  { route: '/pelayanan-publik/informasi-layanan/maklumat', title: 'Maklumat Pelayanan' },
  { route: '/pelayanan-publik/informasi-layanan/standar', title: 'Standar Pelayanan' },
  { route: '/pelayanan-publik/informasi-layanan/jenis', title: 'Jenis Layanan' },
  { route: '/pelayanan-publik/informasi-layanan/jam-operasional', title: 'Jam Operasional Pelayanan' },
  
  // Pelayanan Publik -> Panduan Layanan
  { route: '/pelayanan-publik/panduan-layanan/alur', title: 'Alur Pelayanan' },
  { route: '/pelayanan-publik/panduan-layanan/formulir', title: 'Formulir Permohonan Informasi' },
  { route: '/pelayanan-publik/panduan-layanan/lacak', title: 'Lacak Status Dokumen Anda' },
  { route: '/pelayanan-publik/panduan-layanan/pnbp', title: 'Jenis dan Tarif Layanan PNBP' },
  { route: '/pelayanan-publik/panduan-layanan/tarif-nol', title: 'Tarif Nol rupiah' },
  { route: '/pelayanan-publik/panduan-layanan/peta-pos', title: 'Peta Sebaran Pos Hujan' },
  { route: '/pelayanan-publik/panduan-layanan/faq', title: 'FAQ' },
  
  // Pelayanan Publik -> Pengaduan
  { route: '/pelayanan-publik/pengaduan/skm', title: 'Survei Kepuasan Masyarakat' },
];

for (const p of pages) {
  const dirPath = path.join(__dirname, 'src', 'app', ...p.route.split('/').filter(Boolean));
  fs.mkdirSync(dirPath, { recursive: true });
  
  const content = `import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function Page() {
  return <PlaceholderPage title="${p.title}" />;
}
`;
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), content);
  console.log('Created: ' + p.route);
}
