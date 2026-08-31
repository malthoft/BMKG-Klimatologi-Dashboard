import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Standar Pelayanan - BMKG Jawa Timur",
};

export default function DetailStandarPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/informasi-layanan/standar"
      categoryLabel="Standar Pelayanan"
      defaultFileType="image"
    />
  );
}
