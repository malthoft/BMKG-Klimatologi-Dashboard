import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch } from "@/lib/supabase";
import { Metadata } from "next";
import { BeritaKegiatanList } from "@/components/public/BeritaKegiatanList";

export const metadata: Metadata = {
  title: "Berita & Kegiatan - BMKG Klimatologi Jawa Timur",
  description: "Berita, kegiatan, dan informasi terkini dari Stasiun Klimatologi Jawa Timur.",
};

export const revalidate = 60; // SSR with Revalidation every 60s

export default async function BeritaKegiatanPage() {
  let data: any[] = [];
  try {
    const result = await supabaseFetch("berita_kegiatan", "order=published_at.desc");
    if (result && result.length > 0) {
      data = result;
    }
  } catch (e) {
    console.error("Error fetching berita_kegiatan:", e);
  }

  return (
    <>
      <Header activeRoute="/publikasi/berita-kegiatan" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Berita & Kegiatan</h1>
            <p className="text-slate-500 text-sm md:text-base">Informasi terbaru, artikel, dan dokumentasi kegiatan BMKG Klimatologi Jawa Timur.</p>
            <div className="h-1.5 w-24 bg-blue-600 rounded-full mt-4"></div>
          </div>

          <BeritaKegiatanList initialData={data} />
        </div>
      </main>
      <Footer />
    </>
  );
}
