"use client";

import { useEffect, useState } from "react";
import { H1, H2, Body } from "@/components/ui/typography";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";

export default function PerubahanIklim() {
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
      <Header activeRoute="/perubahan-iklim" />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] space-y-[48px]">
        {/* Judul */}
        <section className="space-y-[16px] max-w-3xl">
          <AnimatedContainer animation="slideInLeft" once={true}>
            <H1 className="leading-[1.1] text-text-primary">Visualisasi Perubahan Iklim Jawa Timur</H1>
          </AnimatedContainer>
        </section>

        {/* Warming Stripes Component */}
        <section className="space-y-[24px]">
          <AnimatedContainer animation="fadeInDown" once={true}>
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <H2 className="text-text-primary">Warming Stripes (Pita Pemanasan Iklim)</H2>
              <p className="text-text-secondary text-sm">
                Visualisasi pita warna buatan Ed Hawkins yang menggambarkan tren kenaikan suhu tahunan dari waktu ke waktu.
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
      </main>

      <Footer />
    </>
  );
}
