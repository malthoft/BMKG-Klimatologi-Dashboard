import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "LKJIP - BMKG Stasiun Klimatologi Jawa Timur",
  description: "LKJIP Stasiun Klimatologi Jawa Timur.",
};

export default function LkjipPage() {
  return (
    <PelayananList 
      category="lkjip"
      title="LKJIP"
      subtitle="Dokumen LKJIP Stasiun Klimatologi Kelas I Jawa Timur."
      basePath="/pelayanan-publik/dokumen-kinerja/lkjip"
      fileType="pdf"
      icon="analytics"
    />
  );
}
