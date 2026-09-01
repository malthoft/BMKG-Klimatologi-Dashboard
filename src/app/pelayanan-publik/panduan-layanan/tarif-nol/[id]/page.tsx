import { PelayananDetail } from "@/components/pelayanan/PelayananDetail";

export const metadata = {
  title: "Detail Tarif Nol Rupiah - BMKG Jawa Timur",
};

export default function DetailTarifNolPage() {
  return (
    <PelayananDetail
      basePath="/pelayanan-publik/panduan-layanan/tarif-nol"
      categoryLabel="Tarif Nol Rupiah"
      defaultFileType="image"
    />
  );
}
