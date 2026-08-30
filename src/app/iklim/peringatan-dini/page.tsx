import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ClimatePublicationViewer } from "@/components/climate/ClimatePublicationViewer";

export default function PeringatanDiniPage() {
  return (
    <>
    <Header activeRoute="/iklim" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
      <ClimatePublicationViewer 
        tableName="iklim_peringatan_dini" 
        title="Peringatan Dini Cuaca dan Iklim" 
        description="Informasi peringatan dini mengenai kondisi cuaca dan iklim ekstrem."
      />
    </main>
      <Footer />
    </>
  );
}
