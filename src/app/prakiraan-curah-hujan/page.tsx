"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useState, useEffect } from "react";
import { supabaseFetch } from "@/lib/supabase";
import { CustomSelect } from "@/components/ui/CustomSelect";

// Import peta tanpa SSR karena Leaflet menggunakan window
const RainfallMap = dynamic(
  () => import("@/components/climate/rainfall-map").then((mod) => mod.RainfallMap),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-100 rounded-xl animate-pulse"><div className="flex flex-col items-center gap-4"><span className="material-symbols-outlined text-4xl text-slate-400 animate-bounce">map</span><span className="text-slate-500 font-medium">Memuat Peta Interaktif...</span></div></div> }
);

interface ForecastOption {
  id: number;
  category: string;
  year: number;
  month: string;
  label: string;
  file_path: string;
}

export default function PrakiraanCurahHujanPage() {
  const [categories] = useState([
    { id: "dasarian", label: "Prakiraan Dasarian" },
    { id: "bulanan_1", label: "Prakiraan 1 Bulan ke Depan" },
    { id: "bulanan_3", label: "Prakiraan 3 Bulan ke Depan" },
    { id: "bulanan_6", label: "Prakiraan 6 Bulan ke Depan" },
  ]);
  
  const [activeCategory, setActiveCategory] = useState("dasarian");
  const [forecasts, setForecasts] = useState<ForecastOption[]>([]);
  const [selectedForecast, setSelectedForecast] = useState<ForecastOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch metadata dari database
  useEffect(() => {
    const fetchForecasts = async () => {
      setIsLoading(true);
      try {
        const data = await supabaseFetch(
          "rainfall_forecasts", 
          `category=eq.${activeCategory}&order=year.desc,month.desc,created_at.desc`
        );

        if (data) {
          setForecasts(data);
          if (data.length > 0) {
            setSelectedForecast(data[0]);
          } else {
            setSelectedForecast(null);
          }
        }
      } catch (err) {
        console.error("Error fetching forecasts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecasts();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header activeRoute="/prakiraan-curah-hujan" />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="material-symbols-outlined">rainy</span>
            <span className="uppercase tracking-widest text-sm">Informasi Iklim</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Peta Prakiraan Curah Hujan
          </h1>
          <p className="text-slate-600 max-w-3xl leading-relaxed">
            Peta interaktif prakiraan curah hujan wilayah Jawa Timur. Menampilkan prediksi intensitas hujan mulai dari skala dasarian (10 hari) hingga prospek 6 bulan ke depan.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end relative z-20">
          <div className="flex-1 w-full space-y-1.5 relative z-50">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Kategori Prakiraan</label>
            <CustomSelect
              value={activeCategory}
              onChange={(val) => setActiveCategory(val)}
              options={categories.map(c => ({ value: c.id, label: c.label }))}
            />
          </div>
          
          <div className="flex-1 w-full space-y-1.5 relative z-40">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Periode</label>
            <CustomSelect
              value={selectedForecast?.id?.toString() || ""}
              onChange={(val) => {
                const found = forecasts.find(f => f.id.toString() === val);
                if (found) setSelectedForecast(found);
              }}
              disabled={isLoading || forecasts.length === 0}
              options={isLoading 
                ? [{ value: "", label: "Memuat data..." }] 
                : forecasts.length === 0 
                  ? [{ value: "", label: "Data tidak tersedia" }] 
                  : forecasts.map(f => ({ value: f.id.toString(), label: f.label }))}
            />
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 min-h-[600px] flex flex-col relative z-10">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">map</span>
              {selectedForecast ? selectedForecast.label : "Peta Jawa Timur"}
            </h2>
          </div>
          
          <div className="flex-1 relative bg-slate-100 min-h-[600px]">
            <RainfallMap forecast={selectedForecast} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
