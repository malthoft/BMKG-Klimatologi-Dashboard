"use client";

import { useEffect, useMemo, useState } from "react";
import { H1, H2, Body } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";

// Deterministic pseudo-random number generator for SSR Hydration
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate dummy data for Normal vs Actual Temp chart
const generateNormalVsActual = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return months.map((month, i) => {
    const base = 23 + Math.sin((i / 11) * Math.PI) * 2;
    const rand = pseudoRandom(i + 456);
    return {
      name: month,
      normal: Number(base.toFixed(1)),
      aktual: Number((base + 0.5 + rand * 0.5).toFixed(1)),
    };
  });
};

export default function ClimateChange() {
  const normalVsActualData = useMemo(() => generateNormalVsActual(), []);
  const [climateData, setClimateData] = useState<ClimateParsedResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Try loading custom uploaded CSV from localStorage
        const storedCSV = typeof window !== "undefined" ? localStorage.getItem("climate_csv_data") : null;
        if (storedCSV) {
          const parsed = parseCSVText(storedCSV);
          setClimateData(parsed);
          setLoading(false);
          return;
        }

        // 2. Fallback: Fetch sample CSV file from public directory
        const res = await fetch("/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv");
        if (res.ok) {
          const text = await res.text();
          const parsed = parseCSVText(text);
          setClimateData(parsed);
        }
      } catch (err) {
        console.error("Gagal memuat data iklim:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <>
      <Header activeRoute="/climate-change" />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] space-y-[64px]">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-[64px] items-center">
          <div className="space-y-[24px]">
            <AnimatedContainer animation="slideInLeft" once={true}>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-[0.875rem] uppercase tracking-wider font-medium">
                Edukasi &amp; Observasi
              </span>
            </AnimatedContainer>
            <AnimatedContainer animation="slideInLeft" delay={0.1} once={true}>
              <H1 className="leading-[1.1] text-text-primary">Visualisasi Perubahan Iklim Jawa Timur</H1>
            </AnimatedContainer>
            <AnimatedContainer animation="slideInLeft" delay={0.2} once={true}>
              <Body className="text-text-secondary">
                Perubahan iklim adalah tantangan global yang dampaknya dirasakan secara nyata di tingkat lokal. 
                Jelajahi visualisasi <strong>Warming Stripes (Pita Pemanasan Iklim)</strong> berdasarkan data anomali suhu resmi 
                BMKG dari 38 Kabupaten/Kota se-Jawa Timur periode 1991 hingga 2025.
              </Body>
            </AnimatedContainer>
          </div>
          <AnimatedContainer animation="scaleIn" delay={0.3} once={true} className="h-full">
            <div className="w-full aspect-video rounded-[12px] overflow-hidden border border-border shadow-sm h-full group">
              <img
                alt="Pemandangan iklim Malang"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA56po7Uu9IUnFzXiCtoYzdF37-ol1jUoEoagPxvMUw1scfcvI_2FD_eZKN0yOSve0toXnuGRfH_sH3Jez3QY7Axm5XSmz3CHfe-0IL1ZVZNA_rFq11tvXPMS5nq5vCBOnfcWsmua046jspexvThRxdakAONwkxGsL-1wnSDl53J9wjqQZeRNvyrVxG0jcWZxDIwVn61rBpeEKto0HRMSXU6P75C55QX4tx79LiMdySYJmZet8YGT9DECsTFVJoZsxYbAdCxAbUhRU"
              />
            </div>
          </AnimatedContainer>
        </section>

        {/* Warming Stripes Component */}
        <section className="space-y-[24px]">
          <AnimatedContainer animation="fadeInDown" once={true}>
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <H2 className="text-text-primary">Warming Stripes (Pita Pemanasan Iklim)</H2>
              <p className="text-text-secondary text-sm">
                Visualisasi pita warna buatan Ed Hawkins yang menggambarkan tren kenaikan suhu tahunan dari waktu ke waktu. 
                Warna biru menunjukkan suhu lebih dingin dari baseline, sedangkan warna merah menandakan anomali suhu yang lebih panas.
              </p>
            </div>
          </AnimatedContainer>

          {loading ? (
            <div className="w-full py-16 flex flex-col items-center justify-center gap-3 text-text-secondary">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
              <span className="text-sm font-medium">Memuat data visualisasi anomali iklim...</span>
            </div>
          ) : (
            <AnimatedContainer animation="fadeInUp" delay={0.2} once={true}>
              <WarmingStripesViewer parsedData={climateData} />
            </AnimatedContainer>
          )}
        </section>

        {/* Data & Tren Iklim (Bento Grid) */}
        <section className="space-y-[32px]">
          <AnimatedContainer animation="fadeInDown" once={true}>
            <H2 className="text-text-primary text-center">Faktor &amp; Dampak Perubahan Iklim</H2>
          </AnimatedContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
            {/* Card 1 */}
            <AnimatedContainer animation="fadeInUp" delay={0.1} once={true} className="h-full">
              <Card className="h-full flex flex-col gap-[16px] hover:bg-surface-container-low transition-colors group cursor-default">
                <div className="flex items-center gap-[8px]">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                    thermostat
                  </span>
                  <h3 className="text-[1.5rem] font-semibold text-text-primary leading-[1.3]">Anomali Suhu</h3>
                </div>
                <p className="text-[1rem] text-text-secondary flex-grow leading-[1.6]">
                  Tercatat kenaikan suhu rata-rata permukaan sebesar 0.3°C hingga 0.8°C dalam beberapa dekade terakhir, mengindikasikan tren pemanasan lokal yang konsisten.
                </p>
                <div className="h-24 flex items-end gap-2 mt-auto">
                  <div className="w-full bg-primary/20 rounded-t-md transition-all duration-500 group-hover:bg-primary/40" style={{ height: "40%" }} />
                  <div className="w-full bg-primary/40 rounded-t-md transition-all duration-500 group-hover:bg-primary/60" style={{ height: "60%" }} />
                  <div className="w-full bg-primary/60 rounded-t-md transition-all duration-500 group-hover:bg-primary/80" style={{ height: "50%" }} />
                  <div className="w-full bg-primary/80 rounded-t-md transition-all duration-500 group-hover:bg-primary/90" style={{ height: "85%" }} />
                  <div className="w-full bg-primary rounded-t-md transition-all duration-500 group-hover:opacity-90" style={{ height: "100%" }} />
                </div>
              </Card>
            </AnimatedContainer>

            {/* Card 2 */}
            <AnimatedContainer animation="fadeInUp" delay={0.2} once={true} className="h-full">
              <Card className="h-full flex flex-col gap-[16px] hover:bg-surface-container-low transition-colors group cursor-default">
                <div className="flex items-center gap-[8px]">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rainy
                  </span>
                  <h3 className="text-[1.5rem] font-semibold text-text-primary leading-[1.3]">Pola Curah Hujan</h3>
                </div>
                <p className="text-[1rem] text-text-secondary flex-grow leading-[1.6]">
                  Pergeseran awal musim hujan dan peningkatan intensitas curah hujan ekstrem dalam durasi singkat, meningkatkan risiko hidrometeorologi.
                </p>
                <div className="mt-auto grid grid-cols-2 gap-[8px]">
                  <div className="bg-surface p-[8px] rounded-lg text-center shadow-sm border border-border group-hover:border-primary/30 transition-colors">
                    <span className="block text-[2rem] font-bold text-primary tabular-nums">↑15%</span>
                    <span className="text-[0.75rem] text-text-secondary">Intensitas</span>
                  </div>
                  <div className="bg-surface p-[8px] rounded-lg text-center shadow-sm border border-border group-hover:border-warning/30 transition-colors">
                    <span className="block text-[2rem] font-bold text-warning tabular-nums">↓10%</span>
                    <span className="text-[0.75rem] text-text-secondary">Durasi Hujan</span>
                  </div>
                </div>
              </Card>
            </AnimatedContainer>

            {/* Card 3 */}
            <AnimatedContainer animation="fadeInUp" delay={0.3} once={true} className="h-full">
              <Card className="h-full flex flex-col gap-[16px] hover:bg-surface-container-low transition-colors group cursor-default">
                <div className="flex items-center gap-[8px]">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                    agriculture
                  </span>
                  <h3 className="text-[1.5rem] font-semibold text-text-primary leading-[1.3]">Dampak Sektor</h3>
                </div>
                <p className="text-[1rem] text-text-secondary flex-grow leading-[1.6]">
                  Perubahan pola cuaca berdampak langsung pada siklus tanam pertanian dan ketersediaan sumber daya air bersih di musim kemarau panjang.
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-warning/10 text-warning text-[0.875rem] font-medium transition-colors group-hover:bg-warning/20">Pertanian</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[0.875rem] font-medium transition-colors group-hover:bg-primary/20">Sumber Air</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-error/10 text-error text-[0.875rem] font-medium transition-colors group-hover:bg-error/20">Kesehatan</span>
                </div>
              </Card>
            </AnimatedContainer>
          </div>
        </section>

        {/* Visualisasi Suhu Normal vs Aktual */}
        <section className="grid grid-cols-1 gap-[16px]">
          <AnimatedContainer animation="slideInRight" delay={0.4} once={true} className="h-full">
            <Card className="flex flex-col gap-[16px] h-full">
              <div>
                <H2 className="text-text-primary">Perbandingan Suhu Normal vs Aktual Bulanan</H2>
                <p className="text-text-secondary text-sm mt-1">Grafik perbandingan rata-rata suhu klimatologis normal (1991-2020) terhadap suhu aktual terkini.</p>
              </div>

              <div className="w-full h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={normalVsActualData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b" }} />
                    <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fill: "#64748b" }} unit="°C" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                      formatter={(value: any) => [`${value} °C`, ""]}
                    />
                    <Line type="monotone" dataKey="normal" name="Normal (Baseline)" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="aktual" name="Suhu Aktual" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-2 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-b-2 border-dashed border-gray-500" />
                  <span className="text-text-secondary">Normal (1991-2020)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-red-500 rounded" />
                  <span className="text-text-primary">Suhu Aktual (Terukur)</span>
                </div>
              </div>
            </Card>
          </AnimatedContainer>
        </section>
      </main>

      <Footer />
    </>
  );
}
