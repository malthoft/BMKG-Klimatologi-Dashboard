"use client";

import { H1, H2, Body } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from "react";

// Deterministic pseudo-random number generator for SSR Hydration
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate dummy data for warming stripes (30 years)
const generateStripesData = () => {
  const data = [];
  const startYear = 1994;
  for (let i = 0; i < 30; i++) {
    const rand = pseudoRandom(i + 123);
    const anomaly = (i * 0.04) + (rand * 0.5 - 0.25);
    data.push({ year: startYear + i, anomaly });
  }
  return data;
};

// Map anomaly value to a color from deep blue to deep red
const getStripeColor = (anomaly: number) => {
  if (anomaly < -0.4) return "#08306b";
  if (anomaly < -0.2) return "#2171b5";
  if (anomaly < 0) return "#6baed6";
  if (anomaly < 0.2) return "#c6dbef";
  if (anomaly < 0.4) return "#fee0d2";
  if (anomaly < 0.6) return "#fc9272";
  if (anomaly < 0.8) return "#de2d26";
  return "#67000d";
};

// Generate dummy data for Normal vs Actual Temp
const generateNormalVsActual = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return months.map((month, i) => {
    // Normal is a base sine wave, Actual is slightly higher
    const base = 23 + Math.sin(i / 11 * Math.PI) * 2;
    const rand = pseudoRandom(i + 456);
    return {
      name: month,
      normal: Number(base.toFixed(1)),
      aktual: Number((base + 0.5 + rand * 0.5).toFixed(1))
    };
  });
};

