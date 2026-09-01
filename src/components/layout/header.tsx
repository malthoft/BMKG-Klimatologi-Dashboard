"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

// Tipe Data untuk Navigasi Rekursif
export type NavItem = {
  label: string;
  href?: string;
  isExternal?: boolean;
  subLinks?: NavItem[];
};

export const navLinks: NavItem[] = [
  { href: "/", label: "Home" },
  {
    label: "Profil",
    href: "/profil",
    subLinks: [
      { href: "/profil/visi-misi", label: "Visi, Misi, dan Tujuan" },
      { href: "/profil/tugas-fungsi", label: "Tugas dan Fungsi" },
      { href: "/profil/struktur-organisasi", label: "Struktur Organisasi" },
      { href: "/profil/sdm", label: "SDM" },
      { href: "/profil/sejarah", label: "Sejarah" },
    ]
  },
  {
    label: "Iklim",
    href: "/iklim",
    subLinks: [
      { href: "/data-pengamatan", label: "Data Pengamatan" },
      { href: "/iklim/peringatan-dini", label: "Peringatan Dini Cuaca dan Iklim" },
      { href: "/perubahan-iklim", label: "Perubahan Iklim (Warming Stripes)" },
      {
        label: "Prediksi Iklim",
        href: "/iklim/prediksi-iklim",
        subLinks: [
          {
            label: "Prediksi Musim",
            href: "/iklim/prediksi-iklim/prediksi-musim",
            subLinks: [
              { href: "/iklim/prediksi-iklim/prediksi-musim/awal", label: "Prediksi Awal Musim" },
              { href: "/iklim/prediksi-iklim/prediksi-musim/perbandingan", label: "Prediksi Perbandingan Musim" },
              { href: "/iklim/prediksi-iklim/prediksi-musim/sifat", label: "Prediksi Sifat Musim" },
              { href: "/iklim/prediksi-iklim/prediksi-musim/durasi", label: "Prediksi Durasi Musim" },
              { href: "/iklim/prediksi-iklim/prediksi-musim/puncak", label: "Prediksi Puncak Musim" },
              { href: "/iklim/prediksi-iklim/prediksi-musim/curah-hujan", label: "Prediksi Curah Hujan Musim" },
            ]
          },
          {
            label: "Prediksi Bulanan",
            href: "/iklim/prediksi-iklim/prediksi-bulanan",
            subLinks: [
              { href: "/prakiraan-curah-hujan", label: "Prediksi Curah Hujan" },
              { href: "/iklim/prediksi-iklim/prediksi-bulanan/sifat", label: "Prediksi Sifat Hujan" },
              { href: "/iklim/prediksi-iklim/prediksi-bulanan/hujan-6-bulan", label: "Prediksi Hujan 6 Bulan" },
            ]
          }
        ]
      },
      {
        label: "Analisis Iklim",
        href: "/iklim/analisis-iklim",
        subLinks: [
          { href: "/iklim/analisis-iklim/kondisi-atmosfer", label: "Kondisi Atmosfer" },
          { href: "/hari-tanpa-hujan", label: "Hari Tanpa Hujan (HTH)" },
          { href: "/iklim/analisis-iklim/hujan-bulanan", label: "Analisis Hujan Bulanan" },
        ]
      }
    ]
  },
  {
    label: "Pelayanan Publik",
    href: "/pelayanan-publik",
    subLinks: [
      {
        label: "Dokumen Kinerja",
        href: "/pelayanan-publik/dokumen-kinerja",
        subLinks: [
          { href: "/pelayanan-publik/dokumen-kinerja/pk", label: "Perjanjian Kinerja (PK)" },
          { href: "/pelayanan-publik/dokumen-kinerja/lakip", label: "LAKIP" },
          { href: "/pelayanan-publik/dokumen-kinerja/rkt", label: "RKT" },
        ]
      },
      {
        label: "Informasi Layanan",
        href: "/pelayanan-publik/informasi-layanan",
        subLinks: [
          { href: "/pelayanan-publik/informasi-layanan/maklumat", label: "Maklumat Pelayanan" },
          { href: "/pelayanan-publik/informasi-layanan/standar", label: "Standar Pelayanan" },
          { href: "/pelayanan-publik/informasi-layanan/jenis", label: "Jenis Layanan" },
          { href: "/pelayanan-publik/informasi-layanan/jam-operasional", label: "Jam Operasional Pelayanan" },
        ]
      },
      {
        label: "Panduan Layanan",
        href: "/pelayanan-publik/panduan-layanan",
        subLinks: [
          { href: "/pelayanan-publik/panduan-layanan/alur", label: "Alur Pelayanan" },
          { href: "https://script.google.com/macros/s/AKfycbyYH9biqvAWfUKkmwvENg7gVw3amiWz_IIgO2UkQhj0yI2mY-_U-ekChvmRubuUQEv1/exec?p=daftar", label: "Formulir Permohonan Informasi", isExternal: true },
          { href: "https://script.google.com/macros/s/AKfycbyYH9biqvAWfUKkmwvENg7gVw3amiWz_IIgO2UkQhj0yI2mY-_U-ekChvmRubuUQEv1/exec?p=client", label: "Lacak Status Dokumen Anda", isExternal: true },
          { href: "/pelayanan-publik/panduan-layanan/pnbp", label: "Jenis dan Tarif Layanan PNBP" },
          { href: "/pelayanan-publik/panduan-layanan/tarif-nol", label: "Tarif Nol rupiah" },
          { href: "https://ptsp.bmkg.go.id/", label: "PTSP BMKG Pusat", isExternal: true },
          { href: "/pelayanan-publik/panduan-layanan/peta-pos", label: "Peta Sebaran Pos Hujan" },
          { href: "/pelayanan-publik/panduan-layanan/faq", label: "FAQ" },
        ]
      },
      {
        label: "Pengaduan",
        href: "/pelayanan-publik/pengaduan",
        subLinks: [
          { href: "https://www.lapor.go.id/", label: "SP4N LAPOR!", isExternal: true },
          { href: "https://docs.google.com/forms/d/e/1FAIpQLScHygPWIQEjdlxp8Yv1hAdyQSvKzDzYiRP5vGDZGP2W6RxYAQ/viewform", label: "Survei Kepuasan Masyarakat", isExternal: true },
          { href: "https://bit.ly/surveypresepsikorupsiKPO", label: "Survei Persepsi Anti Korupsi", isExternal: true },
          { href: "https://wbs.bmkg.go.id/", label: "Whistleblowing System", isExternal: true },
          { href: "https://docs.google.com/forms/d/e/1FAIpQLSfzolWmVwsvkYTjesQORdidf0dPiGTuuV_zXnF2E0ARdfdIuw/viewform", label: "Pengaduan Internal", isExternal: true },
        ]
      }
    ]
  },
  {
    label: "Publikasi",
    href: "/publikasi",
    subLinks: [
      { href: "/publikasi/berita-kegiatan", label: "Berita & Kegiatan" },
      { href: "/publikasi/pengumuman", label: "Pengumuman" },
      { href: "/publikasi/e-buletin", label: "E-Buletin" },
      {
        label: "Survei",
        href: "/publikasi/survei",
        subLinks: [
          { href: "/publikasi/survei/hskm", label: "Hasil Survei Kepuasan Masyarakat" },
          { href: "/publikasi/survei/hspak", label: "Hasil Survei Persepsi Anti Korupsi" },
        ]
      },
      { href: "/publikasi/media-sosial", label: "Media Sosial" },
    ]
  },
  { href: "https://website-edu-klim-83ao.vercel.app/", label: "Edukasi Iklim", isExternal: true },
];


