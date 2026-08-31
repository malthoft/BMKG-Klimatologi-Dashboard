import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Maklumat Pelayanan - BMKG Jawa Timur",
};

export default function DetailMaklumatPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/informasi-layanan/maklumat"
      categoryLabel="Maklumat Pelayanan"
      defaultFileType="image"
    />
  );
}
