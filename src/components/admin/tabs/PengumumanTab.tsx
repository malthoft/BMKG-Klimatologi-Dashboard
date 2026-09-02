import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useAuth } from "@/hooks/useAuth";
import { Pengumuman } from "@/types/admin";
import { supabaseUploadFile, supabaseDeleteFile } from "@/lib/supabase";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Pagination } from "@/components/ui/pagination";
import { ModalPortal } from "@/components/ui/ModalPortal";

export function PengumumanTab() {
  const confirm = useConfirm();
  const { success, error } = useToast();
  const { user } = useAuth();
  const { items: pengumuman, isLoading, isError, load, add, update, remove } = useCrud<Pengumuman>("pengumuman", "pengumuman-files");
  
  const [newPengumuman, setNewPengumuman] = useState({ id: 0, judul: "", deskripsi: "", kategori: "Umum", file_url: "" });
  const [pengumumanFile, setPengumumanFile] = useState<File | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Pengumuman | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    load("order=created_at.desc");
  }, [load]);

  // Handle image/pdf preview generation
  useEffect(() => {
    if (pengumumanFile) {
      const url = URL.createObjectURL(pengumumanFile);
      setPreviewFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewFileUrl(isEditing ? newPengumuman.file_url : null);
    }
  }, [pengumumanFile, isEditing, newPengumuman.file_url]);

  // Handle ESC key to close modals
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

  const handleOpenCreateForm = () => {
    setNewPengumuman({
      id: 0,
      judul: "",
      deskripsi: "",
      kategori: "Umum",
      file_url: ""
    });
    setPengumumanFile(null);
    setIsEditing(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditClick = (item: Pengumuman) => {
    setNewPengumuman({
      id: item.id || 0,
      judul: item.judul || "",
      deskripsi: item.deskripsi || "",
      kategori: item.kategori || "Umum",
      file_url: item.file_url || ""
    });
    setPengumumanFile(null);
    setIsEditing(true);
    setIsFormOpen(true);
    setSelectedDetail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setShowPreview(false);
    setPengumumanFile(null);
  };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPengumuman.judul.trim()) {
      error("Judul pengumuman tidak boleh kosong.");
      return;
    }
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    if (!newPengumuman.judul.trim()) {
      error("Judul pengumuman tidak boleh kosong.");
      return;
    }

    setIsUploadingFiles(true);
    let finalFileUrl = newPengumuman.file_url;

    if (pengumumanFile) {
      const fileExt = pengumumanFile.name.split(".").pop();
      const fileName = `pengumuman-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = await supabaseUploadFile("pengumuman-files", fileName, pengumumanFile);
      if (filePath) {
        finalFileUrl = filePath;
      }
    }

    const payload = {
      judul: newPengumuman.judul,
      deskripsi: newPengumuman.deskripsi,
      kategori: newPengumuman.kategori,
      file_url: finalFileUrl,
      published_at: new Date().toISOString()
    };

    if (isEditing) {
      const res = await update(newPengumuman.id, payload, "Pengumuman berhasil diperbarui!");
      if (res) {
        handleCloseForm();
        load("order=created_at.desc");
      }
    } else {
      const res = await add(payload, "Pengumuman berhasil dipublikasikan!");
      if (res) {
        handleCloseForm();
        load("order=created_at.desc");
      }
    }
    setIsUploadingFiles(false);
  };

  const handleDeletePengumuman = async (id: number, fileUrl: string) => {
    if (await confirm("Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.", "Hapus Pengumuman")) {
      const res = await remove(id);
      if (res) {
        if (fileUrl) {
          await supabaseDeleteFile("pengumuman-files", fileUrl);
        }
        success("Pengumuman berhasil dihapus!");
        load("order=created_at.desc");
      } else {
        error("Gagal menghapus pengumuman");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "webp"];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isAllowedType = file.type.startsWith("image/") || file.type === "application/pdf";

      if (!allowedExtensions.includes(ext) || !isAllowedType) {
        error("Format file tidak didukung! Hanya gambar (.jpg, .png, .webp) atau dokumen (.pdf) yang diperbolehkan.");
        e.target.value = "";
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        error("Ukuran file maksimal 10MB.");
        e.target.value = "";
        return;
      }
      setPengumumanFile(file);
    }
  };

  const filteredItems = pengumuman.filter((item) => {
    const matchesSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.deskripsi && item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesKategori = selectedKategoriFilter === "Semua" || item.kategori === selectedKategoriFilter;
    return matchesSearch && matchesKategori;
  });

  const isPdfFile = (url?: string | null) => {
    if (!url) return false;
    return url.toLowerCase().includes(".pdf") || (pengumumanFile && pengumumanFile.name.toLowerCase().endsWith(".pdf"));
  };

  return (
    <>
      {/* Detail Modal */}
      {selectedDetail && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDetail(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {selectedDetail.file_url && (
              <div className="w-full relative bg-slate-100 flex items-center justify-center border-b border-slate-100">
                {selectedDetail.file_url.toLowerCase().includes(".pdf") ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-6xl text-red-500 mb-2">picture_as_pdf</span>
                    <span className="text-sm font-bold text-slate-700 mb-3">Dokumen PDF Terlampir</span>
                    <a 
                      href={selectedDetail.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Buka Dokumen PDF
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-72 md:h-96 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedDetail.file_url} alt={selectedDetail.judul} className="w-full h-full object-cover" />
                  </div>
                )}
                <button onClick={() => setSelectedDetail(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}
            
            <div className="p-8 md:p-10">
              {!selectedDetail.file_url && (
                <button onClick={() => setSelectedDetail(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700">{selectedDetail.kategori}</span>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                  {new Date(selectedDetail.created_at || selectedDetail.published_at || "").toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-6 leading-tight break-words">{selectedDetail.judul}</h2>
              
              <div 
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed mb-8 w-full max-w-full break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedDetail.deskripsi }}
              />
              
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setSelectedDetail(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Tutup
                </button>
                <button onClick={() => handleEditClick(selectedDetail)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                  Edit Pengumuman Ini (Full Editor)
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
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">Pratinjau Halaman Publik</span>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mt-1">
                  Preview Pengumuman
                </h3>
              </div>
              <button onClick={() => setShowPreview(false)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-8 lg:p-12 overflow-hidden break-words max-w-full">
              <div className="flex flex-wrap gap-2 items-center mb-6">
                <span className="text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-700">{newPengumuman.kategori}</span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                  {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight break-words">{newPengumuman.judul || "Judul Pengumuman Belum Diisi"}</h1>
              
              {previewFileUrl && (
                <div className="w-full rounded-2xl overflow-hidden mb-8 border border-slate-200 shadow-sm bg-slate-50 flex items-center justify-center">
                  {isPdfFile(previewFileUrl) ? (
                    <div className="p-10 text-center flex flex-col items-center">
                      <span className="material-symbols-outlined text-6xl text-red-500 mb-2">picture_as_pdf</span>
                      <span className="text-base font-bold text-slate-800">Lampiran File PDF Terpilih</span>
                      <p className="text-xs text-slate-500 mt-1">File PDF akan ditampilkan secara interaktif pada halaman publik.</p>
                    </div>
                  ) : (
                    <div className="w-full h-72 md:h-96">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewFileUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
              
              <div 
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base w-full max-w-full break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: newPengumuman.deskripsi || "<p className='text-slate-400 italic'>Konten belum diisi...</p>" }}
              />
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-5 flex gap-3 justify-end mt-auto z-10">
              <button onClick={() => setShowPreview(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Kembali Edit
              </button>
              <button onClick={handleConfirmSubmit} disabled={isUploadingFiles} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                {isUploadingFiles ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                {isUploadingFiles ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Konfirmasi & Publikasikan")}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
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
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                    {isEditing ? "Mode Edit" : "Mode Buat Baru"}
                  </span>
                  <span className="text-slate-400 text-xs">• Full-Page Word Editor</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mt-1">
                  {isEditing ? `Edit: ${newPengumuman.judul || "Pengumuman"}` : "Buat Publikasi Pengumuman Baru"}
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
                className="px-5 py-2.5 rounded-xl font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Preview Full
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSubmit} 
                disabled={isUploadingFiles} 
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isUploadingFiles ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                {isUploadingFiles ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Publikasikan")}
              </button>
            </div>
          </div>

          {/* Form Content in Full Width */}
          <form onSubmit={handlePreviewSubmit} className="space-y-6">
            {/* Card 1: Judul & Kategori */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">title</span>
                  </span>
                  Label: Judul & Kategori Pengumuman
                </div>
                <span className="text-xs font-semibold text-slate-400">Wajib Diisi</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Judul Pengumuman <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    value={newPengumuman.judul} 
                    onChange={e => setNewPengumuman({...newPengumuman, judul: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300" 
                    type="text" 
                    placeholder="Ketik judul pengumuman resmi..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Kategori Pengumuman <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    required
                    value={newPengumuman.kategori}
                    onChange={(val) => setNewPengumuman({...newPengumuman, kategori: val})}
                    options={[
                      { value: "Umum", label: "Pengumuman Umum" },
                      { value: "Layanan", label: "Layanan & Operasional" },
                      { value: "Penting", label: "Pemberitahuan Penting" },
                      { value: "Kegiatan", label: "Undangan / Kegiatan" }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Lampiran PDF / Foto */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                  <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">attachment</span>
                  </span>
                  Label: Lampiran Dokumen PDF atau Foto Gambar
                </div>
                <span className="text-xs font-semibold text-slate-400">PDF, JPG, PNG hingga 10MB</span>
              </div>

              <div className="space-y-4">
                {previewFileUrl && (
                  <div className="relative w-full max-w-xl rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 p-4">
                    {isPdfFile(previewFileUrl) ? (
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-red-500">picture_as_pdf</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {pengumumanFile ? pengumumanFile.name : "Dokumen PDF Terlampir"}
                          </p>
                          <p className="text-xs text-slate-400">File PDF tersimpan untuk pengumuman ini</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-56 w-full rounded-xl overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewFileUrl} alt="Pratinjau" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed ${pengumumanFile ? "border-teal-400 bg-teal-50/30" : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-400"} rounded-2xl p-6 cursor-pointer transition-all`}>
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className={`material-symbols-outlined text-4xl mb-2 ${pengumumanFile ? "text-teal-500" : "text-slate-400"}`}>
                      {pengumumanFile ? "check_circle" : "cloud_upload"}
                    </span>
                    <p className="text-sm font-bold text-slate-700">
                      {pengumumanFile ? pengumumanFile.name : "Klik atau seret file PDF / Gambar ke sini"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Format .PDF, .JPG, .PNG, .WEBP (Maksimal 10MB)</p>
                  </div>
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
            </div>

            {/* Card 3: Isi Konten dengan RichTextEditor */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  </span>
                  Label: Isi Konten & Penjelasan Pengumuman (Word-Style Editor)
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Mendukung Bold, Ukuran Font, Italic, Point List, dll
                </span>
              </div>

              <div>
                <RichTextEditor 
                  value={newPengumuman.deskripsi} 
                  onChange={(content) => setNewPengumuman({...newPengumuman, deskripsi: content})}
                  placeholder="Ketik atau susun isi pengumuman di sini. Anda bisa mengatur format tebal (Bold), miring (Italic), ukuran font, list nomor/bullet, rata tengah, kutipan, dll seperti Microsoft Word..."
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
                className="px-6 py-3 rounded-xl font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">visibility</span>
                Preview Tampilan
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSubmit} 
                disabled={isUploadingFiles} 
                className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isUploadingFiles ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
                {isUploadingFiles ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Publikasikan Sekarang")}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Banner with Action Button */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[28px]">campaign</span>
                Manajemen Pengumuman
              </h2>
              <p className="text-sm text-slate-500 mt-1">Publikasikan pengumuman resmi, surat edaran, dan informasi operasional BMKG.</p>
            </div>

            <button 
              onClick={handleOpenCreateForm}
              className="px-6 py-3 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 self-start md:self-auto hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]">add_circle</span>
              Buat Pengumuman Baru
            </button>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Cari pengumuman berdasarkan judul..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-2">
                {["Semua", "Umum", "Layanan", "Penting", "Kegiatan"].map((kategori) => (
                  <button
                    key={kategori}
                    onClick={() => { setSelectedKategoriFilter(kategori); setCurrentPage(1); }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedKategoriFilter === kategori ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {kategori}
                  </button>
                ))}
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
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-100 transition-colors"
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
                id={`item-pengumuman-${item.id}`} 
                key={item.id} 
                onClick={() => setSelectedDetail(item)} 
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row items-start gap-5 group relative overflow-hidden cursor-pointer"
              >
                {item.file_url && (
                  <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm relative z-10 bg-slate-50 flex items-center justify-center">
                    {item.file_url.toLowerCase().includes(".pdf") ? (
                      <div className="flex flex-col items-center justify-center text-red-500">
                        <span className="material-symbols-outlined text-4xl mb-1">picture_as_pdf</span>
                        <span className="text-[10px] font-bold bg-white px-2.5 py-0.5 rounded-md shadow-sm border border-red-100">Dokumen PDF</span>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.file_url} alt={item.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                )}
                
                <div className="flex-1 relative z-10 flex justify-between items-start w-full gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">{item.kategori}</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(item.created_at || item.published_at || "").toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-800 text-lg md:text-xl leading-tight group-hover:text-indigo-600 transition-colors">{item.judul}</h4>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs font-bold text-slate-500">
                      <span className="text-indigo-600 flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
                        Buka & Edit Detail
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} 
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      title="Edit Pengumuman (Full Editor)"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePengumuman(item.id!, item.file_url || ""); }} 
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title="Hapus Pengumuman"
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
                <span className="material-symbols-outlined text-4xl mb-2 animate-spin text-indigo-600">progress_activity</span>
                <p className="text-sm font-bold text-slate-600">Memuat data pengumuman...</p>
              </div>
            )}

            {isError && !isLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-red-500 border border-red-200 rounded-3xl bg-red-50/50">
                <span className="material-symbols-outlined text-4xl mb-2">wifi_off</span>
                <p className="text-sm font-bold mb-3">Gagal Terhubung ke Server</p>
                <button onClick={() => load("order=created_at.desc")} className="px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-bold transition flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Coba Lagi
                </button>
              </div>
            )}

            {!isLoading && !isError && filteredItems.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm text-center p-6">
                <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">campaign</span>
                <p className="text-base font-bold text-slate-700">Belum ada pengumuman yang sesuai.</p>
                <p className="text-xs text-slate-400 mt-1 mb-6">Mulai buat pengumuman baru dengan editor lengkap.</p>
                <button 
                  onClick={handleOpenCreateForm}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Buat Pengumuman Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
