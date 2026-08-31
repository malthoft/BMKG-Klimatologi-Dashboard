import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Jenis Layanan - BMKG Jawa Timur",
};

export default function DetailJenisLayananPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/informasi-layanan/jenis"
      categoryLabel="Jenis Layanan"
      defaultFileType="image_text"
    />
  );
}
