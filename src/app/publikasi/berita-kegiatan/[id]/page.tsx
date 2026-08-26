"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch, supabaseGetPublicUrl } from "@/lib/supabase";

export default function BeritaKegiatanDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const result = await supabaseFetch("berita_kegiatan", `id=eq.${id}`);
        if (result && result.length > 0) {
          setData(result[0]);
        }
      } catch (e) {
        console.error("Error fetching berita_kegiatan detail:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options) + " WIB";
  };

  const fileUrl = data?.file_url ? supabaseGetPublicUrl("berita-kegiatan-files", data.file_url) : null;

  return (
    <>
      <Header activeRoute="/publikasi/berita-kegiatan" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/publikasi/berita-kegiatan" className="inline-flex items-center gap-1 text-primary hover:text-secondary font-medium mb-6 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Berita & Kegiatan
          </Link>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : data ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {fileUrl && (
                <div className="w-full relative">
                  <img src={fileUrl} alt={data.judul} className="w-full h-auto max-h-[60vh] object-contain bg-slate-100" />
                </div>
              )}
              
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {data.kategori || "Berita"}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                  {data.judul}
                </h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-8 pb-8 border-b border-slate-100 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    <span>Ditulis oleh: <strong className="text-slate-700">{data.penulis || "Admin"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span>Dipublikasikan: <strong className="text-slate-700">{formatDate(data.published_at || data.created_at)}</strong></span>
                  </div>
                </div>
                
                <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-primary hover:prose-a:text-secondary">
                  {data.deskripsi?.split('\n').map((paragraph: string, i: number) => (
                    <p key={i} className="mb-4 text-slate-700">{paragraph}</p>
                  ))}
                </div>
                
                <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 font-medium">
                  <p>Dibuat: {formatDate(data.created_at)}</p>
                  {data.updated_at && <p className="mt-1">Terakhir diperbarui: {formatDate(data.updated_at)}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">
              Data tidak ditemukan.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
