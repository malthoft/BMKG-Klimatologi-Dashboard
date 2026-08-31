import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Perjanjian Kinerja - BMKG Jawa Timur",
};

export default function DetailPkPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/dokumen-kinerja/pk"
      categoryLabel="Perjanjian Kinerja"
      defaultFileType="pdf"
    />
  );
}
