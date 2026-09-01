import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Maklumat Pelayanan - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Maklumat Pelayanan Publik Stasiun Klimatologi Kelas I Jawa Timur",
};

export default function MaklumatPelayananPage() {
  return (
    <PelayananList
      category="maklumat"
      title="Maklumat Pelayanan"
      subtitle="Komitmen kesanggupan seluruh jajaran dalam menyelenggarakan pelayanan prima sesuai standar yang ditetapkan."
      basePath="/pelayanan-publik/informasi-layanan/maklumat"
      fileType="image"
      icon="badge"
    />
  );
}
