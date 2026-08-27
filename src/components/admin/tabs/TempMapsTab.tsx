import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { TempMap } from "@/types/admin";
import { supabaseUploadFile } from "@/lib/supabase";
import Image from "next/image";
import { useToast } from "@/components/ui/toast-provider";
import { useConfirm } from "@/components/ui/confirm-provider";
import { CustomSelect } from "@/components/ui/CustomSelect";

export function TempMapsTab() {
  const confirm = useConfirm();
  const { success, error, info } = useToast();
  const { items: tempMaps, isLoading, load, add, update, remove } = useCrud<TempMap>("temperature_maps", "temperature-maps");
  
  const [newTempMap, setNewTempMap] = useState<{year: number, category: string, file: File | null}>({ year: new Date().getFullYear(), category: "Normal", file: null });
  const [isUploadingTempMap, setIsUploadingTempMap] = useState(false);
  const [editTempMapId, setEditTempMapId] = useState<number | null>(null);

  useEffect(() => {
    load("order=year.desc");
  }, [load]);

  const handleAddTempMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTempMap.file) {
      error("Silakan pilih file gambar peta suhu!");
      return;
    }
    setIsUploadingTempMap(true);

    try {
      const fileExt = newTempMap.file.name.split('.').pop();
      const fileName = `tempmap-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${newTempMap.year}/${fileName}`;

      const imageUrl = await supabaseUploadFile("temperature-maps", filePath, newTempMap.file);
      if (!imageUrl) {
        setIsUploadingTempMap(false);
        throw new Error("Gagal mengupload gambar");
      }

      const success = await add({
        year: newTempMap.year,
        category: newTempMap.category,
        image_url: imageUrl
      }, "Peta Suhu berhasil ditambahkan!");

      if (success) {
        setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
        load("order=year.desc");
      }
    } catch (err: any) {
      error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsUploadingTempMap(false);
    }
  };

  const handleEditTempMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTempMapId) return;
    setIsUploadingTempMap(true);

    try {
      let finalImageUrl = undefined;
      
      if (newTempMap.file) {
        const fileExt = newTempMap.file.name.split('.').pop();
        const fileName = `tempmap-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${newTempMap.year}/${fileName}`;
        const uploadedUrl = await supabaseUploadFile("temperature-maps", filePath, newTempMap.file);
        if (!uploadedUrl) {
          setIsUploadingTempMap(false);
          throw new Error("Gagal mengupload gambar baru");
        }
        finalImageUrl = uploadedUrl;
      }

      const updateData: any = {
        year: newTempMap.year,
        category: newTempMap.category,
      };
      if (finalImageUrl) updateData.image_url = finalImageUrl;

      const success = await update(editTempMapId, updateData, "Peta Suhu berhasil diperbarui!");
      if (success) {
        setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
        setEditTempMapId(null);
        load("order=year.desc");
      }
    } catch (err: any) {
      error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsUploadingTempMap(false);
    }
  };

  const startEditTempMap = (map: TempMap) => {
    setEditTempMapId(map.id);
    setNewTempMap({ year: map.year, category: map.category, file: null });
  };

  const cancelEditTempMap = () => {
    setEditTempMapId(null);
    setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
  };

  const handleDeleteTempMap = async (id: number, imageUrl: string) => {
    if (await confirm("Yakin ingin menghapus peta suhu ini?")) {
      remove(id, imageUrl, "Peta Suhu berhasil dihapus");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">map</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {editTempMapId ? "Edit Peta Suhu" : "Upload Peta Suhu Baru"}
                    </h3>
                  </div>
                  <form onSubmit={editTempMapId ? handleEditTempMap : handleAddTempMap} className="flex flex-col gap-4 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                        <span>Gambar Peta {editTempMapId && "(Opsional)"}</span>
                        {newTempMap.file && <span className="text-emerald-500 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full"><i className="fas fa-check-circle"></i> Terpilih</span>}
                      </label>
                      <label className={`flex items-center justify-between w-full border ${newTempMap.file ? 'border-primary/50 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50'} rounded-xl px-4 py-3 cursor-pointer transition-all group`}>
                        <div className="flex items-center gap-3 truncate">
                          <span className="material-symbols-outlined text-primary/70">map</span>
                          <span className={`text-sm truncate font-medium ${newTempMap.file ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {newTempMap.file ? newTempMap.file.name : "Pilih file gambar peta..."}
                          </span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          required={!editTempMapId}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) setNewTempMap({...newTempMap, file});
                          }} 
                        />
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors shrink-0">Browse</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tahun</label>
                        <input 
                          required 
                          type="number" 
                          min="2000" max="2100" 
                          value={newTempMap.year} 
                          onChange={e => setNewTempMap({...newTempMap, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                        <CustomSelect
                          required
                          value={newTempMap.category}
                          onChange={(val) => setNewTempMap({...newTempMap, category: val})}
                          options={[
                            { value: "Normal", label: "Normal" },
                            { value: "Anomali", label: "Anomali" }
                          ]}
                        />
                      </div>
                    </div>
                    <div className="pt-4 mt-auto flex gap-3">
                      <button 
                        type="submit" 
                        disabled={isUploadingTempMap}
                        className={`w-full text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isUploadingTempMap ? 'bg-primary/70 cursor-wait' : 'bg-gradient-to-r from-primary to-blue-600 hover:scale-[1.02] active:scale-95'}`}
                      >
                        {isUploadingTempMap ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[20px]">{editTempMapId ? 'save' : 'cloud_upload'}</span>
                            <span>{editTempMapId ? "Simpan Perubahan" : "Simpan Peta"}</span>
                          </>
                        )}
                      </button>
                      
                      {editTempMapId && (
                        <button 
                          type="button"
                          onClick={cancelEditTempMap}
                          disabled={isUploadingTempMap}
                          className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">collections</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Galeri Peta Suhu ({tempMaps.length})</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tempMaps.map(m => (
                      <div key={m.id} className="group rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative flex flex-col">
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                          {m.image_url ? (
                            <Image 
                              src={m.image_url.includes('http') ? m.image_url : `https://malthoft.supabase.co/storage/v1/object/public/${m.image_url}`} 
                              alt={`Peta Suhu ${m.year}`}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <span className="material-symbols-outlined text-4xl">broken_image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-white/90 text-slate-800 shadow-sm backdrop-blur-sm">
                              {m.year}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg shadow-sm backdrop-blur-sm ${m.category === 'Normal' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                              {m.category}
                            </span>
                          </div>
                          
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                            <button 
                              onClick={() => startEditTempMap(m)} 
                              className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteTempMap(m.id, m.image_url)} 
                              className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-lg"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {tempMaps.length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">map</span>
                        <p className="text-sm font-medium">Belum ada peta suhu yang diupload.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
    </>
  );
}
