import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function DurasiMusimPage() {
  return (
    <>
    <Header activeRoute="/iklim/prediksi-iklim/prediksi-musim/durasi" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_durasi_musim" 
        title="Prediksi Durasi Musim" 
        description="Prakiraan lamanya durasi musim yang akan berlangsung."
      />
    </main>
      <Footer />
    </>
  );
}
