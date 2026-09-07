import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function PuncakMusimPage() {
  return (
    <>
    <Header activeRoute="/iklim/prediksi-iklim/prediksi-musim/puncak" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_puncak_musim" 
        title="Prediksi Puncak Musim" 
        description="Prakiraan waktu terjadinya puncak musim di berbagai zona."
      />
    </main>
      <Footer />
    </>
  );
}
