"use client";

import { H1, H2, Body } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function ClimateChange() {
  return (
    <>
      <Header activeRoute="/climate-change" />

      <main className="flex-grow w-full max-w-7xl mx-auto px-[32px] py-[64px] space-y-[64px]">
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

        {/* Data Tables Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]">
          {/* Statistik Data Bulanan */}
          <AnimatedContainer animation="slideInLeft" delay={0.4} once={false} className="h-full">
            <Card className="flex flex-col gap-[16px] h-full overflow-hidden">
              <div className="flex items-center justify-between mb-[8px]">
                <H2 className="text-text-primary">Statistik Data Bulanan</H2>
                <button className="text-text-secondary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-[0.875rem] font-medium">
                      <th className="py-2 px-2">Bulan</th>
                      <th className="py-2 px-2 text-right">Suhu Maksimum</th>
                      <th className="py-2 px-2 text-right">Suhu Minimum</th>
                      <th className="py-2 px-2 text-right">Suhu Rata-rata</th>
                    </tr>
                  </thead>
                  <tbody className="text-[1rem] tabular-nums text-text-primary divide-y divide-border">
                    <tr className="hover:bg-surface-container-low transition-colors cursor-default">
                      <td className="py-3 px-2">Januari</td>
                      <td className="py-3 px-2 text-right">28,28</td>
                      <td className="py-3 px-2 text-right">20,81</td>
                      <td className="py-3 px-2 text-right font-medium text-primary">23,66</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors cursor-default bg-surface-container-lowest">
                      <td className="py-3 px-2">Februari</td>
                      <td className="py-3 px-2 text-right">28,38</td>
                      <td className="py-3 px-2 text-right">20,90</td>
                      <td className="py-3 px-2 text-right font-medium text-primary">23,72</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors cursor-default">
                      <td className="py-3 px-2">Maret</td>
                      <td className="py-3 px-2 text-right">28,64</td>
                      <td className="py-3 px-2 text-right">20,58</td>
                      <td className="py-3 px-2 text-right font-medium text-primary">23,70</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors cursor-default bg-surface-container-lowest">
                      <td className="py-3 px-2">April</td>
                      <td className="py-3 px-2 text-right">28,82</td>
                      <td className="py-3 px-2 text-right">20,57</td>
                      <td className="py-3 px-2 text-right font-medium text-primary">23,93</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors cursor-default">
                      <td className="py-3 px-2">Mei</td>
                      <td className="py-3 px-2 text-right">28,72</td>
                      <td className="py-3 px-2 text-right">20,05</td>
                      <td className="py-3 px-2 text-right font-medium text-primary">23,80</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </AnimatedContainer>

          {/* Tabel Data Suhu Udara Harian */}
          <AnimatedContainer animation="slideInRight" delay={0.5} once={false} className="h-full">
            <Card className="flex flex-col gap-[16px] h-full overflow-hidden">
              <div className="flex items-center justify-between mb-[8px]">
                <H2 className="text-text-primary">Data Suhu Udara Harian</H2>
                <div className="flex items-center gap-2 text-text-secondary">
                  <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">content_copy</span></button>
                  <div className="flex items-center">
                    <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
                    <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
                  </div>
                  <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">last_page</span></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-[0.875rem] font-medium">
                      <th className="py-2 px-2 border-r border-border">Tanggal</th>
                      <th className="py-2 px-2 border-r border-border">Suhu Min</th>
                      <th className="py-2 px-2 border-r border-border text-right">Suhu Rata-rata</th>
                      <th className="py-2 px-2 text-right">Suhu Max</th>
                    </tr>
                  </thead>
                  <tbody className="text-[1rem] tabular-nums text-text-primary divide-y divide-border">
                    <tr className="hover:bg-surface-container-low transition-colors cursor-default">
                      <td className="py-3 px-2 border-r border-border">24 Agustus 1994</td>
                      <td className="py-3 px-2 border-r border-border text-secondary">11,3</td>
                      <td className="py-3 px-2 border-r border-border text-right font-medium">20,6</td>
                      <td className="py-3 px-2 text-right text-warning">28,6</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors cursor-default bg-surface-container-lowest">
                      <td className="py-3 px-2 border-r border-border">4 September 2006</td>
                      <td className="py-3 px-2 border-r border-border text-secondary">12,2</td>
                      <td className="py-3 px-2 border-r border-border text-right font-medium">20,8</td>
                      <td className="py-3 px-2 text-right text-warning">27,6</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors cursor-default">
                      <td className="py-3 px-2 border-r border-border">19 Juli 1992</td>
                      <td className="py-3 px-2 border-r border-border text-secondary">13,0</td>
                      <td className="py-3 px-2 border-r border-border text-right font-medium">20,6</td>
                      <td className="py-3 px-2 text-right text-warning">26,2</td>
                    </tr>
                  </tbody>
                </table>
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
