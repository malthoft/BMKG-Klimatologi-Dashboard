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
}

const getWeatherCondition = (temp: number, rh: number, rr: number) => {
  if (rr > 5) return { text: "Hujan Lebat", icon: "rainy", color: "text-blue-600" };
  if (rr > 0) return { text: "Hujan Ringan", icon: "rainy", color: "text-blue-500" };
  if (rh > 85) return { text: "Berawan Tebal", icon: "cloud", color: "text-gray-500" };
  if (rh > 70) return { text: "Cerah Berawan", icon: "partly_cloudy_day", color: "text-amber-500" };
  return { text: "Cerah", icon: "sunny", color: "text-amber-400" };
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

        for (const st of stations) {
          const latest = await supabaseFetch(st.table_name, "order=timestamp.desc&limit=1");

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
            });
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
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[22px]">thermostat</span>
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-[1.2rem] leading-tight">Suhu Realtime Per Wilayah</h3>
            <p className="text-xs text-text-secondary mt-0.5">{cards.length} stasiun terpantau</p>
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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-1"
        >
          {pageCards.map((card, idx) => {
            const inner = (
              <div className="bg-gradient-to-b from-[#EAF2FF] to-[#F5F8FF] hover:from-[#DCEAFF] hover:to-[#EBF2FF] border border-[#D0DFEF] rounded-2xl p-5 flex flex-col items-center justify-between min-h-[220px] cursor-pointer transition-all duration-300 text-center h-full hover:shadow-lg hover:border-primary/40 group">
                <div className="w-full">
                  <h4 className="font-bold text-text-primary text-[0.95rem] leading-tight truncate">
                    {card.station.station_name.replace("AWS ", "")}
                  </h4>
                  <p className="text-[0.7rem] text-text-secondary mt-1 font-medium">{card.time}</p>
                </div>

                <div className="my-3">
                  <span
                    className={`material-symbols-outlined text-[48px] ${card.condition === "Offline" ? "text-gray-400" : "text-primary"} group-hover:scale-110 transition-transform`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {card.icon}
                  </span>
                </div>

                <div className="w-full">
                  <div className="text-[2rem] font-extrabold text-text-primary tracking-tight leading-none">
                    {card.temp !== 0 ? `${card.temp}°` : "--"}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-[14px] text-primary">water_drop</span>
                    <span className="text-[0.75rem] text-text-secondary font-medium">
                      {card.rh !== 0 ? `${card.rh}%` : "--"}
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-text-secondary font-semibold mt-1">{card.condition}</p>
                </div>
              </div>
            );

            return onStationSelect ? (
              <div key={idx} onClick={() => onStationSelect(card.station.table_name)} className="h-full">
                {inner}
              </div>
            ) : (
              <Link key={idx} href={`/realtime-data?station=${card.station.table_name}`} className="h-full block">
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
