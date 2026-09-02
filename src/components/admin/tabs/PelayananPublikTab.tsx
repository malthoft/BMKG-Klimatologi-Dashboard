import { useState, useEffect, useMemo } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { PelayananPublik } from "@/types/admin";
import { supabaseUploadFile, supabaseDeleteFile, supabaseGetPublicUrl } from "@/lib/supabase";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Pagination } from "@/components/ui/pagination";
import { PdfViewer } from "@/components/ui/pdf-viewer";
import { formatDescriptionHtml } from "@/lib/utils";
import { ModalPortal } from "@/components/ui/ModalPortal";

export const PELAYANAN_CATEGORIES = [
  { id: "pk", label: "Perjanjian Kinerja", type: "pdf", icon: "description", group: "Dokumen Kinerja" },
  { id: "lakip", label: "Laporan Kinerja", type: "pdf", icon: "analytics", group: "Dokumen Kinerja" },
  { id: "rkt", label: "Rencana Kinerja Tahunan", type: "pdf", icon: "event_note", group: "Dokumen Kinerja" },
  { id: "maklumat", label: "Maklumat Pelayanan", type: "image", icon: "badge", group: "Informasi Layanan" },
  { id: "standar", label: "Standar Pelayanan", type: "image", icon: "verified", group: "Informasi Layanan" },
  { id: "jenis", label: "Jenis Layanan", type: "image_text", icon: "category", group: "Informasi Layanan" },
  { id: "pnbp", label: "Jenis & Tarif Layanan PNBP", type: "image_text", icon: "payments", group: "Panduan Layanan" },
  { id: "tarif-nol", label: "Tarif Nol Rupiah", type: "image", icon: "money_off", group: "Panduan Layanan" },
];

