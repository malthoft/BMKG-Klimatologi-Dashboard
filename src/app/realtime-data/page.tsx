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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getWeatherCondition = (temp: number, rh: number, rr: number) => {
  if (rr > 5) return { text: "Hujan Lebat", icon: "rainy" };
  if (rr > 0) return { text: "Hujan Ringan", icon: "rainy" };
  if (rh > 85) return { text: "Berawan Tebal", icon: "cloud" };
  if (rh > 70) return { text: "Cerah Berawan", icon: "partly_cloudy_day" };
  return { text: "Cerah", icon: "sunny" };
};

const METRIC_CONFIG = {
  temp: { name: "Suhu Udara", unit: "°C", color: "#FF5722", icon: "thermostat" },
  rh: { name: "Kelembapan", unit: "%", color: "#00BCD4", icon: "water_drop" },
  ws: { name: "Kec. Angin", unit: "km/j", color: "#8BC34A", icon: "air" },
  rr: { name: "Curah Hujan", unit: "mm", color: "#3F51B5", icon: "rainy" },
  press: { name: "Tekanan Udara", unit: "hPa", color: "#9C27B0", icon: "speed" },
  sr: { name: "Radiasi Matahari", unit: "W/m²", color: "#FFC107", icon: "wb_sunny" }
};

type MetricKey = keyof typeof METRIC_CONFIG;