export default function ClimateChange() {
  const stripesData = useMemo(() => generateStripesData(), []);
  const normalVsActualData = useMemo(() => generateNormalVsActual(), []);
  const [hoveredStripe, setHoveredStripe] = useState<{year: number, anomaly: number} | null>(null);

  return (
    <>
      <Header activeRoute="/climate-change" />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] space-y-[64px]">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-[64px] items-center">
          <div className="space-y-[24px]">
            <AnimatedContainer animation="slideInLeft" once={false}>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-[0.875rem] uppercase tracking-wider font-medium">Edukasi</span>
            </AnimatedContainer>
            <AnimatedContainer animation="slideInLeft" delay={0.1} once={false}>
              <H1 className="leading-[1.1] text-text-primary">Memahami Perubahan Iklim di Malang Raya</H1>
            </AnimatedContainer>
            <AnimatedContainer animation="slideInLeft" delay={0.2} once={false}>
              <Body className="text-text-secondary">
                Perubahan iklim adalah tantangan global yang dampaknya mulai dirasakan secara lokal. Pelajari bagaimana anomali cuaca, pergeseran musim hujan, dan kenaikan suhu rata-rata memengaruhi kehidupan sehari-hari di wilayah Malang dan sekitarnya.
              </Body>
            </AnimatedContainer>
          </div>
          <AnimatedContainer animation="scaleIn" delay={0.3} once={false} className="h-full">
            <div className="w-full aspect-video rounded-[12px] overflow-hidden border border-border shadow-sm h-full group">
              <img 
                alt="Pemandangan iklim Malang" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA56po7Uu9IUnFzXiCtoYzdF37-ol1jUoEoagPxvMUw1scfcvI_2FD_eZKN0yOSve0toXnuGRfH_sH3Jez3QY7Axm5XSmz3CHfe-0IL1ZVZNA_rFq11tvXPMS5nq5vCBOnfcWsmua046jspexvThRxdakAONwkxGsL-1wnSDl53J9wjqQZeRNvyrVxG0jcWZxDIwVn61rBpeEKto0HRMSXU6P75C55QX4tx79LiMdySYJmZet8YGT9DECsTFVJoZsxYbAdCxAbUhRU" 
              />
            </div>
          </AnimatedContainer>
        </section>

        {/* Data & Tren Iklim (Bento Grid) */}
        <section className="space-y-[32px]">
          <AnimatedContainer animation="fadeInDown" once={false}>
            <H2 className="text-text-primary text-center">Data &amp; Tren Iklim</H2>
          </AnimatedContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
            {/* Card 1 */}
            <AnimatedContainer animation="fadeInUp" delay={0.1} once={false} className="h-full">
              <Card className="h-full flex flex-col gap-[16px] hover:bg-surface-container-low transition-colors group cursor-default">
                <div className="flex items-center gap-[8px]">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>thermostat</span>
                  <h3 className="text-[1.5rem] font-semibold text-text-primary leading-[1.3]">Anomali Suhu</h3>
                </div>
                <p className="text-[1rem] text-text-secondary flex-grow leading-[1.6]">
                  Tercatat kenaikan suhu rata-rata permukaan sebesar 0.5°C hingga 1°C dalam dekade terakhir, mengindikasikan tren pemanasan lokal yang konsisten.
                </p>
                <div className="h-24 flex items-end gap-2 mt-auto">
                  {/* Mock Bar Chart */}
                  <div className="w-full bg-primary/20 rounded-t-md transition-all duration-500 group-hover:bg-primary/40" style={{ height: "40%" }}></div>
                  <div className="w-full bg-primary/40 rounded-t-md transition-all duration-500 group-hover:bg-primary/60" style={{ height: "60%" }}></div>
                  <div className="w-full bg-primary/60 rounded-t-md transition-all duration-500 group-hover:bg-primary/80" style={{ height: "50%" }}></div>
                  <div className="w-full bg-primary/80 rounded-t-md transition-all duration-500 group-hover:bg-primary/90" style={{ height: "85%" }}></div>
                  <div className="w-full bg-primary rounded-t-md transition-all duration-500 group-hover:opacity-90" style={{ height: "100%" }}></div>
                </div>
              </Card>
            </AnimatedContainer>

            {/* Card 2 */}
            <AnimatedContainer animation="fadeInUp" delay={0.2} once={false} className="h-full">
              <Card className="h-full flex flex-col gap-[16px] hover:bg-surface-container-low transition-colors group cursor-default">
                <div className="flex items-center gap-[8px]">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>rainy</span>
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
            <AnimatedContainer animation="fadeInUp" delay={0.3} once={false} className="h-full">
              <Card className="h-full flex flex-col gap-[16px] hover:bg-surface-container-low transition-colors group cursor-default">
                <div className="flex items-center gap-[8px]">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
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

        {/* Visualisasi Iklim (Warming Stripes & Line Chart) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]">
          {/* Warming Stripes */}
          <AnimatedContainer animation="slideInLeft" delay={0.4} once={false} className="h-full">
            <Card className="flex flex-col gap-[16px] h-full">
              <div className="mb-[8px]">
                <H2 className="text-text-primary">Garis Pemanasan (Warming Stripes)</H2>
                <p className="text-text-secondary text-sm mt-1">Anomali suhu rata-rata tahunan (1994 - 2023) di Jawa Timur.</p>
              </div>
              
              <div className="relative w-full h-[200px] flex rounded-md overflow-hidden mt-4 shadow-inner" onMouseLeave={() => setHoveredStripe(null)}>
                {stripesData.map((data, idx) => (
                  <div 
                    key={idx}
                    className="flex-1 h-full transition-opacity hover:opacity-80 cursor-pointer"
                    style={{ backgroundColor: getStripeColor(data.anomaly) }}
                    onMouseEnter={() => setHoveredStripe(data)}
                  ></div>
                ))}
                
                {/* Tooltip Overlay */}
                {hoveredStripe && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface/95 backdrop-blur-sm px-4 py-2 rounded-md shadow-md border border-border text-center pointer-events-none">
                    <div className="font-bold text-text-primary text-lg">{hoveredStripe.year}</div>
                    <div className={`font-semibold ${hoveredStripe.anomaly > 0 ? 'text-[#de2d26]' : 'text-[#2171b5]'}`}>
                      {hoveredStripe.anomaly > 0 ? '+' : ''}{hoveredStripe.anomaly.toFixed(2)} °C
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-text-secondary mt-2 font-bold">
                <span>1994</span>
                <span>2023</span>
              </div>
              <p className="text-sm text-text-secondary mt-4 bg-surface-container-low p-4 rounded-lg">
                <span className="font-bold text-text-primary">Apa artinya?</span> Warna biru menunjukkan suhu lebih dingin dari rata-rata historis, sedangkan merah menunjukkan suhu lebih panas. Semakin pekat merahnya, semakin ekstrim pemanasannya.
              </p>
            </Card>
          </AnimatedContainer>

          {/* Normal vs Aktual Suhu */}
          <AnimatedContainer animation="slideInRight" delay={0.5} once={false} className="h-full">
            <Card className="flex flex-col gap-[16px] h-full">
              <div className="mb-[8px]">
                <H2 className="text-text-primary">Suhu Normal vs Aktual</H2>
                <p className="text-text-secondary text-sm mt-1">Perbandingan suhu iklim normal bulanan dengan data aktual tahun ini.</p>
              </div>
              
              <div className="w-full h-[250px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={normalVsActualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#666666', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fill: '#666666', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      name="Suhu Normal (°C)"
                      type="monotone" 
                      dataKey="normal" 
                      stroke="#9CA3AF" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line 
                      name="Suhu Aktual (°C)"
                      type="monotone" 
                      dataKey="aktual" 
                      stroke="#FF5722" 
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#FF5722' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center gap-6 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-gray-400"></span>
                  <span className="text-text-secondary">Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-[#FF5722]"></span>
                  <span className="text-text-secondary">Aktual</span>
                </div>
              </div>
            </Card>
          </AnimatedContainer>
        </section>

        {/* Mitigasi & Adaptasi */}
        <section className="space-y-[32px]">
          <AnimatedContainer animation="fadeInUp" delay={0.2} once={false}>
            <H2 className="text-text-primary text-center">Strategi Menghadapi Perubahan Iklim</H2>
          </AnimatedContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] items-stretch">
            {/* Mitigasi Card */}
            <AnimatedContainer animation="slideInLeft" delay={0.3} once={false} className="h-full">
              <div className="bg-primary text-white rounded-[16px] p-[32px] shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-[8px] mb-[24px]">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                    <h3 className="text-[1.5rem] font-semibold">Langkah Mitigasi</h3>
                  </div>
                  <p className="mb-[24px] opacity-90 text-[1rem] leading-[1.6]">
                    Upaya untuk mengurangi sumber emisi gas rumah kaca dan meningkatkan penyerapan karbon.
                  </p>
                  <ul className="space-y-[16px] text-[1rem]">
                    <li className="flex items-start gap-[12px] group/item">
                      <span className="material-symbols-outlined text-white mt-[2px] group-hover/item:scale-110 transition-transform">check_circle</span>
                      <span>Penggunaan energi terbarukan</span>
                    </li>
                    <li className="flex items-start gap-[12px] group/item">
                      <span className="material-symbols-outlined text-white mt-[2px] group-hover/item:scale-110 transition-transform">check_circle</span>
                      <span>Efisiensi energi rumah tangga</span>
                    </li>
                    <li className="flex items-start gap-[12px] group/item">
                      <span className="material-symbols-outlined text-white mt-[2px] group-hover/item:scale-110 transition-transform">check_circle</span>
                      <span>Penghijauan lahan kritis</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AnimatedContainer>

            {/* Adaptasi Card */}
            <AnimatedContainer animation="slideInRight" delay={0.4} once={false} className="h-full">
              <div className="bg-surface-container-low text-text-primary rounded-[16px] p-[32px] border border-border shadow-sm flex flex-col justify-between h-full group hover:border-primary/30 hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700 pointer-events-none text-primary">
                  <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>nature_people</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-[8px] mb-[24px]">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>nature_people</span>
                    <h3 className="text-[1.5rem] font-semibold text-text-primary">Langkah Adaptasi</h3>
                  </div>
                  <p className="text-text-secondary mb-[24px] text-[1rem] leading-[1.6]">
                    Penyesuaian sistem alam dan manusia terhadap dampak perubahan iklim yang sedang atau akan terjadi.
                  </p>
                  <ul className="space-y-[16px] text-[1rem]">
                    <li className="flex items-start gap-[12px] group/item">
                      <span className="material-symbols-outlined text-primary mt-[2px] group-hover/item:scale-110 transition-transform">wb_sunny</span>
                      <span>Pemanfaatan informasi cuaca untuk pertanian</span>
                    </li>
                    <li className="flex items-start gap-[12px] group/item">
                      <span className="material-symbols-outlined text-primary mt-[2px] group-hover/item:scale-110 transition-transform">water_drop</span>
                      <span>Pembuatan sumur resapan</span>
                    </li>
                    <li className="flex items-start gap-[12px] group/item">
                      <span className="material-symbols-outlined text-primary mt-[2px] group-hover/item:scale-110 transition-transform">grass</span>
                      <span>Pengembangan varietas tahan kekeringan</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
