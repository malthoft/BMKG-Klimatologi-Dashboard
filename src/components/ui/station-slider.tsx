"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabaseFetch } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { formatUTCtoWIB } from "@/lib/utils";

let globalCardsCache: StationCardData[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 menit

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

const StationCardSkeleton = () => (
  <div className="bg-white/50 rounded-2xl ring-1 ring-slate-100/80 relative overflow-hidden h-full flex flex-col justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-3 sm:pb-4 min-h-[220px] animate-pulse">
    <div className="flex flex-col items-center gap-2 w-full h-full">
      <div className="w-20 sm:w-24 h-4 bg-slate-200 rounded-md mx-auto mb-1"></div>
      <div className="w-14 sm:w-16 h-3 bg-slate-100 rounded-md mx-auto mb-2"></div>
      <div className="w-12 sm:w-14 h-12 sm:h-14 bg-slate-200/60 rounded-full mx-auto my-1"></div>
      <div className="w-16 sm:w-20 h-8 sm:h-10 bg-slate-200/80 rounded-md mx-auto mt-1"></div>
      <hr className="w-full border-t border-slate-50 my-2" />
      <div className="grid grid-cols-2 gap-1.5 w-full mt-auto">
        <div className="h-6 sm:h-7 bg-slate-100 rounded-lg"></div>
        <div className="h-6 sm:h-7 bg-slate-100 rounded-lg"></div>
      </div>
    </div>
  </div>
);

interface StationSliderProps {
  onStationSelect?: (tableName: string) => void;
}

export function StationSlider({ onStationSelect }: StationSliderProps = {}) {
  const [cards, setCards] = useState<StationCardData[]>(globalCardsCache || []);
  const [loading, setLoading] = useState(!globalCardsCache);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const cardsPerPage = 6;
  const totalPages = Math.ceil(cards.length / cardsPerPage);

  // Group cards in pairs of 2 for mobile horizontal slide
  const cardPairs: StationCardData[][] = [];
  for (let i = 0; i < cards.length; i += 2) {
    cardPairs.push(cards.slice(i, i + 2));
  }

  const handleMobileScroll = () => {
    if (mobileScrollRef.current) {
      const { scrollLeft, offsetWidth } = mobileScrollRef.current;
      const slideWidth = offsetWidth * 0.92;
      const index = Math.round(scrollLeft / slideWidth);
      setActiveMobileIndex(Math.min(Math.max(0, index), Math.max(0, cardPairs.length - 1)));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchBatch = async (batchStations: StationData[]) => {
      const results = await Promise.all(
        batchStations.map(st => supabaseFetch(st.table_name, "order=timestamp.desc&limit=1"))
      );
      
      const batchCards: StationCardData[] = [];
      batchStations.forEach((st, index) => {
        const latest = results[index];
        if (latest && latest.length > 0) {
          const data = latest[0];
          const w = getWeatherCondition(data.temp, data.rh, data.rr);
          let minTemp = undefined;
          if (data.temp_min !== undefined && data.temp_min !== null) {
            minTemp = Math.round(data.temp_min);
          }
          batchCards.push({
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
          batchCards.push({
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
      });
      return batchCards;
    };

    async function loadData(isIntervalUpdate = false) {
      try {
        const now = Date.now();
        
        if (!isIntervalUpdate && globalCardsCache && (now - lastFetchTime) < CACHE_DURATION) {
          if (isMounted) {
            setCards(globalCardsCache);
            setLoading(false);
          }
          return;
        }

        let stations: StationData[] | null = await supabaseFetch("stations", "show_on_home=eq.true");

        if (!stations || stations.length === 0) {
          stations = FALLBACK_STATIONS;
        }

        if (stations && stations.length > 0) {
          const firstBatch = stations.slice(0, 6);
          const secondBatch = stations.slice(6);

          const firstCards = await fetchBatch(firstBatch);
          if (isMounted && !isIntervalUpdate) {
            setCards(firstCards);
            setLoading(false);
          }

          if (secondBatch.length > 0 && isMounted) {
            const secondCards = await fetchBatch(secondBatch);
            if (isMounted) {
              const allCards = [...firstCards, ...secondCards];
              setCards(allCards);
              
              globalCardsCache = allCards;
              lastFetchTime = Date.now();
            }
          } else if (isMounted) {
            const allCards = firstCards;
            if (isIntervalUpdate) setCards(allCards);
            
            globalCardsCache = allCards;
            lastFetchTime = Date.now();
          }
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (e) {
        console.error("Error loading stations for slider", e);
        if (isMounted) setLoading(false);
      }
    }

    loadData(false);
    const interval = setInterval(() => loadData(true), CACHE_DURATION);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  const renderCard = (card: StationCardData, idx: number) => {
    const theme = getConditionTheme(card.condition);
    
    const inner = (
      <div className={`bg-white rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl ${theme.shadow} ring-1 ring-slate-100/80 ${theme.ring} group relative overflow-hidden h-full z-0 flex flex-col`}>

        {/* Status Dot (Top Right) */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center justify-center">
          {card.condition !== "Offline" ? (
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.accent}`}></span>
              <span className={`relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 ${theme.accent}`}></span>
            </span>
          ) : (
            <span className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${theme.accent}`}></span>
          )}
        </div>

        {/* Ambient Glow behind icon on hover */}
        <div className={`absolute top-10 sm:top-12 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-20 sm:h-28 rounded-full bg-gradient-to-b ${theme.glow} opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none`}></div>

        {/* Watermark */}
        <span 
          className={`material-symbols-outlined absolute -bottom-4 -right-3 text-[90px] sm:text-[120px] ${theme.icon} opacity-[0.02] group-hover:opacity-[0.05] rotate-[-15deg] group-hover:scale-110 transition-all duration-700 pointer-events-none`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {card.icon}
        </span>

        {/* Card Body */}
        <div className="flex flex-col items-center px-2.5 sm:px-4 pt-3 sm:pt-4 pb-3 sm:pb-4 relative z-10 flex-1 justify-between gap-1.5 sm:gap-2">

          {/* Station Name */}
          <h4 className="font-bold text-slate-800 text-[0.8rem] sm:text-[0.9rem] leading-snug text-center w-full px-1 break-words">
            {(card.station.display_name || card.station.station_name).replace("AWS ", "")}
          </h4>

          {/* Time Badge */}
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <span className="material-symbols-outlined text-[10px] sm:text-[11px]">schedule</span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide">{card.time}</span>
          </div>

          {/* Weather Icon */}
          <div className="relative my-1 sm:my-2 group-hover:scale-105 transition-transform duration-500">
            <span
              className={`material-symbols-outlined text-[40px] sm:text-[52px] ${theme.icon} drop-shadow-sm`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {card.icon}
            </span>
          </div>

          {/* Temperature */}
          <div className="flex flex-col items-center">
            <div className="flex items-start">
              <span className="text-[2.2rem] sm:text-[2.8rem] font-black text-slate-800 tracking-tighter leading-none tabular-nums">
                {card.temp !== 0 ? card.temp : "--"}
              </span>
              <span className="text-sm sm:text-lg font-bold text-slate-300 ml-0.5 mt-0.5 sm:mt-1">°C</span>
            </div>
            {/* Minimum Temperature Indicator */}
            {card.min_temp !== undefined && (
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1 bg-white px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-100 shadow-sm shadow-slate-200/20 group-hover:border-blue-100 group-hover:shadow-blue-100/50 transition-all">
                <div className="flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-blue-50 text-blue-600 shrink-0">
                  <span className="material-symbols-outlined font-bold leading-none" style={{ fontSize: '9px' }}>ac_unit</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mt-px">Min</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-700">{card.min_temp}°C</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider Line */}
          <hr className="w-full border-t border-slate-100 my-1" />

          {/* Condition + Humidity Pills in Fixed Grid for Consistency */}
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 w-full mt-0.5">
            <div className={`flex items-center justify-center px-1 sm:px-1.5 py-1 rounded-md sm:rounded-lg border text-[8.5px] sm:text-[9.5px] font-bold text-center leading-[1.1] min-h-[26px] sm:min-h-[30px] ${theme.pill}`}>
              <span className="text-center w-full">{card.condition}</span>
            </div>
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-1 rounded-md sm:rounded-lg border bg-blue-50 text-blue-700 border-blue-100 text-[8.5px] sm:text-[10px] font-bold min-h-[26px] sm:min-h-[30px]">
              <span className="material-symbols-outlined text-[10px] sm:text-[11px]">water_drop</span>
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
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-5">
        {/* Header Bar Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[22px]">thermostat</span>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <h3 className="font-bold text-text-primary text-[1.2rem] leading-tight">Suhu Realtime Per Wilayah</h3>
                <div className="w-32 h-3 bg-slate-200 rounded animate-pulse mt-1.5"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of Skeleton Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto pt-4 pb-6 px-1">
          {Array.from({ length: 6 }).map((_, idx) => (
            <StationCardSkeleton key={idx} />
          ))}
        </div>
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
            <div className="relative group/info ml-1 cursor-pointer outline-none" tabIndex={0} onClick={(e) => e.currentTarget.focus()}>
              <div className="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200/80 transition-all cursor-pointer shadow-2xs">
                <span className="material-symbols-outlined text-[14px] font-bold">info</span>
              </div>
              
              {/* Tooltip Content */}
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-3 w-[240px] p-4 bg-white/95 backdrop-blur-md text-slate-700 text-[11px] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 z-50 translate-y-2 group-hover/info:translate-y-0 text-left pointer-events-none">
                <div className="font-bold text-xs mb-2 text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-500">info</span>
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

        {/* Navigation Arrows & Page Counter (Desktop Only) */}
        <div className="hidden lg:flex items-center gap-3">
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

      {/* 1. Mobile & Tablet Swipeable Carousel (block lg:hidden) - 2 Cards per slide */}
      <div className="block lg:hidden w-full">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-4 pt-2 scrollbar-hide -mx-6 px-6"
        >
          {cardPairs.map((pair, slideIdx) => (
            <div key={slideIdx} className="w-[92vw] sm:w-[88vw] shrink-0 snap-center grid grid-cols-2 gap-2.5 sm:gap-4">
              {pair.map((card, idx) => (
                <div key={idx} className="w-full h-full">
                  {renderCard(card, slideIdx * 2 + idx)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Mobile Dot Indicators */}
        {cardPairs.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-2 overflow-x-auto py-1 max-w-full">
            {cardPairs.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (mobileScrollRef.current) {
                    const slideWidth = mobileScrollRef.current.offsetWidth * 0.92;
                    mobileScrollRef.current.scrollTo({ left: idx * slideWidth, behavior: "smooth" });
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeMobileIndex === idx ? "w-6 bg-primary" : "w-2 bg-slate-300"
                }`}
                aria-label={`Ke slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Desktop Grid with Smooth Page Transitions (hidden lg:block) */}
      <div className="hidden lg:block w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="grid grid-cols-6 gap-4 pt-2 pb-4"
          >
            {pageCards.map((card, idx) => renderCard(card, idx))}
          </motion.div>
        </AnimatePresence>

        {/* Desktop Page Dots Navigation */}
        <div className="flex justify-center items-center gap-2 mt-2">
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
    </div>
  );
}
