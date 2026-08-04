"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function TopBar() {
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const days = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
      const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
      
      const dayName = days[now.getDay()];
      const date = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      setDateStr(`${dayName}, ${date} ${monthName} ${year}`);

      const hhWib = String(now.getHours()).padStart(2, '0');
      const mmWib = String(now.getMinutes()).padStart(2, '0');
      const ssWib = String(now.getSeconds()).padStart(2, '0');
      
      const hhUtc = String(now.getUTCHours()).padStart(2, '0');
      const mmUtc = String(now.getUTCMinutes()).padStart(2, '0');
      const ssUtc = String(now.getUTCSeconds()).padStart(2, '0');
      
      setTimeStr(`STANDAR WAKTU INDONESIA ${hhWib} : ${mmWib} : ${ssWib} / ${hhUtc} : ${mmUtc} : ${ssUtc} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // Check every second
    return () => clearInterval(interval);
  }, []);

  if (!dateStr) return null;

  return (
    <div className="bg-[#f0f4f8] border-b border-border text-xs md:text-sm text-text-secondary py-2 px-4 md:px-[32px]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center font-medium tracking-wide">
        <div>{dateStr}</div>
        <div className="text-primary font-bold mt-1 md:mt-0">{timeStr}</div>
      </div>
    </div>
  );
}

export function Header({ activeRoute = "/" }: { activeRoute?: string }) {
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
        <Link href="/" className="font-bold text-primary flex items-center gap-[8px] cursor-pointer text-[1.5rem]">
          <span className="material-symbols-outlined text-[28px]" data-icon="cloud" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
          BMKG Malang
        </Link>
        <nav className="hidden md:flex gap-[24px]">
          <Link className={getNavClass("/")} href="/">Home</Link>
          <Link className={getNavClass("/realtime-data")} href="/realtime-data">Data Realtime</Link>
          <Link className={getNavClass("/history")} href="/history">Riwayat</Link>
          <Link className={getNavClass("/climate-change")} href="/climate-change">Perubahan Iklim</Link>
          <Link className={getNavClass("/profile")} href="/profile">Profil</Link>
          <Link className={getNavClass("/announcements")} href="/announcements">Pengumuman</Link>
        </nav>
        <button className="md:hidden text-primary p-2">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </motion.header>
    </>
  );
}
