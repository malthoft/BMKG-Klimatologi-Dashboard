"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { InstagramIcon as Instagram } from "@/components/ui/instagram-icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { StationSlider } from "@/components/ui/station-slider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch } from "@/lib/supabase";
import { formatUTCtoWIB } from "@/lib/utils";
import { FALLBACK_STATIONS } from "@/lib/constants";

const formatIndonesianDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getWeatherCondition = (temp: number, rh: number, rr: number) => {
  if (rr > 5) return { text: "Hujan Lebat", icon: "rainy" };
  if (rr > 0) return { text: "Hujan Ringan", icon: "rainy" };
  if (rh > 85) return { text: "Berawan Tebal", icon: "cloud" };
  if (rh > 70) return { text: "Cerah Berawan", icon: "partly_cloudy_day" };
  return { text: "Cerah", icon: "sunny" };
};

const calculateNOAAHeatIndex = (tempC: number, rh: number): number => {
  // 1. Konversi Celsius ke Fahrenheit (Rumus dasar NOAA menggunakan Fahrenheit)
  const T = (tempC * 9 / 5) + 32;

  // 2. Gunakan rumus sederhana (Steadman) terlebih dahulu
  let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (rh * 0.094));

  // 3. Jika hasil rumus sederhana >= 80°F, gunakan regresi Rothfusz penuh
  if (HI >= 80) {
    HI = -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh - 0.00683783 * T * T - 0.05481717 * rh * rh + 0.00122874 * T * T * rh + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;

    // Penyesuaian untuk udara kering dan panas
    if (rh < 13 && T >= 80 && T <= 112) {
      HI -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    }
    // Penyesuaian untuk udara sangat lembab dan tidak terlalu panas
    else if (rh > 85 && T >= 80 && T <= 87) {
      HI += ((rh - 85) / 10) * ((87 - T) / 5);
    }
  }

  // 4. Kembalikan hasilnya ke Celsius
  return (HI - 32) * 5 / 9;
};

