"use client";

import { AnimatedContainer } from "@/components/ui/animated-container";

export function Footer() {
  return (
    <footer className="bg-footer-bg full-width mt-auto">
      <AnimatedContainer animation="fadeInUp" once={false} className="w-full py-[64px] px-[32px] flex flex-col md:flex-row justify-between items-start gap-[48px] max-w-7xl mx-auto">
        <div className="flex flex-col gap-[12px] md:w-1/3">
          <div className="text-[1.5rem] font-bold text-background flex items-center gap-[12px]">
            <span className="material-symbols-outlined text-background text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
            BMKG Malang
          </div>
          <p className="text-border opacity-80 mt-[16px] text-[1rem] leading-[1.6]">
            Stasiun Klimatologi Malang menyediakan informasi cuaca, iklim, kualitas udara, dan gempa bumi yang akurat dan terpercaya.
          </p>
          <div className="text-border opacity-60 text-[0.875rem] mt-[32px]">
            © 2026 BMKG Stasiun Klimatologi Malang. Seluruh Hak Cipta Dilindungi.
          </div>
        </div>
        <div className="flex flex-col gap-[12px] md:ml-auto">
          <h4 className="text-[1.125rem] text-background font-bold mb-[8px]">Tautan Cepat</h4>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="#">Tentang Kami</a>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="#">Kontak</a>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="#">Kebijakan Privasi</a>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="#">Syarat &amp; Ketentuan</a>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="#">Peta Situs</a>
        </div>
        <div className="flex flex-col gap-[16px] md:w-1/3">
          <h4 className="text-[1.125rem] text-background font-bold mb-[4px]">Kontak</h4>
          <div className="flex items-start gap-[12px] text-border opacity-80 text-[1rem]">
            <span className="material-symbols-outlined text-[20px] mt-1">location_on</span>
            <span>Jl. Meteorologi No. 123, Karangploso, Malang, Jawa Timur</span>
          </div>
          <div className="flex items-center gap-[12px] text-border opacity-80 text-[1rem]">
            <span className="material-symbols-outlined text-[20px]">call</span>
            (0341) 491415
          </div>
          <div className="flex items-center gap-[12px] text-border opacity-80 text-[1rem]">
            <span className="material-symbols-outlined text-[20px]">mail</span>
            staklim.malang@bmkg.go.id
          </div>
        </div>
      </AnimatedContainer>
    </footer>
  );
}
