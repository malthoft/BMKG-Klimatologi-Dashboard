import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useAuth } from "@/hooks/useAuth";
import { Pengumuman } from "@/types/admin";
import { supabaseUploadFile, supabaseDeleteFile } from "@/lib/supabase";

export function PengumumanTab() {
  const { user } = useAuth();
  const { items: pengumuman, isLoading, load, add, remove } = useCrud<Pengumuman>("pengumuman", "pengumuman-files");
  
  const [newPengumuman, setNewPengumuman] = useState({ judul: "", deskripsi: "", kategori: "Umum", file_url: "" });
  const [pengumumanFile, setPengumumanFile] = useState<File | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  useEffect(() => {
    load("order=created_at.desc");
  }, [load]);

  const handleAddPengumuman = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingFiles(true);
    let finalFileUrl = "";

    if (pengumumanFile) {
      const fileExt = pengumumanFile.name.split('.').pop();
      const fileName = `pengumuman-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = await supabaseUploadFile("pengumuman-files", fileName, pengumumanFile);
      if (filePath) {
        finalFileUrl = filePath;
      }
    }

    const success = await add({
      judul: newPengumuman.judul,
      deskripsi: newPengumuman.deskripsi,
      kategori: newPengumuman.kategori,
      file_url: finalFileUrl
    }, "Pengumuman berhasil ditambahkan");

    if (success) {
      setNewPengumuman({ judul: "", deskripsi: "", kategori: "Umum", file_url: "" });
      setPengumumanFile(null);
      load();
    }
    setIsUploadingFiles(false);
  };

  const handleDeletePengumuman = (id: number, file_url?: string) => {
    if (confirm("Yakin ingin menghapus pengumuman ini?")) {
      remove(id, file_url, "Pengumuman berhasil dihapus");
    }
  };


  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">campaign</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Buat Pengumuman</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddPengumuman}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Pengumuman</label>
                      <input required value={newPengumuman.judul} onChange={e => setNewPengumuman({...newPengumuman, judul: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Masukkan judul..."/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                      <input required value={newPengumuman.kategori} onChange={e => setNewPengumuman({...newPengumuman, kategori: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Pengumuman / Informasi..."/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">File Lampiran (PDF / Gambar)</label>
                      <input type="file" accept="image/*,.pdf" onChange={e => setPengumumanFile(e.target.files?.[0] || null)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Isi Konten / Deskripsi</label>
                      <textarea required rows={4} value={newPengumuman.deskripsi} onChange={e => setNewPengumuman({...newPengumuman, deskripsi: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 resize-none" placeholder="Tulis deskripsi..."/>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" disabled={isUploadingFiles} className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">{isUploadingFiles ? 'progress_activity' : 'send'}</span>
                        {isUploadingFiles ? 'Menyimpan...' : 'Publikasikan'}
                      </button>
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
                      <div id={`item-pengumuman-${item.id}`} key={item.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
                        <div className="flex-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">{item.kategori}</span>
                          <h4 className="font-bold text-slate-800 text-lg leading-tight mt-2">{item.judul}</h4>
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed">{item.deskripsi}</p>
                        </div>
                        <button onClick={() => handleDeletePengumuman(item.id, item.file_url)} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    {pengumuman.length === 0 && (
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
