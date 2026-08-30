"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseFetch } from "@/lib/supabase";
import { Pagination } from "@/components/ui/pagination";
// Removed date-fns to prevent module error

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await supabaseFetch(tableName, "order=published_at.desc");
        if (result) {
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

  const getDay = (dateStr: string) => new Date(dateStr).getDate().toString().padStart(2, '0');
  
  const getMonthYear = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };
  
  const getFullDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return `${date} ${time}`;
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Memuat data publikasi...</p>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
        <button 
          onClick={() => setSelectedItem(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Kembali ke Daftar
        </button>
        
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-8 w-full max-w-full">
          {/* TITLE & META */}
          <div className="p-6 md:p-10 border-b border-slate-100 flex flex-col items-center text-center w-full max-w-full overflow-hidden break-words">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-6 leading-tight max-w-4xl break-words">
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
                <img 
                  src={selectedItem.image_url} 
                  alt={selectedItem.judul} 
                  className="object-contain w-full h-full max-h-[70vh]" 
                />
              </div>
            </div>
          )}
          
          {/* DESCRIPTION */}
          <div className="p-6 md:p-10 w-full max-w-full overflow-hidden break-words">
            <div 
              className="prose prose-slate max-w-none text-base sm:text-lg text-slate-700 leading-relaxed w-full max-w-full break-words overflow-hidden"
              dangerouslySetInnerHTML={{ __html: selectedItem.deskripsi }}
            />
          </div>
        </div>

        {/* PDF VIEWER (Separated from the main card) */}
        {selectedItem.pdf_url && (
          <div className="w-full mt-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-2">
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-1">Dokumen Lampiran</h3>
                <p className="text-slate-500">Pratinjau dokumen PDF selengkapnya.</p>
              </div>
              <a 
                href={selectedItem.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors py-2.5 px-6 rounded-xl font-bold text-sm shadow-md"
              >
                <span className="material-symbols-outlined text-[20px]">file_download</span>
                Unduh PDF
              </a>
            </div>
            
            <div 
              className="w-full rounded-2xl overflow-hidden shadow-lg border border-slate-300 bg-white"
              style={{ aspectRatio: '1 / 1.414', minHeight: '800px' }}
            >
              <iframe src={`${selectedItem.pdf_url}#view=FitH`} className="w-full h-full border-none" title="Dokumen Publikasi" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">{title}</h1>
        {description && <p className="text-slate-600 text-lg">{description}</p>}
        <div className="h-1.5 w-24 bg-blue-600 rounded-full mt-6 mx-auto md:mx-0"></div>
      </div>

      {data.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">article</span>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Belum Ada Publikasi</h3>
          <p className="text-slate-500">Saat ini belum ada data publikasi untuk kategori ini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {paginatedData.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            >
              <h2 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                {item.judul}
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  {getDay(item.published_at)} {getMonthYear(item.published_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {item.author_name || "Admin"}
                </span>
                {item.pdf_url && (
                  <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                    PDF Tersedia
                  </span>
                )}
              </div>
              
              <div className="text-primary font-bold group-hover:text-secondary flex items-center gap-1 text-sm mt-3 transition-colors">
                Lihat Detail Publikasi
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>
            </div>
          ))}

          {/* Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setCurrentPage(newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            totalItems={data.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
}
