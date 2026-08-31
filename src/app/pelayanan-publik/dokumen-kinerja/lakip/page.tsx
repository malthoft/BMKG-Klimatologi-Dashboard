import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Laporan Kinerja (LAKIP) - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Laporan Akuntabilitas Kinerja Instansi Pemerintah Stasiun Klimatologi Kelas I Jawa Timur",
};

export default function LaporanKinerjaPage() {
  return (
    <PelayananList
      category="lakip"
      title="Laporan Kinerja (LAKIP)"
      subtitle="Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Stasiun Klimatologi Kelas I Jawa Timur."
      basePath="/pelayanan-publik/dokumen-kinerja/lakip"
      fileType="pdf"
      icon="analytics"
    />
  );
}
