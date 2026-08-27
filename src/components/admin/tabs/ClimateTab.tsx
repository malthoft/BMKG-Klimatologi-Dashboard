import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabaseUploadFile, supabaseDeleteFile, supabaseGetPublicUrl } from "@/lib/supabase";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { TemperatureLineChart } from "@/components/climate/temperature-line-chart";

export function ClimateTab() {
  const [csvTextStripes, setCsvTextStripes] = useState("");
  const [csvTextAnnual, setCsvTextAnnual] = useState("");
  const [climatePreviewStripes, setClimatePreviewStripes] = useState<ClimateParsedResult | null>(null);
  const [climatePreviewAnnual, setClimatePreviewAnnual] = useState<ClimateParsedResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("KAB. MALANG");

  useEffect(() => {
    loadClimateData();
  }, []);

  const loadClimateData = async () => {
    try {
      const publicUrlStripes = supabaseGetPublicUrl("climate-data", "warming-stripes.csv");
      const resStripes = await fetch(`${publicUrlStripes}?t=${new Date().getTime()}`);
      if (resStripes.ok) {
        const text = await resStripes.text();
        if (text && text.length > 10) {
          setCsvTextStripes(text);
          setClimatePreviewStripes(parseCSVText(text));
        }
      }

      const publicUrlAnnual = supabaseGetPublicUrl("climate-data", "annual-temperatures.csv");
      const resAnnual = await fetch(`${publicUrlAnnual}?t=${new Date().getTime()}`);
      if (resAnnual.ok) {
        const text = await resAnnual.text();
        if (text && text.length > 10) {
          setCsvTextAnnual(text);
          setClimatePreviewAnnual(parseCSVText(text));
        }
      }
    } catch (e) {
      console.error("Gagal memuat data iklim", e);
    }
  };

  const processAndUploadCSV = async (textToProcess: string, type: 'stripes' | 'annual') => {
    if (!textToProcess.trim()) {
      toast.error("Teks CSV kosong!");
      return;
    }
    
    try {
      const parsed = parseCSVText(textToProcess);
      const filename = type === 'stripes' ? 'warming-stripes.csv' : 'annual-temperatures.csv';
      
      if (type === 'stripes') {
        setClimatePreviewStripes(parsed);
        setCsvTextStripes(textToProcess);
      } else {
        setClimatePreviewAnnual(parsed);
        setCsvTextAnnual(textToProcess);
      }
      
      const fileBlob = new Blob([textToProcess], { type: 'text/csv' });
      const fileObj = new File([fileBlob], filename, { type: 'text/csv' });
      
      const uploadedUrl = await supabaseUploadFile("climate-data", filename, fileObj);
      
      if (uploadedUrl) {
        toast.success(`Berhasil mengunggah data CSV ${type === 'stripes' ? 'Warming Stripes' : 'Suhu Tahunan'}!`);
      } else {
        toast.error("Gagal mengunggah file ke Supabase Storage. Cek bucket 'climate-data'.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses file CSV.");
    }
  };

  const handleFileUpload = (evt: React.ChangeEvent<HTMLInputElement>, type: 'stripes' | 'annual') => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        processAndUploadCSV(text, type);
      }
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  const handleClearCSV = (type: 'stripes' | 'annual') => {
    if (confirm(`Apakah Anda yakin ingin mengosongkan data CSV iklim (${type}) dari Supabase Storage?`)) {
      (async () => {
        const filename = type === 'stripes' ? 'warming-stripes.csv' : 'annual-temperatures.csv';
        const deleted = await supabaseDeleteFile("climate-data", filename);
        if (deleted) {
          if (type === 'stripes') {
            setCsvTextStripes("");
            setClimatePreviewStripes(null);
          } else {
            setCsvTextAnnual("");
            setClimatePreviewAnnual(null);
          }
          toast.success("Data CSV berhasil dihapus dari storage.");
        } else {
          toast.error("Gagal menghapus file dari storage.");
        }
      })();
    }
  };

  const handleResetDefaultCSV = (type: 'stripes' | 'annual') => {
    if (confirm(`Apakah Anda yakin ingin mereset data (${type}) ke dataset default bawaan sistem? Ini akan mengunggah file default ke Supabase Storage.`)) {
      (async () => {
        try {
          const fallbackPath = type === 'stripes' ? "/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv" : "/Rata_Rata_Suhu_Tahunan.csv";
          const res = await fetch(fallbackPath);
          if (res.ok) {
            const text = await res.text();
            await processAndUploadCSV(text, type);
          } else {
            toast.error("Gagal mengambil dataset default.");
          }
        } catch (e) {
          toast.error("Gagal mereset CSV default.");
        }
      })();
    }
  };

  return (
    <>
      <section className="space-y-8">
                {/* 1. Warming Stripes Management */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">thermostat</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Kelola Data CSV Warming Stripes</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Sistem akan otomatis mendeteksi kolom tahun dan wilayah.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('stripes')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        <span>Reset ke Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('stripes')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        <span>Kosongkan</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputStripes")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group"
                    >
                      <input
                        type="file"
                        id="adminCsvInputStripes"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'stripes')}
                      />
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-sm text-slate-500 mt-1">Format .csv dengan Anomali Suhu</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Atau Tempelkan (Paste) Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextStripes}
                        onChange={(e) => setCsvTextStripes(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,-0.338,-0.834&#10;..."
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextStripes, 'stripes')}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-900 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        Proses &amp; Unggah CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">visibility</span> Preview Warming Stripes</h4>
                    <WarmingStripesViewer parsedData={climatePreviewStripes} selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
                  </div>
                </div>

                {/* 2. Annual Temperatures Management */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">timeline</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Kelola Data CSV Suhu Tahunan</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Suhu absolut rata-rata untuk ditampilkan sebagai grafik garis.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('annual')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        <span>Reset ke Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('annual')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        <span>Kosongkan</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputAnnual")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group"
                    >
                      <input
                        type="file"
                        id="adminCsvInputAnnual"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'annual')}
                      />
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-sm text-slate-500 mt-1">Format .csv dengan Suhu Absolut</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Atau Tempelkan (Paste) Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextAnnual}
                        onChange={(e) => setCsvTextAnnual(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,24.41,27.22&#10;..."
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextAnnual, 'annual')}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-900 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        Proses &amp; Unggah CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">monitoring</span> Preview Grafik Suhu</h4>
                    <TemperatureLineChart parsedData={climatePreviewAnnual} selectedRegion={selectedRegion} />
                  </div>
                </div>
              </section>
    </>
  );
}
