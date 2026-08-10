"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { supabaseFetch } from "@/lib/supabase";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailyObservation {
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
  jam: string;
  suhu_c: number;
  kelembaban_percent: number;
  kecepatan_angin_kt: number;
  tekanan_mbar: number;
}

const formatSyncTimestamp = (syncedAtStr?: string) => {
  if (!syncedAtStr) return "Setiap Jam 09:00 WIB";
  const dateObj = new Date(syncedAtStr);
  if (isNaN(dateObj.getTime())) return "Setiap Jam 09:00 WIB";
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return `${formattedDate}, 09:00 WIB`;
};

export default function PengamatanHarian() {
  const [dailyData, setDailyData] = useState<DailyObservation | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyObservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const dailyResult = await supabaseFetch("daily_observations", "id=eq.1");
        if (dailyResult && dailyResult.length > 0) {
          setDailyData(dailyResult[0]);
        }

        const hourlyResult = await supabaseFetch("hourly_observations", "order=id.asc");
        if (hourlyResult) {
          setHourlyData(hourlyResult);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000); // Refresh setiap 10 Menit
    return () => clearInterval(interval);
  }, []);

  const getMetricCards = (data: DailyObservation) => [
    {
      title: "Suhu Maksimum",
      value: `${data.suhu_maksimum}°C`,
      icon: "thermostat",
      color: "text-[#FF5722]",
      bg: "bg-[#FF5722]/10",
      desc: "Suhu tertinggi harian",
    },
    {
      title: "Suhu Minimum",
      value: `${data.suhu_minimum}°C`,
      icon: "ac_unit",
      color: "text-[#2196F3]",
      bg: "bg-[#2196F3]/10",
      desc: "Suhu terendah harian",
    },
    {
      title: "Curah Hujan",
      value: `${data.curah_hujan_mm} mm`,
      icon: "rainy",
      color: "text-[#3F51B5]",
      bg: "bg-[#3F51B5]/10",
      desc: data.kategori_hujan,
      badge: true,
    },
    {
      title: "Suhu Udara Rata²",
      value: `${data.suhu_udara_rata}°C`,
      icon: "device_thermostat",
      color: "text-[#FF9800]",
      bg: "bg-[#FF9800]/10",
      desc: "Rerata suhu harian",
    },
    {
      title: "Kelembaban (RH)",
      value: `${data.kelembaban_rata}%`,
      icon: "water_drop",
      color: "text-[#00BCD4]",
      bg: "bg-[#00BCD4]/10",
      desc: "Rerata kelembaban",
    },
    {
      title: "Kecepatan Angin",
      value: `${data.angin_kecepatan_rata_kt} Kt`,
      icon: "air",
      color: "text-[#8BC34A]",
      bg: "bg-[#8BC34A]/10",
      desc: `Arah: ${data.angin_arah_dominan}, Maks: ${data.angin_kecepatan_max_kt} Kt`,
    },
    {
      title: "Tekanan QFE",
      value: `${data.tekanan_udara_rata} hPa`,
      icon: "speed",
      color: "text-[#9C27B0]",
      bg: "bg-[#9C27B0]/10",
      desc: "Rerata tekanan harian",
    },
    {
      title: "Status Data",
      value: "Lengkap",
      icon: "check_circle",
      color: "text-[#4CAF50]",
      bg: "bg-[#4CAF50]/10",
      desc: "Diperbarui otomatis tiap jam 09:00",
    },
  ];

  return (
    <>
      <Header activeRoute="/realtime-data" />
      <main className="flex-grow w-full bg-[#f8fafc]">
        
        {/* Banner Section */}
        <section className="bg-primary text-white pt-24 md:pt-32 pb-16 md:pb-20 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          
          <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
            <AnimatedContainer animation="fadeInUp" once={true}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full">
                <div className="w-full md:max-w-[700px]">
                  <span className="inline-block bg-white/20 text-white border border-white/30 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider mb-4 shadow-sm backdrop-blur-sm">
                    LAPORAN DATA HARIAN
                  </span>
                  <h1 className="text-[2.25rem] md:text-[3.25rem] font-extrabold leading-[1.1] tracking-tight mb-4 drop-shadow-md">
                    Data Pengamatan Harian
                  </h1>
                  <p className="text-white/90 text-[1.1rem] md:text-[1.2rem] leading-relaxed max-w-[600px] drop-shadow-sm font-medium">
                    Pelaporan data hasil pengamatan cuaca harian secara periodik di Stasiun Klimatologi Jawa Timur. Data pengamatan terbaru selalu di-update secara otomatis setiap hari pada pukul <span className="font-bold text-amber-300">09:00 WIB pagi</span>.
                  </p>
                </div>
                
                {dailyData && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-lg shrink-0 flex items-center gap-4">
                    <span className="material-symbols-outlined text-[36px] text-amber-300">calendar_month</span>
                    <div>
                      <p className="text-sm text-white/80 font-semibold mb-1">Tanggal Pengamatan</p>
                      <p className="text-lg font-bold">{dailyData.tanggal_pengamatan}</p>
                      <p className="text-xs text-white/70 mt-0.5">Update: {formatSyncTimestamp(dailyData.synced_at || dailyData.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </AnimatedContainer>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 -mt-8 relative z-20 pb-16">
          {loading ? (
            <div className="bg-surface rounded-2xl shadow-lg p-16 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-[48px] text-primary mb-4">progress_activity</span>
              <p className="text-text-secondary font-medium">Memuat data pengamatan...</p>
            </div>
          ) : !dailyData ? (
            <div className="bg-surface rounded-2xl shadow-lg p-16 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-error mb-4">error_outline</span>
              <p className="text-text-secondary font-medium">Data pengamatan harian tidak tersedia.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {getMetricCards(dailyData).map((card, idx) => (
                  <AnimatedContainer key={idx} animation="fadeInUp" delay={0.1 * idx} once={true}>
                    <Card className="h-full border border-border/70 hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-300 p-5 rounded-2xl bg-surface group flex flex-col justify-between">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                          <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
                        </div>
                        {card.badge && (
                          <Badge variant={card.desc === "Hujan" || card.desc === "Hujan Ringan" ? "neutral" : card.desc === "Hujan Lebat" ? "error" : "success"}>
                            {card.desc}
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-text-secondary text-sm font-semibold mb-1">{card.title}</h3>
                        <div className="text-[1.75rem] font-bold text-text-primary mb-2 tabular-nums leading-tight tracking-tight">
                          {card.value}
                        </div>
                        {!card.badge && (
                          <p className="text-xs text-text-secondary font-medium">{card.desc}</p>
                        )}
                      </div>
                    </Card>
                  </AnimatedContainer>
                ))}
              </div>

              {/* Summary Banner */}
              <AnimatedContainer animation="fadeInUp" delay={0.2} once={true}>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 md:p-6 shadow-sm flex items-start gap-4">
                  <div className="bg-white rounded-full p-2 shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary text-[28px]">info</span>
                  </div>
                  <div>
                    <h4 className="text-text-primary font-bold text-lg mb-1">Rangkuman Cuaca Ekstrim</h4>
                    <p className="text-text-secondary text-[0.95rem] leading-relaxed">{dailyData.rangkuman_info}</p>
                  </div>
                </div>
              </AnimatedContainer>

              {/* Charts Section */}
              {hourlyData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  
                  {/* Chart 1: Suhu vs Kelembaban */}
                  <AnimatedContainer animation="slideInLeft" once={true}>
                    <Card className="p-5 md:p-6 shadow-md border-border rounded-2xl">
                      <h3 className="text-lg font-bold text-text-primary mb-1">Grafik Suhu & Kelembaban</h3>
                      <p className="text-sm text-text-secondary mb-6">Periode Pengamatan: 07:00 - 22:00 WIB</p>
                      
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSuhu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF5722" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#FF5722" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRH" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00BCD4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00BCD4" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="jam" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#FF5722' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#00BCD4' }} axisLine={false} tickLine={false} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Area yAxisId="left" type="monotone" dataKey="suhu_c" name="Suhu (°C)" stroke="#FF5722" strokeWidth={3} fillOpacity={1} fill="url(#colorSuhu)" />
                            <Area yAxisId="right" type="monotone" dataKey="kelembaban_percent" name="Kelembaban (%)" stroke="#00BCD4" strokeWidth={3} fillOpacity={1} fill="url(#colorRH)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </AnimatedContainer>

                  {/* Chart 2: Tekanan vs Angin */}
                  <AnimatedContainer animation="slideInRight" once={true}>
                    <Card className="p-5 md:p-6 shadow-md border-border rounded-2xl">
                      <h3 className="text-lg font-bold text-text-primary mb-1">Grafik Tekanan & Kecepatan Angin</h3>
                      <p className="text-sm text-text-secondary mb-6">Periode Pengamatan: 07:00 - 22:00 WIB</p>
                      
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorPress" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9C27B0" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#9C27B0" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8BC34A" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8BC34A" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="jam" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis yAxisId="left" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12, fill: '#9C27B0' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#8BC34A' }} axisLine={false} tickLine={false} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Area yAxisId="left" type="monotone" dataKey="tekanan_mbar" name="Tekanan (hPa)" stroke="#9C27B0" strokeWidth={3} fillOpacity={1} fill="url(#colorPress)" />
                            <Area yAxisId="right" type="monotone" dataKey="kecepatan_angin_kt" name="Angin (Kt)" stroke="#8BC34A" strokeWidth={3} fillOpacity={1} fill="url(#colorWind)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </AnimatedContainer>

                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </>
  );
}
