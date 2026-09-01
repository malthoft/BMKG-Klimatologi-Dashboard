import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Perjanjian Kinerja - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Dokumen Perjanjian Kinerja Stasiun Klimatologi Kelas I Jawa Timur",
};

export default function PerjanjianKinerjaPage() {
  return (
    <PelayananList
      category="pk"
      title="Perjanjian Kinerja"
      subtitle="Dokumen resmi komitmen dan perjanjian kinerja Stasiun Klimatologi Kelas I Jawa Timur."
      basePath="/pelayanan-publik/dokumen-kinerja/pk"
      fileType="pdf"
      icon="description"
    />
  );
}
