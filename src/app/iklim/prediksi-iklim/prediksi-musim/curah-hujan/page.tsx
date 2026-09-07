import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function CurahHujanMusimPage() {
  return (
    <>
    <Header activeRoute="/iklim/prediksi-iklim/prediksi-musim/curah-hujan" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_curah_hujan_musim" 
        title="Prediksi Curah Hujan Musim" 
        description="Prakiraan akumulasi curah hujan selama satu musim."
      />
    </main>
      <Footer />
    </>
  );
}
