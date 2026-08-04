"use client";

import { H1, H2, Body, Label } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseFetch } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { formatUTCtoWIB } from "@/lib/utils";

const getWeatherCondition = (temp: number, rh: number, rr: number) => {
  if (rr > 5) return { text: "Hujan Lebat", icon: "rainy" };
  if (rr > 0) return { text: "Hujan Ringan", icon: "rainy" };
  if (rh > 85) return { text: "Berawan Tebal", icon: "cloud" };
  if (rh > 70) return { text: "Cerah Berawan", icon: "partly_cloudy_day" };
  return { text: "Cerah", icon: "sunny" };
};

function RealtimeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [stationName, setStationName] = useState<string>("Memuat...");
  
  const [latestData, setLatestData] = useState<any>(null);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Load stations
  useEffect(() => {
    async function init() {
      try {
        let sts = await supabaseFetch("stations", "show_on_realtime=eq.true");
        if (!sts || sts.length === 0) {
          sts = FALLBACK_STATIONS;
        }
        setStations(sts);
        
        let initialStation = searchParams?.get("station");
        if (!initialStation && sts && sts.length > 0) {
          initialStation = sts[0].table_name;
        }
        
        if (initialStation) {
          setSelectedStation(initialStation);
          const st = sts.find((s: any) => s.table_name === initialStation);
          if (st) setStationName(st.station_name);
        }
      } catch (e) {
        console.error("Error loading stations", e);
      }
    }
    init();
  }, [searchParams]);

  // 2. Load Realtime Data when selectedStation changes
  useEffect(() => {
    if (!selectedStation) return;
    
    async function loadData() {
      setLoading(true);
      try {
        const st = stations.find(s => s.table_name === selectedStation);
        if (st) setStationName(st.station_name);

        // Fetch latest 1 record for hero metrics
        const latest = await supabaseFetch(selectedStation, "order=timestamp.desc&limit=1");
        if (latest && latest.length > 0) {
          setLatestData(latest[0]);
        } else {
          setLatestData(null);
        }

        // Fetch today's data (limit 24 for hourly)
        // In real app, we might want to group by hour, but for now just fetch recent 24
        const todayStr = new Date().toISOString().split("T")[0]; // "2026-08-02"
        const hourly = await supabaseFetch(selectedStation, `date=eq.${todayStr}&order=time.desc&limit=24`);
        setHourlyData(hourly || []);

      } catch (e) {
        console.error("Error loading realtime data", e);
        setLatestData(null);
        setHourlyData([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [selectedStation, stations]);

  const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setSelectedStation(newVal);
    router.push(`/realtime-data?station=${newVal}`);
  };

  const weather = latestData 
    ? getWeatherCondition(latestData.temp, latestData.rh, latestData.rr)
    : { text: "Offline", icon: "cloud_off" };

  return (
    <main className="flex-grow">
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-[32px] py-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <AnimatedContainer animation="slideInLeft" once={false}>
          <H1 className="mb-[8px] leading-[1.1]">Cuaca Saat Ini</H1>
          <Body className="text-text-secondary">Pemantauan Realtime AWS BMKG</Body>
        </AnimatedContainer>
        
        <AnimatedContainer animation="slideInRight" once={false}>
          <select 
            value={selectedStation} 
            onChange={handleStationChange}
            className="bg-surface border border-border text-text-primary text-[1rem] rounded-lg focus:ring-primary focus:border-primary block p-3 cursor-pointer outline-none min-w-[250px] font-medium shadow-sm"
          >
            {stations.map(st => (
              <option key={st.id} value={st.table_name}>{st.station_name}</option>
            ))}
            {stations.length === 0 && <option value="">Memuat stasiun...</option>}
          </select>
        </AnimatedContainer>
      </section>

      {/* Live Metrics Bento Grid */}
      <section className="max-w-7xl mx-auto px-[32px] mb-[64px]">
        {loading ? (
          <div className="w-full h-[400px] flex items-center justify-center text-text-secondary">
            <span className="material-symbols-outlined animate-spin text-[48px] mb-4 text-primary">progress_activity</span>
          </div>
        ) : !latestData ? (
          <div className="w-full h-[400px] flex items-center justify-center text-text-secondary bg-surface rounded-xl border border-border">
            Belum ada data tersedia untuk stasiun ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
            {/* Suhu Udara */}
            <div className="col-span-1 md:col-span-2 flex">
              <AnimatedContainer animation="fadeInUp" delay={0.1} once={false} className="w-full">
                <Card className="h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-[24px]">
                    <div>
                      <div className="flex items-center gap-[8px] mb-[4px]">
                        <H2>Suhu Udara</H2>
                        <span className="bg-error text-background px-2 py-0.5 rounded-full text-[0.75rem] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-background rounded-full animate-pulse"></span> Live
                        </span>
                      </div>
                      <p className="text-text-secondary flex items-center gap-[4px] text-[0.875rem]">
                        <span className="material-symbols-outlined text-[18px]">location_on</span> {stationName} ({formatUTCtoWIB(latestData.time)} WIB)
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[48px] text-primary" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>{weather.icon}</span>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-end gap-[16px] mb-[24px]">
                    <span className="text-[4.5rem] font-bold tabular-nums tracking-tighter leading-none text-text-primary">{Math.round(latestData.temp)}°C</span>
                    <span className="text-[1.125rem] text-text-secondary mb-2 font-medium">{weather.text}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-[16px] border-t border-border pt-[16px]">
                    <div>
                      <p className="text-[0.875rem] text-text-secondary mb-1">Suhu Maksimum</p>
                      <p className="font-semibold tabular-nums text-text-primary">{latestData.temp_max}°C</p>
                    </div>
                    <div>
                      <p className="text-[0.875rem] text-text-secondary mb-1">Suhu Minimum</p>
                      <p className="font-semibold tabular-nums text-text-primary">{latestData.temp_min}°C</p>
                    </div>
                  </div>
                </Card>
              </AnimatedContainer>
            </div>

            {/* Kelembapan */}
            <AnimatedContainer animation="fadeInUp" delay={0.2} once={false}>
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-text-secondary mb-[16px] flex items-center gap-[8px]">
                    <span className="material-symbols-outlined">water_drop</span> Kelembapan
                  </h3>
                  <div className="text-[2.25rem] font-bold tabular-nums mb-[16px] text-text-primary">{Math.round(latestData.rh)}%</div>
                </div>
                <div className="w-full bg-border rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${Math.min(latestData.rh, 100)}%` }}></div>
                </div>
              </Card>
            </AnimatedContainer>

            {/* Kecepatan Angin */}
            <AnimatedContainer animation="fadeInUp" delay={0.3} once={false}>
              <Card className="h-full">
                <h3 className="font-bold text-text-secondary mb-[16px] flex items-center gap-[8px]">
                  <span className="material-symbols-outlined">air</span> Kecepatan Angin
                </h3>
                <div className="text-[2.25rem] font-bold tabular-nums mb-[8px] text-text-primary">
                  {latestData.ws} <span className="text-[1.125rem] text-text-secondary font-normal">km/j</span>
                </div>
                <p className="text-[0.875rem] text-text-secondary flex items-center gap-[4px]">
                  <span className="material-symbols-outlined text-[16px]">explore</span> Arah: {latestData.wd}°
                </p>
                <p className="text-[0.875rem] text-text-secondary flex items-center gap-[4px] mt-2 border-t border-border pt-2">
                  Maksimum: {latestData.ws_max} km/j
                </p>
              </Card>
            </AnimatedContainer>

            {/* Curah Hujan */}
            <AnimatedContainer animation="fadeInUp" delay={0.4} once={false}>
              <Card className="h-full">
                <h3 className="font-bold text-text-secondary mb-[16px] flex items-center gap-[8px]">
                  <span className="material-symbols-outlined">rainy</span> Curah Hujan
                </h3>
                <div className="text-[2.25rem] font-bold tabular-nums mb-[8px] text-text-primary">
                  {latestData.rr} <span className="text-[1.125rem] text-text-secondary font-normal">mm</span>
                </div>
                <p className="text-[0.875rem] text-text-secondary font-medium mt-4">
                  Tekanan: {latestData.press} hPa
                </p>
                <p className="text-[0.875rem] text-text-secondary font-medium mt-1">
                  Radiasi Matahari: {latestData.sr} W/m²
                </p>
              </Card>
            </AnimatedContainer>
            
            {/* Peta Radar / Map (Placeholder) */}
            <AnimatedContainer animation="scaleIn" delay={0.5} once={false}>
              <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden relative group min-h-[180px] h-full flex flex-col items-center justify-center">
                 <span className="material-symbols-outlined text-[64px] text-border mb-2">map</span>
                 <p className="text-secondary font-medium">Peta Lokasi AWS</p>
              </div>
            </AnimatedContainer>
          </div>
        )}
      </section>

      {/* Hourly Data Table */}
      {!loading && hourlyData.length > 0 && (
        <section className="max-w-7xl mx-auto px-[32px] mb-[96px]">
          <AnimatedContainer animation="fadeInUp" once={false}>
            <div className="bg-surface rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-border overflow-hidden">
              <div className="p-[24px] border-b border-border flex justify-between items-center bg-surface">
                <H2>Data Klimatologi Per Jam</H2>
                <button className="flex items-center gap-2 px-4 py-2 border border-border text-primary rounded-lg hover:bg-surface-container-low transition-colors text-[0.875rem] font-medium">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Ekspor CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-surface-container-low text-text-secondary text-[0.875rem] font-medium border-b border-border">
                    <tr>
                      <th className="p-4">Waktu (WIB)</th>
                      <th className="p-4">Suhu (°C)</th>
                      <th className="p-4">Kelembaban (%)</th>
                      <th className="p-4">Kec. Angin (km/j)</th>
                      <th className="p-4">Arah Angin (°)</th>
                      <th className="p-4">Tekanan (hPa)</th>
                      <th className="p-4">Curah Hujan (mm)</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums divide-y divide-border text-text-primary text-[0.875rem]">
                    {hourlyData.map((data, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium">{formatUTCtoWIB(data.time)}</td>
                        <td className="p-4">{data.temp}</td>
                        <td className="p-4">{data.rh}</td>
                        <td className="p-4">{data.ws}</td>
                        <td className="p-4">{data.wd}</td>
                        <td className="p-4">{data.press}</td>
                        <td className="p-4">{data.rr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedContainer>
        </section>
      )}
    </main>
  );
}

export default function RealtimeData() {
  return (
    <>
      <Header activeRoute="/realtime-data" />
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Memuat...</div>}>
        <RealtimeContent />
      </Suspense>
      <Footer />
    </>
  );
}
