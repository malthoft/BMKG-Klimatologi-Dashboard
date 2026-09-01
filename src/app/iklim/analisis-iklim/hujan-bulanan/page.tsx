import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function AnalisisHujanBulananPage() {
  return (
    <>
    <Header activeRoute="/iklim" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_analisis_hujan_bulanan" 
        title="Analisis Hujan Bulanan" 
        description="Analisis akumulasi dan evaluasi curah hujan yang terjadi pada bulan-bulan sebelumnya."
      />
    </main>
      <Footer />
    </>
  );
}
