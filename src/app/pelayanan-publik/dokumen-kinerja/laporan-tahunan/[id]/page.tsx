import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Laporan Tahunan - BMKG Jawa Timur",
};

export default function DetailLaporanTahunanPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/dokumen-kinerja/laporan-tahunan"
      categoryLabel="Laporan Tahunan"
      defaultFileType="pdf"
    />
  );
}
