import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function AwalMusimPage() {
  return (
    <>
    <Header activeRoute="/iklim" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_awal_musim" 
        title="Prediksi Awal Musim" 
        description="Prakiraan waktu dimulainya musim pada suatu zona musim."
      />
    </main>
      <Footer />
    </>
  );
}
