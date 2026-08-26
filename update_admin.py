import os
import re

file_path = r'c:\xampp\htdocs\bmkg-clone\src\app\admin\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add pengumuman state and loading state
content = re.sub(
    r'const \[beritaKegiatan, setBeritaKegiatan\] = useState<any\[\]>\(\[\]\);',
    r'const [beritaKegiatan, setBeritaKegiatan] = useState<any[]>([]);\n  const [pengumuman, setPengumuman] = useState<any[]>([]);',
    content
)

# 2. Add new variables for forms
content = re.sub(
    r'const \[newBerita, setNewBerita\] = useState\(\{ title: "", content: "", author: "Admin", category: "", publish_date: "", file_url: "", file_type: "image" \}\);',
    r'const [newBerita, setNewBerita] = useState({ judul: "", deskripsi: "", kategori: "Berita", penulis: "Admin", file_url: "" });\n  const [newPengumuman, setNewPengumuman] = useState({ judul: "", deskripsi: "", kategori: "Pengumuman", penulis: "Admin", file_url: "" });\n  const [isUploadingFiles, setIsUploadingFiles] = useState(false);',
    content
)

# 3. Add load functions
load_functions = """
  const loadBeritaKegiatan = async () => {
    const res = await supabaseFetch("berita_kegiatan", "order=published_at.desc");
    setBeritaKegiatan(res || []);
  };

  const loadPengumuman = async () => {
    const res = await supabaseFetch("pengumuman", "order=published_at.desc");
    setPengumuman(res || []);
  };
"""
content = re.sub(
    r'const loadAnnouncements = async \(\) => \{[^}]+\};',
    load_functions.strip(),
    content
)

# 4. Remove old newAnnouncement state
content = re.sub(r'const \[newAnnouncement, setNewAnnouncement\] = useState\([^)]+\);\n', '', content)

# 5. Replace handleAddAnnouncement and handleDeleteAnnouncement with new handlers
handlers = """
  const handleAddBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingFiles(true);
    let imageUrl = null;
    
    if (beritaFile) {
      const fileExt = beritaFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      imageUrl = await supabaseUploadFile("berita-kegiatan-files", fileName, beritaFile);
      if (!imageUrl) {
        toast.error("Gagal mengupload gambar.");
        setIsUploadingFiles(false);
        return;
      }
    }
    
    const result = await supabaseInsert("berita_kegiatan", {
      judul: newBerita.judul,
      deskripsi: newBerita.deskripsi,
      kategori: newBerita.kategori,
      penulis: newBerita.penulis,
      file_url: imageUrl,
      published_at: new Date().toISOString()
    });
    
    if (result) {
      toast.success("Berita berhasil dipublikasikan!");
      setNewBerita({ judul: "", deskripsi: "", kategori: "Berita", penulis: "Admin", file_url: "" });
      setBeritaFile(null);
      loadBeritaKegiatan();
    } else {
      toast.error("Gagal mempublikasikan berita.");
    }
    setIsUploadingFiles(false);
  };

  const handleDeleteBerita = (id: number, file_url: string) => {
    openConfirm("Hapus Berita", "Yakin ingin menghapus berita ini?", async () => {
      closeConfirm();
      await supabaseDelete("berita_kegiatan", `id=eq.${id}`);
      if (file_url) {
        await supabaseDeleteFile("berita-kegiatan-files", file_url);
      }
      loadBeritaKegiatan();
      toast.success("Berita berhasil dihapus.");
    });
  };

  const handleAddPengumuman = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingFiles(true);
    let fileUrl = null;
    
    if (beritaFile) {
      const fileExt = beritaFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      fileUrl = await supabaseUploadFile("pengumuman-files", fileName, beritaFile);
      if (!fileUrl) {
        toast.error("Gagal mengupload file pengumuman.");
        setIsUploadingFiles(false);
        return;
      }
    }
    
    const result = await supabaseInsert("pengumuman", {
      judul: newPengumuman.judul,
      deskripsi: newPengumuman.deskripsi,
      kategori: newPengumuman.kategori,
      penulis: newPengumuman.penulis,
      file_url: fileUrl,
      published_at: new Date().toISOString()
    });
    
    if (result) {
      toast.success("Pengumuman berhasil dipublikasikan!");
      setNewPengumuman({ judul: "", deskripsi: "", kategori: "Pengumuman", penulis: "Admin", file_url: "" });
      setBeritaFile(null);
      loadPengumuman();
    } else {
      toast.error("Gagal mempublikasikan pengumuman.");
    }
    setIsUploadingFiles(false);
  };

  const handleDeletePengumuman = (id: number, file_url: string) => {
    openConfirm("Hapus Pengumuman", "Yakin ingin menghapus pengumuman ini?", async () => {
      closeConfirm();
      await supabaseDelete("pengumuman", `id=eq.${id}`);
      if (file_url) {
        await supabaseDeleteFile("pengumuman-files", file_url);
      }
      loadPengumuman();
      toast.success("Pengumuman berhasil dihapus.");
    });
  };
"""

content = re.sub(
    r'const handleAddAnnouncement = async \(e: React\.FormEvent\) => \{[\s\S]*?const handleDeleteAnnouncement = \(id: number\) => \{[\s\S]*?\}\);[\s\S]*?\};',
    handlers.strip(),
    content
)

# 6. Call loadPengumuman inside useEffect
content = re.sub(
    r'loadBeritaKegiatan\(\);',
    r'loadBeritaKegiatan();\n    loadPengumuman();',
    content
)

# 7. Add pengumuman tab and replace announcements tab UI
ui_replacement = """
            {activeTab === 'berita' && (
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
                      <div key={item.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
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
            )}

            {activeTab === 'pengumuman' && (
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
                      <input type="file" accept="image/*,.pdf" onChange={e => setBeritaFile(e.target.files?.[0] || null)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"/>
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
                      <div key={item.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
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
            )}
"""

content = re.sub(
    r'\{activeTab === \'announcements\' && \([\s\S]*?\n\s*\}\)',
    ui_replacement.strip(),
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil memperbarui src/app/admin/page.tsx")
