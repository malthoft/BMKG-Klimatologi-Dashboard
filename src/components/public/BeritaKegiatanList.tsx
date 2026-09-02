"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { supabaseGetPublicUrl } from "@/lib/supabase";

interface BeritaItem {
  id: number;
  judul: string;
  deskripsi: string;
  kategori: string;
  penulis: string;
  file_url: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface BeritaKegiatanListProps {
  initialData: BeritaItem[];
}

export function BeritaKegiatanList({ initialData }: BeritaKegiatanListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = ["Semua", "Berita", "Kegiatan", "Artikel"];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("id-ID", options) + " WIB";
  };

  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const matchesSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesKategori = selectedKategori === "Semua" || item.kategori?.toLowerCase() === selectedKategori.toLowerCase();
      return matchesSearch && matchesKategori;
    });
  }, [initialData, searchQuery, selectedKategori]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleKategoriChange = (kat: string) => {
    setSelectedKategori(kat);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Cari berita & kegiatan..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {categories.map((kat) => (
            <button
              key={kat}
              onClick={() => handleKategoriChange(kat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedKategori === kat
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {kat}
            </button>
          ))}
        </div>
      </div>

      {/* List Items */}
      {paginatedData.length > 0 ? (
        <div className="flex flex-col gap-6">
          {paginatedData.map((item) => (
            <Link
              href={`/publikasi/berita-kegiatan/${item.id}`}
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-all group overflow-hidden"
            >
              {/* Thumbnail Image */}
              <div className="relative w-full sm:w-48 h-48 sm:h-36 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:shadow-sm transition-all">
                {item.file_url ? (
                  <img 
                    src={supabaseGetPublicUrl("berita-kegiatan-files", item.file_url)} 
                    alt={item.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-slate-300 group-hover:scale-110 transition-transform duration-500">
                    newspaper
                  </span>
                )}
                {/* Overlay gradient for empty images */}
                {!item.file_url && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-100/50 to-transparent mix-blend-overlay"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border border-blue-100">
                    {item.kategori || "Berita"}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.judul}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium mt-3">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                    {formatDate(item.published_at || item.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    {item.penulis || "Admin"}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">newspaper</span>
          <h3 className="text-lg font-bold text-slate-700 mb-1">Tidak Ada Data Ditemukan</h3>
          <p className="text-slate-500 text-sm">
            {searchQuery
              ? `Tidak ditemukan berita dengan kata kunci "${searchQuery}".`
              : "Belum ada publikasi berita atau kegiatan saat ini."}
          </p>
        </div>
      )}
    </div>
  );
}
