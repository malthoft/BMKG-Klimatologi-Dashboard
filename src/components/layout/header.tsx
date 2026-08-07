"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

function TopBar() {
  const [dateStr, setDateStr] = useState("");
  const [wibTime, setWibTime] = useState({ hh: "--", mm: "--", ss: "--" });
  const [utcTime, setUtcTime] = useState({ hh: "--", mm: "--", ss: "--" });
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

      const dayName = days[now.getDay()];
      const date = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      setDateStr(`${dayName}, ${date} ${monthName} ${year}`);

      setWibTime({
        hh: String(now.getHours()).padStart(2, '0'),
        mm: String(now.getMinutes()).padStart(2, '0'),
        ss: String(now.getSeconds()).padStart(2, '0'),
      });

      setUtcTime({
        hh: String(now.getUTCHours()).padStart(2, '0'),
        mm: String(now.getUTCMinutes()).padStart(2, '0'),
        ss: String(now.getUTCSeconds()).padStart(2, '0'),
      });

      setBlink((prev) => !prev);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateStr) return null;

  const colonClass = blink ? "opacity-100" : "opacity-30 transition-opacity duration-300";

  return (
    <div className="bg-[#F0F6FE] border-b border-[#D6E5F5] py-2 px-4 md:px-[32px] text-xs md:text-sm font-medium">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
        {/* Tanggal */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#C5DCFA] shadow-2xs">
          <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
          <span className="tracking-wide text-text-primary font-semibold">{dateStr}</span>
        </div>

        {/* Jam Digital WIB & UTC */}
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#C5DCFA] shadow-2xs">
            <span className="material-symbols-outlined text-[16px] text-amber-500">schedule</span>
            <span className="text-text-secondary text-[11px] uppercase tracking-wider font-semibold">WIB</span>
            <span className="font-mono font-bold text-primary tracking-wider">
              {wibTime.hh}<span className={colonClass}>:</span>{wibTime.mm}<span className={colonClass}>:</span>{wibTime.ss}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-full border border-[#D6E5F5] text-text-secondary">
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">UTC</span>
            <span className="font-mono font-semibold text-text-primary">
              {utcTime.hh}:{utcTime.mm}:{utcTime.ss}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ activeRoute = "/" }: { activeRoute?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/realtime-data", label: "Data Pengamatan" },
    { href: "/climate-change", label: "Perubahan Iklim" },
    { href: "/profile", label: "Profil" },
    { href: "/announcements", label: "Pengumuman" },
  ];

  const getNavClass = (path: string) => {
    if (activeRoute === path) {
      return "text-primary font-bold border-b-2 border-primary pb-1 transition-all";
    }
    return "text-text-secondary hover:text-primary transition-colors pb-1";
  };

  return (
    <>
      <TopBar />
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface w-full z-50 sticky top-0 border-b border-border shadow-sm"
      >
        <div className="flex justify-between items-center w-full px-[32px] py-[16px] max-w-7xl mx-auto">
          <Link href="/" className="font-bold text-primary flex items-center gap-[10px] cursor-pointer text-[1.5rem] hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-tertiary flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
            </div>
            <span>BMKG Malang</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-[24px]">
            {navLinks.map((link) => (
              <Link key={link.href} className={getNavClass(link.href)} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="md:hidden text-primary p-2 rounded-md hover:bg-tertiary transition-colors"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-surface border-b border-border px-6 py-4 flex flex-col gap-3 shadow-lg overflow-hidden"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeRoute === link.href
                      ? "bg-tertiary text-primary font-semibold"
                      : "text-text-secondary hover:bg-tertiary/50 hover:text-primary"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
