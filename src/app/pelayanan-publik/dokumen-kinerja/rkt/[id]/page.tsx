import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Rencana Kinerja Tahunan - BMKG Jawa Timur",
};

export default function DetailRktPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/dokumen-kinerja/rkt"
      categoryLabel="Rencana Kinerja Tahunan"
      defaultFileType="pdf"
    />
  );
}
