"use client";

import { H1, H2, Body, Label } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BarChart } from "@/components/ui/bar-chart";
import { Heatmap } from "@/components/ui/heatmap";
import { useEffect, useState } from "react";
import { supabaseFetch } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";

export default function HistoryData() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [yesterdayData, setYesterdayData] = useState<any>({
    avgTemp: "-",
    avgRh: "-",
    avgWs: "-",
    totalRr: "-"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      let sts = await supabaseFetch("stations");
      if (!sts || sts.length === 0) {
        sts = FALLBACK_STATIONS;
      }
      setStations(sts);
      if (sts && sts.length > 0) {
        setSelectedStation(sts[0].table_name);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedStation) return;
    async function loadYesterday() {
      setLoading(true);
      try {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const yesterdayStr = date.toISOString().split("T")[0]; // "2026-08-01"
        
        const data = await supabaseFetch(selectedStation, `date=eq.${yesterdayStr}`);
        if (data && data.length > 0) {
          let sumTemp = 0, sumRh = 0, sumWs = 0, sumRr = 0;
          for (const d of data) {
            sumTemp += d.temp;
            sumRh += d.rh;
            sumWs += d.ws;
            sumRr += d.rr;
          }
          const count = data.length;
          setYesterdayData({
            avgTemp: (sumTemp / count).toFixed(1),
            avgRh: (sumRh / count).toFixed(1),
            avgWs: (sumWs / count).toFixed(1),
            totalRr: sumRr.toFixed(1)
          });
        } else {
          setYesterdayData({ avgTemp: "-", avgRh: "-", avgWs: "-", totalRr: "-" });
        }
      } catch (e) {
        console.error("Error loading yesterday data", e);
        setYesterdayData({ avgTemp: "-", avgRh: "-", avgWs: "-", totalRr: "-" });
      } finally {
        setLoading(false);
      }
    }
    loadYesterday();
  }, [selectedStation]);

  return (
    <>
      <Header activeRoute="/history" />

      <main className="flex-grow w-full max-w-7xl mx-auto px-[32px] py-[64px] space-y-[64px]">
        {/* Header Section */}
        <section className="space-y-[16px]">
          <AnimatedContainer animation="slideInLeft" once={false}>
            <H1 className="leading-[1.1] text-text-primary">Data Iklim Historis</H1>
            <Body className="text-text-secondary w-full mt-[8px]">
              Akses pola cuaca historis yang komprehensif dan catatan iklim.
            </Body>
          </AnimatedContainer>
        </section>

        {/* Rata-rata Harian Kemarin */}
        <section>
          <AnimatedContainer animation="scaleIn" once={false}>
            <H2 className="mb-4">Rata-rata Harian (Kemarin)</H2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="flex items-center gap-4 border-l-4 border-l-primary">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>thermostat</span>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Suhu Rata-rata</p>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">
                    {loading ? "..." : yesterdayData.avgTemp} {yesterdayData.avgTemp !== "-" && "°C"}
                  </p>
                </div>
              </Card>
              <Card className="flex items-center gap-4 border-l-4 border-l-primary">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Kelembaban</p>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">
                    {loading ? "..." : yesterdayData.avgRh} {yesterdayData.avgRh !== "-" && "%"}
                  </p>
                </div>
              </Card>
              <Card className="flex items-center gap-4 border-l-4 border-l-primary">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>air</span>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Kec. Angin Rata-rata</p>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">
                    {loading ? "..." : yesterdayData.avgWs} {yesterdayData.avgWs !== "-" && "km/j"}
                  </p>
                </div>
              </Card>
              <Card className="flex items-center gap-4 border-l-4 border-l-primary">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>rainy</span>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Total Curah Hujan</p>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">
                    {loading ? "..." : yesterdayData.totalRr} {yesterdayData.totalRr !== "-" && "mm"}
                  </p>
                </div>
              </Card>
            </div>
          </AnimatedContainer>
        </section>

        {/* Filter Section */}
        <section>
          <AnimatedContainer animation="fadeInDown" once={false}>
            <Card>
              <form className="grid grid-cols-1 md:grid-cols-4 gap-[16px] items-end">
                <div className="space-y-[8px]">
                  <Label className="text-text-secondary">Lokasi (Stasiun AWS)</Label>
                  <select 
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full rounded-md border border-border focus:ring-primary focus:border-primary py-2 px-3 text-[1rem] bg-surface outline-none cursor-pointer"
                  >
                    {stations.map(st => (
                      <option key={st.id} value={st.table_name}>{st.station_name}</option>
                    ))}
                    {stations.length === 0 && <option value="">Memuat...</option>}
                  </select>
                </div>
                <div className="space-y-[8px]">
                  <Label className="text-text-secondary">Parameter</Label>
                  <select className="w-full rounded-md border border-border focus:ring-primary focus:border-primary py-2 px-3 text-[1rem] bg-surface outline-none cursor-pointer">
                    <option>Curah Hujan</option>
                    <option>Suhu Udara</option>
                    <option>Kelembapan</option>
                  </select>
                </div>
                <div className="space-y-[8px]">
                  <Label className="text-text-secondary">Tanggal Mulai</Label>
                  <input className="w-full rounded-md border border-border focus:ring-primary focus:border-primary py-2 px-3 text-[1rem] bg-surface outline-none cursor-pointer" type="date" defaultValue="2023-01-01" />
                </div>
                <div className="space-y-[8px]">
                  <Label className="text-text-secondary">Tanggal Selesai</Label>
                  <input className="w-full rounded-md border border-border focus:ring-primary focus:border-primary py-2 px-3 text-[1rem] bg-surface outline-none cursor-pointer" type="date" defaultValue="2023-12-31" />
                </div>
              </form>
            </Card>
          </AnimatedContainer>
        </section>

        {/* Data Visualization Row (Bento Grid Style) */}
        <section className="grid grid-cols-12 gap-[24px]">
          {/* Main Chart */}
          <div className="col-span-12 lg:col-span-8 flex">
            <AnimatedContainer animation="slideInLeft" delay={0.1} once={false} className="w-full">
              <Card className="flex flex-col min-h-[400px] h-full">
                <H2 className="mb-[24px]">Tren Curah Hujan Bulanan</H2>
                <div className="flex-grow relative w-full">
                  <BarChart />
                </div>
              </Card>
            </AnimatedContainer>
          </div>

          {/* Sidebar KPIs & Heatmap */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-[24px]">
            {/* KPI Card */}
            <AnimatedContainer animation="slideInRight" delay={0.2} once={false}>
              <Card className="bg-white/90 backdrop-blur-md border border-white/20 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
                <h4 className="text-[0.875rem] font-medium text-text-secondary uppercase tracking-wider mb-[16px]">Ringkasan Historis</h4>
                <div className="space-y-[16px]">
                  <div>
                    <div className="text-[0.875rem] text-text-secondary mb-1">Total Curah Hujan</div>
                    <div className="text-[1.5rem] font-bold text-primary tabular-nums">2.450 mm</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[0.875rem] text-text-secondary mb-1">Rata-rata Tertinggi</div>
                      <div className="text-[1rem] font-semibold text-warning tabular-nums">29.5°C</div>
                    </div>
                    <div>
                      <div className="text-[0.875rem] text-text-secondary mb-1">Rata-rata Terendah</div>
                      <div className="text-[1rem] font-semibold text-secondary tabular-nums">21.2°C</div>
                    </div>
                  </div>
                </div>
              </Card>
            </AnimatedContainer>

            {/* Heatmap Card */}
            <AnimatedContainer animation="slideInRight" delay={0.3} once={false} className="flex-grow flex">
              <Card className="flex-grow">
                <h4 className="text-[0.875rem] font-medium text-text-secondary uppercase tracking-wider mb-[16px]">Heatmap Curah Hujan</h4>
                <Heatmap />
              </Card>
            </AnimatedContainer>
          </div>
        </section>

        {/* Data Table Section */}
        <section>
          <AnimatedContainer animation="fadeInUp" delay={0.4} once={false}>
            <div className="bg-surface rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-border overflow-hidden">
              <div className="p-[24px] border-b border-border flex justify-between items-center bg-surface">
                <H2>Catatan Terperinci</H2>
                <button className="flex items-center gap-2 px-4 py-2 border border-border text-primary rounded-lg hover:bg-surface-container-low transition-colors text-[1rem]">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Ekspor CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="bg-surface-container-low text-text-secondary text-[0.875rem] font-medium border-b border-border">
                    <tr>
                      <th className="p-4">Bulan</th>
                      <th className="p-4">Curah Hujan (mm)</th>
                      <th className="p-4">Hari Hujan</th>
                      <th className="p-4">Rata-rata Suhu Maks</th>
                      <th className="p-4">Rata-rata Suhu Min</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums divide-y divide-border text-text-primary">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-[1rem]">Januari</td>
                      <td className="p-4">345.2</td>
                      <td className="p-4">22</td>
                      <td className="p-4">28.5°C</td>
                      <td className="p-4">22.1°C</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-[1rem]">Februari</td>
                      <td className="p-4">310.5</td>
                      <td className="p-4">19</td>
                      <td className="p-4">28.7°C</td>
                      <td className="p-4">22.0°C</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-[1rem]">Maret</td>
                      <td className="p-4">280.8</td>
                      <td className="p-4">18</td>
                      <td className="p-4">29.1°C</td>
                      <td className="p-4">21.8°C</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedContainer>
        </section>
      </main>

      <Footer />
    </>
  );
}