const HeatIndexCard = ({ temp, rh }: { temp: number, rh: number }) => {
  const apparentTemp = calculateNOAAHeatIndex(temp, rh);
  const feelsLike = Math.round(apparentTemp);

  return (
    <div className="w-full max-w-[360px] flex flex-col gap-3 animate-fade-in shrink-0 mt-4 lg:mt-0">
      <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/80 relative group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Header Row */}
          <div className="flex items-center justify-between w-full mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider border border-blue-100 shadow-2xs">
              <span className="material-symbols-outlined text-[14px] text-blue-600">thermostat</span>
              Suhu Terasa
            </div>

            {/* Refined Blue Info Icon Button */}
            <div className="relative group/info cursor-pointer outline-none" tabIndex={0} onClick={(e) => e.currentTarget.focus()}>
              <div className="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200/80 transition-all cursor-pointer shadow-2xs">
                <span className="material-symbols-outlined text-[14px] font-bold">info</span>
              </div>

              {/* Tooltip Content */}
              <div className="absolute right-0 top-full mt-2 w-[260px] p-3.5 bg-white text-slate-700 text-[11px] rounded-xl shadow-xl border border-slate-200 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible group-focus/info:opacity-100 group-focus/info:visible transition-all duration-200 z-50 translate-y-1 group-hover/info:translate-y-0 text-left pointer-events-none">
                <div className="font-bold text-xs mb-1.5 text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">info</span>
                  Tentang Suhu Terasa
                </div>
                <div className="text-slate-600 font-medium leading-relaxed text-justify">
                  Suhu terasa (Heat Index) ini dihitung menggunakan formula dari <strong>NOAA (National Oceanic and Atmospheric Administration)</strong>. Nilai ini menggambarkan suhu yang dirasakan tubuh berdasarkan kombinasi <strong>suhu udara</strong> dan <strong>kelembaban relatif</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Large Clean Dark Slate Temperature Display */}
          <div className="flex items-baseline justify-center gap-1 my-1">
            <span className="text-[3.85rem] leading-none font-black tracking-tight text-slate-800">
              {feelsLike || 0}
            </span>
            <span className="text-[1.5rem] font-bold text-slate-500">°C</span>
          </div>

          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Sensasi Suhu yang Dirasakan</span>

          {/* Sub-metrics Grid (2 Columns: Suhu Udara & Kelembaban) */}
          <div className="w-full grid grid-cols-2 gap-2 mt-1">
            <div className="bg-slate-50 rounded-xl py-2 px-3 flex flex-col items-center justify-center border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <span className="material-symbols-outlined text-[14px] text-rose-500">thermostat</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Suhu Udara</span>
              </div>
              <span className="font-extrabold text-slate-800 text-base">{Math.round(temp) || 0}<span className="text-[11px] font-bold text-slate-400">°C</span></span>
            </div>

            <div className="bg-slate-50 rounded-xl py-2 px-3 flex flex-col items-center justify-center border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <span className="material-symbols-outlined text-[14px] text-sky-500">water_drop</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Kelembaban</span>
              </div>
              <span className="font-extrabold text-slate-800 text-base">{Math.round(rh) || 0}<span className="text-[11px] font-bold text-slate-400">%</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [beritaKegiatan, setBeritaKegiatan] = useState<any[]>([]);
  const [loadingBerita, setLoadingBerita] = useState(true);
  const [instagramPosts, setInstagramPosts] = useState<any[]>([]);

  // --- Realtime Data States ---
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("aws_malang");
  const [stationName, setStationName] = useState<string>("AWS Malang");
  const [latestData, setLatestData] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStations = stations.filter(st => {
    const nameToSearch = st.display_name || st.station_name;
    return nameToSearch.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            setStationName(malang.display_name || malang.station_name);
          } else {
            setSelectedStation(sts[0].table_name);
            setStationName(sts[0].display_name || sts[0].station_name);
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
        if (st) setStationName(st.display_name || st.station_name);

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

  const loadBeritaKegiatan = useCallback(async () => {
    try {
      const berita = await supabaseFetch("berita_kegiatan", "order=published_at.desc&limit=3");
      if (berita && berita.length > 0) {
        setBeritaKegiatan(berita);
      } else {
        setBeritaKegiatan([]);
      }
    } catch (e) {
      console.error("Error loading berita & kegiatan", e);
      setBeritaKegiatan([]);
    } finally {
      setLoadingBerita(false);
    }
  }, []);

  useEffect(() => {
    loadBeritaKegiatan();
    loadInstagramPosts();
    const interval = setInterval(() => {
      loadBeritaKegiatan();
      loadInstagramPosts();
    }, 10 * 60 * 1000); // Refresh setiap 10 Menit
    return () => clearInterval(interval);
  }, [loadBeritaKegiatan]);

  const loadInstagramPosts = async () => {
    try {
      const posts = await supabaseFetch("instagram_posts", "order=created_at.desc&limit=4");
      if (posts) setInstagramPosts(posts);
    } catch (e) {
      console.error("Error loading instagram posts", e);
    }
  };

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

  const getCategoryGradient = (cat: string) => {
    switch (cat) {
      case "peringatan_dini": return "from-red-500 to-orange-500";
      case "kegiatan": return "from-emerald-500 to-teal-500";
      case "info": return "from-blue-500 to-cyan-500";
      default: return "from-blue-500 to-cyan-500";
    }
  };

  const getCategoryIconBg = (cat: string) => {
    switch (cat) {
      case "peringatan_dini": return "bg-red-50 border border-red-100";
      case "kegiatan": return "bg-emerald-50 border border-emerald-100";
      case "info": return "bg-blue-50 border border-blue-100";
      default: return "bg-blue-50 border border-blue-100";
    }
  };

  const getCategoryIconColor = (cat: string) => {
    switch (cat) {
      case "peringatan_dini": return "text-red-600";
      case "kegiatan": return "text-emerald-600";
      case "info": return "text-blue-600";
      default: return "text-blue-600";
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
                <div className="flex flex-col gap-1 xl:border-l xl:border-slate-800/15 xl:pl-8 relative z-20 shrink-0">
                  <div className="flex items-center gap-2 text-slate-900 text-sm font-bold whitespace-nowrap">
                    <div className="w-5 flex justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px] text-blue-700">location_on</span>
                    </div>

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
                                    {st.display_name || st.station_name}
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

                  <div className="flex items-center gap-2 text-slate-900 text-[11px] font-medium whitespace-nowrap mt-0.5">
                    <div className="w-5 flex justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px] text-blue-700 font-bold drop-shadow-2xs">history_toggle_off</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3">
                      <span className="opacity-80">Pukul {latestData?.time ? formatUTCtoWIB(latestData.time) : "--:--"} WIB</span>
                    </div>
                  </div>
                </div>

                {/* Right: Parameter Badges */}
                <div className="grid grid-cols-2 xl:flex xl:flex-nowrap justify-start xl:justify-end gap-2 md:gap-3 shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
                  {[
                    { icon: "water_drop", label: "Kelembaban", value: latestData ? `${Math.round(latestData.rh)}%` : "--", color: "text-blue-700" },
                    { icon: "air", label: "Angin", value: latestData ? `${parseFloat((latestData.ws || 0).toFixed(1))} km/h` : "--", color: "text-teal-700" },
                    { icon: "rainy", label: "Curah Hujan", value: latestData ? `${parseFloat((latestData.rr || 0).toFixed(1))} mm` : "--", color: "text-indigo-700" },
                    { icon: "speed", label: "Tekanan", value: (latestData && latestData.press > 0) ? `${Math.round(latestData.press)} mBar` : "--", color: "text-amber-700" },
                  ].map((param) => (
                    <div
                      key={param.label}
                      className="bg-white/75 backdrop-blur-md border border-white/90 rounded-2xl px-3 sm:px-4 py-3 md:py-4 flex flex-col items-start justify-center shadow-xs w-full xl:min-w-[130px]"
                    >
                      <div className="flex items-start gap-1 sm:gap-1.5 mb-1.5 w-full">
                        <span className={`material-symbols-outlined text-[16px] sm:text-[18px] shrink-0 ${param.color}`}>{param.icon}</span>
                        <span className="text-[0.6rem] sm:text-[0.65rem] md:text-[0.7rem] text-slate-700 font-bold uppercase tracking-wide leading-tight break-words">{param.label}</span>
                      </div>
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight w-full truncate">{param.value}</span>
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
                LAYANAN INFORMASI CUACA & IKLIM
              </span>
            </div>

            <h1 className="text-[2.25rem] sm:text-[2.75rem] md:text-[3.25rem] font-extrabold text-text-primary leading-[1.15] tracking-tight w-full">
              Portal Informasi Cuaca &amp; Iklim Jawa Timur
            </h1>

            <AnimatedContainer animation="fadeInUp" delay={0.15} once={true} className="w-full">
              <p className="text-text-secondary text-[1.05rem] md:text-[1.15rem] leading-relaxed w-full">
                Layanan digital terpadu Stasiun Klimatologi Jawa Timur. Menyajikan data observasi cuaca realtime, analisis iklim, dan informasi peringatan dini secara akurat untuk seluruh wilayah Jawa Timur.
              </p>
              
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 mb-2">
                <Link href="/data-pengamatan" className="group">
                  <div className="flex items-center gap-2.5 text-slate-700 hover:text-blue-600 transition-colors bg-white/60 hover:bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-sm hover:shadow-md cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">analytics</span>
                    </div>
                    <span className="text-sm font-bold">Data Pengamatan</span>
                  </div>
                </Link>
                <Link href="/hari-tanpa-hujan" className="group">
                  <div className="flex items-center gap-2.5 text-slate-700 hover:text-amber-600 transition-colors bg-white/60 hover:bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-sm hover:shadow-md cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
                    </div>
                    <span className="text-sm font-bold">Hari Tanpa Hujan</span>
                  </div>
                </Link>
                <Link href="/prakiraan-curah-hujan" className="group">
                  <div className="flex items-center gap-2.5 text-slate-700 hover:text-teal-600 transition-colors bg-white/60 hover:bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-sm hover:shadow-md cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">rainy</span>
                    </div>
                    <span className="text-sm font-bold">Prakiraan Hujan</span>
                  </div>
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
        {/* 5. BERITA & KEGIATAN TERBARU — With color accent */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-6 md:py-8 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 w-full">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary mb-2 block whitespace-nowrap">Informasi &amp; Peringatan</span>
              <h2 className="text-[2rem] font-extrabold text-slate-800 leading-tight">Berita & Kegiatan Terbaru</h2>
            </div>
            <Link href="/publikasi/berita-kegiatan" className="text-primary font-bold hover:text-secondary flex items-center gap-1.5 text-sm group whitespace-nowrap bg-blue-50/50 hover:bg-blue-50 px-4 py-2 rounded-full border border-blue-100 transition-colors">
              Lihat Semua
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          <div className="w-full">
            {loadingBerita ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                <span className="text-slate-500 font-medium">Memuat berita & kegiatan...</span>
              </div>
            ) : beritaKegiatan && beritaKegiatan.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6 w-full">
                {beritaKegiatan.map((ann, idx) => (
                  <AnimatedContainer key={ann.id || idx} animation="fadeInUp" delay={0.08 * idx} once={true} className="w-full h-full">
                    <Link href={`/publikasi/berita-kegiatan/${ann.id}`} className="block w-full h-full">
                      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[1.5rem] p-6 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group relative overflow-hidden">
                        {/* Decorative Background Glow */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getCategoryGradient(ann.kategori)} rounded-bl-full opacity-10 -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500`}></div>

                        {/* Header: Icon & Date */}
                        <div className="flex justify-between items-start mb-5 relative z-10">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${getCategoryIconBg(ann.kategori)}`}>
                            <span className={`material-symbols-outlined text-[22px] ${getCategoryIconColor(ann.kategori)}`}>{getCategoryIcon(ann.kategori)}</span>
                          </div>
                          <div className="text-slate-500 font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                            <span className="material-symbols-outlined text-[13px] text-slate-400">calendar_month</span>
                            {(ann.published_at || ann.created_at) ? new Date(ann.published_at || ann.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Terbaru"}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="mb-3 relative z-10 flex-grow">
                          <Badge variant={getBadgeVariant(ann.kategori)} className="mb-3">
                            {getCategoryLabel(ann.kategori)}
                          </Badge>
                          <h4 className="text-[1.15rem] text-slate-800 font-extrabold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {ann.judul}
                          </h4>
                        </div>

                        <p className="text-[0.9rem] text-slate-500 line-clamp-2 mt-auto relative z-10 leading-relaxed font-medium">
                          {ann.deskripsi}
                        </p>
                      </div>
                    </Link>
                  </AnimatedContainer>
                ))}
              </div>
            ) : (
              <div className="w-full text-center py-12 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-[1.5rem] flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-[48px] text-slate-300">campaign</span>
                <p className="text-slate-500 font-medium">Belum ada berita & kegiatan terbaru saat ini.</p>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 6. INSTAGRAM BMKG */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="bg-tertiary/30 py-12 md:py-16 border-t border-border w-full">
          <div className="max-w-7xl mx-auto px-6 md:px-8 w-full">
            <AnimatedContainer animation="fadeInUp" once={true} className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
                  <Instagram size={20} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Instagram BMKG Malang</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Informasi terbaru melalui media sosial kami.</p>
                </div>
              </div>
              <Link href="/galeri" className="self-end sm:self-auto shrink-0 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 group">
                Lihat Lebih Banyak
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
            </AnimatedContainer>

            {instagramPosts.length > 0 ? (
              <div className="relative w-full">
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 w-full pb-6 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition-colors">
                  {instagramPosts.map((post, idx) => (
                    <AnimatedContainer key={idx} animation="scaleIn" delay={0.08 * idx} once={true} className="w-[85vw] sm:w-[45vw] lg:min-w-[280px] lg:flex-1 shrink-0 snap-center sm:snap-start">
                      <a href={post.post_url} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden relative group shadow-sm hover:shadow-2xl hover:-translate-y-1.5 border border-slate-200/60 w-full cursor-pointer bg-white transition-all duration-300">
                        
                        {/* Fake IG Header */}
                        <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white z-20 relative">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px]">
                              <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-[1.5px] overflow-hidden">
                                <Image src="/LogoStaklimJatim.jpg" alt="BMKG Malang" width={24} height={24} className="rounded-full w-full h-full object-cover" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-800">bmkg_malang</span>
                              </div>
                              <span className="text-[10px] text-slate-500 leading-none mt-0.5">Stasiun Klimatologi Jatim</span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">more_horiz</span>
                        </div>

                        {/* Image Area */}
                        <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                          {/* Blurred Background */}
                          <div className="absolute inset-0 w-full h-full">
                            <Image
                              alt="Background Blur"
                              src={post.image_url}
                              fill
                              className="object-cover opacity-50 blur-xl scale-125 saturate-150"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          </div>
                          
                          {/* Foreground Image */}
                          <Image
                            alt={`Instagram Post ${idx + 1}`}
                            className="object-contain relative z-10 transition-transform duration-700 group-hover:scale-105"
                            src={post.image_url}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          
                          {/* Center Hover Icon */}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                             <div className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-500 delay-75">
                               <Instagram size={22} className="text-[#dc2743]" />
                             </div>
                          </div>
                        </div>

                        {/* Fake IG Footer */}
                        <div className="p-3 bg-white z-20 relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-[20px] text-slate-800 hover:text-slate-500 transition-colors">favorite</span>
                              <span className="material-symbols-outlined text-[20px] text-slate-800 hover:text-slate-500 transition-colors">mode_comment</span>
                              <span className="material-symbols-outlined text-[20px] text-slate-800 hover:text-slate-500 transition-colors -rotate-45 -mt-1">send</span>
                            </div>
                            <span className="material-symbols-outlined text-[20px] text-slate-800 hover:text-slate-500 transition-colors">bookmark</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 mb-1">Disukai oleh bmkg_malang dan lainnya</div>
                          <div className="text-[10px] text-slate-400 font-medium">Buka di Instagram...</div>
                        </div>

                      </a>
                    </AnimatedContainer>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <Instagram size={40} className="text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium text-sm">Belum ada postingan Instagram terbaru.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
