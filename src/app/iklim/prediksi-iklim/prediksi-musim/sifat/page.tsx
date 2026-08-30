import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function SifatMusimPage() {
  return (
    <>
    <Header activeRoute="/iklim" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_sifat_musim" 
        title="Prediksi Sifat Musim" 
        description="Prakiraan sifat musim yang akan terjadi, apakah normal, atas normal, atau bawah normal."
      />
    </main>
      <Footer />
    </>
  );
}
