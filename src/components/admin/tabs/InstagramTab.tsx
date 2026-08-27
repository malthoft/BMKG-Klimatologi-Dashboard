import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useToast } from "@/components/ui/toast-provider";
import Image from "next/image";
import { useConfirm } from "@/components/ui/confirm-provider";
import { InstagramIcon } from "@/components/ui/instagram-icon"; // Assuming this exists from previous fixes

export function InstagramTab() {
  const confirm = useConfirm();
  const { items: instagramPosts, isLoading, isError, load, add, update, remove } = useCrud<any>("instagram_posts");
  const { error, success } = useToast();

  const [newInstagram, setNewInstagram] = useState({ image_url: "", post_url: "" });
  const [isEditingIg, setIsEditingIg] = useState(false);
  const [editIgData, setEditIgData] = useState({ id: 0, image_url: "", post_url: "" });
  
  // Bulk selection mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    load("order=created_at.desc");
  }, [load]);

  const handleAddInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstagram.image_url || !newInstagram.post_url) return;

    const successAdd = await add({
      image_url: newInstagram.image_url,
      post_url: newInstagram.post_url
    }, "Postingan Instagram berhasil ditambahkan!");
    if (successAdd) {
      setNewInstagram({ image_url: "", post_url: "" });
      load("order=created_at.desc");
    }
  };

  const handleEditInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    const successUpdate = await update(editIgData.id, {
      image_url: editIgData.image_url,
      post_url: editIgData.post_url
    }, "Postingan Instagram berhasil diperbarui!");
    if (successUpdate) {
      setIsEditingIg(false);
      setEditIgData({ id: 0, image_url: "", post_url: "" });
      load("order=created_at.desc");
    }
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (await confirm(`Yakin ingin menghapus ${selectedIds.length} postingan yang dipilih?`)) {
      let successCount = 0;
      for (const id of selectedIds) {
        const deleted = await remove(id, undefined, "");
        if (deleted) successCount++;
      }
      if (successCount > 0) {
        success(`${successCount} postingan berhasil dihapus.`);
        setSelectedIds([]);
        setIsSelectMode(false);
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
              <InstagramIcon className="w-5 h-5" />
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
            {newInstagram.image_url && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 relative aspect-square w-full max-w-[150px] mx-auto bg-slate-100">
                 <Image src={newInstagram.image_url} alt="Preview" fill className="object-cover" />
              </div>
            )}
            <button 
              type="submit" 
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Simpan Postingan
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-800">Daftar Galeri Instagram</h3>
              <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{instagramPosts.length} post</span>
            </div>
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIds([]);
              }}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 border ${
                isSelectMode ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{isSelectMode ? "close" : "checklist"}</span>
              {isSelectMode ? "Batal Mode Pilih" : "Pilih Multiple"}
            </button>
          </div>
          
          {isLoading ? (
            <div className="text-center text-slate-400 py-12 flex flex-col items-center border-2 border-dashed border-slate-100 rounded-xl">
              <span className="material-symbols-outlined text-4xl mb-2 animate-spin">refresh</span>
              <p className="text-sm font-medium">Memuat...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {instagramPosts.map((post) => {
                const isSelected = selectedIds.includes(post.id);
                return (
                  <div 
                    key={post.id} 
                    onClick={() => isSelectMode && toggleSelection(post.id)}
                    className={`relative group rounded-2xl overflow-hidden border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 bg-slate-50 aspect-square transition-all duration-300 ${
                      isSelectMode ? "cursor-pointer" : ""
                    } ${isSelected ? "border-blue-500 scale-[0.98]" : "border-slate-200/60 group-hover:border-slate-300"}`}
                  >
                    {/* Bulk Select Overlay */}
                    {isSelectMode && (
                      <div className="absolute inset-0 z-30 flex items-start justify-end p-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-white/80 bg-black/20"
                        }`}>
                          {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                        </div>
                      </div>
                    )}

                    {/* Blurred Background */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                      <Image
                        alt="Background Blur"
                        src={post.image_url}
                        fill
                        className="object-cover opacity-50 blur-xl scale-125 saturate-150"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    
                    {/* Foreground Image */}
                    <Image src={post.image_url} alt="Instagram Post" className="object-contain relative z-10 transition-transform duration-500 group-hover:scale-105 pointer-events-none" fill sizes="(max-width: 768px) 50vw, 33vw" />
                    
                    {/* Hover Controls (Only visible when NOT in select mode) */}
                    {!isSelectMode && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-20">
                        <a 
                          href={post.post_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-white/95 hover:bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                        >
                          <InstagramIcon className="w-4 h-4" />
                          Buka IG
                        </a>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditIgData({ id: post.id, image_url: post.image_url, post_url: post.post_url });
                            setIsEditingIg(true);
                          }}
                          className="bg-slate-800/90 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 transition-transform hover:scale-105 flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            
              {/* Error State */}
              {isError && !isLoading && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-red-500 border-2 border-dashed border-red-200 rounded-2xl bg-red-50/50 mt-6">
                  <span className="material-symbols-outlined text-4xl mb-2">wifi_off</span>
                  <p className="text-sm font-bold mb-3">Gagal Terhubung ke Server</p>
                  <button onClick={() => load("order=created_at.desc")} className="px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-bold transition flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !isError && instagramPosts.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl mt-6">
                  <span className="material-symbols-outlined text-4xl mb-2">photo_library</span>
                  <p className="text-sm font-medium">Belum ada postingan Instagram.</p>
                </div>
              )}
            </div>
          )}

          {/* Bulk Action Bar */}
          {isSelectMode && selectedIds.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-40 flex items-center gap-4 animate-in slide-in-from-bottom-5">
              <span className="text-sm font-bold">{selectedIds.length} dipilih</span>
              <div className="w-px h-5 bg-slate-700"></div>
              <button onClick={handleDeleteSelected} className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors">
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Hapus
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Edit Modal */}
      {isEditingIg && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditingIg(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">edit</span>
              Edit Postingan
            </h3>
            <form onSubmit={handleEditInstagram} className="space-y-4">
              {/* Preview Image */}
              {editIgData.image_url && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-4">
                  <Image src={editIgData.image_url} alt="Preview" fill className="object-contain" />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">URL Gambar (Image Link)</label>
                <input 
                  type="url" required 
                  value={editIgData.image_url} 
                  onChange={(e) => setEditIgData({...editIgData, image_url: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">URL Postingan Instagram</label>
                <input 
                  type="url" required 
                  value={editIgData.post_url} 
                  onChange={(e) => setEditIgData({...editIgData, post_url: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsEditingIg(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
