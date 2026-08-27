import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useAuth } from "@/hooks/useAuth";
import { BeritaKegiatan } from "@/types/admin";
import { supabaseUploadFile, supabaseDeleteFile } from "@/lib/supabase";

export function BeritaTab() {
  const { user } = useAuth();
  const { items: beritaKegiatan, isLoading, load, add, remove } = useCrud<BeritaKegiatan>("berita_kegiatan", "berita-kegiatan-files");
  
  const [newBerita, setNewBerita] = useState({ judul: "", deskripsi: "", kategori: "Berita", penulis: "Admin", file_url: "" });
  const [beritaFile, setBeritaFile] = useState<File | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  useEffect(() => {
    load("order=published_at.desc");
  }, [load]);

  const handleAddBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingFiles(true);
    let finalFileUrl = "";

    if (beritaFile) {
      const fileExt = beritaFile.name.split('.').pop();
      const fileName = `berita-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = await supabaseUploadFile("berita-kegiatan-files", fileName, beritaFile);
      if (filePath) {
        finalFileUrl = filePath;
      }
    }

    const success = await add({
      judul: newBerita.judul,
      deskripsi: newBerita.deskripsi,
      kategori: newBerita.kategori,
      penulis: newBerita.penulis || user?.display_name || "Admin",
      file_url: finalFileUrl,
      published_at: new Date().toISOString()
    }, "Berita berhasil ditambahkan");

    if (success) {
      setNewBerita({ judul: "", deskripsi: "", kategori: "Berita", penulis: "Admin", file_url: "" });
      setBeritaFile(null);
      load();
    }
    setIsUploadingFiles(false);
  };

  const handleDeleteBerita = (id: number, file_url?: string) => {
    if (confirm("Yakin ingin menghapus berita ini?")) {
      remove(id, file_url, "Berita berhasil dihapus");
    }
  };


  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">newspaper</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Buat Berita/Kegiatan</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddBerita}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul</label>
                      <input required value={newBerita.judul} onChange={e => setNewBerita({...newBerita, judul: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Masukkan judul..."/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                      <input required value={newBerita.kategori} onChange={e => setNewBerita({...newBerita, kategori: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Berita / Kegiatan..."/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gambar (Hanya Image)</label>
                      <input type="file" accept="image/*" onChange={e => setBeritaFile(e.target.files?.[0] || null)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Isi Konten</label>
                      <textarea required rows={4} value={newBerita.deskripsi} onChange={e => setNewBerita({...newBerita, deskripsi: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 resize-none" placeholder="Tulis deskripsi..."/>
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
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Berita & Kegiatan</h3>
                  </div>
                  <div className="space-y-4">
                    {beritaKegiatan.map(item => (
                      <div id={`item-berita-${item.id}`} key={item.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
                        <div className="flex-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">{item.kategori}</span>
                          <h4 className="font-bold text-slate-800 text-lg leading-tight mt-2">{item.judul}</h4>
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed">{item.deskripsi}</p>
                        </div>
                        <button onClick={() => handleDeleteBerita(item.id, item.file_url)} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    {beritaKegiatan.length === 0 && (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">newspaper</span>
                        <p className="text-sm font-medium">Belum ada berita & kegiatan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
    </>
  );
}
