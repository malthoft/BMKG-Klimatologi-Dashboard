"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch, supabaseGetPublicUrl } from "@/lib/supabase";
import { EBuletin } from "@/types/admin";
import { Pagination } from "@/components/ui/pagination";
import { PdfViewer } from "@/components/ui/pdf-viewer";

export default function EBuletinPage() {
  const [data, setData] = useState<EBuletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBuletin, setSelectedBuletin] = useState<EBuletin | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await supabaseFetch("e_buletin", "order=wilayah.asc,created_at.desc");
        if (res && Array.isArray(res)) {
          setData(res);
        }
      } catch (err) {
        console.error("Gagal memuat e-buletin:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data;
    return data.filter((item) => {
      return (
        item.wilayah?.toLowerCase().includes(q) ||
        item.judul?.toLowerCase().includes(q) ||
        (item.edisi && item.edisi.toLowerCase().includes(q))
      );
    });
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <>
      <Header activeRoute="/publikasi/e-buletin" />
      <main className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-200 mb-4 border border-white/10">
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>Publikasi Ilmiah & Buletin</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                E-Buletin Kota & Kabupaten
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
                Daftar arsip dokumen E-Buletin informasi iklim, analisis curah hujan, dan ringkasan agroklimat untuk 38 Kota dan Kabupaten di Provinsi Jawa Timur.
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
                  placeholder="Cari Kota atau Kabupaten (misal: Malang, Surabaya, Pacitan)..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:bg-white/15 transition-all"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">
                  search
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE PDF VIEWER MODAL / FULL CARD */}
          {selectedBuletin && (
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-primary/30 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                        {selectedBuletin.wilayah}
                      </span>
                      {selectedBuletin.edisi && (
                        <span className="text-xs text-slate-500 font-bold">• Edisi: {selectedBuletin.edisi}</span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {selectedBuletin.judul}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBuletin(null);
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    <span>Tutup Pratinjau</span>
                  </button>
                </div>

                <div className="w-full">
                  <PdfViewer
                    url={supabaseGetPublicUrl("e-buletin-files", selectedBuletin.pdf_url)}
                    title={selectedBuletin.judul}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TABLE LIST VIEW */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">list_alt</span>
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                  Daftar Wilayah E-Buletin
                </h3>
              </div>
              <div className="text-xs font-bold text-slate-500">
                Menampilkan: <span className="text-primary font-extrabold">{filteredData.length} dokumen</span>
              </div>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500 font-medium animate-pulse">Memuat data e-buletin wilayah...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">menu_book</span>
                <h4 className="text-base font-bold text-slate-700 mb-1">
                  {searchQuery ? "Wilayah Tidak Ditemukan" : "Belum Ada Dokumen E-Buletin"}
                </h4>
                <p className="text-xs text-slate-400">
                  {searchQuery ? "Coba gunakan kata kunci pencarian yang lain." : "Dokumen E-Buletin sedang dipersiapkan oleh admin Staklim Jawa Timur."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4 w-16 text-center">No</th>
                      <th className="px-6 py-4">Wilayah (Kota / Kabupaten)</th>
                      <th className="px-6 py-4">Judul Dokumen & Edisi</th>
                      <th className="px-6 py-4">Tanggal Diperbarui</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedData.map((item, idx) => {
                      const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                      const pdfFullUrl = supabaseGetPublicUrl("e-buletin-files", item.pdf_url);
                      const isCurrentlyActive = selectedBuletin?.id === item.id;

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${
                            isCurrentlyActive ? "bg-blue-50/70" : ""
                          }`}
                          onClick={() => {
                            setSelectedBuletin(item);
                            window.scrollTo({ top: 350, behavior: "smooth" });
                          }}
                        >
                          <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                            {rowNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-[17px]">location_on</span>
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 group-hover:text-primary transition-colors block">
                                  {item.wilayah}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">Provinsi Jawa Timur</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 line-clamp-1">{item.judul}</div>
                            {item.edisi && (
                              <div className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md font-bold mt-1">
                                <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                                <span>{item.edisi}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              {/* Baca PDF Button */}
                              <button
                                onClick={() => {
                                  setSelectedBuletin(item);
                                  window.scrollTo({ top: 350, behavior: "smooth" });
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-primary/20 transition-all active:scale-95 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                <span className="hidden sm:inline">Baca Buletin</span>
                              </button>
                              {/* Unduh File */}
                              <a
                                href={pdfFullUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Unduh File PDF"
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">download</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
