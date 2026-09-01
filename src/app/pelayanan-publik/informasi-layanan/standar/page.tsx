import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Standar Pelayanan - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Standar Pelayanan Publik Stasiun Klimatologi Kelas I Jawa Timur",
};

export default function StandarPelayananPage() {
  return (
    <PelayananList
      category="standar"
      title="Standar Pelayanan"
      subtitle="Pedoman dan tolok ukur acuan penilaian kualitas penyelenggaraan pelayanan publik di lingkungan BMKG Jawa Timur."
      basePath="/pelayanan-publik/informasi-layanan/standar"
      fileType="image"
      icon="verified"
    />
  );
}
