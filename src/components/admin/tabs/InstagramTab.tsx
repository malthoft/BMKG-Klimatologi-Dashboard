import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { toast } from "sonner";
import Image from "next/image";

export function InstagramTab() {
  const { items: instagramPosts, isLoading, load, add, update, remove } = useCrud<any>("instagram_posts");

  const [newInstagram, setNewInstagram] = useState({ image_url: "", post_url: "" });
  const [isEditingIg, setIsEditingIg] = useState(false);
  const [editIgData, setEditIgData] = useState({ id: 0, image_url: "", post_url: "" });

  useEffect(() => {
    load("order=created_at.desc");
  }, [load]);

  const handleAddInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstagram.image_url || !newInstagram.post_url) return;

    try {
      const success = await add({
        image_url: newInstagram.image_url,
        post_url: newInstagram.post_url
      }, "Postingan Instagram berhasil ditambahkan!");
      if (success) {
        setNewInstagram({ image_url: "", post_url: "" });
        load("order=created_at.desc");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan data.");
    }
  };

  const handleEditInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await update(editIgData.id, {
        image_url: editIgData.image_url,
        post_url: editIgData.post_url
      }, "Postingan Instagram berhasil diperbarui!");
      if (success) {
        setIsEditingIg(false);
        setEditIgData({ id: 0, image_url: "", post_url: "" });
        load("order=created_at.desc");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui data.");
    }
  };

  const handleDeleteInstagram = async (id: number) => {
    if (confirm("Yakin ingin menghapus postingan ini?")) {
      const success = await remove(id, undefined, "Postingan Instagram dihapus.");
      if (success) {
        load("order=created_at.desc");
      }
    }
  };

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit sticky top-24">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">photo_library</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Tambah Postingan</h3>
                  </div>
                  <form onSubmit={handleAddInstagram} className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">URL Gambar (Image Link)</label>
                      <input 
                        type="url" 
                        required 
                        placeholder="https://example.com/image.jpg"
                        value={newInstagram.image_url} 
                        onChange={(e) => setNewInstagram({...newInstagram, image_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">URL Postingan Instagram</label>
                      <input 
                        type="url" 
                        required 
                        placeholder="https://www.instagram.com/p/..."
                        value={newInstagram.post_url} 
                        onChange={(e) => setNewInstagram({...newInstagram, post_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 mt-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Simpan Postingan
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Daftar Galeri Instagram</h3>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{instagramPosts.length} post</span>
                  </div>
                  
                  {isLoading ? (
                    <div className="text-center text-slate-400 py-12 flex flex-col items-center border-2 border-dashed border-slate-100 rounded-xl">
                      <span className="material-symbols-outlined text-4xl mb-2 animate-spin">refresh</span>
                      <p className="text-sm font-medium">Memuat...</p>
                    </div>
                  ) : instagramPosts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {instagramPosts.map((post) => (
                        <div key={post.id} className="relative group rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm bg-slate-50 aspect-square">
                          {/* Blurred Background */}
                          <div className="absolute inset-0 w-full h-full overflow-hidden">
                            <Image
                              alt="Background Blur"
                              src={post.image_url}
                              fill
                              className="object-cover opacity-50 blur-xl scale-125 saturate-150"
                              sizes="(max-width: 768px) 50vw, 33vw"
                            />
                          </div>
                          
                          {/* Foreground Image */}
                          <Image src={post.image_url} alt="Instagram Post" className="object-contain relative z-10 transition-transform duration-500 group-hover:scale-105" fill sizes="(max-width: 768px) 50vw, 33vw" />
                          
                          {/* Hover Controls */}
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-20">
                            <a 
                              href={post.post_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-white/95 hover:bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[14px] text-[#dc2743]">photo_camera</span>
                              Buka IG
                            </a>
                            <button 
                              onClick={() => {
                                setEditIgData({ id: post.id, image_url: post.image_url, post_url: post.post_url });
                                setIsEditingIg(true);
                              }}
                              className="bg-slate-800/90 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 transition-transform hover:scale-105 flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteInstagram(post.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-900/20 transition-transform hover:scale-105 flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-12 flex flex-col items-center border-2 border-dashed border-slate-100 rounded-xl">
                      <span className="material-symbols-outlined text-4xl mb-2">photo_library</span>
                      <p className="text-sm font-medium">Belum ada foto galeri.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Edit Modal */}
              {isEditingIg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditingIg(false)}></div>
                  <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative z-10 animate-fade-up">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Postingan Instagram</h3>
                    <form onSubmit={handleEditInstagram} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">URL Gambar (Image Link)</label>
                        <input 
                          type="url" required 
                          value={editIgData.image_url} 
                          onChange={(e) => setEditIgData({...editIgData, image_url: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">URL Postingan Instagram</label>
                        <input 
                          type="url" required 
                          value={editIgData.post_url} 
                          onChange={(e) => setEditIgData({...editIgData, post_url: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                        />
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsEditingIg(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 shadow-md shadow-pink-600/20 transition-colors">Simpan</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
    </>
  );
}
