import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { Survey } from "@/types/admin";
import { supabaseUploadFile } from "@/lib/supabase";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Pagination } from "@/components/ui/pagination";

export function SurveiTab() {
  const confirm = useConfirm();
  const { success, error } = useToast();
  
  // Custom wrapper for useCrud since Survey uses string/uuid for id.
  const { items: surveys, isLoading, isError, load, add, update, remove } = useCrud<Survey & { id?: any }>("surveys", "public_assets");
  
  const currentYear = new Date().getFullYear();
  const [newSurvey, setNewSurvey] = useState<Survey>({
    survey_type: "hskm",
    title: "",
    year: currentYear,
    content: "",
    file_url: "",
    file_type: undefined,
  });
  
  const [surveyFile, setSurveyFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    load("order=year.desc,created_at.desc");
  }, [load]);

  const handleOpenCreateForm = () => {
    setNewSurvey({
      survey_type: "hskm",
      title: "",
      year: currentYear,
      content: "",
      file_url: "",
      file_type: undefined,
    });
    setSurveyFile(null);
    setIsEditing(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditClick = (item: Survey) => {
    setNewSurvey({ ...item });
    setSurveyFile(null);
    setIsEditing(true);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setSurveyFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurvey.title.trim()) {
      error("Judul survei wajib diisi.");
      return;
    }
    
    setIsUploading(true);
    try {
      let finalFileUrl = newSurvey.file_url;
      let finalFileType = newSurvey.file_type;
      
      if (surveyFile) {
        const timestamp = Date.now();
        const cleanName = surveyFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `surveys/${timestamp}_${cleanName}`;
        finalFileUrl = await supabaseUploadFile("public_assets", path, surveyFile);
        
        if (!finalFileUrl) throw new Error("Gagal mengunggah file");
        
        finalFileType = surveyFile.type.includes("pdf") ? "pdf" : "image";
      }

      const payload = {
        ...newSurvey,
        file_url: finalFileUrl,
        file_type: finalFileType,
      };

      if (isEditing && newSurvey.id) {
        await update(newSurvey.id, payload);
        success("Survei berhasil diperbarui!");
      } else {
        await add(payload);
        success("Survei baru berhasil ditambahkan!");
      }
      handleCloseForm();
    } catch (err: any) {
      error(err.message || "Terjadi kesalahan saat menyimpan survei.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm(
      "Apakah Anda yakin ingin menghapus survei ini? Data tidak dapat dipulihkan.",
      "Hapus Survei"
    );
    if (isConfirmed) {
      try {
        await remove(id);
        success("Survei berhasil dihapus.");
      } catch (err: any) {
        error(err.message || "Gagal menghapus survei.");
      }
    }
  };

  const filteredSurveys = surveys.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.year.toString().includes(searchQuery);
    const matchType = selectedTypeFilter === "Semua" || 
                     (selectedTypeFilter === "HSKM" && s.survey_type === "hskm") ||
                     (selectedTypeFilter === "HSPAK" && s.survey_type === "hspak");
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSurveys = filteredSurveys.slice(startIndex, startIndex + itemsPerPage);

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50/50 rounded-2xl border border-red-100">
        <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
        <p className="text-red-800 font-medium">Gagal memuat data Survei.</p>
        <button onClick={() => load("order=year.desc,created_at.desc")} className="mt-4 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-colors">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Kelola Survei Publik</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data Hasil Survei Kepuasan Masyarakat (HSKM) dan Persepsi Anti Korupsi (HSPAK).</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Survei
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-slide-down">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 text-blue-600">
                <span className="material-symbols-outlined">{isEditing ? 'edit' : 'post_add'}</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">{isEditing ? "Edit Survei" : "Tambah Survei Baru"}</h3>
                <p className="text-xs text-slate-500 font-medium">Isi form di bawah ini dengan lengkap.</p>
              </div>
            </div>
            <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-2 rounded-lg transition-colors border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Jenis Survei <span className="text-red-500">*</span></label>
                  <CustomSelect
                    options={[
                      { value: "hskm", label: "HSKM (Hasil Survei Kepuasan Masyarakat)" },
                      { value: "hspak", label: "HSPAK (Hasil Survei Persepsi Anti Korupsi)" }
                    ]}
                    value={newSurvey.survey_type}
                    onChange={(val) => setNewSurvey({ ...newSurvey, survey_type: val as "hskm" | "hspak" })}
                    placeholder="Pilih jenis survei"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Tahun <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={newSurvey.year}
                    onChange={(e) => setNewSurvey({ ...newSurvey, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                    placeholder="Contoh: 2024"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Judul Survei <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newSurvey.title}
                    onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                    placeholder="Contoh: Laporan HSKM Triwulan I"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700">File Pendukung (Opsional)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center h-[calc(100%-24px)] transition-colors hover:bg-slate-100/50 hover:border-slate-300">
                  <input
                    type="file"
                    id="survey-file"
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSurveyFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="survey-file" className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-200 text-blue-500">
                      <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700 mb-1">Upload PDF atau Gambar</span>
                    <span className="text-xs text-slate-500 max-w-[200px] leading-relaxed line-clamp-2">
                      {surveyFile ? surveyFile.name : (newSurvey.file_url ? "File sudah ada, klik untuk mengganti" : "Klik untuk memilih file")}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 mb-8">
              <label className="text-[13px] font-bold text-slate-700">Konten Detail (Opsional)</label>
              <div className="prose-container bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <RichTextEditor
                  value={newSurvey.content || ""}
                  onChange={(val) => setNewSurvey({ ...newSurvey, content: val })}
                  placeholder="Ketik detail survei di sini..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-colors"
                disabled={isUploading}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Menyimpan...</>
                ) : (
                  <><span className="material-symbols-outlined text-[20px]">save</span>Simpan Survei</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Cari judul atau tahun..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-40">
                <CustomSelect
                  options={[
                    { value: "Semua", label: "Semua Jenis" },
                    { value: "HSKM", label: "HSKM" },
                    { value: "HSPAK", label: "HSPAK" },
                  ]}
                  value={selectedTypeFilter}
                  onChange={(v) => {
                    setSelectedTypeFilter(v);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter Jenis"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <span className="material-symbols-outlined animate-spin text-4xl mb-3 text-blue-500">progress_activity</span>
                <p className="font-medium animate-pulse">Memuat data survei...</p>
              </div>
            ) : filteredSurveys.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-3xl">inbox</span>
                </div>
                <p className="font-medium text-slate-600">Tidak ada survei ditemukan</p>
                <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian atau tambah data baru.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="py-4 px-5 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[100px]">Tahun</th>
                    <th className="py-4 px-5 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[120px]">Jenis</th>
                    <th className="py-4 px-5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Judul Survei</th>
                    <th className="py-4 px-5 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[120px] text-center">Lampiran</th>
                    <th className="py-4 px-5 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[100px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSurveys.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                          {item.year}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          item.survey_type === 'hskm' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {item.survey_type}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{item.title}</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {item.file_url ? (
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title={`Lihat ${item.file_type || 'file'}`}>
                            <span className="material-symbols-outlined text-[18px]">
                              {item.file_type === 'pdf' ? 'picture_as_pdf' : 'image'}
                            </span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id!)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {!isLoading && filteredSurveys.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
