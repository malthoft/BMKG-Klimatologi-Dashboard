import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Laporan Kinerja (LAKIP) - BMKG Jawa Timur",
};

export default function DetailLakipPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/dokumen-kinerja/lakip"
      categoryLabel="Laporan Kinerja (LAKIP)"
      defaultFileType="pdf"
    />
  );
}
