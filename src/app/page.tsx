"use client";

import { H1, H2, Body, Label } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { TextReveal } from "@/components/ui/text-reveal";
import { StationSlider } from "@/components/ui/station-slider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <Header activeRoute="/" />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] md:py-[96px] w-full grid grid-cols-1 lg:grid-cols-12 gap-[48px] lg:gap-[64px] items-center">
          <div className="lg:col-span-7 flex flex-col gap-[24px] items-start">
            <H1 className="leading-[1.1]">
              <TextReveal text="Selamat Datang di BMKG Stasiun Klimatologi Malang" />
            </H1>
            <AnimatedContainer animation="fadeInUp" delay={0.2} once={false}>
              <Body className="text-text-secondary w-full">
                Menyediakan data cuaca dan iklim terpercaya, akurat, dan up-to-date untuk masyarakat Malang dan sekitarnya. Pantau kondisi lingkungan Anda hari ini.
              </Body>
            </AnimatedContainer>
            <AnimatedContainer animation="fadeInUp" delay={0.4} once={false}>
              <Button variant="primary" className="mt-[16px] flex items-center gap-[8px]">
                Jelajahi Data Iklim
                <span className="material-symbols-outlined">arrow_forward</span>
              </Button>
            </AnimatedContainer>
          </div>
          
          {/* Widget Card */}
          <div className="lg:col-span-5 w-full">
            <AnimatedContainer animation="scaleIn" delay={0.3} duration={0.8} once={false}>
              <Card className="w-full">
                <div className="flex justify-between items-start mb-[16px] border-b border-border pb-[12px]">
                  <H2>Cuaca Saat Ini</H2>
                  <div className="flex items-center gap-[4px] text-primary">
                    <span className="material-symbols-outlined text-[20px]">location_on</span>
                    <Label className="text-primary">Malang, ID</Label>
                  </div>
                </div>
                <div className="flex items-center gap-[24px] mb-[24px] mt-[24px]">
                  <span className="material-symbols-outlined text-[80px] text-warning" style={{ fontVariationSettings: "'FILL' 1" }}>partly_cloudy_day</span>
                  <div>
                    <div className="text-[56px] font-bold text-text-primary leading-none">26°C</div>
                    <Body className="text-text-secondary mt-[8px]">Cerah Berawan</Body>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-[16px] pt-[16px] border-t border-border">
                  <div className="flex flex-col">
                    <span className="text-[0.875rem] font-medium text-text-secondary flex items-center gap-[4px] mb-[4px]">
                      <span className="material-symbols-outlined text-[18px]">water_drop</span>
                      Kelembaban
                    </span>
                    <span className="text-[1.125rem] font-semibold text-text-primary">75%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.875rem] font-medium text-text-secondary flex items-center gap-[4px] mb-[4px]">
                      <span className="material-symbols-outlined text-[18px]">air</span>
                      Angin
                    </span>
                    <span className="text-[1.125rem] font-semibold text-text-primary">12 km/h</span>
                  </div>
                </div>
              </Card>
            </AnimatedContainer>
          </div>
        </section>

        {/* AWS Station Slider Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-[32px] mb-[64px] md:mb-[96px] w-full">
          <AnimatedContainer animation="fadeInUp" delay={0.2} once={false}>
            <StationSlider />
          </AnimatedContainer>
        </section>

        {/* Layanan Cepat (Quick Services) */}
        <section className="bg-tertiary border-t border-b border-border py-[64px] md:py-[96px] bg-opacity-30">
          <div className="max-w-7xl mx-auto px-4 md:px-[32px] w-full">
            <AnimatedContainer animation="fadeInUp" once={false} className="mb-[48px]">
              <H2>Layanan Cepat</H2>
            </AnimatedContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px]">
              {/* Service Card 1 */}
              <AnimatedContainer animation="fadeInUp" delay={0.1} once={false}>
                <Card className="h-full flex flex-col items-start group cursor-pointer hover:border-primary transition-colors duration-300">
                  <div className="w-14 h-14 bg-tertiary rounded-full flex items-center justify-center text-primary mb-[24px] group-hover:bg-primary group-hover:text-background transition-colors duration-300">
                    <span className="material-symbols-outlined">thermostat</span>
                  </div>
                  <h3 className="text-[1.5rem] font-semibold text-text-primary mb-[12px]">Climate Change</h3>
                  <Body className="text-text-secondary mb-[32px] flex-grow">
                    Pantau proyeksi perubahan iklim jangka panjang dan analisis tren suhu serta curah hujan di wilayah Malang dan Jawa Timur.
                  </Body>
                  <a className="text-[0.875rem] font-medium text-primary flex items-center gap-[4px] mt-auto group-hover:text-secondary" href="#">
                    Pelajari Lebih Lanjut
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </Card>
              </AnimatedContainer>

              {/* Service Card 2 */}
              <AnimatedContainer animation="fadeInUp" delay={0.2} once={false}>
                <Card className="h-full flex flex-col items-start group cursor-pointer hover:border-primary transition-colors duration-300">
                  <div className="w-14 h-14 bg-tertiary rounded-full flex items-center justify-center text-primary mb-[24px] group-hover:bg-primary group-hover:text-background transition-colors duration-300">
                    <span className="material-symbols-outlined">history</span>
                  </div>
                  <h3 className="text-[1.5rem] font-semibold text-text-primary mb-[12px]">Historical Data</h3>
                  <Body className="text-text-secondary mb-[32px] flex-grow">
                    Akses arsip data cuaca dan iklim historis untuk keperluan penelitian, pertanian, dan perencanaan infrastruktur.
                  </Body>
                  <a className="text-[0.875rem] font-medium text-primary flex items-center gap-[4px] mt-auto group-hover:text-secondary" href="#">
                    Pelajari Lebih Lanjut
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </Card>
              </AnimatedContainer>
            </div>
          </div>
        </section>

        {/* Latest Announcements */}
        <section className="max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] md:py-[96px] w-full">
          <AnimatedContainer animation="slideInLeft" once={false} className="mb-[48px]">
            <H2>Latest Announcements</H2>
          </AnimatedContainer>
          
          <div className="flex flex-col gap-[24px]">
            {/* Announcement Card 1 */}
            <AnimatedContainer animation="fadeInUp" delay={0.1} once={false}>
              <div className="bg-surface border border-border rounded-lg p-[24px] flex flex-col md:flex-row items-start md:items-center gap-[24px] hover:bg-tertiary transition-colors cursor-pointer">
                <Badge variant="error">Peringatan Dini</Badge>
                <div className="flex-grow">
                  <h4 className="text-[1.25rem] text-text-primary font-semibold mb-[8px]">Waspada Hujan Lebat</h4>
                  <p className="text-[1rem] text-text-secondary line-clamp-1">Potensi hujan lebat disertai petir di wilayah Malang Raya pada sore hingga malam hari.</p>
                </div>
                <div className="text-text-secondary font-medium text-[0.875rem] whitespace-nowrap flex items-center gap-[6px]">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  24 Jul 2026
                </div>
              </div>
            </AnimatedContainer>

            {/* Announcement Card 2 */}
            <AnimatedContainer animation="fadeInUp" delay={0.2} once={false}>
              <div className="bg-surface border border-border rounded-lg p-[24px] flex flex-col md:flex-row items-start md:items-center gap-[24px] hover:bg-tertiary transition-colors cursor-pointer">
                <Badge variant="success">Informasi Iklim</Badge>
                <div className="flex-grow">
                  <h4 className="text-[1.25rem] text-text-primary font-semibold mb-[8px]">Proyeksi Awal Musim Kemarau</h4>
                  <p className="text-[1rem] text-text-secondary line-clamp-1">Prakiraan awal musim kemarau tahun 2026 untuk wilayah Jawa Timur bagian selatan.</p>
                </div>
                <div className="text-text-secondary font-medium text-[0.875rem] whitespace-nowrap flex items-center gap-[6px]">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  22 Jul 2026
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </section>

        {/* Instagram Feed / Photos */}
        <section className="bg-tertiary py-[64px] md:py-[96px] border-t border-border bg-opacity-30">
          <div className="max-w-7xl mx-auto px-4 md:px-[32px] w-full">
            <AnimatedContainer animation="fadeInUp" once={false} className="mb-[48px] flex flex-col md:flex-row items-start md:items-center justify-between gap-[16px]">
              <H2 className="flex items-center gap-[12px]">
                <span className="material-symbols-outlined text-primary text-[28px]">photo_camera</span>
                Galeri BMKG
              </H2>
              <a className="text-[1rem] font-medium text-primary hover:text-secondary transition-colors" href="#">Lihat Instagram @bmkgmalang</a>
            </AnimatedContainer>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[16px]">
              {[
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDJCz4HXllE5ZKWwkJK1niD6TsdSSNOXicUMe_HoyuITFg-PBoJwNdWsYmSF36tDI3MS3SSZa4GKQgN4Ls_0LuTa7gpnyagLwzLx0EruYCc5UO7S4KI5dUzWI_01zNngS4DM9N8jv67yn_EyScHh5OZWl9Rl7rNh_fvh_w1tTpKP4AKMrA8_OZpWSwBcbp08l-ARmr4TIte7U3cQ9NwYKdz5o1MWNITa6wxvdAK2nWa0tmKkMhAgYBVszW1jo7WKBZe0NZTRa7Xnys",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBDlmz34yJ9K7BJmKxn6tyXtSjIaPtOHHoES3vyCcoWT-oOrmH0JnX63Sh-Qv0bzMX6ZqGRQueubo9sGGmwS4qlBsVxoqoqy6BGR5KqiWfmEDfpcP45Wmz5-xjMgOok9Pll9AB7lIH5IZ72Uy-xyHT7LQw-StKXgcXAq9873HGTa5MXzgj_Zcryx9LoLMKJGQvXC8RvhK_USQrjIe3lVjmmxUYmZ8J6YlP1iKMWAxuGAvf4EHwCXZ3IwjFDGJiLPFna0oBL_btdTjM",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuB8O3CFQkxw6oXSvVy8OB3ifIp10xLRDbsZkER7D3N-yZIF_EpnEuU2MfT0cFnF1gYhVs5at1a4BwYnnIJn1xZvV0eykd4MKzzlPJiANr1UMTV1qJbnE3JGUtZYRLzNHIcTqindw7gVlrLrQG3nenM_Y47T2kB8mHeyGx-hpfgh6zWedPSK1FjmEdvjWVUhZ_VqOxwuInZAcGf_4gHjV5l7mc0PommD3B2CzOq7Dt-fAsO4KlQh47QeY-neyPQRglyQX0pGtDlKcl4",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAZYSwKCAYFrlQl0bLneconT-K1mTmNpk0iW2zBCN9eje1bPFp1Qyn-8hpgspuxWY4IO5ZTHiWZCaEArr9ZNSk6Hkr2EEhuXqHXM0e4zPTznzTkyU1L05ngBB6MMFWMHVQFkCQ9-D2DhYzQeNfJY7O_NnqgMB-PrPerppcfS0HlWJiNCenIXJI_olYZ7YaPCgPlxuzOqyGlMwUkg0loSfCSF6w06TglFKefpJkqukV6l84h-yAB4V0BD8kSekSAlj7DlxRH95mc2vQ"
              ].map((src, idx) => (
                <AnimatedContainer key={idx} animation="scaleIn" delay={0.1 * idx} once={false}>
                  <div className="aspect-square bg-surface rounded-lg overflow-hidden relative group shadow-sm border border-border">
                    <img alt={`Galeri ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={src} />
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
