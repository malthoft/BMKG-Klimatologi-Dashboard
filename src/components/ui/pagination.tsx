"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    let start = currentPage - 1;
    let end = currentPage + 1;

    if (start < 1) {
      start = 1;
      end = Math.min(3, totalPages);
    }

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, totalPages - 2);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : currentPage * itemsPerPage;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-slate-100 ${className}`}>
      {totalItems !== undefined && (
        <div className="text-xs md:text-sm text-slate-500 font-medium order-2 sm:order-1">
          Menampilkan <span className="font-bold text-slate-700">{startItem}</span> -{" "}
          <span className="font-bold text-slate-700">{endItem}</span> dari{" "}
          <span className="font-bold text-blue-600">{totalItems}</span> data
        </div>
      )}

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Tombol Sebelumnya */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          aria-label="Halaman Sebelumnya"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Angka Halaman */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === "...") {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 font-bold text-sm select-none">
                  ...
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(Number(page))}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center transition-all ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 border border-blue-600 scale-105"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                }`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Tombol Selanjutnya */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          aria-label="Halaman Selanjutnya"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
