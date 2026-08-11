"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnimatedContainer } from "@/components/ui/animated-container";

export default function PengumumanPage() {
  return (
    <>
      <Header activeRoute="/pengumuman" />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[100px] flex flex-col items-center justify-center text-center">
        <AnimatedContainer animation="fadeInUp" once={true} className="flex flex-col items-center max-w-lg">
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              construction
            </span>
          </div>
          <h1 className="text-[2rem] font-bold text-text-primary mb-3">Sedang Dalam Pengembangan</h1>
          <p className="text-text-secondary text-[1rem] leading-relaxed">
            Halaman Pengumuman saat ini sedang dinonaktifkan sementara untuk proses pemeliharaan dan pengembangan sistem. Silakan kembali lagi nanti.
          </p>
        </AnimatedContainer>
      </main>
      <Footer />
    </>
  );
}