export function PelayananPublikTab() {
  const confirm = useConfirm();
  const { success, error } = useToast();
  
  const { items, isLoading, isError, load, add, update, remove } = useCrud<PelayananPublik>("pelayanan_publik", "pelayanan-publik-files");

  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<PelayananPublik | null>(null);

  const [formData, setFormData] = useState<Partial<PelayananPublik>>({
    id: 0,
    kategori: "pk",
    judul: "",
    file_url: "",
    deskripsi: "",
    penulis: "",
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  // Load items on mount
  useEffect(() => {
    load("order=created_at.desc");
  }, [load]);

  // Dropdown Category Options with real-time counts
  const categoryOptions = useMemo(() => {
    const totalAll = items.length;
    const allOption = {
      value: "all",
      label: `Semua Kategori (${totalAll} data)`
    };

    const catOpts = PELAYANAN_CATEGORIES.map(cat => {
      const count = items.filter(i => i.kategori === cat.id).length;
      return {
        value: cat.id,
        label: `${cat.label} (${count} data)`
      };
    });

    return [allOption, ...catOpts];
  }, [items]);

  // Current category metadata
  const currentCatMeta = useMemo(() => {
    return PELAYANAN_CATEGORIES.find(c => c.id === formData.kategori) || PELAYANAN_CATEGORIES[0];
  }, [formData.kategori]);

  // Handle local file preview
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      if (formData.file_url) {
        setPreviewFileUrl(supabaseGetPublicUrl("pelayanan-publik-files", formData.file_url));
      } else {
        setPreviewFileUrl(null);
      }
    }
  }, [uploadedFile, formData.file_url]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDetail(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenCreateForm = (defaultCat?: string) => {
    setFormData({
      id: 0,
      kategori: defaultCat || (selectedFilterCategory !== "all" ? selectedFilterCategory : "pk"),
      judul: "",
      file_url: "",
      deskripsi: "",
      penulis: "",
    });
    setUploadedFile(null);
    setPreviewFileUrl(null);
    setIsEditing(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditClick = (item: PelayananPublik) => {
    setFormData({
      id: item.id,
      kategori: item.kategori,
      judul: item.judul,
      file_url: item.file_url,
      deskripsi: item.deskripsi || "",
      penulis: item.penulis || "",
    });
    setUploadedFile(null);
    setIsEditing(true);
    setIsFormOpen(true);
    setSelectedDetail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setUploadedFile(null);
    setPreviewFileUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul?.trim()) {
      error("Judul tidak boleh kosong.");
      return;
    }
    if (!formData.penulis?.trim()) {
      error("Penulis / Tim Pengelola wajib diisi.");
      return;
    }

    if (!isEditing && !uploadedFile && !formData.file_url?.trim()) {
      error(`Harap unggah file ${currentCatMeta.type === 'pdf' ? 'PDF' : 'Gambar'} terlebih dahulu.`);
      return;
    }

    setIsSubmitting(true);
    try {
      let finalFileUrl = formData.file_url || "";

      // Upload file jika ada file baru yang dipilih
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split(".").pop();
        const cleanName = `${formData.kategori}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const uploadResult = await supabaseUploadFile("pelayanan-publik-files", cleanName, uploadedFile);
        if (!uploadResult) {
          error("Gagal mengunggah berkas ke server.");
          setIsSubmitting(false);
          return;
        }
        finalFileUrl = cleanName;
      }

      const payload: Partial<PelayananPublik> = {
        kategori: formData.kategori,
        judul: formData.judul.trim(),
        file_url: finalFileUrl,
        deskripsi: formData.deskripsi || "",
        penulis: formData.penulis?.trim() || "",
        updated_at: new Date().toISOString(),
      };

      let res = false;
      if (isEditing && formData.id) {
        res = await update(formData.id, payload, "Data Pelayanan Publik berhasil diperbarui!");
      } else {
        payload.created_at = new Date().toISOString();
        res = await add(payload, "Data Pelayanan Publik berhasil ditambahkan!");
      }

      if (res) {
        handleCloseForm();
        load("order=created_at.desc");
      }
    } catch (err: any) {
      error(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: PelayananPublik) => {
    const isConfirmed = await confirm(
      `Apakah Anda yakin ingin menghapus data "${item.judul}"? Tindakan ini tidak dapat dibatalkan.`,
      "Hapus Konten Pelayanan?"
    );

    if (isConfirmed) {
      const res = await remove(item.id, item.file_url, "Data Pelayanan berhasil dihapus!");
      if (res) {
        if (selectedDetail?.id === item.id) setSelectedDetail(null);
        load("order=created_at.desc");
      }
    }
  };

  // Filter & Search
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = selectedFilterCategory === "all" || item.kategori === selectedFilterCategory;
      const matchSearch = !searchQuery.trim() || 
        item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [items, selectedFilterCategory, searchQuery]);

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

  const getCategoryBadge = (catId: string) => {
    const cat = PELAYANAN_CATEGORIES.find(c => c.id === catId);
    if (!cat) return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{catId}</span>;
    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-0.5 rounded-full text-xs font-semibold">
        <span className="material-symbols-outlined text-[13px]">{cat.icon}</span>
        {cat.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Dropdown & Create Button Banner (Matching Publikasi Iklim Style) */}
      {!isFormOpen && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[24px]">category</span>
              Kategori Pelayanan Publik
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Pilih jenis dokumen atau layanan publik untuk memfilter dan mengelola konten:
            </p>
            <div className="max-w-md relative z-[50]">
              <CustomSelect
                value={selectedFilterCategory}
                onChange={(val) => {
                  setSelectedFilterCategory(val);
                  setCurrentPage(1);
                }}
                options={categoryOptions}
              />
            </div>
          </div>

          <button
            onClick={() => handleOpenCreateForm()}
            className="px-6 py-3.5 rounded-2xl font-black text-white bg-primary hover:bg-blue-700 shadow-lg shadow-primary/25 transition-all flex items-center gap-2 self-start md:self-auto hover:scale-105 active:scale-95 shrink-0 text-sm"
          >
            <span className="material-symbols-outlined text-[22px]">add_circle</span>
            Tambah Konten Baru
          </button>
        </div>
      )}

      {/* FORM MODAL / DRAWER */}
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
                  {isEditing ? "Edit Konten Pelayanan" : "Tambah Konten Pelayanan Baru"}
                </h3>
                <p className="text-xs text-slate-500">Lengkapi form berikut sesuai jenis dokumen</p>
              </div>
            </div>
            <button
              onClick={handleCloseForm}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Kategori Pelayanan <span className="text-red-500">*</span>
                </label>
                <div className="relative z-50">
                  <CustomSelect
                    value={formData.kategori || "pk"}
                    onChange={(val) => setFormData({ ...formData, kategori: val })}
                    options={[
                      { value: "pk", label: "📁 Dokumen Kinerja - Perjanjian Kinerja (PK)" },
                      { value: "lakip", label: "📁 Dokumen Kinerja - Laporan Kinerja (LAKIP)" },
                      { value: "rkt", label: "📁 Dokumen Kinerja - Rencana Kinerja Tahunan (RKT)" },
                      { value: "maklumat", label: "ℹ️ Informasi Layanan - Maklumat Pelayanan" },
                      { value: "standar", label: "ℹ️ Informasi Layanan - Standar Pelayanan" },
                      { value: "jenis", label: "ℹ️ Informasi Layanan - Jenis Layanan" },
                      { value: "pnbp", label: "📖 Panduan Layanan - Jenis & Tarif Layanan PNBP" },
                      { value: "tarif-nol", label: "📖 Panduan Layanan - Tarif Nol Rupiah" }
                    ]}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">info</span>
                  <span>
                    Format yang dibutuhkan:{" "}
                    <strong>
                      {currentCatMeta.type === "pdf"
                        ? "Dokumen PDF"
                        : currentCatMeta.type === "image"
                        ? "File Gambar (JPG/PNG/WebP)"
                        : "Gambar & Teks Deskripsi"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Penulis / Sumber */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Penulis / Tim Pengelola <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.penulis || ""}
                  onChange={(e) => setFormData({ ...formData, penulis: e.target.value })}
                  placeholder="Contoh: Tim Pelayanan Publik BMKG"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Judul */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Judul Dokumen / Layanan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.judul || ""}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                placeholder={
                  currentCatMeta.type === "pdf"
                    ? "Contoh: Perjanjian Kinerja Stasiun Klimatologi Jawa Timur Tahun 2025"
                    : "Contoh: Standar Pelayanan Informasi Iklim dan Cuaca Khusus"
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Upload File */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {currentCatMeta.type === "pdf" ? "Upload File PDF Dokumen" : "Upload File Gambar / Infografis"}{" "}
                {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50/50 rounded-2xl p-6 transition-all text-center">
                <input
                  type="file"
                  id="fileInput"
                  accept={currentCatMeta.type === "pdf" ? ".pdf,application/pdf" : "image/*"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadedFile(f);
                  }}
                  className="hidden"
                />
                <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">
                      {currentCatMeta.type === "pdf" ? "picture_as_pdf" : "cloud_upload"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-primary hover:underline">
                      {uploadedFile ? uploadedFile.name : isEditing && formData.file_url ? "Ganti File Terunggah" : "Klik untuk Pilih Berkas"}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentCatMeta.type === "pdf" ? "Mendukung format .PDF (Maks. 50MB)" : "Mendukung JPG, PNG, WEBP"}
                    </p>
                  </div>
                </label>
              </div>

              {/* Status File Terpilih */}
              {(uploadedFile || (isEditing && formData.file_url)) && (
                <div className="mt-3 flex items-center justify-between bg-slate-100 p-3 rounded-xl text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    <span className="truncate">{uploadedFile ? uploadedFile.name : formData.file_url}</span>
                  </div>
                  {uploadedFile && (
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-red-500 hover:text-red-700 font-bold shrink-0 ml-2"
                    >
                      Batal
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Rich Text Deskripsi */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Deskripsi / Rincian Informasi {currentCatMeta.type === "image_text" ? <span className="text-red-500">*</span> : "(Opsional)"}
                </label>
                <span className="text-[11px] text-slate-400">Dukungan format teks & paragraf rapi</span>
              </div>
              <RichTextEditor
                value={formData.deskripsi || ""}
                onChange={(val) => setFormData({ ...formData, deskripsi: val })}
                placeholder="Tuliskan rincian pelayanan, persyaratan, tata cara, atau informasi tarif..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isEditing ? "Simpan Perubahan" : "Publikasikan Data"}</span>
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
              placeholder="Cari judul atau rincian dokumen..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="flex items-center gap-2">
              <label htmlFor="perPage" className="text-xs font-bold text-slate-500">Tampilkan:</label>
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
            <div className="text-xs font-bold text-slate-500">
              Total: <span className="text-primary font-extrabold">{filteredItems.length} data</span>
            </div>
          </div>
        </div>
      )}

      {/* TABLE / LIST CONTENT */}
      {!isFormOpen && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium animate-pulse">Memuat data pelayanan publik...</p>
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
              <p className="text-sm font-semibold">Tabel database pelayanan_publik belum siap.</p>
              <p className="text-xs text-slate-400 mt-1">Pastikan skrip SQL setup_pelayanan_publik.sql telah dijalankan di Supabase.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_off</span>
              <p className="text-sm font-bold text-slate-700">Belum ada konten pada filter ini.</p>
              <p className="text-xs text-slate-400 mt-1">Klik tombol &ldquo;Tambah Konten Baru&rdquo; untuk mulai mengunggah data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Judul Dokumen / Layanan</th>
                    <th className="px-6 py-4">Format File</th>
                    <th className="px-6 py-4">Tanggal Diunggah</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedItems.map((item) => {
                    const catMeta = PELAYANAN_CATEGORIES.find(c => c.id === item.kategori);
                    const isPdf = item.file_url?.toLowerCase().endsWith(".pdf") || catMeta?.type === "pdf";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getCategoryBadge(item.kategori)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 line-clamp-2">{item.judul}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Oleh: {item.penulis || "Admin"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                            isPdf ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            <span className="material-symbols-outlined text-[15px]">
                              {isPdf ? "picture_as_pdf" : "image"}
                            </span>
                            {isPdf ? "PDF" : "Gambar"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Detail / Preview Button */}
                            <button
                              onClick={() => setSelectedDetail(item)}
                              title="Pratinjau Dokumen"
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

      {/* DETAIL MODAL */}
      {selectedDetail && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 flex flex-col border border-slate-100">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  {getCategoryBadge(selectedDetail.kategori)}
                  <span className="text-xs text-slate-400 font-medium">Diunggah: {formatDate(selectedDetail.created_at)}</span>
                </div>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {selectedDetail.judul}
                </h3>

                {/* PDF Preview */}
                {(selectedDetail.file_url?.toLowerCase().endsWith(".pdf") || PELAYANAN_CATEGORIES.find(c => c.id === selectedDetail.kategori)?.type === "pdf") && (
                  <div className="w-full">
                    <PdfViewer
                      url={supabaseGetPublicUrl("pelayanan-publik-files", selectedDetail.file_url)}
                      title={selectedDetail.judul}
                    />
                  </div>
                )}

                {/* Image Preview */}
                {(!selectedDetail.file_url?.toLowerCase().endsWith(".pdf") && PELAYANAN_CATEGORIES.find(c => c.id === selectedDetail.kategori)?.type !== "pdf") && selectedDetail.file_url && (
                  <div className="w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-4">
                    <img
                      src={supabaseGetPublicUrl("pelayanan-publik-files", selectedDetail.file_url)}
                      alt={selectedDetail.judul}
                      className="max-h-[65vh] object-contain rounded-xl shadow-sm"
                    />
                  </div>
                )}

                {/* Description */}
                {selectedDetail.deskripsi && (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Deskripsi / Rincian Layanan</h4>
                    <div
                      className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatDescriptionHtml(selectedDetail.deskripsi) }}
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="text-xs text-slate-500 font-medium">
                  Penulis: <strong className="text-slate-800">{selectedDetail.penulis || "Admin"}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDetail(null);
                      handleEditClick(selectedDetail);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Edit Dokumen
                  </button>
                  <button
                    onClick={() => setSelectedDetail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
