import { PelayananList } from "@/components/pelayanan/PelayananList";

export const metadata = {
  title: "Jenis & Tarif Layanan PNBP - BMKG Stasiun Klimatologi Jawa Timur",
  description: "Informasi jenis dan struktur tarif Penerimaan Negara Bukan Pajak (PNBP) BMKG",
};

export default function PnbpPage() {
  return (
    <PelayananList
      category="pnbp"
      title="Jenis dan Tarif Layanan PNBP"
      subtitle="Struktur tarif resmi Penerimaan Negara Bukan Pajak (PNBP) atas jenis pelayanan informasi BMKG."
      basePath="/pelayanan-publik/panduan-layanan/pnbp"
      fileType="image_text"
      icon="payments"
    />
  );
}
