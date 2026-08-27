import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { supabaseUploadFile } from "@/lib/supabase";
import { toast } from "sonner";

export function RainfallTab() {
  const { items: rainfallForecasts, isLoading, load, add, remove } = useCrud<any>("rainfall_forecasts", "rainfall-data");
  
  const [newRainfall, setNewRainfall] = useState<{
    year: number;
    month: string;
    category: string;
    label: string;
    uploadMode: "shp" | "json";
    fileShp: File | null;
    fileDbf: File | null;
    fileJson: File | null;
  }>({ 
    year: new Date().getFullYear(), 
    month: "01", 
    category: "dasarian", 
    label: "",
    uploadMode: "shp",
    fileShp: null,
    fileDbf: null,
    fileJson: null
  });
  
  const [isUploadingRainfall, setIsUploadingRainfall] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddRainfall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRainfall.uploadMode === 'shp' && (!newRainfall.fileShp || !newRainfall.fileDbf)) {
      toast.error("Harap pilih file .shp DAN .dbf secara bersamaan!");
      return;
    }
    if (newRainfall.uploadMode === 'json' && !newRainfall.fileJson) {
      toast.error("Harap pilih file .json!");
      return;
    }
    setIsUploadingRainfall(true);

    try {
      let finalFileName = `prakiraan/${Date.now()}-${Math.random().toString(36).substring(7)}.json`;
      let fileToUpload: File;

      if (newRainfall.uploadMode === 'shp') {
        const shapefile = require('shapefile');
        const shpBytes = await newRainfall.fileShp!.arrayBuffer();
        const dbfBytes = await newRainfall.fileDbf!.arrayBuffer();
        
        const geojson = await shapefile.read(shpBytes, dbfBytes);
        
        const geojsonStr = JSON.stringify(geojson);
        fileToUpload = new File([geojsonStr], 'converted.json', { type: 'application/json' });
      } else {
        fileToUpload = newRainfall.fileJson!;
      }

      const uploadedUrl = await supabaseUploadFile("rainfall-data", finalFileName, fileToUpload);
      if (!uploadedUrl) throw new Error("Gagal mengupload file ke Storage");

      const success = await add({
        category: newRainfall.category,
        year: newRainfall.year,
        month: newRainfall.month,
        label: newRainfall.label,
        file_path: uploadedUrl
      }, "Data Prakiraan Curah Hujan berhasil ditambahkan!");

      if (success) {
        setNewRainfall({ category: "dasarian", year: new Date().getFullYear(), month: "01", label: "", uploadMode: "shp", fileShp: null, fileDbf: null, fileJson: null });
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memproses data.");
    } finally {
      setIsUploadingRainfall(false);
    }
  };

  const handleDeleteRainfall = (id: number, filePath: string) => {
    if (confirm("Yakin ingin menghapus data ini? File GeoJSON di storage juga akan dihapus.")) {
      remove(id, filePath, "Data dihapus");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Upload */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Upload Prakiraan Hujan
                    </h3>
                  </div>
                  <form onSubmit={handleAddRainfall} className="flex flex-col gap-4 flex-1">
                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Metode Upload</label>
                      <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={newRainfall.uploadMode === 'shp'} onChange={() => setNewRainfall({...newRainfall, uploadMode: 'shp'})} className="accent-primary" />
                          <span className="text-sm font-medium">SHP & DBF (Konversi Otomatis)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={newRainfall.uploadMode === 'json'} onChange={() => setNewRainfall({...newRainfall, uploadMode: 'json'})} className="accent-primary" />
                          <span className="text-sm font-medium">File GeoJSON (.json)</span>
                        </label>
                      </div>

                      {newRainfall.uploadMode === 'shp' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                              <span>File .SHP (Geometri)</span>
                              {newRainfall.fileShp && <span className="text-emerald-500"><i className="fas fa-check-circle"></i> Terpilih</span>}
                            </label>
                            <input 
                              type="file" 
                              accept=".shp" 
                              onChange={e => setNewRainfall({...newRainfall, fileShp: e.target.files?.[0] || null})} 
                              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                              <span>File .DBF (Atribut)</span>
                              {newRainfall.fileDbf && <span className="text-emerald-500"><i className="fas fa-check-circle"></i> Terpilih</span>}
                            </label>
                            <input 
                              type="file" 
                              accept=".dbf" 
                              onChange={e => setNewRainfall({...newRainfall, fileDbf: e.target.files?.[0] || null})} 
                              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                            />
                          </div>
                          <div className="col-span-full mt-1">
                            <p className="text-xs text-slate-500 flex items-start gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0">info</span>
                              File akan diekstrak dan dikonversi secara aman di browser sebelum disimpan. Pastikan kedua file valid.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                            <span>File GeoJSON (.json)</span>
                            {newRainfall.fileJson && <span className="text-emerald-500"><i className="fas fa-check-circle"></i> Terpilih</span>}
                          </label>
                          <input 
                            type="file" 
                            accept=".json,application/json" 
                            onChange={e => setNewRainfall({...newRainfall, fileJson: e.target.files?.[0] || null})} 
                            className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          />
                          <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-blue-500 shrink-0">info</span>
                            Upload file GeoJSON yang sebelumnya sudah Anda konversi (seperti analisis_xxx.json).
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tahun</label>
                      <input 
                        required 
                        type="number" 
                        min="2000" 
                        max="2100"
                        value={newRainfall.year} 
                        onChange={e => setNewRainfall({...newRainfall, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bulan</label>
                      <select 
                        required 
                        value={newRainfall.month} 
                        onChange={e => setNewRainfall({...newRainfall, month: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => {
                          const monthStr = m.toString().padStart(2, '0');
                          const monthName = new Date(2000, m - 1, 1).toLocaleString('id-ID', { month: 'long' });
                          return <option key={monthStr} value={monthStr}>{monthName}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Waktu</label>
                      <select 
                        required 
                        value={newRainfall.category} 
                        onChange={e => setNewRainfall({...newRainfall, category: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="dasarian">Dasarian</option>
                        <option value="bulanan">Bulanan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Label Tambahan</label>
                      <input 
                        type="text" 
                        value={newRainfall.label} 
                        onChange={e => setNewRainfall({...newRainfall, label: e.target.value})} 
                        placeholder="e.g. Dasarian I"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                      />
                    </div>
                    <div className="pt-4 mt-auto">
                      <button 
                        type="submit" 
                        disabled={isUploadingRainfall}
                        className={`w-full text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isUploadingRainfall ? 'bg-primary/70 cursor-wait' : 'bg-gradient-to-r from-primary to-blue-600 hover:scale-[1.02] active:scale-95'}`}
                      >
                        {isUploadingRainfall ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                            <span>Upload Data</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Daftar Prakiraan */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Data Prakiraan ({rainfallForecasts.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rainfallForecasts.map(r => (
                      <div key={r.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all flex flex-col gap-2 relative group">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {r.category}
                            </span>
                            <h4 className="font-bold text-slate-800 mt-2 text-sm">{new Date(r.year, parseInt(r.month)-1, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h4>
                            <p className="text-xs text-slate-500 font-medium">{r.label}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteRainfall(r.id, r.file_path)} 
                            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                            title="Hapus Data"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400 break-all font-mono bg-white p-2 rounded-lg border border-slate-100 line-clamp-1" title={r.file_path}>
                          {r.file_path?.split('/').pop()}
                        </div>
                      </div>
                    ))}
                    {rainfallForecasts.length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">cloud_off</span>
                        <p className="text-sm font-medium">Belum ada data prakiraan curah hujan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
    </>
  );
}
