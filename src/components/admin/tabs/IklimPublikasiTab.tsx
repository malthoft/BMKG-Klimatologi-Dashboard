import { useState, useEffect, useMemo, useCallback } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { supabaseUploadFile, supabaseDeleteFile, supabaseFetch } from "@/lib/supabase";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Pagination } from "@/components/ui/pagination";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface IklimPublikasi {
  id?: number;
  judul: string;
  image_url: string;
  deskripsi: string;
  pdf_url?: string;
  author_name: string;
  published_at: string;
  created_at?: string;
}

const CATEGORIES = [
  { value: "iklim_peringatan_dini", label: "Peringatan Dini Cuaca dan Iklim" },
  { value: "iklim_awal_musim", label: "Prediksi Awal Musim" },
  { value: "iklim_perbandingan_musim", label: "Prediksi Perbandingan Musim" },
  { value: "iklim_sifat_musim", label: "Prediksi Sifat Musim" },
  { value: "iklim_durasi_musim", label: "Prediksi Durasi Musim" },
  { value: "iklim_puncak_musim", label: "Prediksi Puncak Musim" },
  { value: "iklim_curah_hujan_musim", label: "Prediksi Curah Hujan Musim" },
  { value: "iklim_sifat_hujan", label: "Prediksi Sifat Hujan" },
  { value: "iklim_hujan_6_bulan", label: "Prediksi Hujan 6 Bulan" },
  { value: "iklim_kondisi_atmosfer", label: "Kondisi Atmosfer" },
  { value: "iklim_analisis_hujan_bulanan", label: "Analisis Hujan Bulanan" }
];

