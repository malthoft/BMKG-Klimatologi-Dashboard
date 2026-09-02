import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Laporan Tahunan - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Dokumen Laporan Tahunan Stasiun Klimatologi Kelas I Jawa Timur",
};

export default function LaporanTahunanPage() {
  return (
    <PelayananList
      category="laporan-tahunan"
      title="Laporan Tahunan"
      subtitle="Dokumen Laporan Tahunan Stasiun Klimatologi Kelas I Jawa Timur."
      basePath="/pelayanan-publik/dokumen-kinerja/laporan-tahunan"
      fileType="pdf"
      icon="book"
    />
  );
}
