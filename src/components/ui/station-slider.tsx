"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabaseFetch } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { formatUTCtoWIB } from "@/lib/utils";

interface StationData {
  id: string;
  station_id: string;
  station_name: string;
  display_name?: string | null;
  table_name: string;
  latitude: number;
  longitude: number;
}

interface StationCardData {
  station: StationData;
  time: string;
  temp: number;
  rh: number;
  rr: number;
  condition: string;
  icon: string;
  min_temp?: number;
}

const getWeatherCondition = (temp: number, rh: number, rr: number) => {
  if (rr > 5) return { text: "Hujan Lebat", icon: "rainy", color: "text-indigo-600" };
  if (rr > 0) return { text: "Hujan Ringan", icon: "rainy", color: "text-sky-500" };
  if (rh > 85) return { text: "Berawan Tebal", icon: "cloud", color: "text-slate-500" };
  if (rh > 70) return { text: "Cerah Berawan", icon: "partly_cloudy_day", color: "text-amber-500" };
  return { text: "Cerah", icon: "sunny", color: "text-orange-500" };
};

const getConditionTheme = (condition: string) => {
  switch (condition) {
    case "Hujan Lebat":
      return { icon: "text-indigo-500", accent: "bg-indigo-500", text: "text-indigo-600", shadow: "hover:shadow-indigo-500/20", glow: "from-indigo-500/10 to-transparent", ring: "hover:ring-2 hover:ring-indigo-500", pill: "bg-indigo-50 text-indigo-700 border-indigo-100" };
    case "Hujan Ringan":
      return { icon: "text-sky-500", accent: "bg-sky-500", text: "text-sky-600", shadow: "hover:shadow-sky-500/20", glow: "from-sky-500/10 to-transparent", ring: "hover:ring-2 hover:ring-sky-500", pill: "bg-sky-50 text-sky-700 border-sky-100" };
    case "Berawan Tebal":
      return { icon: "text-slate-500", accent: "bg-slate-500", text: "text-slate-600", shadow: "hover:shadow-slate-500/20", glow: "from-slate-400/10 to-transparent", ring: "hover:ring-2 hover:ring-slate-400", pill: "bg-slate-100 text-slate-700 border-slate-200" };
    case "Cerah Berawan":
      return { icon: "text-amber-500", accent: "bg-amber-400", text: "text-amber-600", shadow: "hover:shadow-amber-500/20", glow: "from-amber-400/10 to-transparent", ring: "hover:ring-2 hover:ring-amber-400", pill: "bg-amber-50 text-amber-700 border-amber-100" };
    case "Cerah":
      return { icon: "text-orange-500", accent: "bg-orange-500", text: "text-orange-600", shadow: "hover:shadow-orange-500/20", glow: "from-orange-400/10 to-transparent", ring: "hover:ring-2 hover:ring-orange-500", pill: "bg-orange-50 text-orange-700 border-orange-100" };
    case "Offline":
    default:
      return { icon: "text-slate-300", accent: "bg-slate-300", text: "text-slate-400", shadow: "hover:shadow-slate-300/20", glow: "from-slate-200/10 to-transparent", ring: "hover:ring-2 hover:ring-slate-300", pill: "bg-slate-50 text-slate-500 border-slate-200" };
  }
};

const CARDS_PER_PAGE = 6;

interface StationSliderProps {
  onStationSelect?: (tableName: string) => void;
}

