"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";

interface PengumumanItem {
  id: number;
  judul: string;
  deskripsi: string;
  kategori: string;
  penulis?: string;
  file_url?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface PengumumanListProps {
  initialData: PengumumanItem[];
}

export function PengumumanList({ initialData }: PengumumanListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = ["Semua", "Umum", "Layanan", "Penting", "Kegiatan"];

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
            placeholder="Cari pengumuman..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {categories.map((kat) => (
            <button
              key={kat}
              onClick={() => handleKategoriChange(kat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedKategori === kat
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
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
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border border-indigo-100">
                  {item.kategori || "Pengumuman"}
                </span>
                {item.file_url && item.file_url.toLowerCase().includes(".pdf") && (
                  <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 border border-red-100">
                    <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                    Dokumen PDF
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                {item.judul}
              </h2>

              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  {formatDate(item.published_at || item.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {item.penulis || "Admin"}
                </span>
              </div>

              <Link
                href={`/publikasi/pengumuman/${item.id}`}
                className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1 text-sm mt-2 transition-colors self-start"
              >
                Baca Selengkapnya
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </Link>
            </div>
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
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">campaign</span>
          <h3 className="text-lg font-bold text-slate-700 mb-1">Tidak Ada Data Ditemukan</h3>
          <p className="text-slate-500 text-sm">
            {searchQuery
              ? `Tidak ditemukan pengumuman dengan kata kunci "${searchQuery}".`
              : "Belum ada pengumuman resmi saat ini."}
          </p>
        </div>
      )}
    </div>
  );
}
