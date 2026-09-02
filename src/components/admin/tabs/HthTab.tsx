import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { supabaseUploadFile, supabaseGetPublicUrl } from "@/lib/supabase";

export function HthTab() {
  const { success, error, info } = useToast();
  const [hthConfig, setHthConfig] = useState({ judul: "MONITORING HARI TANPA HUJAN", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTi79gYQsWbuErXu85VpBLIiuMD7v2XnWEjWRBCPSIpyhxB_BxloWkztP19sAOOVQ/pub?gid=655976518&single=true&output=csv" });
  const [isSyncingHth, setIsSyncingHth] = useState(false);
  const [hthStats, setHthStats] = useState({ totalData: 0, lastUpdate: "-" });
  const [uploadMethod, setUploadMethod] = useState<"excel" | "link">("excel");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        success("Judul HTH berhasil diperbarui!");
      } else {
        throw new Error("Gagal upload config");
      }
    } catch (e: any) {
      error(e.message || "Gagal memperbarui judul HTH");
    }
  };

  const handleSyncHth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMethod === "link" && !hthConfig.url) {
      error("URL Google Sheets tidak boleh kosong");
      return;
    }
    if (uploadMethod === "excel" && !excelFile) {
      error("Harap pilih file Excel terlebih dahulu");
      return;
    }

    setIsSyncingHth(true);
    try {
      const { fetchAndParseHTHCsv, parseHTHExcel } = await import("@/lib/hth-parser");
      let data;
      
      if (uploadMethod === "link") {
        data = await fetchAndParseHTHCsv(hthConfig.url);
      } else {
        data = await parseHTHExcel(excelFile!);
      }
      
      if (!data || data.length === 0) {
        throw new Error("Gagal mengambil data atau data kosong. Pastikan file/URL memiliki data yang benar.");
      }

      const dataStr = JSON.stringify(data);
      const dataFile = new File([dataStr], 'data.json', { type: 'application/json' });
      await supabaseUploadFile("rainfall-data", "hth/data.json", dataFile);

      const now = new Date().toLocaleString('id-ID');
      const configStr = JSON.stringify({ ...hthConfig, lastUpdate: now });
      const configFile = new File([configStr], 'config.json', { type: 'application/json' });
      await supabaseUploadFile("rainfall-data", "hth/config.json", configFile);

      setHthStats({ totalData: data.length, lastUpdate: now });
      success(`Sukses! Sinkronisasi berhasil. Total ${data.length} data pos diperbarui.`);
      setExcelFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      error(e.message || "Gagal sinkronisasi HTH");
    } finally {
      setIsSyncingHth(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        error("Format file tidak didukung! Harap unggah file .xlsx, .xls, atau .csv.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        error("Ukuran file terlalu besar! Maksimal 10 MB.");
        return;
      }
      setExcelFile(file);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 h-fit">
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

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6">
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
                    {/* Method Selector */}
                    <div className="flex flex-col sm:flex-row gap-4 p-1 bg-slate-100 rounded-xl">
                      <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${uploadMethod === 'excel' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        <input 
                          type="radio" 
                          name="hth_upload_method" 
                          className="hidden" 
                          checked={uploadMethod === 'excel'} 
                          onChange={() => setUploadMethod('excel')}
                        />
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Upload File Excel
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${uploadMethod === 'link' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        <input 
                          type="radio" 
                          name="hth_upload_method" 
                          className="hidden" 
                          checked={uploadMethod === 'link'} 
                          onChange={() => setUploadMethod('link')}
                        />
                        <span className="material-symbols-outlined text-[18px]">link</span>
                        Link Spreadsheet
                      </label>
                    </div>

                    {uploadMethod === "link" ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                          <span>URL Google Sheets (CSV Export)</span>
                          <a href={hthConfig.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">Cek Link <span className="material-symbols-outlined text-[12px]">open_in_new</span></a>
                        </label>
                        <input 
                          required={uploadMethod === "link"}
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
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">File Excel (.xlsx, .csv)</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${excelFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'}`}
                        >
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            accept=".xlsx,.xls,.csv" 
                            className="hidden" 
                            onChange={handleFileChange}
                          />
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${excelFile ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                            <span className="material-symbols-outlined text-2xl">
                              {excelFile ? "check_circle" : "description"}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-700">
                            {excelFile ? excelFile.name : "Klik atau Seret Berkas Excel ke Sini"}
                          </h4>
                          {!excelFile && (
                            <p className="text-xs text-slate-400 mt-1">Mendukung .xlsx, .xls, dan .csv (Maks 10MB)</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Format Kolom Wajib Notice */}
                    <div className="bg-white/50 border border-amber-200/80 rounded-xl p-4 mt-4 shadow-sm">
                      <h4 className="flex items-center gap-1.5 text-sm font-bold text-amber-600 mb-3">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                        Format Kolom Wajib:
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-2 text-[13px] font-mono text-slate-700">
                        <div>1. ID</div>
                        <div>2. Nama</div>
                        <div>3. Lat</div>
                        <div>4. Lon</div>
                        <div>5. Kab</div>
                        <div>6. HTH (Angka)</div>
                      </div>
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
