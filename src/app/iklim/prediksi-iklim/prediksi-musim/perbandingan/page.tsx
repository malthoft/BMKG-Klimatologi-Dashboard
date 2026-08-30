import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function PerbandinganMusimPage() {
  return (
    <>
    <Header activeRoute="/iklim" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_perbandingan_musim" 
        title="Prediksi Perbandingan Musim" 
        description="Perbandingan prediksi musim saat ini terhadap rata-rata klimatologisnya."
      />
    </main>
      <Footer />
    </>
  );
}
