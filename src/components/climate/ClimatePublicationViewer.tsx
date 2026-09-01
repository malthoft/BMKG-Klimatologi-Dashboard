"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { supabaseFetch } from "@/lib/supabase";
import { Pagination } from "@/components/ui/pagination";
import { PdfViewer } from "@/components/ui/pdf-viewer";
import { formatDescriptionHtml } from "@/lib/utils";

interface Publication {
  id: number;
  judul: string;
  image_url: string;
  deskripsi: string;
  pdf_url?: string;
  author_name: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export function ClimatePublicationViewer({ tableName, title, description }: { tableName: string, title: string, description?: string }) {
  const [data, setData] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Publication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await supabaseFetch(tableName, "order=published_at.desc");
        if (result && Array.isArray(result)) {
          setData(result);
        }
      } catch (err) {
        console.error(`Failed to fetch from ${tableName}`, err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tableName]);

  const getDay = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).getDate().toString().padStart(2, '0');
  };
  
  const getMonthYear = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data;
    return data.filter((item) => {
      return (
        item.judul?.toLowerCase().includes(q) ||
        (item.author_name && item.author_name.toLowerCase().includes(q)) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q))
      );
    });
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm animate-pulse">Memuat data publikasi iklim...</p>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
        <button 
          onClick={() => {
            setSelectedItem(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Kembali ke Daftar Publikasi
        </button>
        
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-8 w-full max-w-full">
          {/* TITLE & META */}
          <div className="p-4 sm:p-6 md:p-10 border-b border-slate-100 flex flex-col items-center text-center w-full max-w-full overflow-hidden">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-slate-800 mb-4 sm:mb-6 leading-tight max-w-4xl">
              {selectedItem.judul}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg font-medium">
                <span className="material-symbols-outlined text-[16px]">edit_document</span>
                Oleh: {selectedItem.author_name}
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg font-medium">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                Dipublikasikan: {getDay(selectedItem.published_at)} {getMonthYear(selectedItem.published_at)}
              </div>
            </div>
          </div>

          {/* IMAGE */}
          {selectedItem.image_url && (
            <div className="w-full relative bg-slate-100 border-b border-slate-200 flex justify-center">
              <div className="relative w-full h-auto max-h-[70vh] flex items-center justify-center py-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedItem.image_url} 
                  alt={selectedItem.judul} 
                  className="object-contain w-full h-full max-h-[70vh]" 
                />
              </div>
            </div>
          )}
          
          {/* DESCRIPTION */}
          {selectedItem.deskripsi && selectedItem.deskripsi.trim() !== "" && (
            <div className="p-4 sm:p-6 md:p-8 lg:p-10 w-full max-w-full overflow-hidden">
              <div 
                className="prose prose-slate max-w-none text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed sm:leading-loose w-full max-w-full overflow-hidden"
                dangerouslySetInnerHTML={{ __html: formatDescriptionHtml(selectedItem.deskripsi) }}
              />
            </div>
          )}
        </div>

        {/* PDF VIEWER (Separated from the main card) */}
        {selectedItem.pdf_url && (
          <div className="w-full mt-8">
            <PdfViewer 
              url={selectedItem.pdf_url} 
              title={selectedItem.judul || "Dokumen Lampiran Publikasi"} 
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-2">{title}</h1>
          {description && <p className="text-slate-600 text-sm sm:text-base max-w-2xl">{description}</p>}
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-80 relative shrink-0">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Cari judul publikasi..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto my-8">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">article</span>
          <h3 className="text-lg font-bold text-slate-700 mb-1">
            {searchQuery ? "Publikasi Tidak Ditemukan" : "Belum Ada Publikasi"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            {searchQuery ? "Tidak ditemukan publikasi yang cocok dengan kata kunci pencarian Anda." : "Saat ini belum ada data publikasi untuk kategori ini."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Menampilkan {filteredData.length} data publikasi</span>
            {totalPages > 1 && <span>Halaman {currentPage} dari {totalPages}</span>}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {paginatedData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  setSelectedItem(item);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-white rounded-2xl shadow-xs hover:shadow-lg border border-slate-200/80 hover:border-primary/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {item.judul}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 font-medium mt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-blue-600">calendar_month</span>
                      {getDay(item.published_at)} {getMonthYear(item.published_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-blue-600">person</span>
                      {item.author_name || "Admin"}
                    </span>
                    {item.pdf_url && (
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        <span className="material-symbols-outlined text-[13px]">picture_as_pdf</span>
                        PDF Lampiran
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-primary font-bold group-hover:translate-x-1 flex items-center gap-1 text-xs sm:text-sm shrink-0 transition-transform">
                  <span>Lihat Detail</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Component */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(newPage) => {
                  setCurrentPage(newPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