export function StationSlider({ onStationSelect }: StationSliderProps = {}) {
  const [cards, setCards] = useState<StationCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);

  useEffect(() => {
    async function loadData() {
      try {
        let stations: StationData[] | null = await supabaseFetch("stations", "show_on_home=eq.true");

        if (!stations || stations.length === 0) {
          stations = FALLBACK_STATIONS;
        }

        const cardsData: StationCardData[] = [];

        if (stations) {
          for (const st of stations) {
            // 1. Fetch latest data
            const latest = await supabaseFetch(st.table_name, "order=timestamp.desc&limit=1");
          
            // 2. Fetch min temp for today
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            let minTemp = undefined;
            try {
              const minResult = await supabaseFetch(st.table_name, `date=eq.${today}&order=temp_min.asc&limit=1`);
              if (minResult && minResult.length > 0) {
                minTemp = Math.round(minResult[0].temp_min);
              }
            } catch (e) {
              console.warn(`Could not fetch min temp for ${st.table_name}`);
            }

            if (latest && latest.length > 0) {
              const data = latest[0];
              const w = getWeatherCondition(data.temp, data.rh, data.rr);
              cardsData.push({
                station: st,
                time: `${formatUTCtoWIB(data.time)} WIB`,
                temp: Math.round(data.temp),
                rh: Math.round(data.rh),
                rr: data.rr,
                condition: w.text,
                icon: w.icon,
                min_temp: minTemp,
              });
            } else {
              cardsData.push({
                station: st,
                time: "--:-- WIB",
                temp: 0,
                rh: 0,
                rr: 0,
                condition: "Offline",
                icon: "cloud_off",
                min_temp: undefined,
              });
            }
          }
        }

        setCards(cardsData);
      } catch (e) {
        console.error("Error loading stations for slider", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 10 * 60 * 1000); // Refresh setiap 10 Menit
    return () => clearInterval(interval);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 0) page = totalPages - 1;
      if (page >= totalPages) page = 0;
      setCurrentPage(page);
    },
    [totalPages]
  );

  // Auto-advance silently every 5 seconds, paused on hover
  useEffect(() => {
    if (isPaused || totalPages <= 1) return;

    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1 >= totalPages ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, totalPages]);

  const pageCards = cards.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-3 text-text-secondary">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        <span className="text-sm font-medium">Memuat data stasiun...</span>
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col gap-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[22px]">thermostat</span>
          </div>
          <div className="flex items-start gap-2">
            <div>
              <h3 className="font-bold text-text-primary text-[1.2rem] leading-tight">Suhu Realtime Per Wilayah</h3>
              <p className="text-xs text-text-secondary mt-0.5">{cards.length} stasiun terpantau</p>
            </div>
            <div className="relative group/info ml-1 cursor-help mt-0.5">
              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover/info:bg-blue-100 transition-colors">
                <span className="material-symbols-outlined text-blue-500 text-[12px]">info</span>
              </div>
              
              {/* Tooltip Content */}
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-3 w-[240px] p-4 bg-white/95 backdrop-blur-md text-slate-700 text-[11px] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 z-50 translate-y-2 group-hover/info:translate-y-0 text-left pointer-events-none">
                <div className="font-bold text-xs mb-2 text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-500">help</span>
                  Indikator Cuaca Stasiun
                </div>
                <ul className="flex flex-col gap-2 text-slate-600 font-medium mt-3">
                  <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-600"></span><span className="text-indigo-600">Hujan Lebat</span></span> <span className="font-mono text-slate-400">CH &gt; 5mm</span></li>
                  <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500"></span><span className="text-sky-600">Hujan Ringan</span></span> <span className="font-mono text-slate-400">CH &gt; 0mm</span></li>
                  <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500"></span><span className="text-slate-600">Berawan Tebal</span></span> <span className="font-mono text-slate-400">RH &gt; 85%</span></li>
                  <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span className="text-amber-500">Cerah Berawan</span></span> <span className="font-mono text-slate-400">RH &gt; 70%</span></li>
                  <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span><span className="text-orange-500">Cerah</span></span> <span className="font-mono text-slate-400">RH &le; 70%</span></li>
                </ul>
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed font-normal">
                  Kalkulasi otomatis dari sensor Curah Hujan (CH) dan Kelembaban Udara (RH) instrumen AWS.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows & Page Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              aria-label="Previous page"
              className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center hover:bg-tertiary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-text-secondary">chevron_left</span>
            </button>
            <span className="text-xs font-semibold text-text-primary min-w-[48px] text-center tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              aria-label="Next page"
              className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center hover:bg-tertiary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-text-secondary">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Station Cards with Smooth Transition & Side Scroll */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pt-4 pb-6 px-1"
        >
          {pageCards.map((card, idx) => {
            const theme = getConditionTheme(card.condition);
            
            const inner = (
              <div className={`bg-white rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${theme.shadow} ring-1 ring-slate-100/80 ${theme.ring} group relative overflow-hidden h-full z-0 flex flex-col`}>

                {/* Status Dot (Top Right) */}
                <div className="absolute top-4 right-4 z-20 flex items-center justify-center">
                  {card.condition !== "Offline" ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.accent}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.accent}`}></span>
                    </span>
                  ) : (
                    <span className={`w-2.5 h-2.5 rounded-full ${theme.accent}`}></span>
                  )}
                </div>

                {/* Ambient Glow behind icon on hover */}
                <div className={`absolute top-12 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-gradient-to-b ${theme.glow} opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none`}></div>

                {/* Watermark */}
                <span 
                  className={`material-symbols-outlined absolute -bottom-4 -right-3 text-[120px] ${theme.icon} opacity-[0.02] group-hover:opacity-[0.05] rotate-[-15deg] group-hover:scale-110 transition-all duration-700 pointer-events-none`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {card.icon}
                </span>

                {/* Card Body */}
                <div className="flex flex-col items-center px-4 pt-4 pb-4 relative z-10 flex-1 justify-between gap-2">

                  {/* Station Name */}
                  <h4 className="font-bold text-slate-800 text-[0.9rem] leading-snug text-center w-full px-4 break-words">
                    {(card.station.display_name || card.station.station_name).replace("AWS ", "")}
                  </h4>

                  {/* Time Badge */}
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <span className="material-symbols-outlined text-[11px]">schedule</span>
                    <span className="text-[10px] font-semibold tracking-wide">{card.time}</span>
                  </div>

                  {/* Weather Icon */}
                  <div className="relative my-2 group-hover:scale-105 transition-transform duration-500">
                    <span
                      className={`material-symbols-outlined text-[52px] ${theme.icon} drop-shadow-sm`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {card.icon}
                    </span>
                  </div>

                  {/* Temperature */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-start">
                      <span className="text-[2.8rem] font-black text-slate-800 tracking-tighter leading-none tabular-nums">
                        {card.temp !== 0 ? card.temp : "--"}
                      </span>
                      <span className="text-lg font-bold text-slate-300 ml-0.5 mt-1">°C</span>
                    </div>
                    {/* Minimum Temperature Indicator */}
                    {card.min_temp !== undefined && (
                      <div className="flex items-center gap-1 mt-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        <span className="material-symbols-outlined text-[12px] text-blue-500">arrow_downward</span>
                        <span className="text-[10px] font-bold">Min: {card.min_temp}°C</span>
                      </div>
                    )}
                  </div>

                  {/* Divider Line */}
                  <hr className="w-full border-t border-slate-100 mt-2 mb-1" />

                  {/* Condition + Humidity Pills in Fixed Grid for Consistency */}
                  <div className="grid grid-cols-2 gap-1.5 w-full mt-1">
                    <div className={`flex items-center justify-center px-1.5 py-1 rounded-lg border text-[9.5px] font-bold text-center leading-[1.1] min-h-[30px] ${theme.pill}`}>
                      <span>{card.condition}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold min-h-[30px]">
                      <span className="material-symbols-outlined text-[11px]">water_drop</span>
                      <span>{card.rh !== 0 ? `${card.rh}%` : "--"}</span>
                    </div>
                  </div>

                </div>
              </div>
            );

            return onStationSelect ? (
              <div key={idx} onClick={() => onStationSelect(card.station.table_name)} className="h-full">
                {inner}
              </div>
            ) : (
              <Link key={idx} href={`/data-pengamatan?station=${card.station.table_name}`} className="h-full block">
                {inner}
              </Link>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Page Dots Navigation */}
      <div className="flex justify-center items-center gap-2">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToPage(idx)}
            aria-label={`Go to page ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentPage ? "w-7 bg-primary" : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
