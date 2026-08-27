"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseGetPublicUrl } from "@/lib/supabase";

// Import Map dynamically to avoid SSR issues with Leaflet
const HTHMap = dynamic(
  () => import("@/components/climate/hth-map").then((mod) => mod.HTHMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Memuat Peta HTH...</p>
        </div>
      </div>
    ),
  }
);

export default function HariTanpaHujanPage() {
  const [judulHTH, setJudulHTH] = useState("MONITORING HARI TANPA HUJAN");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const publicUrl = supabaseGetPublicUrl("rainfall-data", "hth/config.json");
        const res = await fetch(`${publicUrl}?t=${new Date().getTime()}`);
        if (res.ok) {
          const config = await res.json();
          if (config.judul_hth) {
            setJudulHTH(config.judul_hth);
          }
        }
      } catch (err) {
        console.warn("Failed to load HTH config, using default title");
      }
    }
    fetchConfig();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50/50 flex flex-col">
      <Header activeRoute="/hari-tanpa-hujan" />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#003366] uppercase drop-shadow-sm mb-2">
            {judulHTH}
          </h2>
          <div className="text-slate-500 text-sm md:text-base">
            Update Data Kekeringan Meteorologis Wilayah Jawa Timur
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full flex-1 min-h-[600px]">
          {/* MAP CONTAINER */}
          <div className="w-full lg:w-3/4 h-[500px] lg:h-auto rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <HTHMap />
          </div>

          {/* LEGEND SIDEBAR */}
          <div className="w-full lg:w-1/4 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary text-[20px]">format_list_bulleted</span>
                <h6 className="font-bold text-slate-800 text-sm m-0">KETERANGAN</h6>
              </div>
              
              <div className="flex flex-col gap-2">
                {[
                  { range: "1 - 5 Hari", label: "Sangat Pendek", color: "#7FFF00" },
                  { range: "6 - 10 Hari", label: "Pendek", color: "#FFFF00" },
                  { range: "11 - 20 Hari", label: "Menengah", color: "#D2691E" },
                  { range: "21 - 30 Hari", label: "Panjang", color: "#8B4513" },
                  { range: "31 - 60 Hari", label: "Sangat Panjang", color: "#FFC0CB" },
                  { range: "> 60 Hari", label: "Kekeringan Ekstrem", color: "#FF0000" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-2 hover:bg-slate-100 transition-colors">
                    <span className="w-8 h-8 rounded-lg shrink-0 shadow-sm border border-slate-200" style={{ background: item.color }}></span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-800 leading-tight">{item.range}</span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{item.label}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-2 hover:bg-slate-100 transition-colors">
                    <span className="w-8 h-8 rounded-lg shrink-0 shadow-sm border border-slate-200" style={{ background: '#006400' }}></span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-800 leading-tight">Masih Ada Hujan</span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">No Drought</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#eef2f5] p-4 rounded-xl border border-slate-200/60 shadow-sm flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">info</span>
              <p className="mb-0 italic text-[11px] text-slate-600 leading-relaxed">
                Data HTH diperbarui secara berkala sesuai hasil pengamatan pos hujan di seluruh wilayah Jawa Timur.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
