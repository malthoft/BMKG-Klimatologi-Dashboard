"use client";

import { AnimatedContainer } from "@/components/ui/animated-container";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-footer-bg full-width mt-auto">
      <AnimatedContainer animation="fadeInUp" once={true} className="w-full py-[64px] px-4 md:px-[32px] flex flex-col md:flex-row justify-between items-start gap-[48px] max-w-7xl mx-auto">
        <div className="flex flex-col gap-[12px] md:w-1/3">
          <div className="flex items-center gap-[16px]">
            <Image 
              src="/logobmkg.png" 
              alt="BMKG Logo" 
              width={56} 
              height={64} 
              className="object-contain drop-shadow-[0_0_1.5px_rgba(255,255,255,0.8)]" 
            />
            <div className="flex flex-col justify-center">
              <span className="text-white font-bold text-[16px] md:text-[20px] leading-tight uppercase tracking-wide">Stasiun Klimatologi</span>
              <span className="text-sky-400 font-bold text-[16px] md:text-[20px] leading-tight uppercase tracking-wide">Kelas I Jawa Timur</span>
            </div>
          </div>
          <p className="text-border opacity-80 mt-[16px] text-[1rem] leading-[1.6]">
            Stasiun Klimatologi Jawa Timur menyediakan informasi cuaca, iklim, kualitas udara, dan gempa bumi yang akurat dan terpercaya.
          </p>
          <div className="text-border opacity-60 text-[0.875rem] mt-[32px]">
            © {new Date().getFullYear()} BMKG Stasiun Klimatologi Jawa Timur. Seluruh Hak Cipta Dilindungi.
          </div>
        </div>
        <div className="flex flex-col gap-[12px] md:ml-auto">
          <h4 className="text-[1.125rem] text-background font-bold mb-[8px]">Tautan Cepat</h4>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="/data-pengamatan">Data Pengamatan</a>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="/perubahan-iklim">Perubahan Iklim</a>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="/profil/visi-misi">Profil Stasiun</a>
          <a className="text-[1rem] text-border opacity-80 hover:opacity-100 transition-opacity hover:text-primary" href="/publikasi/pengumuman">Pengumuman</a>
        </div>
        <div className="flex flex-col gap-[16px] md:w-1/3 relative">
          <h4 className="text-[1.125rem] text-background font-bold mb-[4px]">Kontak</h4>
          <div className="flex items-start gap-[12px] text-border opacity-80 text-[1rem]">
            <span className="material-symbols-outlined text-[20px] mt-1 shrink-0">location_on</span>
            <a href="https://maps.app.goo.gl/XnBXDJw57tn8XaFS7" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:opacity-100 transition-opacity">
              Jl. Zentana No.33, Krajan, Ngijo, Kec. Karang Ploso, Kabupaten Malang, Jawa Timur 65152
            </a>
          </div>
          <div className="flex items-center gap-[12px] text-border opacity-80 text-[1rem]">
            <span className="material-symbols-outlined text-[20px] shrink-0">call</span>
            <a href="tel:0341464827" className="hover:text-primary hover:opacity-100 transition-opacity">
              0341-464827
            </a>
          </div>
          <div className="flex items-center gap-[12px] text-border opacity-80 text-[1rem]">
            <span className="material-symbols-outlined text-[20px] shrink-0">mail</span>
            <a href="mailto:staklim.jatim@bmkg.go.id" className="hover:text-primary hover:opacity-100 transition-opacity">
              staklim.jatim@bmkg.go.id
            </a>
          </div>
          
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-6 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors w-fit border border-white/10 shadow-sm"
            aria-label="Kembali ke atas"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            <span className="text-[14px] font-medium">Kembali ke Atas</span>
          </button>
        </div>
      </AnimatedContainer>
    </footer>
  );
}
