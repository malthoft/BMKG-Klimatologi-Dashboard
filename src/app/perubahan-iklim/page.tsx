"use client";

import { useEffect, useState } from "react";
import { H1, H2, Body } from "@/components/ui/typography";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { TemperatureMapSlider } from "@/components/climate/temperature-map-slider";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";
import { supabaseFetch, supabaseGetPublicUrl } from "@/lib/supabase";
import { TemperatureLineChart } from "@/components/climate/temperature-line-chart";

export default function PerubahanIklim() {
  const [climateData, setClimateData] = useState<ClimateParsedResult | null>(null);
  const [annualData, setAnnualData] = useState<ClimateParsedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  
  const [tempMaps, setTempMaps] = useState<any[]>([]);
  const [loadingMaps, setLoadingMaps] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch Warming Stripes Data
        let stripesParsed: ClimateParsedResult | null = null;
        try {
          const res = await fetch(supabaseGetPublicUrl("climate-data", "warming-stripes.csv"), { cache: "no-store" });
          if (res.ok) {
            stripesParsed = parseCSVText(await res.text());
          }
        } catch (e) {
          // Ignore and fallback
        }
        
        if (!stripesParsed) {
          const res = await fetch("/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv");
          if (res.ok) {
            stripesParsed = parseCSVText(await res.text());
          }
        }
        
        // Fetch Annual Temperature Data
        let annualParsed: ClimateParsedResult | null = null;
        try {
          const res = await fetch(supabaseGetPublicUrl("climate-data", "annual-temperatures.csv"), { cache: "no-store" });
          if (res.ok) {
            annualParsed = parseCSVText(await res.text());
          }
        } catch (e) {
          // Ignore and fallback
        }
        
        if (!annualParsed) {
          const res = await fetch("/Rata_Rata_Suhu_Tahunan.csv");
          if (res.ok) {
            annualParsed = parseCSVText(await res.text());
          }
        }

        setClimateData(stripesParsed);
        setAnnualData(annualParsed);
        
        // Set initial region if available
        if (stripesParsed && Object.keys(stripesParsed.regionsData).length > 0) {
          const regions = Object.keys(stripesParsed.regionsData);
          const malang = regions.find((r) => /malang/i.test(r));
          setSelectedRegion(malang || regions[0]);
        }
        
      } catch (err) {
        console.error("Gagal memuat data iklim:", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadMaps() {
      try {
        const data = await supabaseFetch("temperature_maps", "order=year.desc,created_at.desc");
        if (data) {
          setTempMaps(data);
        }
      } catch (err) {
        console.error("Gagal memuat peta suhu:", err);
      } finally {
        setLoadingMaps(false);
      }
    }

    loadData();
    loadMaps();
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
            <AnimatedContainer animation="fadeInUp" delay={0.2} once={true} className="flex flex-col gap-6">
              <WarmingStripesViewer 
                parsedData={climateData} 
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
              />
              <TemperatureLineChart 
                parsedData={annualData}
                selectedRegion={selectedRegion}
              />
            </AnimatedContainer>
          )}
        </section>

        {/* Separator */}
        <div className="w-full flex items-center justify-center py-16">
          <div className="h-[1px] w-full max-w-xs bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          <div className="px-4 text-slate-300">
            <span className="material-symbols-outlined text-3xl">public</span>
          </div>
          <div className="h-[1px] w-full max-w-xs bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        </div>

        {/* Peta Perubahan Curah Hujan Component */}
        <section className="space-y-[24px]">
          <AnimatedContainer animation="fadeInDown" once={true}>
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <H2 className="text-text-primary">Peta Perubahan Curah Hujan Jawa Timur</H2>
              <p className="text-text-secondary text-sm">
                Distribusi spasial perubahan curah hujan tahunan berdasarkan fenomena El Niño dan La Niña di wilayah Jawa Timur.
              </p>
            </div>
          </AnimatedContainer>

          {loadingMaps ? (
            <div className="w-full py-16 flex flex-col items-center justify-center gap-3 text-text-secondary">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
              <span className="text-sm font-medium">Memuat data peta curah hujan...</span>
            </div>
          ) : (
            <AnimatedContainer animation="fadeInUp" delay={0.3} once={true}>
              <TemperatureMapSlider maps={tempMaps} />
            </AnimatedContainer>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