const getMinMax = (data: any[], key: string) => {
  if (!data || data.length === 0) return { min: '--', max: '--' };
  const values = data.map(d => Number(d[key])).filter(n => !isNaN(n));
  if (values.length === 0) return { min: '--', max: '--' };
  
  // Format based on standard precision
  const formatNum = (num: number) => Number.isInteger(num) ? num : Number(num.toFixed(1));
  
  return {
    min: formatNum(Math.min(...values)),
    max: formatNum(Math.max(...values))
  };
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("temp");

  const filteredStations = stations.filter(st => st.station_name.toLowerCase().includes(searchQuery.toLowerCase()));

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

        const latest = await supabaseFetch(selectedStation, "order=timestamp.desc&limit=1");
        if (latest && latest.length > 0) {
          setLatestData(latest[0]);
        } else {
          setLatestData(null);
        }

        const rawData = await supabaseFetch(selectedStation, `order=timestamp.desc&limit=144`);
        
        const hourlyDataMap = new Map();
        (rawData || []).forEach((d: any) => {
          const wibTime = formatUTCtoWIB(d.time); 
          const hour = wibTime.split(':')[0]; 
          
          if (!hourlyDataMap.has(hour)) {
            hourlyDataMap.set(hour, {
              ...d,
              timeLabel: `${hour}:00`
            });
          }
        });
        
        const formattedHourly = Array.from(hourlyDataMap.values()).reverse();
        setHourlyData(formattedHourly);

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

  const stats = {
    temp: getMinMax(hourlyData, 'temp'),
    rh: getMinMax(hourlyData, 'rh'),
    ws: getMinMax(hourlyData, 'ws'),
    rr: getMinMax(hourlyData, 'rr'),
    press: getMinMax(hourlyData, 'press'),
    sr: getMinMax(hourlyData, 'sr'),
  };

  const weather = latestData 
    ? getWeatherCondition(latestData.temp, latestData.rh, latestData.rr)
    : { text: "Offline", icon: "cloud_off" };

  const getCardClass = (metric: MetricKey) => {
    return `h-full flex flex-col justify-between cursor-pointer transition-all duration-300 border-[2px] rounded-xl overflow-hidden ${
      selectedMetric === metric 
        ? 'border-primary shadow-md bg-primary/5 scale-[1.02]' 
        : 'border-border shadow-sm hover:shadow-md hover:border-primary/50'
    }`;
  };

  const getCardFooter = (metric: MetricKey, value: any) => {
    switch(metric) {
      case 'temp':
        return { label: "Kondisi Cuaca", value: weather.text };
      case 'rh':
        return { label: "Kategori", value: value > 80 ? "Lembab" : value < 50 ? "Kering" : "Normal" };
      case 'ws':
        return { label: "Arah Angin", value: `${latestData?.wd || 0}°` };
      case 'rr':
        return { label: "Intensitas", value: weather.text };
      case 'press':
        return { label: "Referensi", value: "Permukaan Laut" };
      case 'sr':
        return { label: "Status", value: value > 1 ? "Siang (Ada Sinar)" : "Malam (Gelap)" };
      default:
        return { label: "-", value: "-" };
    }
  };

  const renderCard = (metric: MetricKey, value: any) => {
    const config = METRIC_CONFIG[metric];
    const footerInfo = getCardFooter(metric, value);
    
    return (
      <AnimatedContainer animation="fadeInUp" once={false} className="w-full">
        <div onClick={() => setSelectedMetric(metric)} className="h-full">
          <Card className={getCardClass(metric)}>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-[16px]">
                <h3 className={`font-bold flex items-center gap-[6px] text-sm md:text-base ${selectedMetric === metric ? 'text-primary' : 'text-text-secondary'}`}>
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">{config.icon}</span> 
                  {config.name}
                </h3>
                {selectedMetric === metric && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </div>
              <div className="text-[2rem] md:text-[2.5rem] font-bold tabular-nums text-text-primary leading-none mb-4">
                {Math.round(value)} <span className="text-[1rem] md:text-[1.25rem] text-text-secondary font-normal">{config.unit}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
              <span className="text-[0.75rem] md:text-[0.875rem] text-text-secondary font-medium">{footerInfo.label}</span>
              <span className="text-[0.75rem] md:text-[0.875rem] text-text-primary font-bold truncate max-w-[150px] text-right">{footerInfo.value}</span>
            </div>
          </Card>
        </div>
      </AnimatedContainer>
    );
  };

  return (
    <main className="flex-grow">
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-[32px] py-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <AnimatedContainer animation="slideInLeft" once={false}>
          <H1 className="mb-[8px] leading-[1.1]">Kondisi Cuaca Terkini</H1>
          <Body className="text-text-secondary">Detail pemantauan cuaca dan pengamatan stasiun</Body>
        </AnimatedContainer>
        
        <AnimatedContainer animation="slideInRight" once={false} className="relative z-40">
          <div className="relative min-w-[250px] w-full md:w-auto">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-surface border border-border text-text-primary text-[1rem] rounded-lg flex items-center justify-between p-3 cursor-pointer outline-none font-medium shadow-sm hover:border-primary transition-colors"
            >
              <span className="truncate">{stationName || "Memuat stasiun..."}</span>
              <span className="material-symbols-outlined text-text-secondary">{isDropdownOpen ? "expand_less" : "expand_more"}</span>
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute top-full right-0 left-0 mt-2 bg-surface border border-border rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col z-50">
                  <div className="p-2 border-b border-border bg-surface">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">search</span>
                      <input 
                        type="text" 
                        placeholder="Cari stasiun..." 
                        className="w-full pl-8 pr-3 py-2 bg-[#f0f4f8] rounded-md outline-none text-sm text-text-primary focus:ring-1 focus:ring-primary transition-shadow"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto bg-surface">
                    {filteredStations.length > 0 ? (
                      filteredStations.map(st => (
                        <div 
                          key={st.id} 
                          className={`px-4 py-3 cursor-pointer hover:bg-[#f0f4f8] transition-colors text-sm ${selectedStation === st.table_name ? "bg-primary/10 text-primary font-bold" : "text-text-primary font-medium"}`}
                          onClick={() => {
                            setSelectedStation(st.table_name);
                            router.push(`/realtime-data?station=${st.table_name}`);
                            setIsDropdownOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          {st.station_name}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-text-secondary">Tidak ada hasil</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </AnimatedContainer>
      </section>

      {/* Live Metrics Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-[32px] mb-[32px]">
        {loading ? (
          <div className="w-full h-[400px] flex items-center justify-center text-text-secondary">
            <span className="material-symbols-outlined animate-spin text-[48px] mb-4 text-primary">progress_activity</span>
          </div>
        ) : !latestData ? (
          <div className="w-full h-[400px] flex items-center justify-center text-text-secondary bg-surface rounded-xl border border-border">
            Belum ada data tersedia untuk stasiun ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[12px] md:gap-[16px]">
            {renderCard("temp", latestData.temp)}
            {renderCard("rh", latestData.rh)}
            {renderCard("ws", latestData.ws)}
            {renderCard("rr", latestData.rr)}
            {renderCard("press", latestData.press)}
            {renderCard("sr", latestData.sr)}
          </div>
        )}
      </section>

      {/* Interactive Trend Chart */}
      {!loading && hourlyData.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-[32px] mb-[96px]">
          <AnimatedContainer animation="fadeInUp" once={false}>
            <div className="bg-surface rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-border p-4 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                  <H2 className="mb-2">Grafik Tren {METRIC_CONFIG[selectedMetric].name}</H2>
                  <p className="text-text-secondary text-[0.875rem]">Fluktuasi dalam 24 jam terakhir. Klik card di atas untuk mengubah grafik.</p>
                </div>
                
                {/* Min Max Indicator on Chart */}
                <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
                  <div className="px-3 py-2 bg-error/10 text-error rounded-lg flex-1 md:flex-none text-center">
                    <p className="text-[0.65rem] uppercase font-bold opacity-80">Maksimum</p>
                    <p className="font-bold text-sm md:text-base">{stats[selectedMetric].max} {METRIC_CONFIG[selectedMetric].unit}</p>
                  </div>
                  <div className="px-3 py-2 bg-primary/10 text-primary rounded-lg flex-1 md:flex-none text-center">
                    <p className="text-[0.65rem] uppercase font-bold opacity-80">Minimum</p>
                    <p className="font-bold text-sm md:text-base">{stats[selectedMetric].min} {METRIC_CONFIG[selectedMetric].unit}</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full h-[250px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="timeLabel" 
                      tick={{ fill: '#666666', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      minTickGap={15}
                    />
                    <YAxis 
                      tick={{ fill: '#666666', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#000' }}
                      formatter={(value: any) => [`${value} ${METRIC_CONFIG[selectedMetric].unit}`, METRIC_CONFIG[selectedMetric].name]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke={METRIC_CONFIG[selectedMetric].color} 
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
