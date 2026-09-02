"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { EBuletin } from "@/types/admin";
import { supabaseUploadFile, supabaseGetPublicUrl } from "@/lib/supabase";
import { Pagination } from "@/components/ui/pagination";
import { PdfViewer } from "@/components/ui/pdf-viewer";
import { ModalPortal } from "@/components/ui/ModalPortal";

export const KOTA_KABUPATEN_JATIM = [
  "Kabupaten Bangkalan",
  "Kabupaten Banyuwangi",
  "Kabupaten Blitar",
  "Kabupaten Bojonegoro",
  "Kabupaten Bondowoso",
  "Kabupaten Gresik",
  "Kabupaten Jember",
  "Kabupaten Jombang",
  "Kabupaten Kediri",
  "Kabupaten Lamongan",
  "Kabupaten Lumajang",
  "Kabupaten Madiun",
  "Kabupaten Magetan",
  "Kabupaten Malang",
  "Kabupaten Mojokerto",
  "Kabupaten Nganjuk",
  "Kabupaten Ngawi",
  "Kabupaten Pacitan",
  "Kabupaten Pamekasan",
  "Kabupaten Pasuruan",
  "Kabupaten Ponorogo",
  "Kabupaten Probolinggo",
  "Kabupaten Sampang",
  "Kabupaten Sidoarjo",
  "Kabupaten Situbondo",
  "Kabupaten Sumenep",
  "Kabupaten Trenggalek",
  "Kabupaten Tuban",
  "Kabupaten Tulungagung",
  "Kota Batu",
  "Kota Blitar",
  "Kota Kediri",
  "Kota Madiun",
  "Kota Malang",
  "Kota Mojokerto",
  "Kota Pasuruan",
  "Kota Probolinggo",
  "Kota Surabaya"
];

