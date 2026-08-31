import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Rencana Kinerja Tahunan (RKT) - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Dokumen Rencana Kinerja Tahunan Stasiun Klimatologi Kelas I Jawa Timur",
};

export default function RktPage() {
  return (
    <PelayananList
      category="rkt"
      title="Rencana Kinerja Tahunan"
      subtitle="Dokumen perencanaan target dan program kinerja tahunan Stasiun Klimatologi Kelas I Jawa Timur."
      basePath="/pelayanan-publik/dokumen-kinerja/rkt"
      fileType="pdf"
      icon="event_note"
    />
  );
}
