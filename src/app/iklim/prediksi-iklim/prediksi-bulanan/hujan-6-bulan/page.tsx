import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function Hujan6BulanPage() {
  return (
    <>
    <Header activeRoute="/iklim" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_hujan_6_bulan" 
        title="Prediksi Hujan 6 Bulan" 
        description="Prakiraan curah hujan untuk rentang periode enam bulan berturut-turut."
      />
    </main>
      <Footer />
    </>
  );
}