export function EBuletinTab() {
  const confirm = useConfirm();
  const { success, error } = useToast();
  
  const { items, isLoading, isError, load, add, update, remove } = useCrud<EBuletin>("e_buletin", "e-buletin-files");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<EBuletin | null>(null);

  const [formData, setFormData] = useState<Partial<EBuletin>>({
    id: 0,
    wilayah: "",
    judul: "",
    edisi: "",
    pdf_url: "",
    penulis: "Tim Staklim Jatim",
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showWilayahSuggestions, setShowWilayahSuggestions] = useState(false);
  const wilayahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load("order=wilayah.asc,created_at.desc");
  }, [load]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wilayahRef.current && !wilayahRef.current.contains(e.target as Node)) {
        setShowWilayahSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDetail(null);
        setShowWilayahSuggestions(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const suggestedWilayah = useMemo(() => {
    const q = (formData.wilayah || "").toLowerCase().trim();
    if (!q) return KOTA_KABUPATEN_JATIM;
    return KOTA_KABUPATEN_JATIM.filter((w) => w.toLowerCase().includes(q));
  }, [formData.wilayah]);

  const handleOpenCreateForm = () => {
    setFormData({
      id: 0,
      wilayah: "",
      judul: "",
      edisi: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      pdf_url: "",
      penulis: "Tim Staklim Jatim",
    });
    setPdfFile(null);
    setIsEditing(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditClick = (item: EBuletin) => {
    setFormData({
      id: item.id,
      wilayah: item.wilayah || "",
      judul: item.judul || "",
      edisi: item.edisi || "",
      pdf_url: item.pdf_url || "",
      penulis: item.penulis || "Tim Staklim Jatim",
    });
    setPdfFile(null);
    setIsEditing(true);
    setIsFormOpen(true);
    setSelectedDetail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setPdfFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.wilayah?.trim()) {
      error("Nama Kota/Kabupaten tidak boleh kosong.");
      return;
    }
    if (!formData.judul?.trim()) {
      error("Judul E-Buletin tidak boleh kosong.");
      return;
    }
    if (!isEditing && !pdfFile && !formData.pdf_url?.trim()) {
      error("Harap unggah file PDF buletin terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPdfUrl = formData.pdf_url || "";

      // Upload file PDF baru jika dipilih
      if (pdfFile) {
        const cleanWilayah = formData.wilayah.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const cleanName = `ebuletin_${cleanWilayah}_${Date.now()}.pdf`;
        const uploadResult = await supabaseUploadFile("e-buletin-files", cleanName, pdfFile);
        if (!uploadResult) {
          error("Gagal mengunggah berkas PDF ke storage.");
          setIsSubmitting(false);
          return;
        }
        finalPdfUrl = cleanName;
      }

      const payload: Partial<EBuletin> = {
        wilayah: formData.wilayah.trim(),
        judul: formData.judul.trim(),
        edisi: formData.edisi?.trim() || "",
        pdf_url: finalPdfUrl,
        penulis: formData.penulis?.trim() || "Tim Staklim Jatim",
        updated_at: new Date().toISOString(),
      };

      let res = false;
      if (isEditing && formData.id) {
        res = await update(formData.id, payload, "E-Buletin berhasil diperbarui!");
      } else {
        payload.created_at = new Date().toISOString();
        res = await add(payload, "E-Buletin berhasil ditambahkan!");
      }

      if (res) {
        handleCloseForm();
        load("order=wilayah.asc,created_at.desc");
      }
    } catch (err: any) {
      error(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: EBuletin) => {
    const isConfirmed = await confirm(
      `Apakah Anda yakin ingin menghapus E-Buletin untuk "${item.wilayah}"? Tindakan ini tidak dapat dibatalkan.`,
      "Hapus E-Buletin?"
    );

    if (isConfirmed) {
      const res = await remove(item.id, item.pdf_url, "E-Buletin berhasil dihapus!");
      if (res) {
        if (selectedDetail?.id === item.id) setSelectedDetail(null);
        load("order=wilayah.asc,created_at.desc");
      }
    }
  };

  // Filter & Search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.wilayah?.toLowerCase().includes(q) ||
        item.judul?.toLowerCase().includes(q) ||
        (item.edisi && item.edisi.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      {!isFormOpen && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-[26px]">menu_book</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Manajemen E-Buletin Jawa Timur</h2>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm">
              Kelola dokumen E-Buletin informasi iklim untuk 38 Kota dan Kabupaten di Provinsi Jawa Timur (Format PDF).
            </p>
          </div>
          <button
            onClick={handleOpenCreateForm}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-95 text-sm shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Tambah E-Buletin</span>
          </button>
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {isFormOpen && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-primary/30 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
                <span className="material-symbols-outlined text-[22px]">
                  {isEditing ? "edit_note" : "post_add"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isEditing ? "Edit E-Buletin Wilayah" : "Tambah E-Buletin Baru"}
                </h3>
                <p className="text-xs text-slate-500">Pilih Kota/Kabupaten dan upload dokumen PDF buletin</p>
              </div>
            </div>
            <button
              onClick={handleCloseForm}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wilayah (Kota / Kabupaten) - Custom Autocomplete Input */}
              <div className="relative" ref={wilayahRef}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Wilayah Kota / Kabupaten <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.wilayah || ""}
                    onFocus={() => setShowWilayahSuggestions(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShowWilayahSuggestions(true);
                      setFormData({
                        ...formData,
                        wilayah: val,
                        judul: !isEditing && (!formData.judul || formData.judul.startsWith("E-Buletin Informasi Iklim"))
                          ? (val ? `E-Buletin Informasi Iklim ${val}` : "")
                          : formData.judul,
                      });
                    }}
                    placeholder="Contoh: Kabupaten Malang / Kota Surabaya"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {formData.wilayah && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, wilayah: "" });
                        setShowWilayahSuggestions(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Custom Floating Suggestions - Strictly Max 5 items per scroll (max-h-[190px]) */}
                {showWilayahSuggestions && suggestedWilayah.length > 0 && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[190px] overflow-y-auto divide-y divide-slate-100">
                    {suggestedWilayah.map((wil) => (
                      <button
                        key={wil}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            wilayah: wil,
                            judul: !isEditing && (!formData.judul || formData.judul.startsWith("E-Buletin Informasi Iklim"))
                              ? `E-Buletin Informasi Iklim ${wil}`
                              : formData.judul,
                          });
                          setShowWilayahSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-xs sm:text-sm font-medium text-slate-700 hover:text-primary transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>{wil}</span>
                        {formData.wilayah === wil && (
                          <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-1.5">
                  Ketik nama wilayah secara manual atau klik salah satu saran
                </p>
              </div>

              {/* Edisi Buletin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Edisi Buletin (Bulan / Tahun / Periode)
                </label>
                <input
                  type="text"
                  value={formData.edisi || ""}
                  onChange={(e) => setFormData({ ...formData, edisi: e.target.value })}
                  placeholder="Contoh: Agustus 2026 / Triwulan III"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Judul Buletin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Judul Lengkap Dokumen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul || ""}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: E-Buletin Informasi Iklim Kabupaten Malang Edisi Agustus 2026"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Penulis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Penyusun / Tim Redaksi
                </label>
                <input
                  type="text"
                  value={formData.penulis || ""}
                  onChange={(e) => setFormData({ ...formData, penulis: e.target.value })}
                  placeholder="Contoh: Tim Staklim Jatim"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Upload PDF */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Upload Dokumen PDF E-Buletin {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50/50 rounded-2xl p-6 transition-all text-center">
                <input
                  type="file"
                  id="pdfFileInput"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPdfFile(f);
                  }}
                  className="hidden"
                />
                <label htmlFor="pdfFileInput" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-primary hover:underline">
                      {pdfFile ? pdfFile.name : isEditing && formData.pdf_url ? "Ganti File PDF Terunggah" : "Klik untuk Pilih Berkas PDF"}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Mendukung format .PDF (Maks. 50MB)</p>
                  </div>
                </label>
              </div>

              {/* Status File */}
              {(pdfFile || (isEditing && formData.pdf_url)) && (
                <div className="mt-3 flex items-center justify-between bg-slate-100 p-3 rounded-xl text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    <span className="truncate">{pdfFile ? pdfFile.name : formData.pdf_url}</span>
                  </div>
                  {pdfFile && (
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="text-red-500 hover:text-red-700 font-bold shrink-0 ml-2 cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isEditing ? "Simpan Perubahan" : "Publikasikan E-Buletin"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      {!isFormOpen && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Cari nama kota, kabupaten, atau edisi..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-xs font-bold text-slate-500">
              Total E-Buletin: <span className="text-primary font-extrabold">{filteredItems.length} wilayah</span>
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>

            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="perPage" className="text-xs font-bold text-slate-500 hidden md:block">Tampilkan:</label>
              <select
                id="perPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2 py-1.5 outline-none focus:border-primary cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value={5}>5 Baris</option>
                <option value={10}>10 Baris</option>
                <option value={20}>20 Baris</option>
                <option value={50}>50 Baris</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TABLE DATA */}
      {!isFormOpen && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium animate-pulse">Memuat data e-buletin...</p>
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
              <p className="text-sm font-semibold">Tabel database e_buletin belum siap.</p>
              <p className="text-xs text-slate-400 mt-1">Pastikan skrip SQL setup_e_buletin.sql telah dijalankan di Supabase.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">menu_book</span>
              <p className="text-sm font-bold text-slate-700">Belum ada dokumen E-Buletin.</p>
              <p className="text-xs text-slate-400 mt-1">Klik tombol &ldquo;Tambah E-Buletin&rdquo; untuk mulai mengunggah file PDF wilayah.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4 w-16 text-center">No</th>
                    <th className="px-6 py-4">Wilayah (Kota / Kabupaten)</th>
                    <th className="px-6 py-4">Judul & Edisi</th>
                    <th className="px-6 py-4">Format</th>
                    <th className="px-6 py-4">Tanggal Diunggah</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedItems.map((item, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                          {rowNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                            <span className="font-bold text-slate-900">{item.wilayah}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 line-clamp-1">{item.judul}</div>
                          {item.edisi && (
                            <div className="text-[11px] text-blue-600 font-bold mt-0.5">Edisi: {item.edisi}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100">
                            <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                            PDF
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview Button */}
                            <button
                              onClick={() => setSelectedDetail(item)}
                              title="Baca Dokumen PDF"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[17px]">visibility</span>
                            </button>
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditClick(item)}
                              title="Edit Data"
                              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(item)}
                              title="Hapus Data"
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
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
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      )}

      {/* DETAIL PDF MODAL */}
      {selectedDetail && (
        <ModalPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 flex flex-col border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div>
                <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  {selectedDetail.wilayah}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedDetail.judul}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6">
              <PdfViewer
                url={supabaseGetPublicUrl("e-buletin-files", selectedDetail.pdf_url)}
                title={selectedDetail.judul}
              />
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="text-xs text-slate-500 font-medium">
                Penyusun: <strong className="text-slate-800">{selectedDetail.penulis || "Tim Staklim Jatim"}</strong>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
