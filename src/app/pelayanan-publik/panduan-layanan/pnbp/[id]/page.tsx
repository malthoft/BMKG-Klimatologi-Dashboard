import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Jenis & Tarif PNBP - BMKG Jawa Timur",
};

export default function DetailPnbpPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/panduan-layanan/pnbp"
      categoryLabel="Jenis & Tarif Layanan PNBP"
      defaultFileType="image_text"
    />
  );
}
