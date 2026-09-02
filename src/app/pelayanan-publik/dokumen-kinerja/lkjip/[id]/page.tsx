import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail LKJIP - BMKG Jawa Timur",
};

export default function DetailLkjipPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/dokumen-kinerja/lkjip"
      categoryLabel="LKJIP"
      defaultFileType="pdf"
    />
  );
}
