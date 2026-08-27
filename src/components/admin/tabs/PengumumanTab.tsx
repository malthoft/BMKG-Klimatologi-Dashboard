import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useAuth } from "@/hooks/useAuth";
import { Pengumuman } from "@/types/admin";
import { supabaseUploadFile, supabaseDeleteFile } from "@/lib/supabase";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { CustomSelect } from "@/components/ui/CustomSelect";

export function PengumumanTab() {
  const confirm = useConfirm();
  const { success, error, info } = useToast();
  const { user } = useAuth();
  const { items: pengumuman, isLoading, isError, load, add, update, remove } = useCrud<Pengumuman>("pengumuman", "pengumuman-files");
  
  const [newPengumuman, setNewPengumuman] = useState({ id: 0, judul: "", deskripsi: "", kategori: "Umum", file_url: "" });
  const [pengumumanFile, setPengumumanFile] = useState<File | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  const [selectedDetail, setSelectedDetail] = useState<Pengumuman | null>(null);

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

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    setIsUploadingFiles(true);
    let finalFileUrl = newPengumuman.file_url;

    if (pengumumanFile) {
      const fileExt = pengumumanFile.name.split('.').pop();
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
      const res = await update(newPengumuman.id, payload);
      if (res) {
        success("Pengumuman berhasil diperbarui!");
        resetForm();
        load("order=created_at.desc");
      } else {
        error("Gagal memperbarui pengumuman");
      }
    } else {
      const res = await add(payload);
      if (res) {
        success("Pengumuman berhasil dipublikasikan!");
        resetForm();
        load("order=created_at.desc");
      } else {
        error("Gagal mempublikasikan pengumuman");
      }
    }
    setIsUploadingFiles(false);
  };

  const resetForm = () => {
    setNewPengumuman({ id: 0, judul: "", deskripsi: "", kategori: "Umum", file_url: "" });
    setPengumumanFile(null);
    setIsEditing(false);
    setShowPreview(false);
    setPreviewFileUrl(null);
  };

  const handleEditClick = (item: Pengumuman) => {
    setNewPengumuman(item as any);
    setPengumumanFile(null);
    setIsEditing(true);
    setShowPreview(false);
    setSelectedDetail(null); // Close modal if open
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (file.size > 10 * 1024 * 1024) {
        error("Ukuran file maksimal 10MB.");
        return;
      }
      setPengumumanFile(file);
    }
  };

  return (
    <>
      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDetail(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {selectedDetail.file_url && (
              <div className="w-full h-64 md:h-80 relative bg-slate-100 flex items-center justify-center">
                {selectedDetail.file_url.toLowerCase().endsWith('.pdf') ? (
                  <div className="flex flex-col items-center justify-center text-red-500">
                    <span className="material-symbols-outlined text-7xl mb-2">picture_as_pdf</span>
                    <span className="text-sm font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-red-100">Dokumen PDF Terlampir</span>
                    <a href={selectedDetail.file_url} target="_blank" rel="noopener noreferrer" className="mt-4 px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-200">Lihat PDF Penuh</a>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={selectedDetail.file_url} alt={selectedDetail.judul} className="w-full h-full object-cover" />
                )}
                <button onClick={() => setSelectedDetail(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}
            
            <div className="p-8">
              {!selectedDetail.file_url && (
                <button onClick={() => setSelectedDetail(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700">{selectedDetail.kategori}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {new Date(selectedDetail.created_at || selectedDetail.published_at || '').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-6 leading-tight">{selectedDetail.judul}</h2>
              
              <div className="prose prose-slate max-w-none mb-8">
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-base">{selectedDetail.deskripsi}</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setSelectedDetail(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Tutup
                </button>
                <button onClick={() => handleEditClick(selectedDetail)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                  Edit Data Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPreview(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">visibility</span>
                Preview Pengumuman
              </h3>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-8 lg:p-12">
              <div className="flex gap-2 items-center mb-6">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">{newPengumuman.kategori}</span>
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              
              <h2 className="text-3xl font-black text-slate-800 mb-8 leading-tight">{newPengumuman.judul}</h2>
              
              {previewFileUrl && (
                <div className="w-full h-64 md:h-96 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mb-8 shadow-sm flex items-center justify-center relative">
                  {(pengumumanFile?.name.toLowerCase().endsWith('.pdf') || (isEditing && newPengumuman.file_url?.toLowerCase().endsWith('.pdf'))) ? (
                    <div className="flex flex-col items-center justify-center text-red-500">
                      <span className="material-symbols-outlined text-7xl mb-2">picture_as_pdf</span>
                      <span className="text-sm font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-red-100">Dokumen PDF Terlampir</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewFileUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{newPengumuman.deskripsi}</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-5 flex gap-3 justify-end mt-auto z-10">
              <button onClick={() => setShowPreview(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Kembali Edit
              </button>
              <button onClick={handleConfirmSubmit} disabled={isUploadingFiles} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                {isUploadingFiles ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                {isUploadingFiles ? "Menyimpan..." : "Konfirmasi Publikasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">{isEditing ? "edit" : "campaign"}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{isEditing ? "Edit Pengumuman" : "Buat Pengumuman"}</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handlePreviewSubmit}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Pengumuman</label>
                      <input required value={newPengumuman.judul} onChange={e => setNewPengumuman({...newPengumuman, judul: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Masukkan judul..."/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                      <CustomSelect
                        required
                        value={newPengumuman.kategori}
                        onChange={(val) => setNewPengumuman({...newPengumuman, kategori: val})}
                        options={[
                          { value: "Umum", label: "Umum" },
                          { value: "Penting", label: "Penting" },
                          { value: "Informasi", label: "Informasi" }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                        <span>File Lampiran (PDF / Gambar)</span>
                        {pengumumanFile && <span className="text-emerald-500 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full"><i className="fas fa-check-circle"></i> Terpilih</span>}
                      </label>
                      {isEditing && newPengumuman.file_url && !pengumumanFile && (
                        <div className="text-[11px] text-blue-600 font-bold mb-2 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          File saat ini ada (unggah baru untuk mengganti)
                        </div>
                      )}
                      <label className={`flex items-center justify-between w-full border ${pengumumanFile ? 'border-indigo-500/50 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-500/30 hover:bg-slate-50'} rounded-xl px-4 py-3 cursor-pointer transition-all group`}>
                        <div className="flex items-center gap-3 truncate">
                          <span className="material-symbols-outlined text-indigo-600/70">upload_file</span>
                          <span className={`text-sm truncate font-medium ${pengumumanFile ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {pengumumanFile ? pengumumanFile.name : "Pilih file..."}
                          </span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="hidden"
                          onChange={handleFileChange} 
                        />
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">Browse</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Isi Konten / Deskripsi</label>
                      <textarea required rows={4} value={newPengumuman.deskripsi} onChange={e => setNewPengumuman({...newPengumuman, deskripsi: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 resize-none" placeholder="Tulis deskripsi..."/>
                    </div>
                    <div className="pt-4 mt-auto flex flex-col gap-2">
                      <button type="submit" disabled={isUploadingFiles} className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                        Preview Publikasi
                      </button>
                      {isEditing && (
                        <button type="button" onClick={resetForm} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                          Batal Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Pengumuman</h3>
                  </div>
                  <div className="space-y-4">
                    {pengumuman.map(item => (
                      <div id={`item-pengumuman-${item.id}`} key={item.id} onClick={() => setSelectedDetail(item)} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-start gap-5 group relative overflow-hidden cursor-pointer">
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-bl-full opacity-5 -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
                        
                        {item.file_url && (
                          <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm relative z-10 bg-slate-100 flex items-center justify-center">
                            {item.file_url.toLowerCase().endsWith('.pdf') ? (
                               <div className="flex flex-col items-center justify-center text-red-500 h-full w-full bg-red-50/50">
                                 <span className="material-symbols-outlined text-4xl mb-1">picture_as_pdf</span>
                                 <span className="text-[10px] font-bold">PDF Doc</span>
                               </div>
                            ) : (
                               /* eslint-disable-next-line @next/next/no-img-element */
                               <img src={item.file_url} alt={item.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            )}
                          </div>
                        )}
                        
                        <div className="flex-1 relative z-10 flex justify-between items-start w-full gap-4">
                          <div className="flex-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">{item.kategori}</span>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight mt-3 group-hover:text-indigo-600 transition-colors">{item.judul}</h4>
                            <p className="text-sm text-slate-600 line-clamp-3 mt-2 leading-relaxed">{item.deskripsi}</p>
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                              {new Date(item.created_at || item.published_at || '').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePengumuman(item.id!, item.file_url || ""); }} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2 animate-spin">progress_activity</span>
                        <p className="text-sm font-medium">Memuat data...</p>
                      </div>
                    )}
                    {isError && !isLoading && (
                      <div className="py-12 flex flex-col items-center justify-center text-red-500 border-2 border-dashed border-red-200 rounded-2xl bg-red-50/50">
                        <span className="material-symbols-outlined text-4xl mb-2">wifi_off</span>
                        <p className="text-sm font-bold mb-3">Gagal Terhubung ke Server</p>
                        <button onClick={() => load("order=created_at.desc")} className="px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-bold transition flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">refresh</span>
                          Coba Lagi
                        </button>
                      </div>
                    )}
                    {!isLoading && !isError && pengumuman.length === 0 && (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">campaign</span>
                        <p className="text-sm font-medium">Belum ada pengumuman.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
    </>
  );
}
