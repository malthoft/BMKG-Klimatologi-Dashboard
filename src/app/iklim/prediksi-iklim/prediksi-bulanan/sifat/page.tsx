import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function SifatHujanPage() {
  return (
    <>
    <Header activeRoute="/iklim/prediksi-iklim/prediksi-bulanan/sifat" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_sifat_hujan" 
        title="Prediksi Sifat Hujan Bulanan" 
        description="Prakiraan sifat hujan secara bulanan untuk periode ke depan."
      />
    </main>
      <Footer />
    </>
  );
}
