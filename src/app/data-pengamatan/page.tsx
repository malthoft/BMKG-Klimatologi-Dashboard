"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { supabaseFetch } from "@/lib/supabase";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface DailyObservation {
  id?: number;
  tanggal_pengamatan: string;
  synced_at?: string;
  updated_at?: string;
  suhu_maksimum: number;
  suhu_minimum: number;
  curah_hujan_mm: number;
  kategori_hujan: string;
  suhu_udara_rata: number;
  kelembaban_rata: number;
  angin_arah_dominan: string;
  angin_kecepatan_rata_kt: number;
  angin_kecepatan_max_kt: number;
  tekanan_udara_rata: number;
  rangkuman_info: string;
}

interface HourlyObservation {
  id?: number;
  jam: string;
  suhu_c: number;
  kelembaban_percent: number;
  kecepatan_angin_kt: number;
  tekanan_mbar: number;
  arah_angin?: string;
}

const formatSyncTimestamp = (syncedAtStr?: string) => {
  if (!syncedAtStr) return "Terverifikasi Stasiun";
  const dateObj = new Date(syncedAtStr);
  if (isNaN(dateObj.getTime())) return "Terverifikasi Stasiun";
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return `Diperbarui: ${formattedDate}`;
};

export default function PengamatanHarian() {
  const [dailyData, setDailyData] = useState<DailyObservation | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<"suhu" | "kelembaban" | "tekanan" | "angin">("suhu");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let dailyResult = await supabaseFetch("daily_observations", "order=id.desc&limit=1");
      if (!dailyResult || dailyResult.length === 0) {
        dailyResult = await supabaseFetch("daily_observations", "id=eq.1");
      }
      if (dailyResult && dailyResult.length > 0) {
        setDailyData(dailyResult[0]);
      }

      const hourlyResult = await supabaseFetch("hourly_observations", "order=id.asc");
      if (hourlyResult && hourlyResult.length > 0) {
        const sortedHourly = [...hourlyResult].sort((a, b) => (a.jam || "").localeCompare(b.jam || ""));
        setHourlyData(sortedHourly);
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Gagal memuat data pengamatan. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const safeNumber = (val: number | null | undefined, fallback = "-", suffix = "") => {
    if (val === null || val === undefined || isNaN(val)) return fallback;
    return `${val}${suffix}`;
  };

  const getPeakWindInfo = () => {
    if (!hourlyData || hourlyData.length === 0) return "Puncak hembusan gust 24 jam";
    const peak = hourlyData.reduce((max, h) => (h.kecepatan_angin_kt > max.kecepatan_angin_kt ? h : max), hourlyData[0]);
    if (!peak || !peak.jam) return "Puncak hembusan gust 24 jam";
    return `Puncak hembusan pukul ${peak.jam} WIB`;
  };

  const getMetricCards = (data: DailyObservation) => [
    {
      title: "Suhu Minimum (Terdingin)",
      value: safeNumber(data.suhu_minimum, "-", "°C"),
      icon: "ac_unit",
      color: "text-sky-600",
      bgColor: "bg-sky-50",
      borderColor: "border-sky-100",
      desc: "Suhu udara terendah 24 jam (pagi)",
    },
    {
      title: "Suhu Maksimum (Terpanas)",
      value: safeNumber(data.suhu_maksimum, "-", "°C"),
      icon: "thermostat",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
      desc: "Suhu udara tertinggi 24 jam (siang)",
    },
    {
      title: "Suhu Udara Rata²",
      value: safeNumber(data.suhu_udara_rata, "-", "°C"),
      icon: "device_thermostat",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      desc: "Nilai rata-rata suhu harian",
    },
    {
      title: "Curah Hujan Harian",
      value: safeNumber(data.curah_hujan_mm, "-", " mm"),
      icon: "rainy",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      desc: "Akumulasi curah hujan 24 jam",
      badge: true,
      badgeText: data.kategori_hujan || "Tidak Ada Hujan",
    },
    {
      title: "Kelembaban Udara (RH)",
      value: safeNumber(data.kelembaban_rata, "-", "%"),
      icon: "water_drop",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-100",
      desc: "Rata-rata kelembaban relatif",
    },
    {
      title: "Tekanan Udara (QFE)",
      value: safeNumber(data.tekanan_udara_rata, "-", " mBar"),
      icon: "speed",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      desc: "Tekanan rata-rata stasiun",
    },
    {
      title: "Angin Rata² & Arah",
      value: `${safeNumber(data.angin_kecepatan_rata_kt, "-", " Knot")}`,
      icon: "air",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      desc: `Arah dominan: ${data.angin_arah_dominan || "-"}`,
    },
    {
      title: "Angin Maksimum (Peak)",
      value: `${safeNumber(data.angin_kecepatan_max_kt, "-", " Knot")}`,
      icon: "storm",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-100",
      desc: getPeakWindInfo(),
    },
  ];

  const formatSectionContent = (text: string) => {
    if (!text) return "";
    let formatted = text.replace(/:\s*(?=-)/g, ':\n');
    formatted = formatted.replace(/(?<!\n)(?:\s+-\s*|\s*,\s*-\s*)/g, '\n• ');
    return formatted.trim();
  };

  const parseRangkumanItems = (text: string): string[] => {
    if (!text) return ["Tidak ada catatan kejadian cuaca ekstrim untuk tanggal ini."];
    const cleaned = text.trim();

    // Try splitting by double newlines or section headers (suhu, angin, terjadi...)
    const sections = cleaned
      .split(/(?:\r?\n\s*\r?\n|(?=\b(?:suhu|angin|terjadi|catatan|peringatan)\b[:\s]))/gi)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sections.length >= 2) {
      return sections.map(s => formatSectionContent(s));
    }

    const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length >= 3) {
      const size = Math.ceil(lines.length / 3);
      return [
        formatSectionContent(lines.slice(0, size).join("\n")),
        formatSectionContent(lines.slice(size, size * 2).join("\n")),
        formatSectionContent(lines.slice(size * 2).join("\n"))
      ];
    }

    return [formatSectionContent(cleaned)];
  };

  const executivePanelThemes = [
    { tag: "ANOMALI SUHU", icon: "thermostat", tagColor: "text-rose-400 border-rose-500/30 bg-rose-500/10", iconColor: "text-rose-400" },
    { tag: "SIRKULASI ANGIN", icon: "air", tagColor: "text-sky-400 border-sky-500/30 bg-sky-500/10", iconColor: "text-sky-400" },
    { tag: "REKAP & FENOMENA", icon: "report_problem", tagColor: "text-amber-400 border-amber-500/30 bg-amber-500/10", iconColor: "text-amber-400" },
  ];

  return (
    <>
      <Header activeRoute="/data-pengamatan" />
      <main className="flex-grow w-full bg-slate-50/60 pb-16">
        
        {/* Banner Section — Clean Professional Institutional Theme */}
        <section className="bg-gradient-to-r from-blue-50 via-slate-50 to-sky-50 text-slate-900 pt-8 md:pt-12 pb-16 md:pb-20 border-b border-slate-200/80 relative overflow-hidden">
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-100/50 rounded-full blur-3xl pointer-events-none transform -translate-x-1/3 translate-y-1/3" />
          
          <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
            <AnimatedContainer animation="fadeInUp" once={true}>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 w-full">
                <div className="w-full lg:max-w-[680px]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[11px] font-extrabold tracking-widest uppercase shadow-xs">
                      STASIUN KLIMATOLOGI JAWA TIMUR
                    </span>
                  </div>
                  <h1 className="text-[2.25rem] sm:text-[2.75rem] md:text-[3.25rem] font-black leading-[1.1] tracking-tight mb-3 text-slate-900">
                    Laporan Pengamatan Harian
                  </h1>
                  <p className="text-slate-600 text-[1rem] md:text-[1.1rem] leading-relaxed font-medium">
                    Data sinoptik dan klimatologi hasil pencatatan instrumen stasiun. Pembaruan data otomatis setiap hari kerja pada pukul <span className="font-bold text-blue-700">09:00 WIB</span>.
                  </p>
                </div>
                
                {/* Live Observation Date Card */}
                <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200/80 shrink-0 w-full lg:w-auto min-w-[320px] flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-slate-500 font-extrabold text-xs uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[20px] text-blue-600">calendar_month</span>
                      Tanggal Pengamatan
                    </div>
                  </div>

                  <div className="text-slate-900 font-black text-xl md:text-2xl tracking-tight my-2">
                    {dailyData?.tanggal_pengamatan || "Hari Ini"}
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-blue-600">update</span>
                    {formatSyncTimestamp(dailyData?.synced_at || dailyData?.updated_at)}
                  </div>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20 space-y-6 md:space-y-8">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-16 flex flex-col items-center justify-center border border-slate-200/80">
              <span className="material-symbols-outlined animate-spin text-[48px] text-primary mb-4">progress_activity</span>
              <p className="text-slate-600 font-bold">Memuat data pengamatan harian...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 flex flex-col items-center justify-center text-center border border-slate-200/80">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <span className="material-symbols-outlined text-[36px]">wifi_off</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Gagal Mengambil Data</h3>
              <p className="text-slate-500 mb-6 max-w-md">{error}</p>
              <button 
                onClick={fetchData}
                className="px-6 py-2.5 bg-primary text-white rounded-full font-bold hover:bg-secondary transition-colors flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Coba Lagi
              </button>
            </div>
          ) : !dailyData ? (
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-16 flex flex-col items-center justify-center border border-slate-200/80">
              <span className="material-symbols-outlined text-[48px] text-amber-500 mb-4">info</span>
              <p className="text-slate-600 font-bold">Data pengamatan harian belum tersedia.</p>
            </div>
          ) : (
            <>
              {/* Key Metrics Grid (4x2 = 8 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                {getMetricCards(dailyData).map((card, idx) => (
                  <AnimatedContainer key={idx} animation="fadeInUp" delay={0.05 * idx} once={true}>
                    <Card className={`h-full border ${card.borderColor} shadow-xs hover:shadow-lg transition-all duration-300 p-4 sm:p-5 md:p-6 rounded-2xl bg-white group flex flex-col justify-between relative overflow-hidden`}>
                      <div className="flex items-start justify-between mb-3 relative z-10 gap-2">
                        <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ${card.bgColor} ${card.color} group-hover:scale-105 transition-transform duration-300 shadow-2xs`}>
                          <span className="material-symbols-outlined text-[20px] md:text-[24px]">{card.icon}</span>
                        </div>
                        {card.badge && (
                          <span className={`inline-flex shrink items-center justify-center px-2 py-1 rounded-full text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap shadow-2xs ${card.badgeText.includes("Hujan") ? "bg-amber-100/80 text-amber-800 border border-amber-200" : "bg-slate-100/80 text-slate-600 border border-slate-200"}`}>
                            {card.badgeText}
                          </span>
                        )}
                      </div>
                      
                      <div className="relative z-10">
                        <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">{card.title}</span>
                        <div className="text-[1.4rem] sm:text-[1.65rem] md:text-[1.85rem] font-black text-slate-900 tracking-tight leading-tight mb-1.5">
                          {card.value}
                        </div>
                        {card.desc && (
                          <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">{card.desc}</p>
                        )}
                      </div>
                    </Card>
                  </AnimatedContainer>
                ))}
              </div>

              {/* Combined Summary & Extreme Weather Panel (Restored Previous Mixed Gradient Theme & Size) */}
              <AnimatedContainer animation="fadeInUp" delay={0.15} once={true}>
                <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-sky-50 border border-slate-200/80 shadow-md rounded-3xl p-5 sm:p-6 md:p-8 relative overflow-hidden">
                  {/* Subtle Ambient Glow Shapes like Hero Banner */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-100/50 rounded-full blur-3xl pointer-events-none transform -translate-x-1/4 translate-y-1/4" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/90 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-blue-600 text-[26px] sm:text-[32px]">info</span>
                    </div>

                    <div className="flex-grow w-full">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-2xs">
                          RINGKASAN & KEJADIAN EKSTRIM
                        </span>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black mb-2 text-slate-900 tracking-tight leading-snug">
                        Analisis & Catatan Cuaca Harian
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200/60">
                        {parseRangkumanItems(dailyData.rangkuman_info).map((item, idx) => (
                          <div key={idx} className="flex flex-col bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="break-words font-semibold text-slate-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm md:text-base">
                              {item}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedContainer>

              {/* Individual Chart Section with Tabs */}
              <AnimatedContainer animation="fadeInUp" delay={0.2} once={true}>
                <Card className="p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200/80 rounded-3xl bg-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-blue-100">
                          DIAGRAM PENGAMATAN PER JAM
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                        Grafik & Tabel Parameter Cuaca
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                        Tanggal: <strong className="text-slate-700">{dailyData.tanggal_pengamatan}</strong> | Periode: 07:00 – 22:00 WIB
                      </p>
                    </div>

                    {/* Chart Tabs Toggle */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 w-full lg:w-auto">
                      {[
                        { id: "suhu", label: "Suhu Udara", icon: "thermostat" },
                        { id: "kelembaban", label: "Kelembaban", icon: "water_drop" },
                        { id: "tekanan", label: "Tekanan Udara", icon: "speed" },
                        { id: "angin", label: "Kec. Angin", icon: "air" }, // Disematkan agar lebih rapi di HP
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setChartTab(tab.id as any)}
                          className={`flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 w-full whitespace-nowrap ${
                            chartTab === tab.id
                              ? "bg-white text-blue-700 shadow-sm border border-slate-200/80"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px] sm:text-[16px] shrink-0">{tab.icon}</span>
                          <span className="truncate">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {hourlyData.length > 0 ? (
                    <div className="w-full space-y-6">
                      {/* INDIVIDUAL CHART: SUHU */}
                      {chartTab === "suhu" && (
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSuhu" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="jam" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                              <YAxis tick={{ fontSize: 12, fill: '#ef4444' }} domain={['dataMin - 1', 'dataMax + 1']} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                              <Legend wrapperStyle={{ paddingTop: '15px' }} />
                              <Area type="monotone" dataKey="suhu_c" name="Suhu Udara (°C)" stroke="#ef4444" strokeWidth={3} fill="url(#colorSuhu)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* INDIVIDUAL CHART: KELEMBABAN */}
                      {chartTab === "kelembaban" && (
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorRH" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="jam" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                              <YAxis tick={{ fontSize: 12, fill: '#0284c7' }} domain={['dataMin - 5', 'dataMax + 5']} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                              <Legend wrapperStyle={{ paddingTop: '15px' }} />
                              <Area type="monotone" dataKey="kelembaban_percent" name="Kelembaban Relatif (%)" stroke="#0284c7" strokeWidth={3} fill="url(#colorRH)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* INDIVIDUAL CHART: TEKANAN */}
                      {chartTab === "tekanan" && (
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorPress" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="jam" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                              <YAxis tick={{ fontSize: 12, fill: '#9333ea' }} domain={['dataMin - 1', 'dataMax + 1']} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                              <Legend wrapperStyle={{ paddingTop: '15px' }} />
                              <Area type="monotone" dataKey="tekanan_mbar" name="Tekanan Udara (mBar)" stroke="#9333ea" strokeWidth={3} fill="url(#colorPress)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* INDIVIDUAL CHART: ANGIN */}
                      {chartTab === "angin" && (
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="jam" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                              <YAxis tick={{ fontSize: 12, fill: '#10b981' }} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                              <Legend wrapperStyle={{ paddingTop: '15px' }} />
                              <Area type="monotone" dataKey="kecepatan_angin_kt" name="Kecepatan Angin (Knot)" stroke="#10b981" strokeWidth={3} fill="url(#colorWind)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Data Table Bar */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4 pt-5 mt-4">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-blue-600">table_chart</span>
                            Tabel Data Pengamatan Jam-Jaman
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">Stasiun Klimatologi Malang</span>
                        </div>
                        <table className="w-full text-xs text-left text-slate-700 font-medium">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold">
                              <th className="py-2.5 px-3">Jam (WIB)</th>
                              <th className="py-2.5 px-3 text-red-600">Suhu Udara (°C)</th>
                              <th className="py-2.5 px-3 text-sky-600">Kelembaban (%)</th>
                              <th className="py-2.5 px-3 text-purple-600">Tekanan (mBar)</th>
                              <th className="py-2.5 px-3 text-emerald-600">Kecepatan Angin</th>
                              <th className="py-2.5 px-3 text-slate-600">Arah Angin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hourlyData.map((row, i) => (
                              <tr key={i} className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-slate-900">{row.jam}</td>
                                <td className="py-2.5 px-3 font-bold text-red-600">{row.suhu_c}°C</td>
                                <td className="py-2.5 px-3 font-bold text-sky-600">{row.kelembaban_percent}%</td>
                                <td className="py-2.5 px-3 font-bold text-purple-600">{row.tekanan_mbar} mBar</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-600">{row.kecepatan_angin_kt} Knot</td>
                                <td className="py-2.5 px-3 font-bold text-slate-600">{row.arah_angin || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">query_stats</span>
                      <p className="text-slate-600 font-bold">Data per jam belum tersedia untuk tanggal ini.</p>
                    </div>
                  )}
                </Card>
              </AnimatedContainer>
            </>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
