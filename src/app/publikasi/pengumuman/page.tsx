import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch } from "@/lib/supabase";
import { Metadata } from "next";
import { PengumumanList } from "@/components/public/PengumumanList";

export const metadata: Metadata = {
  title: "Pengumuman - BMKG Klimatologi Jawa Timur",
  description: "Pengumuman resmi dan informasi penting dari Stasiun Klimatologi Jawa Timur.",
};

export const revalidate = 60; // SSR with Revalidation every 60s

export default async function PengumumanPage() {
  let data: any[] = [];
  try {
    const result = await supabaseFetch("pengumuman", "order=created_at.desc");
    if (result && result.length > 0) {
      data = result;
    }
  } catch (e) {
    console.error("Error fetching pengumuman:", e);
  }

  return (
    <>
      <Header activeRoute="/publikasi/pengumuman" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Pengumuman</h1>
            <p className="text-slate-500 text-sm md:text-base">Pengumuman resmi, surat edaran, dan informasi operasional BMKG Klimatologi Jawa Timur.</p>
            <div className="h-1.5 w-24 bg-blue-600 rounded-full mt-4"></div>
          </div>

          <PengumumanList initialData={data} />
        </div>
      </main>
      <Footer />
    </>
  );
}
