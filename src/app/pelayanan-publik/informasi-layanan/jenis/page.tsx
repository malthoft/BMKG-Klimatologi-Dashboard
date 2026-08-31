import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Jenis Layanan - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Daftar jenis dan produk layanan informasi iklim, cuaca, dan data BMKG Jawa Timur",
};

export default function JenisLayananPage() {
  return (
    <PelayananList
      category="jenis"
      title="Jenis Layanan"
      subtitle="Informasi ragam produk dan jasa layanan meteorologi, klimatologi, dan geofisika yang dapat diakses masyarakat."
      basePath="/pelayanan-publik/informasi-layanan/jenis"
      fileType="image_text"
      icon="category"
    />
  );
}
