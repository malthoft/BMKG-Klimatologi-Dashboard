"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { StationSlider } from "@/components/ui/station-slider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch } from "@/lib/supabase";
import { formatUTCtoWIB } from "@/lib/utils";
import { FALLBACK_STATIONS } from "@/lib/constants";

const getWeatherCondition = (temp: number, rh: number, rr: number) => {
  if (rr > 5) return { text: "Hujan Lebat", icon: "rainy" };
  if (rr > 0) return { text: "Hujan Ringan", icon: "rainy" };
  if (rh > 85) return { text: "Berawan Tebal", icon: "cloud" };
  if (rh > 70) return { text: "Cerah Berawan", icon: "partly_cloudy_day" };
  return { text: "Cerah", icon: "sunny" };
};

const HeatIndexCard = ({ temp, rh }: { temp: number, rh: number }) => {
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
  const apparentTemp = temp + 0.33 * e - 4.00;
  const feelsLike = Math.round(apparentTemp);
  
  let statusText = "Nyaman";
  let statusColor = "text-green-500";
  let bgGradient = "from-green-500/20 to-emerald-500/5";
  let icon = "mood";

  if (feelsLike >= 32 && feelsLike < 39) {
    statusText = "Cukup Gerah";
    statusColor = "text-amber-500";
    bgGradient = "from-amber-500/20 to-orange-500/5";
    icon = "local_fire_department";
  } else if (feelsLike >= 39) {
    statusText = "Sangat Panas (Bahaya)";
    statusColor = "text-red-500";
    bgGradient = "from-red-500/20 to-rose-500/5";
    icon = "warning";
  } else if (feelsLike < 25) {
    statusText = "Sejuk";
    statusColor = "text-blue-500";
    bgGradient = "from-blue-500/20 to-cyan-500/5";
    icon = "ac_unit";
  }

  return (
    <div className="w-full max-w-[380px] flex flex-col gap-4 animate-fade-in shrink-0 mt-8 lg:mt-0">
      <div className={`bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg border-2 border-white/80 ring-1 ring-slate-100/50 relative group hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] hover:border-blue-100/60 hover:-translate-y-1 transition-all duration-500`}>
        {/* Isolated Overflow Hidden wrapper for the blur effect */}
        <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden pointer-events-none">
          <div className={`absolute -right-8 -top-8 w-48 h-48 bg-gradient-to-br ${bgGradient} rounded-full blur-[40px] group-hover:scale-125 transition-transform duration-700 opacity-80`}></div>
        </div>
        
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center justify-between mb-4 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">thermostat</span>
              Suhu Terasa
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className={`material-symbols-outlined ${statusColor} text-[16px] animate-pulse`}>{icon}</span>
                <span className={`font-bold text-[12px] ${statusColor}`}>{statusText}</span>
              </div>
              <div className="relative group/info ml-1 cursor-help">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover/info:bg-blue-100 transition-colors">
                  <span className="material-symbols-outlined text-blue-500 text-[14px]">info</span>
                </div>
                
                {/* Tooltip Content - Unrestricted by overflow */}
                <div className="absolute right-0 top-full mt-3 w-[240px] p-4 bg-white/95 backdrop-blur-md text-slate-700 text-[11px] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 z-50 translate-y-2 group-hover/info:translate-y-0 text-left pointer-events-none">
                  <div className="font-bold text-xs mb-2 text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-500">help</span>
                    Indikator Suhu Terasa
                  </div>
                  <ul className="flex flex-col gap-2 text-slate-600 font-medium mt-3">
                    <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span><span className="text-blue-500">Sejuk</span></span> <span className="font-mono text-slate-400">&lt; 25°C</span></li>
                    <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span><span className="text-green-500">Nyaman</span></span> <span className="font-mono text-slate-400">25 - 31.9°C</span></li>
                    <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span className="text-amber-500">Gerah</span></span> <span className="font-mono text-slate-400">32 - 38.9°C</span></li>
                    <li className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span><span className="text-red-500">Bahaya</span></span> <span className="font-mono text-slate-400">&ge; 39°C</span></li>
                  </ul>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed font-normal">
                    Suhu yang dirasakan tubuh akibat efek kelembaban.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center mb-5 mt-1 ml-1">
            <div className="flex items-start gap-1">
              <span className={`text-[4rem] leading-none font-black tracking-tighter ${statusColor} drop-shadow-sm`}>
                {feelsLike || 0}
              </span>
              <span className={`text-[1.5rem] font-bold ${statusColor} mt-1.5`}>°C</span>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl p-3.5 flex justify-between items-center border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center w-1/2 border-r border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Suhu Asli</span>
              <span className="font-bold text-slate-700 text-lg flex items-center gap-0.5">{Math.round(temp) || 0}<span className="text-sm font-semibold text-slate-400">°C</span></span>
            </div>
            <div className="flex flex-col items-center w-1/2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Kelembaban</span>
              <span className="font-bold text-slate-700 text-lg flex items-center gap-0.5">{Math.round(rh) || 0}<span className="text-sm font-semibold text-slate-400">%</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // --- Realtime Data States ---
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("aws_malang");
  const [stationName, setStationName] = useState<string>("AWS Malang");
  const [latestData, setLatestData] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStations = stations.filter(st => st.station_name.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    async function init() {
      try {
        let sts = await supabaseFetch("stations", "show_on_realtime=eq.true");
        if (!sts || sts.length === 0) {
          sts = FALLBACK_STATIONS;
        }
        sts = sts.filter((st: any) => st.table_name !== "aws_tanggul");
        setStations(sts);
        
        if (sts && sts.length > 0) {
          const malang = sts.find((s: any) => s.table_name === "aws_malang");
          if (malang) {
            setSelectedStation("aws_malang");
            setStationName(malang.station_name);
          } else {
            setSelectedStation(sts[0].table_name);
            setStationName(sts[0].station_name);
          }
        }
      } catch (e) {
        console.error("Error loading stations", e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedStation) return;
    
    async function loadData() {
      try {
        const st = stations.find(s => s.table_name === selectedStation);
        if (st) setStationName(st.station_name);

        const latest = await supabaseFetch(selectedStation, "order=timestamp.desc&limit=1");
        if (latest && latest.length > 0) {
          setLatestData(latest[0]);
        } else {
          setLatestData(null);
        }
      } catch (e) {
        console.error("Error loading realtime data", e);
        setLatestData(null);
      }
    }
    
    loadData();
    const interval = setInterval(loadData, 10 * 60 * 1000); // Refresh setiap 10 Menit
    return () => clearInterval(interval);
  }, [selectedStation, stations]);

  const loadAnnouncements = useCallback(async () => {
    try {
      const anns = await supabaseFetch("announcements", "order=published_at.desc&limit=3");
      if (anns && anns.length > 0) {
        setAnnouncements(anns);
      } else {
        setAnnouncements([
          {
            id: 1,
            title: "Waspada Hujan Lebat & Angin Kencang",
            content: "Potensi cuaca ekstrem disertai hujan lebat dan petir di wilayah Malang Raya.",
            category: "peringatan_dini",
            published_at: new Date().toISOString(),
          },
          {
            id: 2,
            title: "Proyeksi Awal Musim Kemarau 2026",
            content: "Prakiraan awal musim kemarau tahun 2026 untuk wilayah Jawa Timur bagian selatan.",
            category: "info",
            published_at: new Date().toISOString(),
          },
          {
            id: 3,
            title: "Sosialisasi Pemahaman Iklim Bagi Petani",
            content: "Kegiatan edukasi pemanfaatan data iklim terpadu untuk efisiensi sektor pertanian.",
            category: "kegiatan",
            published_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error("Error loading announcements", e);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 10 * 60 * 1000); // Refresh setiap 10 Menit
    return () => clearInterval(interval);
  }, [loadAnnouncements]);

  const weather = latestData 
    ? getWeatherCondition(latestData.temp, latestData.rh, latestData.rr)
    : { text: "Offline", icon: "cloud_off" };

  const getBadgeVariant = (cat: string): "error" | "success" | "neutral" | "warning" => {
    switch (cat) {
      case "peringatan_dini": return "error";
      case "kegiatan": return "success";
      case "info": return "neutral";
      default: return "neutral";
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "peringatan_dini": return "Peringatan Dini";
      case "kegiatan": return "Kegiatan";
      case "info": return "Informasi Iklim";
      default: return "Pengumuman";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "peringatan_dini": return "warning";
      case "kegiatan": return "groups";
      case "info": return "info";
      default: return "article";
    }
  };

  const getCategoryAccent = (cat: string) => {
    switch (cat) {
      case "peringatan_dini": return "border-l-error";
      case "kegiatan": return "border-l-success";
      case "info": return "border-l-primary";
      default: return "border-l-primary";
    }
  };

  const handleStationSelect = (tableName: string) => {
    setSelectedStation(tableName);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <>
      <Header activeRoute="/" />

      <main className="flex-grow w-full">
        {/* ═══════════════════════════════════════════════════ */}
        {/* 1. CUACA TERKINI — Clean Modern Blue Gradient Card */}
        {/* ═══════════════════════════════════════════════════ */}
        <section id="cuaca-realtime" className="max-w-7xl mx-auto px-6 md:px-8 pt-6 pb-2 w-full scroll-mt-[80px]">
          <AnimatedContainer animation="fadeInUp" once={true} className="w-full">
            <div className="bg-gradient-to-r from-[#b2cbf2] via-[#c2d6f6] to-[#e2ebf8] text-slate-900 rounded-3xl p-6 md:p-8 shadow-lg border border-white/80 relative w-full overflow-visible">
              {/* Ambient Glow */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/40 rounded-full blur-2xl" />
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-300/40 rounded-full blur-2xl" />
              </div>

              <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 xl:gap-8 w-full">
                {/* Left: Main temperature display */}
                <div className="flex items-center gap-5 shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-white/95 via-white/85 to-blue-50/70 backdrop-blur-xl flex items-center justify-center border border-white shadow-md relative overflow-hidden shrink-0 group hover:shadow-xl hover:scale-105 transition-all duration-300">
                    {/* Inner glowing halo */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/25 via-sky-300/20 to-transparent blur-sm rounded-3xl group-hover:scale-125 transition-transform duration-500" />
                    
                    {/* Floating weather icon */}
                    <div className="relative z-10 flex items-center justify-center animate-float">
                      <span
                        className="material-symbols-outlined text-[54px] md:text-[66px] text-amber-500 drop-shadow-[0_8px_16px_rgba(245,158,11,0.5)] group-hover:rotate-6 transition-transform duration-300"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                      >
                        {weather.icon}
                      </span>
                    </div>

                    {/* Glass glare highlight */}
                    <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/50 rounded-full blur-md pointer-events-none" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-900/10 text-blue-900 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-900/20 whitespace-nowrap">
                        CUACA TERKINI
                      </span>
                    </div>
                    <div className="text-[48px] md:text-[60px] font-black leading-none tracking-tight text-slate-900 whitespace-nowrap">
                      {latestData ? Math.round(latestData.temp) : "--"}°<span className="text-[28px] md:text-[36px] font-bold text-slate-600">C</span>
                    </div>
                    <p className="text-slate-700 font-bold text-base mt-1 whitespace-nowrap">{weather.text}</p>
                  </div>
                </div>

                {/* Center: Station & Location Info */}
                <div className="flex flex-col gap-1.5 xl:border-l xl:border-slate-800/15 xl:pl-8 relative z-20 shrink-0">
                  <div className="flex items-center gap-2 text-slate-900 text-sm font-bold whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px] text-blue-700">location_on</span>
                    
                    <div className="relative z-30">
                      <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="bg-white/70 hover:bg-white border border-white/90 text-slate-900 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer outline-none transition-all shadow-xs text-sm"
                      >
                        <span>{stationName}</span>
                        <span className="material-symbols-outlined text-[16px] text-slate-600">{isDropdownOpen ? "expand_less" : "expand_more"}</span>
                      </button>

                      {isDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                          <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 min-w-[260px] text-slate-900 font-normal">
                            <div className="p-2 border-b border-slate-100 bg-slate-50">
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                <input 
                                  type="text" 
                                  placeholder="Cari stasiun..." 
                                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 transition-shadow"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto bg-white">
                              {filteredStations.length > 0 ? (
                                filteredStations.map(st => (
                                  <div 
                                    key={st.id} 
                                    className={`px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors text-xs ${selectedStation === st.table_name ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 font-medium"}`}
                                    onClick={() => {
                                      setSelectedStation(st.table_name);
                                      setIsDropdownOpen(false);
                                      setSearchQuery("");
                                    }}
                                  >
                                    {st.station_name}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-center text-xs text-slate-400">Tidak ada hasil</div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold whitespace-nowrap">
                    <span className="material-symbols-outlined text-[14px] text-blue-700">schedule</span>
                    {latestData?.date && <span>{latestData.date}</span>}
                    <span>Pukul {latestData?.time ? formatUTCtoWIB(latestData.time) : "--:--"} WIB</span>
                  </div>
                </div>

                {/* Right: Parameter Badges */}
                <div className="flex flex-wrap xl:flex-nowrap justify-start xl:justify-end gap-2 md:gap-3 shrink-0 w-full xl:w-auto">
                  {[
                    { icon: "water_drop", label: "Kelembaban", value: latestData ? `${Math.round(latestData.rh)}%` : "--", color: "text-blue-700" },
                    { icon: "air", label: "Angin", value: latestData ? `${parseFloat((latestData.ws || 0).toFixed(1))} km/h` : "--", color: "text-teal-700" },
                    { icon: "rainy", label: "Curah Hujan", value: latestData ? `${parseFloat((latestData.rr || 0).toFixed(1))} mm` : "--", color: "text-indigo-700" },
                    { icon: "speed", label: "Tekanan", value: (latestData && latestData.press > 0) ? `${Math.round(latestData.press)} hPa` : "--", color: "text-amber-700" },
                  ].map((param) => (
                    <div
                      key={param.label}
                      className="bg-white/75 backdrop-blur-md border border-white/90 rounded-2xl px-4 py-3 md:py-4 flex flex-col items-start justify-center shadow-xs min-w-[130px] flex-1 xl:flex-none"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5 whitespace-nowrap w-full">
                        <span className={`material-symbols-outlined text-[18px] shrink-0 ${param.color}`}>{param.icon}</span>
                        <span className="text-[0.65rem] md:text-[0.7rem] text-slate-700 font-bold uppercase tracking-wider">{param.label}</span>
                      </div>
                      <span className="text-xl font-extrabold text-slate-900 tracking-tight w-full">{param.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </section>



        {/* ═══════════════════════════════════════════════════ */}
        {/* 2. HERO WELCOME SECTION */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-6 md:py-8 w-full flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div>
              <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider whitespace-nowrap">
                STASIUN KLIMATOLOGI MALANG
              </span>
            </div>

            <h1 className="text-[2.25rem] sm:text-[2.75rem] md:text-[3.25rem] font-extrabold text-text-primary leading-[1.15] tracking-tight w-full">
              Portal Informasi Cuaca &amp; Iklim Jawa Timur
            </h1>

            <AnimatedContainer animation="fadeInUp" delay={0.15} once={true} className="w-full">
              <p className="text-text-secondary text-[1.05rem] md:text-[1.15rem] leading-relaxed w-full">
                Menyediakan data cuaca dan iklim terpercaya, akurat, dan up-to-date untuk masyarakat Malang Raya dan sekitarnya. Pantau kondisi lingkungan Anda setiap saat.
              </p>
            </AnimatedContainer>

            <AnimatedContainer animation="fadeInUp" delay={0.25} once={true} className="w-full">
              <div className="flex flex-wrap gap-3 mt-2">
                <Link href="/realtime-data">
                  <button className="bg-primary text-white hover:bg-secondary px-6 py-3 rounded-full font-semibold text-[1rem] transition-all hover:-translate-y-1 inline-flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer">
                    Lihat Data Pengamatan
                    <span className="material-symbols-outlined text-[20px]">explore</span>
                  </button>
                </Link>
                <Link href="/profile">
                  <button className="bg-transparent border border-border text-text-primary hover:bg-tertiary px-6 py-3 rounded-lg font-semibold text-[1rem] transition-colors inline-flex items-center gap-2 cursor-pointer">
                    Tentang Stasiun
                  </button>
                </Link>
              </div>
            </AnimatedContainer>
          </div>
          
          <AnimatedContainer animation="slideInRight" delay={0.3} once={true} className="w-full lg:w-auto flex justify-center lg:justify-end">
             <HeatIndexCard temp={latestData?.temp ?? 0} rh={latestData?.rh ?? 0} />
          </AnimatedContainer>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 3. AWS STATION GRID */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-6 md:pb-8 w-full">
          <AnimatedContainer animation="fadeInUp" delay={0.1} once={true} className="w-full">
            <StationSlider onStationSelect={handleStationSelect} />
          </AnimatedContainer>
        </section>



        {/* ═══════════════════════════════════════════════════ */}
        {/* 5. PENGUMUMAN TERBARU — With color accent */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-6 md:py-8 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 w-full">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-1 block whitespace-nowrap">Informasi &amp; Peringatan</span>
              <h2 className="text-[1.75rem] font-bold text-text-primary leading-tight">Pengumuman Terbaru</h2>
            </div>
            <Link href="/announcements" className="text-primary font-semibold hover:text-secondary flex items-center gap-1 text-sm group whitespace-nowrap">
              Lihat Semua Pengumuman
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {loadingAnnouncements ? (
              <div className="py-10 text-center text-text-secondary">Memuat pengumuman...</div>
            ) : (
              announcements.map((ann, idx) => (
                <AnimatedContainer key={ann.id || idx} animation="fadeInUp" delay={0.08 * idx} once={true} className="w-full">
                  <Link href="/announcements" className="block w-full">
                    <div className={`bg-surface border border-border/70 hover:border-primary/40 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 hover:shadow-lg transition-all cursor-pointer group border-l-4 ${getCategoryAccent(ann.category)} w-full`}>
                      <div className="w-10 h-10 rounded-lg bg-tertiary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[22px]">{getCategoryIcon(ann.category)}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant={getBadgeVariant(ann.category)}>
                            {getCategoryLabel(ann.category)}
                          </Badge>
                        </div>
                        <h4 className="text-[1.05rem] text-text-primary font-bold mb-1 group-hover:text-primary transition-colors truncate">
                          {ann.title}
                        </h4>
                        <p className="text-[0.875rem] text-text-secondary line-clamp-1">{ann.content}</p>
                      </div>
                      <div className="text-text-secondary font-medium text-[0.75rem] whitespace-nowrap flex items-center gap-1.5 bg-tertiary/50 px-3 py-1.5 rounded-full border border-border/50 shrink-0">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {ann.published_at
                          ? new Date(ann.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : "Terbaru"}
                      </div>
                    </div>
                  </Link>
                </AnimatedContainer>
              ))
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 6. INSTAGRAM BMKG */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="bg-tertiary/30 py-12 md:py-16 border-t border-border w-full">
          <div className="max-w-7xl mx-auto px-6 md:px-8 w-full">
            <AnimatedContainer animation="fadeInUp" once={true} className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
              <div>
                <h2 className="text-[1.5rem] font-bold text-text-primary flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[28px]">photo_camera</span>
                  Instagram @bmkg.iklimjatim
                </h2>
                <p className="text-text-secondary text-[0.9rem] mt-1">Dokumentasi kegiatan operasional, edukasi, dan pengamatan iklim.</p>
              </div>
              <a
                className="inline-flex items-center gap-2 font-semibold text-primary hover:text-secondary transition-colors bg-surface border border-border px-4 py-2.5 rounded-full text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                href="https://www.instagram.com/bmkg.iklimjatim/"
                target="_blank"
                rel="noreferrer"
              >
                <span>Kunjungi Instagram</span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            </AnimatedContainer>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDJCz4HXllE5ZKWwkJK1niD6TsdSSNOXicUMe_HoyuITFg-PBoJwNdWsYmSF36tDI3MS3SSZa4GKQgN4Ls_0LuTa7gpnyagLwzLx0EruYCc5UO7S4KI5dUzWI_01zNngS4DM9N8jv67yn_EyScHh5OZWl9Rl7rNh_fvh_w1tTpKP4AKMrA8_OZpWSwBcbp08l-ARmr4TIte7U3cQ9NwYKdz5o1MWNITa6wxvdAK2nWa0tmKkMhAgYBVszW1jo7WKBZe0NZTRa7Xnys",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBDlmz34yJ9K7BJmKxn6tyXtSjIaPtOHHoES3vyCcoWT-oOrmH0JnX63Sh-Qv0bzMX6ZqGRQueubo9sGGmwS4qlBsVxoqoqy6BGR5KqiWfmEDfpcP45Wmz5-xjMgOok9Pll9AB7lIH5IZ72Uy-xyHT7LQw-StKXgcXAq9873HGTa5MXzgj_Zcryx9LoLMKJGQvXC8RvhK_USQrjIe3lVjmmxUYmZ8J6YlP1iKMWAxuGAvf4EHwCXZ3IwjFDGJiLPFna0oBL_btdTjM",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuB8O3CFQkxw6oXSvVy8OB3ifIp10xLRDbsZkER7D3N-yZIF_EpnEuU2MfT0cFnF1gYhVs5at1a4BwYnnIJn1xZvV0eykd4MKzzlPJiANr1UMTV1qJbnE3JGUtZYRLzNHIcTqindw7gVlrLrQG3nenM_Y47T2kB8mHeyGx-hpfgh6zWedPSK1FjmEdvjWVUhZ_VqOxwuInZAcGf_4gHjV5l7mc0PommD3B2CzOq7Dt-fAsO4KlQh47QeY-neyPQRglyQX0pGtDlKcl4",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAZYSwKCAYFrlQl0bLneconT-K1mTmNpk0iW2zBCN9eje1bPFp1Qyn-8hpgspuxWY4IO5ZTHiWZCaEArr9ZNSk6Hkr2EEhuXqHXM0e4zPTznzTkyU1L05ngBB6MMFWMHVQFkCQ9-D2DhYzQeNfJY7O_NnqgMB-PrPerppcfS0HlWJiNCenIXJI_olYZ7YaPCgPlxuzOqyGlMwUkg0loSfCSF6w06TglFKefpJkqukV6l84h-yAB4V0BD8kSekSAlj7DlxRH95mc2vQ",
              ].map((src, idx) => (
                <AnimatedContainer key={idx} animation="scaleIn" delay={0.08 * idx} once={true} className="w-full">
                  <a href="https://www.instagram.com/bmkg.iklimjatim/" target="_blank" rel="noreferrer" className="block aspect-square bg-surface rounded-xl overflow-hidden relative group shadow-sm border border-border/70 w-full cursor-pointer">
                    <img
                      alt={`Instagram Post ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={src}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="flex items-center gap-4 text-white text-sm font-medium">
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">open_in_new</span> Buka di IG</span>
                      </div>
                    </div>
                  </a>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
