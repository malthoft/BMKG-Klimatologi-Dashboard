import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabaseUploadFile, supabaseGetPublicUrl } from "@/lib/supabase";

export function HthTab() {
  const [hthConfig, setHthConfig] = useState({ judul: "MONITORING HARI TANPA HUJAN", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTi79gYQsWbuErXu85VpBLIiuMD7v2XnWEjWRBCPSIpyhxB_BxloWkztP19sAOOVQ/pub?gid=655976518&single=true&output=csv" });
  const [isSyncingHth, setIsSyncingHth] = useState(false);
  const [hthStats, setHthStats] = useState({ totalData: 0, lastUpdate: "-" });

  useEffect(() => {
    loadHthData();
  }, []);

  const loadHthData = async () => {
    try {
      let currentConfig: any = null;
      const publicUrl = supabaseGetPublicUrl("rainfall-data", "hth/config.json");
      const res = await fetch(`${publicUrl}?t=${new Date().getTime()}`);
      if (res.ok) {
        currentConfig = await res.json();
        setHthConfig(prev => ({ ...prev, ...currentConfig }));
      }
      const dataUrl = supabaseGetPublicUrl("rainfall-data", "hth/data.json");
      const resData = await fetch(`${dataUrl}?t=${new Date().getTime()}`);
      if (resData.ok) {
        const hthData = await resData.json();
        setHthStats({ totalData: hthData.length || 0, lastUpdate: currentConfig?.lastUpdate || new Date().toLocaleString('id-ID') });
      }
    } catch (e) {
      console.warn("Failed to load HTH data", e);
    }
  };

  const handleSaveHthTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configStr = JSON.stringify({ ...hthConfig, lastUpdate: hthStats.lastUpdate });
      const fileToUpload = new File([configStr], 'config.json', { type: 'application/json' });
      const uploadedUrl = await supabaseUploadFile("rainfall-data", "hth/config.json", fileToUpload);
      if (uploadedUrl) {
        toast.success("Judul HTH berhasil diperbarui!");
      } else {
        throw new Error("Gagal upload config");
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal memperbarui judul HTH");
    }
  };

  const handleSyncHth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hthConfig.url) {
      toast.error("URL Google Sheets tidak boleh kosong");
      return;
    }
    setIsSyncingHth(true);
    try {
      const { fetchAndParseHTHCsv } = await import("@/lib/hth-parser");
      const data = await fetchAndParseHTHCsv(hthConfig.url);
      
      if (!data || data.length === 0) {
        throw new Error("Gagal mengambil data atau data kosong");
      }

      const dataStr = JSON.stringify(data);
      const dataFile = new File([dataStr], 'data.json', { type: 'application/json' });
      await supabaseUploadFile("rainfall-data", "hth/data.json", dataFile);

      const now = new Date().toLocaleString('id-ID');
      const configStr = JSON.stringify({ ...hthConfig, lastUpdate: now });
      const configFile = new File([configStr], 'config.json', { type: 'application/json' });
      await supabaseUploadFile("rainfall-data", "hth/config.json", configFile);

      setHthStats({ totalData: data.length, lastUpdate: now });
      toast.success(`Sukses! Sinkronisasi berhasil. Total ${data.length} data pos diperbarui.`);
    } catch (e: any) {
      toast.error(e.message || "Gagal sinkronisasi HTH");
    } finally {
      setIsSyncingHth(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 h-fit">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">edit_document</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Judul & Pengaturan HTH</h3>
                  </div>
                  
                  <form onSubmit={handleSaveHthTitle} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Peta HTH</label>
                      <input 
                        required 
                        type="text" 
                        value={hthConfig.judul} 
                        onChange={(e) => setHthConfig({...hthConfig, judul: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-800" 
                        placeholder="Contoh: MONITORING HARI TANPA HUJAN - UPDATE 10 FEBRUARI 2026"
                      />
                      <p className="text-xs text-slate-400 mt-2">Judul ini akan ditampilkan di atas peta HTH pada halaman publik.</p>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-md shadow-slate-900/20 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Simpan Judul
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">sync</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Sinkronisasi Data Pos</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400 font-medium">Terakhir Sinkron:</span>
                      <span className="text-sm font-bold text-slate-800">{hthStats.lastUpdate}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Pos Aktif</p>
                      <p className="text-3xl font-black text-slate-800">{hthStats.totalData}</p>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-blue-200">location_on</span>
                  </div>

                  <form onSubmit={handleSyncHth} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                        <span>URL Google Sheets (CSV Export)</span>
                        <a href={hthConfig.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">Cek Link <span className="material-symbols-outlined text-[12px]">open_in_new</span></a>
                      </label>
                      <input 
                        required 
                        type="url" 
                        value={hthConfig.url} 
                        onChange={(e) => setHthConfig({...hthConfig, url: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono bg-slate-50" 
                        placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                      />
                      <p className="text-[11px] text-amber-600 mt-2 flex items-start gap-1 bg-amber-50 p-2 rounded-lg border border-amber-100/50">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        Pastikan Google Sheets telah dipublikasikan ke web (File {'>'} Share {'>'} Publish to web) dengan format <strong>Comma-separated values (.csv)</strong>.
                      </p>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSyncingHth}
                      className={`w-full text-white shadow-md shadow-primary/20 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isSyncingHth ? 'bg-primary/70 cursor-wait' : 'bg-gradient-to-r from-primary to-blue-600 hover:scale-[1.02] active:scale-95'}`}
                    >
                      {isSyncingHth ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                          <span>Mengambil & Memproses Data...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">cloud_download</span>
                          <span>Tarik Data Terbaru dari Sheets</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
    </>
  );
}
