"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { StationSlider } from "@/components/ui/station-slider";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { supabaseFetch } from "@/lib/supabase";
import { formatUTCtoWIB } from "@/lib/utils";

interface HeroWeatherData {
  stationName: string;
  temp: number;
  rh: number;
  ws: number;
  rr: number;
  press: number;
  sr: number;
  condition: string;
  icon: string;
  time: string;
  date: string;
}

const DEFAULT_WEATHER: HeroWeatherData = {
  stationName: "Malang Utama",
  temp: 26,
  rh: 75,
  ws: 12,
  rr: 0,
  press: 1013,
  sr: 0,
  condition: "Cerah Berawan",
  icon: "partly_cloudy_day",
  time: "--:--",
  date: "",
};

export default function Home() {
  const [heroWeather, setHeroWeather] = useState<HeroWeatherData>(DEFAULT_WEATHER);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  const loadHeroData = useCallback(async () => {
    try {
      const latest = await supabaseFetch("aws_batu", "order=timestamp.desc&limit=1");
      if (latest && latest.length > 0) {
        const d = latest[0];
        let cond = "Cerah";
        let icon = "sunny";
        if (d.rr > 5) { cond = "Hujan Lebat"; icon = "rainy"; }
        else if (d.rr > 0) { cond = "Hujan Ringan"; icon = "rainy"; }
        else if (d.rh > 85) { cond = "Berawan Tebal"; icon = "cloud"; }
        else if (d.rh > 70) { cond = "Cerah Berawan"; icon = "partly_cloudy_day"; }

        setHeroWeather({
          stationName: "AWS Batu (Malang)",
          temp: Math.round(d.temp),
          rh: Math.round(d.rh),
          ws: parseFloat((d.ws || 0).toFixed(1)),
          rr: parseFloat((d.rr || 0).toFixed(1)),
          press: Math.round(d.press || 0),
          sr: parseFloat((d.sr || 0).toFixed(1)),
          condition: cond,
          icon: icon,
          time: d.time ? formatUTCtoWIB(d.time) : "--:--",
          date: d.date || "",
        });
      }
    } catch (e) {
      console.error("Error loading hero weather", e);
    }
  }, []);

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
    loadHeroData();
    loadAnnouncements();

    const refreshInterval = setInterval(() => {
      loadHeroData();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [loadHeroData, loadAnnouncements]);

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

  return (
    <>
      <Header activeRoute="/" />

      <main className="flex-grow w-full">
        {/* ═══════════════════════════════════════════════════ */}
        {/* 1. CUACA TERKINI — Clean Modern Blue Gradient Card */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 pt-6 pb-2 w-full">
          <AnimatedContainer animation="fadeInUp" once={false} className="w-full">
            <div className="bg-gradient-to-r from-[#0056B3] via-[#0A84FF] to-[#00A3FF] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-white/20 relative overflow-hidden w-full">
              {/* Ambient Glow */}
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8 w-full">
                {/* Left: Main temperature display */}
                <div className="flex items-center gap-5 shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner shrink-0">
                    <span
                      className="material-symbols-outlined text-[64px] md:text-[76px] text-amber-300 drop-shadow-md"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {heroWeather.icon}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/30 whitespace-nowrap">
                        CUACA TERKINI
                      </span>
                    </div>
                    <div className="text-[48px] md:text-[60px] font-black leading-none tracking-tight whitespace-nowrap">
                      {heroWeather.temp}°<span className="text-[28px] md:text-[36px] font-bold text-white/70">C</span>
                    </div>
                    <p className="text-white/90 font-semibold text-base mt-1 whitespace-nowrap">{heroWeather.condition}</p>
                  </div>
                </div>

                {/* Center: Station & Location Info */}
                <div className="flex flex-col gap-1.5 lg:border-l lg:border-white/20 lg:pl-8">
                  <div className="flex items-center gap-2 text-white/90 text-sm font-bold whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px] text-cyan-200">location_on</span>
                    {heroWeather.stationName}
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs font-medium whitespace-nowrap">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {heroWeather.date && <span>{heroWeather.date}</span>}
                    <span>Pukul {heroWeather.time} WIB</span>
                  </div>
                </div>

                {/* Right: Parameter Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                  {[
                    { icon: "water_drop", label: "Kelembaban", value: `${heroWeather.rh}%`, color: "text-sky-200" },
                    { icon: "air", label: "Angin", value: `${heroWeather.ws} km/h`, color: "text-teal-200" },
                    { icon: "rainy", label: "Curah Hujan", value: `${heroWeather.rr} mm`, color: "text-blue-200" },
                    { icon: "speed", label: "Tekanan", value: heroWeather.press > 0 ? `${heroWeather.press} hPa` : "--", color: "text-amber-200" },
                  ].map((param) => (
                    <div
                      key={param.label}
                      className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 min-w-[105px] flex flex-col items-start justify-center shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 mb-1 whitespace-nowrap">
                        <span className={`material-symbols-outlined text-[16px] ${param.color}`}>{param.icon}</span>
                        <span className="text-[0.65rem] text-white/70 font-semibold uppercase tracking-wider">{param.label}</span>
                      </div>
                      <span className="text-base font-extrabold text-white tracking-tight whitespace-nowrap">{param.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 2. COUNTER STATISTICS STRIP (NEW INFORMATION ITEMS) */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="bg-surface border-b border-border py-6 w-full">
          <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center w-full">
            {[
              { value: "23 AWS", label: "Stasiun Otomatis Aktif", color: "text-primary" },
              { value: "10 Menit", label: "Interval Update Realtime", color: "text-amber-500" },
              { value: "30+ Tahun", label: "Arsip Data Klimatologi", color: "text-emerald-500" },
              { value: "Jawa Timur", label: "Wilayah Operasional Resmi", color: "text-sky-500" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-text-primary whitespace-nowrap">{stat.value}</span>
                <span className="text-xs text-text-secondary font-semibold mt-1 whitespace-nowrap">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 3. HERO WELCOME SECTION */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-14 w-full">
          <div className="w-full max-w-[800px] flex flex-col gap-4">
            <div>
              <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider whitespace-nowrap">
                STASIUN KLIMATOLOGI MALANG
              </span>
            </div>

            <h1 className="text-[2.25rem] sm:text-[2.75rem] md:text-[3.25rem] font-extrabold text-text-primary leading-[1.15] tracking-tight w-full">
              Portal Informasi Cuaca &amp; Iklim Jawa Timur
            </h1>

            <AnimatedContainer animation="fadeInUp" delay={0.15} once={false} className="w-full">
              <p className="text-text-secondary text-[1.05rem] md:text-[1.15rem] leading-relaxed w-full">
                Menyediakan data cuaca dan iklim terpercaya, akurat, dan up-to-date untuk masyarakat Malang Raya dan sekitarnya. Pantau kondisi lingkungan Anda setiap saat.
              </p>
            </AnimatedContainer>

            <AnimatedContainer animation="fadeInUp" delay={0.25} once={false} className="w-full">
              <div className="flex flex-wrap gap-3 mt-2">
                <Link href="/realtime-data">
                  <button className="bg-primary text-white hover:bg-secondary px-6 py-3 rounded-lg font-semibold text-[1rem] transition-colors inline-flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer">
                    Jelajahi Data Iklim
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
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
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 4. AWS STATION GRID */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-12 md:pb-16 w-full">
          <AnimatedContainer animation="fadeInUp" delay={0.1} once={false} className="w-full">
            <StationSlider />
          </AnimatedContainer>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 5. LAYANAN CEPAT — 2×2 grid */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="bg-tertiary/40 py-12 md:py-16 border-t border-b border-border w-full">
          <div className="max-w-7xl mx-auto px-6 md:px-8 w-full">
            <AnimatedContainer animation="fadeInUp" once={false} className="mb-10 w-full">
              <div className="text-center w-full max-w-[650px] mx-auto">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-2 block whitespace-nowrap">
                  Akses Informasi Praktis
                </span>
                <h2 className="text-[1.75rem] font-bold text-text-primary leading-tight w-full">Layanan Cepat Stasiun</h2>
                <p className="text-text-secondary mt-2 text-[0.95rem] leading-relaxed w-full">
                  Jelajahi berbagai fitur utama portal klimatologi untuk kebutuhan informasi cuaca, analisis tren, dan pengumuman resmi.
                </p>
              </div>
            </AnimatedContainer>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[850px] mx-auto w-full">
              {[
                {
                  href: "/realtime-data",
                  icon: "sensors",
                  subtitle: "23 Stasiun Aktif",
                  title: "Data Realtime",
                  desc: "Pantau parameter suhu, kelembaban, dan curah hujan terkini dari seluruh jaringan AWS.",
                  cta: "Buka Data",
                },
                {
                  href: "/climate-change",
                  icon: "thermostat",
                  subtitle: "Analisis Tren",
                  title: "Perubahan Iklim",
                  desc: "Pantau proyeksi perubahan iklim jangka panjang dan tren suhu wilayah Jawa Timur.",
                  cta: "Pelajari Lebih Lanjut",
                },
                {
                  href: "/history",
                  icon: "history",
                  subtitle: "Arsip Terpadu",
                  title: "Data Historis",
                  desc: "Akses arsip data cuaca historis untuk riset, sektor pertanian, dan perencanaan.",
                  cta: "Lihat Arsip",
                },
                {
                  href: "/announcements",
                  icon: "campaign",
                  subtitle: "Update Terkini",
                  title: "Pengumuman & Berita",
                  desc: "Dapatkan peringatan dini cuaca, buletin klimatologi, dan agenda resmi stasiun.",
                  cta: "Baca Berita",
                },
              ].map((svc, idx) => (
                <AnimatedContainer key={svc.href} animation="fadeInUp" delay={0.1 * idx} once={false} className="w-full">
                  <Link href={svc.href} className="block h-full w-full">
                    <Card className="h-full flex flex-row items-start gap-5 group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg w-full">
                      <div className="w-14 h-14 bg-tertiary rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                        <span className="material-symbols-outlined text-[28px]">{svc.icon}</span>
                      </div>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-[0.65rem] font-bold text-primary uppercase tracking-widest whitespace-nowrap">{svc.subtitle}</span>
                        <h3 className="text-[1.1rem] font-bold text-text-primary group-hover:text-primary transition-colors leading-snug">{svc.title}</h3>
                        <p className="text-text-secondary text-[0.85rem] leading-relaxed mt-0.5">{svc.desc}</p>
                        <span className="text-[0.8rem] font-semibold text-primary flex items-center gap-1 mt-2 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                          {svc.cta}
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                      </div>
                    </Card>
                  </Link>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 6. PENGUMUMAN TERBARU — With color accent */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 w-full">
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
                <AnimatedContainer key={ann.id || idx} animation="fadeInUp" delay={0.08 * idx} once={false} className="w-full">
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
        {/* 7. GALERI BMKG — Updated IG link */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="bg-tertiary/30 py-12 md:py-16 border-t border-border w-full">
          <div className="max-w-7xl mx-auto px-6 md:px-8 w-full">
            <AnimatedContainer animation="fadeInUp" once={false} className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
              <div>
                <h2 className="text-[1.5rem] font-bold text-text-primary flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[28px]">photo_camera</span>
                  Galeri BMKG Iklim Jawa Timur
                </h2>
                <p className="text-text-secondary text-[0.9rem] mt-1">Dokumentasi kegiatan operasional, edukasi, dan pengamatan iklim.</p>
              </div>
              <a
                className="inline-flex items-center gap-2 font-semibold text-primary hover:text-secondary transition-colors bg-surface border border-border px-4 py-2.5 rounded-full text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                href="https://www.instagram.com/bmkg.iklimjatim/"
                target="_blank"
                rel="noreferrer"
              >
                <span>Kunjungi Instagram @bmkg.iklimjatim</span>
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
                <AnimatedContainer key={idx} animation="scaleIn" delay={0.08 * idx} once={false} className="w-full">
                  <div className="aspect-square bg-surface rounded-2xl overflow-hidden relative group shadow-sm border border-border/70 w-full">
                    <img
                      alt={`Galeri BMKG ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={src}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap">
                        <span className="material-symbols-outlined text-[16px]">visibility</span> Lihat foto
                      </span>
                    </div>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </>
  );
}
