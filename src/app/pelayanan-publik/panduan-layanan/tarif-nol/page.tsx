import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Tarif Nol Rupiah - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Informasi dan persyaratan layanan bertarif 0 (Nol) Rupiah BMKG",
};

export default function TarifNolPage() {
  return (
    <PelayananList
      category="tarif-nol"
      title="Tarif Nol Rupiah"
      subtitle="Kriteria, persyaratan, dan mekanisme permohonan layanan khusus yang dikenakan tarif Rp0,00."
      basePath="/pelayanan-publik/panduan-layanan/tarif-nol"
      fileType="image"
      icon="money_off"
    />
  );
}