export function IklimPublikasiTab() {
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].value);
  
  const { items, isLoading, isError, load, add, update, remove } = useCrud<IklimPublikasi>(selectedCategory, "berita-kegiatan-files");

  const [formData, setFormData] = useState<Partial<IklimPublikasi>>({
    id: 0,
    judul: "",
    deskripsi: "",
    author_name: "Tim Klimatologi BMKG",
    published_at: new Date().toISOString().split('T')[0],
    image_url: "",
    pdf_url: ""
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<IklimPublikasi | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Fetch counts for all iklim categories
  const loadCategoryCounts = useCallback(async () => {
    try {
      const promises = CATEGORIES.map(async (cat) => {
        const data = await supabaseFetch(cat.value, "select=id");
        return { key: cat.value, count: data && Array.isArray(data) ? data.length : 0 };
      });
      const results = await Promise.all(promises);
      const countMap: Record<string, number> = {};
      results.forEach((r) => { countMap[r.key] = r.count; });
      setCategoryCounts(countMap);
    } catch (e) {
      // fail silently
    }
  }, []);

  useEffect(() => {
    loadCategoryCounts();
  }, [loadCategoryCounts]);

  useEffect(() => {
    // Update local count when current active items change
    setCategoryCounts((prev) => ({
      ...prev,
      [selectedCategory]: items.length,
    }));
  }, [selectedCategory, items.length]);

  const categoryOptions = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const count = categoryCounts[cat.value] !== undefined ? categoryCounts[cat.value] : 0;
      return {
        value: cat.value,
        label: `${cat.label} (${count} data)`,
      };
    });
  }, [categoryCounts]);

  useEffect(() => {
    // Muat data saat kategori berubah
    load("order=published_at.desc");
    setCurrentPage(1);
  }, [selectedCategory, load]);

  // Handle image preview generation
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewImageUrl(isEditing ? (formData.image_url || null) : null);
    }
  }, [imageFile, isEditing, formData.image_url]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDetail(null);
        setShowPreview(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentCategoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label || "Publikasi Iklim";

  const handleOpenCreateForm = () => {
    setFormData({
      id: 0,
      judul: "",
      deskripsi: "",
      author_name: "Tim Klimatologi BMKG",
      published_at: new Date().toISOString().split('T')[0],
      image_url: "",
      pdf_url: ""
    });
    setImageFile(null);
    setPdfFile(null);
    setIsEditing(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditClick = (item: IklimPublikasi) => {
    setFormData({
      id: item.id || 0,
      judul: item.judul || "",
      deskripsi: item.deskripsi || "",
      author_name: item.author_name || "Tim Klimatologi BMKG",
      published_at: item.published_at ? item.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
      image_url: item.image_url || "",
      pdf_url: item.pdf_url || ""
    });
    setImageFile(null);
    setPdfFile(null);
    setIsEditing(true);
    setIsFormOpen(true);
    setSelectedDetail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setShowPreview(false);
    setImageFile(null);
    setPdfFile(null);
  };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul?.trim()) {
      error("Judul publikasi tidak boleh kosong.");
      return;
    }
    if (!isEditing && !imageFile) {
      error("Harap unggah gambar peta publikasi.");
      return;
    }
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    if (!formData.judul?.trim()) {
      error("Judul publikasi tidak boleh kosong.");
      return;
    }
    if (!isEditing && !imageFile) {
      error("Harap unggah gambar peta publikasi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const ts = new Date().getTime();
      let finalImageUrl = formData.image_url || "";
      let finalPdfUrl = formData.pdf_url || undefined;
      
      // Upload Image if selected
      if (imageFile) {
        const imgExt = imageFile.name.split('.').pop();
        const imgName = `${selectedCategory}_img_${ts}.${imgExt}`;
        const uploadedImg = await supabaseUploadFile("berita-kegiatan-files", imgName, imageFile);
        if (uploadedImg) {
          finalImageUrl = uploadedImg;
        } else {
          throw new Error("Gagal mengunggah gambar");
        }
      }
      
      // Upload PDF if selected
      if (pdfFile) {
        const pdfExt = pdfFile.name.split('.').pop();
        const pdfName = `${selectedCategory}_pdf_${ts}.${pdfExt}`;
        const uploadedPdf = await supabaseUploadFile("berita-kegiatan-files", pdfName, pdfFile);
        if (uploadedPdf) {
          finalPdfUrl = uploadedPdf;
        }
      }

      const payload = {
        judul: formData.judul,
        deskripsi: formData.deskripsi,
        author_name: formData.author_name,
        published_at: formData.published_at,
        image_url: finalImageUrl,
        pdf_url: finalPdfUrl
      };

      if (isEditing && formData.id) {
        const res = await update(formData.id, payload, "Publikasi iklim berhasil diperbarui!");
        if (res) {
          handleCloseForm();
          load("order=published_at.desc");
        }
      } else {
        const res = await add(payload, "Publikasi iklim berhasil ditambahkan!");
        if (res) {
          handleCloseForm();
          load("order=published_at.desc");
        }
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kesalahan saat menyimpan data publikasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, imgUrl: string, pdfUrl?: string) => {
    if (await confirm("Yakin ingin menghapus publikasi iklim ini? Tindakan ini tidak dapat dibatalkan.", "Hapus Publikasi")) {
      const res = await remove(id, imgUrl, "Publikasi berhasil dihapus");
      if (res) {
        if (pdfUrl) {
          await supabaseDeleteFile("berita-kegiatan-files", pdfUrl);
        }
        success("Publikasi berhasil dihapus!");
        load("order=published_at.desc");
      } else {
        error("Gagal menghapus publikasi");
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        error("Ukuran file gambar maksimal 8MB.");
        return;
      }
      setImageFile(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        error("Ukuran file PDF maksimal 15MB.");
        return;
      }
      setPdfFile(file);
    }
  };

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesJudul = item.judul.toLowerCase().includes(query);
    const matchesDeskripsi = item.deskripsi && item.deskripsi.toLowerCase().includes(query);
    return matchesJudul || matchesDeskripsi;
  });

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {selectedDetail && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDetail(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {selectedDetail.image_url && (
              <div className="w-full h-72 md:h-96 relative bg-slate-100 flex items-center justify-center border-b border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedDetail.image_url} alt={selectedDetail.judul} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedDetail(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}
            
            <div className="p-8 md:p-10">
              {!selectedDetail.image_url && (
                <button onClick={() => setSelectedDetail(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">{currentCategoryLabel}</span>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                  {new Date(selectedDetail.published_at || "").toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">person</span>
                  {selectedDetail.author_name}
                </span>
                {selectedDetail.pdf_url && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                    Ada PDF
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-6 leading-tight break-words">{selectedDetail.judul}</h2>
              
              <div 
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed mb-8 w-full max-w-full break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedDetail.deskripsi }}
              />

              {selectedDetail.pdf_url && (
                <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-red-500">picture_as_pdf</span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Dokumen Lampiran PDF</p>
                      <p className="text-xs text-slate-500">Tersedia untuk diunduh / dilihat pengguna</p>
                    </div>
                  </div>
                  <a 
                    href={selectedDetail.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Buka PDF
                  </a>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setSelectedDetail(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Tutup
                </button>
                <button onClick={() => handleEditClick(selectedDetail)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                  Edit Publikasi Ini (Full Editor)
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ModalPortal>
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowPreview(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">Pratinjau Halaman Publik</span>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mt-1">
                  Preview Publikasi: {currentCategoryLabel}
                </h3>
              </div>
              <button onClick={() => setShowPreview(false)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-8 lg:p-12 overflow-hidden break-words max-w-full">
              <div className="flex flex-wrap gap-2 items-center mb-6">
                <span className="text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full bg-blue-100 text-blue-700">{currentCategoryLabel}</span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                  {formData.published_at || new Date().toLocaleDateString("id-ID")}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">person</span>
                  {formData.author_name || "Admin"}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight break-words">{formData.judul || "Judul Publikasi Belum Diisi"}</h1>
              
              {previewImageUrl && (
                <div className="w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-8 border border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewImageUrl} alt={formData.judul} className="w-full h-full object-cover" />
                </div>
              )}
              
              <div 
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base mb-8 w-full max-w-full break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: formData.deskripsi || "<p className='text-slate-400 italic'>Konten deskripsi belum diisi...</p>" }}
              />

              {(pdfFile || formData.pdf_url) && (
                <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-blue-600">picture_as_pdf</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Dokumen PDF Terlampir</p>
                    <p className="text-xs text-slate-500">{pdfFile ? pdfFile.name : "File PDF tersimpan"}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-5 flex gap-3 justify-end mt-auto z-10">
              <button onClick={() => setShowPreview(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Kembali Edit
              </button>
              <button onClick={handleConfirmSubmit} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2">
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                {isSubmitting ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Konfirmasi & Publikasikan")}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Category Selector Banner */}
      {!isFormOpen && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-600 text-[24px]">category</span>
              Kategori Publikasi Iklim
            </h3>
            <div className="max-w-md relative z-[50]">
              <CustomSelect
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={categoryOptions}
              />
            </div>
          </div>

          <button 
            onClick={handleOpenCreateForm}
            className="px-6 py-3.5 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 self-start md:self-auto hover:scale-105 active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">add_circle</span>
            Buat Publikasi Baru
          </button>
        </div>
      )}

      {/* FULL-PAGE EDITOR VIEW */}
      {isFormOpen ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Action Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={handleCloseForm} 
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-sm"
                title="Kembali ke Daftar"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                    {isEditing ? "Mode Edit" : "Mode Buat Baru"}
                  </span>
                  <span className="text-slate-500 text-xs font-bold">• {currentCategoryLabel}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mt-1">
                  {isEditing ? `Edit: ${formData.judul || "Publikasi Iklim"}` : `Buat Publikasi Baru: ${currentCategoryLabel}`}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <button 
                type="button" 
                onClick={handleCloseForm} 
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={handlePreviewSubmit} 
                className="px-5 py-2.5 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Preview Full
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSubmit} 
                disabled={isSubmitting} 
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                {isSubmitting ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Publikasikan")}
              </button>
            </div>
          </div>

          {/* Form Content in Full Width */}
          <form onSubmit={handlePreviewSubmit} className="space-y-6">
            {/* Card 1: Judul & Informasi */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">title</span>
                  </span>
                  Label: Judul Publikasi & Informasi Penulis
                </div>
                <span className="text-xs font-semibold text-slate-400">Kategori: {currentCategoryLabel}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Judul Publikasi Iklim <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    value={formData.judul} 
                    onChange={e => setFormData({...formData, judul: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300" 
                    type="text" 
                    placeholder={`Ketik judul publikasi untuk ${currentCategoryLabel}...`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Nama Penulis / Tim Pembuat <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      value={formData.author_name} 
                      onChange={e => setFormData({...formData, author_name: e.target.value})} 
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all" 
                      type="text" 
                      placeholder="Cth: Tim Klimatologi BMKG"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Tanggal Publikasi <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      value={formData.published_at} 
                      onChange={e => setFormData({...formData, published_at: e.target.value})} 
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all" 
                      type="date" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Gambar Peta & File PDF */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gambar Peta (Wajib) */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">map</span>
                    </span>
                    Label: Gambar Peta / Foto Utama <span className="text-red-500">*</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {previewImageUrl && (
                    <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewImageUrl} alt="Pratinjau Peta" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                          {imageFile ? "Gambar Baru Terpilih" : "Gambar Tersimpan"}
                        </span>
                      </div>
                    </div>
                  )}

                  <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed ${imageFile ? "border-emerald-400 bg-emerald-50/30" : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400"} rounded-2xl p-5 cursor-pointer transition-all`}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className={`material-symbols-outlined text-3xl mb-1 ${imageFile ? "text-emerald-500" : "text-slate-400"}`}>
                        {imageFile ? "check_circle" : "add_photo_alternate"}
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        {imageFile ? imageFile.name : (isEditing ? "Klik untuk ganti gambar peta" : "Pilih file gambar peta...")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, JPEG hingga 8MB</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange} 
                    />
                  </label>
                </div>
              </div>

              {/* File PDF (Opsional) */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                    <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                    </span>
                    Label: File Dokumen PDF (Opsional)
                  </div>
                </div>

                <div className="space-y-4">
                  {(pdfFile || formData.pdf_url) && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                      <span className="material-symbols-outlined text-3xl text-red-500">picture_as_pdf</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {pdfFile ? pdfFile.name : "Dokumen PDF Tersimpan"}
                        </p>
                        <p className="text-[10px] text-slate-400">PDF akan ditampilkan di halaman detail</p>
                      </div>
                    </div>
                  )}

                  <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed ${pdfFile ? "border-red-400 bg-red-50/30" : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-red-300"} rounded-2xl p-5 cursor-pointer transition-all`}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className={`material-symbols-outlined text-3xl mb-1 ${pdfFile ? "text-red-500" : "text-slate-400"}`}>
                        {pdfFile ? "check_circle" : "upload_file"}
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        {pdfFile ? pdfFile.name : (formData.pdf_url ? "Klik untuk ganti file PDF" : "Pilih file dokumen PDF...")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Format .PDF hingga 15MB</p>
                    </div>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={handlePdfChange} 
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3: Isi Konten dengan RichTextEditor */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  </span>
                  Label: Isi Konten & Deskripsi Analisis (Word-Style Editor)
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Mendukung Bold, Ukuran Font, Italic, Point List, dll
                </span>
              </div>

              <div>
                <RichTextEditor 
                  value={formData.deskripsi || ""} 
                  onChange={(content) => setFormData({...formData, deskripsi: content})}
                  placeholder="Ketik atau susun analisis/deskripsi iklim di sini. Anda bisa mengatur format tebal (Bold), miring (Italic), ukuran font, list nomor/bullet, rata tengah, kutipan, dll seperti Microsoft Word..."
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={handleCloseForm} 
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={handlePreviewSubmit} 
                className="px-6 py-3 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">visibility</span>
                Preview Tampilan
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSubmit} 
                disabled={isSubmitting} 
                className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
                {isSubmitting ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Publikasikan Sekarang")}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder={`Cari di ${currentCategoryLabel}...`} 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="text-xs font-bold text-slate-500">
                Total Publikasi: <span className="text-blue-600 font-extrabold">{items.length} data</span>
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
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value={5}>5 Baris</option>
                  <option value={10}>10 Baris</option>
                  <option value={20}>20 Baris</option>
                  <option value={50}>50 Baris</option>
                </select>
              </div>
            </div>
          </div>

          {/* Item List */}
          <div className="space-y-4">
            {filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => (
              <div 
                id={`item-iklim-${item.id}`} 
                key={item.id} 
                onClick={() => setSelectedDetail(item)} 
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row items-start gap-5 group relative overflow-hidden cursor-pointer"
              >
                {item.image_url && (
                  <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm relative z-10 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt={item.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                
                <div className="flex-1 relative z-10 flex justify-between items-start w-full gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{currentCategoryLabel}</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {item.published_at ? new Date(item.published_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : ""}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-800 text-lg md:text-xl leading-tight group-hover:text-blue-600 transition-colors">{item.judul}</h4>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                        {item.author_name || "Admin"}
                      </span>
                      {item.pdf_url && (
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-[11px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                          PDF Tersedia
                        </span>
                      )}
                      <span className="text-blue-600 flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform ml-auto sm:ml-0">
                        Buka & Edit Detail
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} 
                      className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      title="Edit Publikasi (Full Editor)"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id!, item.image_url, item.pdf_url); }} 
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title="Hapus Publikasi"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Component */}
            {filteredItems.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
              />
            )}

            {isLoading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <span className="material-symbols-outlined text-4xl mb-2 animate-spin text-blue-600">progress_activity</span>
                <p className="text-sm font-bold text-slate-600">Memuat data publikasi...</p>
              </div>
            )}

            {isError && !isLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-red-500 border border-red-200 rounded-3xl bg-red-50/50">
                <span className="material-symbols-outlined text-4xl mb-2">wifi_off</span>
                <p className="text-sm font-bold mb-3">Gagal Terhubung ke Server</p>
                <button onClick={() => load("order=published_at.desc")} className="px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-bold transition flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Coba Lagi
                </button>
              </div>
            )}

            {!isLoading && !isError && filteredItems.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm text-center p-6">
                <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">article</span>
                <p className="text-base font-bold text-slate-700">Belum ada publikasi pada kategori ini.</p>
                <p className="text-xs text-slate-400 mt-1 mb-6">Mulai buat publikasi untuk {currentCategoryLabel}.</p>
                <button 
                  onClick={handleOpenCreateForm}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Buat Publikasi Pertama
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