// --- Komponen Rekursif untuk Desktop Dropdown ---
function DesktopDropdownItem({ item, activeRoute, level = 1 }: { item: NavItem; activeRoute: string; level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100); // slight delay prevents accidental closes
  };

  const isActive = (link: NavItem): boolean => {
    if (link.href && activeRoute === link.href) return true;
    if (link.subLinks) return link.subLinks.some(isActive);
    return false;
  };

  const active = isActive(item);

  if (item.subLinks) {
    return (
      <div 
        className="relative group/item"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className={`flex items-center justify-between transition-all duration-300 cursor-default ${
            level === 1 
              ? `px-4 py-1.5 text-[13px] font-bold rounded-full border ${active ? "text-blue-700 bg-blue-50/80 border-blue-200/60 shadow-xs" : "text-slate-600 border-transparent hover:bg-slate-100/80 hover:text-slate-900"}`
              : `w-full px-4 py-2.5 text-[13px] font-semibold rounded-lg ${active ? "text-blue-700 bg-blue-50/50" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`
          }`}
        >
          {item.label}
          <span className={`material-symbols-outlined transition-transform duration-300 ${level === 1 ? 'text-[16px] ml-1.5' : 'text-[16px]'} ${active ? 'text-blue-600' : 'text-slate-400 group-hover/item:text-slate-600'} ${isOpen && level === 1 ? 'rotate-180' : ''}`}>
            {level === 1 ? 'expand_more' : 'chevron_right'}
          </span>
        </div>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: level === 1 ? 0 : -15, y: level === 1 ? 15 : 0, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: level === 1 ? 0 : -10, y: level === 1 ? 10 : 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
              // Removed overflow-hidden so that nested submenus aren't clipped!
              className={`absolute bg-white border border-slate-200 shadow-xl rounded-xl min-w-[240px] z-50 ${
                level === 1 
                  ? "top-full left-0 mt-1" // Dropdown pertama ke bawah
                  : "top-0 left-full ml-1" // Dropdown kedua dsb ke kanan
              }`}
            >
              <div className="py-2">
                {item.subLinks.map((sub, idx) => (
                  <DesktopDropdownItem key={idx} item={sub} activeRoute={activeRoute} level={level + 1} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      target={item.isExternal ? "_blank" : undefined}
      rel={item.isExternal ? "noopener noreferrer" : undefined}
      className={`flex items-center justify-between transition-all duration-300 cursor-pointer ${
        level === 1 
          ? `px-4 py-1.5 text-[13px] font-bold rounded-full border ${active ? "text-blue-700 bg-blue-50/80 border-blue-200/60 shadow-xs" : "text-slate-600 border-transparent hover:bg-slate-100/80 hover:text-slate-900"}`
          : `w-full px-4 py-2.5 text-[13px] font-semibold rounded-lg ${active ? "text-blue-700 bg-blue-50/50" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`
      }`}
    >
      {item.label}
      {item.isExternal && item.label !== "Edukasi Iklim" && (
        <span className={`material-symbols-outlined text-[13px] ml-1.5 opacity-60 ${active ? 'text-blue-500' : 'text-slate-400'}`}>language</span>
      )}
    </Link>
  );
}

// --- Komponen Rekursif untuk Mobile Accordion ---
function MobileAccordionItem({ item, activeRoute, level = 0, closeMenu }: { item: NavItem; activeRoute: string; level?: number; closeMenu: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (link: NavItem): boolean => {
    if (link.href && activeRoute === link.href) return true;
    if (link.subLinks) return link.subLinks.some(isActive);
    return false;
  };

  const active = isActive(item);

  if (item.subLinks) {
    return (
      <div className="flex flex-col border-b border-slate-100 last:border-0">
        <div 
          className={`flex items-center justify-between w-full py-2 px-4 text-left transition-colors cursor-pointer ${
            active ? "bg-slate-50" : "hover:bg-slate-50"
          }`}
          style={{ paddingLeft: `${1 + level * 1}rem` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span 
            className={`flex-1 py-1 font-bold text-[14px] transition-colors ${active ? "text-primary" : "text-slate-700 hover:text-primary"}`}
          >
            {item.label}
          </span>
          <button 
            className="p-2 ml-2 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0"
          >
            <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-400'}`}>
              expand_more
            </span>
          </button>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-slate-50/50"
            >
              {item.subLinks.map((sub, idx) => (
                <MobileAccordionItem key={idx} item={sub} activeRoute={activeRoute} level={level + 1} closeMenu={closeMenu} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      target={item.isExternal ? "_blank" : undefined}
      rel={item.isExternal ? "noopener noreferrer" : undefined}
      onClick={closeMenu}
      className={`flex items-center gap-2 py-3 px-4 text-[13px] border-b border-slate-100 last:border-0 transition-colors ${
        active ? "text-primary font-bold bg-blue-50" : "text-slate-600 hover:text-primary hover:bg-slate-100"
      }`}
      style={{ paddingLeft: `${1 + level * 1}rem` }}
    >
      {item.label}
      {item.isExternal && item.label !== "Edukasi Iklim" && (
        <span className="material-symbols-outlined text-[13px] text-slate-400 ml-auto opacity-60">language</span>
      )}
    </Link>
  );
}


export function Header({ activeRoute = "/" }: { activeRoute?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Date/Time States
  const [dateStr, setDateStr] = useState("");
  const [wibTime, setWibTime] = useState({ hh: "--", mm: "--", ss: "--" });
  const [blink, setBlink] = useState(true);
  const [isBmkgSynced, setIsBmkgSynced] = useState(false);

  // Sync BMKG Time
  useEffect(() => {
    let deltaD = 0;

    const syncBmkgTime = async () => {
      try {
        const res = await fetch("/api/bmkg-time");
        const data = await res.json();
        if (data.success && data.timestamp) {
          deltaD = data.timestamp - Date.now();
          setIsBmkgSynced(true);
        }
      } catch (err) {
        console.warn("Failed to sync with BMKG time server, falling back to local time:", err);
      }
    };

    syncBmkgTime();

    const updateTime = () => {
      const syncedTimestamp = Date.now() + deltaD;
      const now = new Date(syncedTimestamp);

      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

      const dayName = days[now.getDay()];
      const date = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      setDateStr(`${dayName}, ${date} ${monthName} ${year}`);

      setWibTime({
        hh: String(now.getHours()).padStart(2, "0"),
        mm: String(now.getMinutes()).padStart(2, "0"),
        ss: String(now.getSeconds()).padStart(2, "0"),
      });

      setBlink((prev) => !prev);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const colonClass = blink ? "opacity-100" : "opacity-30 transition-opacity duration-300";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full z-50 sticky top-0"
      >
        {/* SINGLE ROW HEADER */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="flex items-center justify-between w-full px-4 md:px-6 lg:px-8 h-20 lg:h-[88px] max-w-[1440px] mx-auto gap-4">
            {/* Left: Logo Section */}
            <Link href="/" className="flex items-center gap-3 md:gap-4 cursor-pointer hover:opacity-90 transition-opacity shrink-0 group relative z-20">
              {/* Animated Glow Behind Logo */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 via-sky-300/10 to-amber-300/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="relative">
                <Image src="/logobmkg.png" alt="Logo BMKG" width={40} height={50} className="h-9 lg:h-11 w-auto shrink-0 drop-shadow-md z-10 relative" />
                {/* Decorative Climate Ring */}
                <div className="absolute inset-0 border border-blue-500/20 rounded-full scale-[1.3] opacity-0 group-hover:opacity-100 group-hover:scale-[1.4] transition-all duration-500 pointer-events-none"></div>
              </div>

              {/* Desktop Text */}
              <div className="hidden lg:flex flex-col justify-center ml-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 font-extrabold text-[15px] leading-tight tracking-tight drop-shadow-2xs">
                  Stasiun Klimatologi Kelas I Jawa Timur
                </span>
                <span className="text-slate-500 font-bold text-[9px] tracking-widest mt-0.5 uppercase">
                  Badan Meteorologi, Klimatologi, dan Geofisika
                </span>
              </div>
              {/* Mobile Text */}
              <div className="flex lg:hidden flex-col">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 font-extrabold text-[13px] uppercase tracking-wide leading-tight drop-shadow-2xs">
                  Stasiun Klimatologi
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 font-extrabold text-[13px] uppercase tracking-wide leading-tight drop-shadow-2xs">
                  Kelas I Jawa Timur
                </span>
              </div>
            </Link>

            {/* Center: Navigation Bar (Desktop) */}
            <div className="hidden xl:flex items-center justify-center flex-1 z-10 px-4">
              <nav className="flex items-center gap-1.5">
                {navLinks.map((link, idx) => (
                  <div key={idx} className="relative group h-full flex items-center">
                    <DesktopDropdownItem item={link} activeRoute={activeRoute} />
                  </div>
                ))}
              </nav>
            </div>

            {/* Right Side: Date + Clock + Hamburger */}
            <div className="flex items-center justify-end gap-3 shrink-0 z-20">
              {/* Date & Time Widgets (desktop) */}
              {dateStr && (
                <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-slate-900 font-bold text-[14px] leading-tight tracking-tight">
                      {wibTime.hh}<span className={colonClass}>:</span>{wibTime.mm}<span className={colonClass}>:</span>{wibTime.ss}
                    </span>
                    <span className="text-slate-500 font-bold text-[9px] lg:text-[10px] tracking-widest uppercase">WIB</span>
                    {isBmkgSynced && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm ml-0.5 mb-0.5" title="Tersinkronisasi dengan Server Jam BMKG (time.bmkg.go.id)"></span>
                    )}
                  </div>
                  <div className="flex items-center mt-0.5">
                    <span className="text-slate-500 font-bold text-[9px] lg:text-[10px] tracking-widest uppercase">{dateStr}</span>
                  </div>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <div className="flex items-center xl:hidden gap-3 ml-2">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Menu"
                  className="text-slate-700 hover:text-primary p-2 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[28px]">{mobileMenuOpen ? "close" : "menu"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Sidebar */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[300px] max-w-[85vw] bg-surface z-[100] md:hidden flex flex-col shadow-2xl border-l border-border"
              >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
                  <div className="flex flex-col">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 font-extrabold text-[13px] uppercase tracking-wide leading-tight drop-shadow-2xs">
                      Stasiun Klimatologi
                    </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 font-extrabold text-[14px] uppercase tracking-wide leading-tight drop-shadow-2xs">
                      Kelas I Jawa Timur
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                {/* Mobile Clock */}
                <div className="px-5 py-3 border-b border-slate-100 bg-white">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{dateStr}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                    <span className="text-[16px] font-black text-slate-700 tracking-wider font-mono">
                      {wibTime.hh}<span className={`text-primary ${colonClass}`}>:</span>{wibTime.mm}<span className={`text-primary ${colonClass}`}>:</span>{wibTime.ss}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 mt-1">WIB</span>
                  </div>
                </div>

                {/* Mobile Nav Links (Accordions) */}
                <div className="flex-1 overflow-y-auto py-2">
                  {navLinks.map((link, idx) => (
                    <MobileAccordionItem 
                      key={idx} 
                      item={link} 
                      activeRoute={activeRoute} 
                      closeMenu={() => setMobileMenuOpen(false)} 
                    />
                  ))}
                </div>
                
                {/* Sidebar Footer */}
                <div className="p-4 border-t border-border bg-slate-50 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("trigger-pwa-install"));
                      }
                    }}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200/80 rounded-xl py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">install_mobile</span>
                    Pasang Aplikasi BMKG
                  </button>
                  <p className="text-[11px] text-slate-400 font-medium text-center">
                    &copy; {new Date().getFullYear()} BMKG Jawa Timur.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
