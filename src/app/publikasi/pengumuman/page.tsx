"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch } from "@/lib/supabase";

export default function PengumumanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await supabaseFetch("pengumuman", "order=published_at.desc");
        if (result && result.length > 0) {
          setData(result);
        }
      } catch (e) {
        console.error("Error fetching pengumuman:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options) + " WIB";
  };

  return (
    <>
      <Header activeRoute="/publikasi/pengumuman" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 w-full">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-8 border-b-2 border-primary pb-4 inline-block">Pengumuman</h1>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : data.length > 0 ? (
            <div className="flex flex-col gap-6">
              {data.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-bold text-slate-800 leading-tight">
                    {item.judul}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      {formatDate(item.published_at || item.created_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      {item.penulis || "Admin"}
                    </span>
                  </div>
                  <Link href={`/publikasi/pengumuman/${item.id}`} className="text-primary font-bold hover:text-secondary flex items-center gap-1 text-sm mt-2 transition-colors">
                    Baca Selengkapnya
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Belum ada pengumuman.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
