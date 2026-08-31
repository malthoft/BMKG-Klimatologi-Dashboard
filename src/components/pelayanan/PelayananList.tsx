"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch, supabaseGetPublicUrl } from "@/lib/supabase";
import { PelayananPublik } from "@/types/admin";
import { Pagination } from "@/components/ui/pagination";

interface PelayananListProps {
  category: "pk" | "lakip" | "rkt" | "maklumat" | "standar" | "jenis" | "pnbp" | "tarif-nol" | string;
  title: string;
  subtitle?: string;
  basePath: string;
  fileType: "pdf" | "image" | "image_text";
  icon?: string;
}

export function PelayananList({
  category,
  title,
  subtitle,
  basePath,
  fileType,
  icon = "description",
}: PelayananListProps) {
  const [items, setItems] = useState<PelayananPublik[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await supabaseFetch("pelayanan_publik", `kategori=eq.${category}&order=created_at.desc`);
        if (data && Array.isArray(data)) {
          setItems(data);
        }
      } catch (err) {
        console.error("Error loading pelayanan publik:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [category]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.judul.toLowerCase().includes(q) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <>
      <Header activeRoute={basePath} />
      <main className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-200 mb-4 border border-white/10">
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                <span>Pelayanan Publik</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                {title}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
                {subtitle || `Daftar arsip dan dokumen ${title.toLowerCase()} Stasiun Klimatologi Jawa Timur.`}
              </p>
            </div>

            {/* Search Bar inside Header */}
            <div className="mt-6 sm:mt-8 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari arsip atau dokumen..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:bg-white/15 transition-all"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">
                  search
                </span>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium animate-pulse">Memuat daftar dokumen...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">folder_off</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Dokumen</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchQuery ? "Tidak ditemukan dokumen yang cocok dengan kata kunci pencarian." : "Dokumen pada halaman ini sedang dipersiapkan oleh admin."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map((item) => {
                const isPdf = item.file_url?.toLowerCase().endsWith(".pdf") || fileType === "pdf";
                const fileUrl = item.file_url ? supabaseGetPublicUrl("pelayanan-publik-files", item.file_url) : "";

                return (
                  <Link
                    key={item.id}
                    href={`${basePath}/${item.id}`}
                    className="group bg-white rounded-3xl border border-slate-200/80 hover:border-primary/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {/* Thumbnail Preview Area */}
                    <div className="w-full h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-[32px]">picture_as_pdf</span>
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-red-600 bg-red-100/60 px-2.5 py-0.5 rounded-full">
                            Dokumen PDF
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full relative overflow-hidden bg-slate-50 flex items-center justify-center">
                          {fileUrl ? (
                            <img
                              src={fileUrl}
                              alt={item.judul}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                              <span className="material-symbols-outlined text-[36px]">image</span>
                              <span className="text-xs">Gambar Layanan</span>
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="material-symbols-outlined text-[13px]">image</span>
                            <span>Infografis</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
                          <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {item.judul}
                        </h3>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                        <span>{isPdf ? "Baca Dokumen PDF" : "Lihat Rincian Layanan"}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
