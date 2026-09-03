"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { fetchServiceLinks, getStoredServiceLinks, DEFAULT_SERVICE_LINKS } from "@/lib/service-links";

export default function LacakPage() {
  const [lacakUrl, setLacakUrl] = useState<string>(() => getStoredServiceLinks().lacakStatus);

  useEffect(() => {
    let isMounted = true;
    fetchServiceLinks().then(links => {
      if (isMounted) {
        setLacakUrl(links.lacakStatus);
        window.location.href = links.lacakStatus;
      }
    }).catch(() => {
      if (isMounted) {
        window.location.href = lacakUrl || DEFAULT_SERVICE_LINKS.lacakStatus;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [lacakUrl]);

  return (
    <>
      <Header activeRoute="/pelayanan-publik/panduan-layanan/lacak" />
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">track_changes</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Lacak Status Dokumen</h2>
          <p className="text-sm text-slate-500 mb-6">
            Sedang mengalihkan Anda ke portal Pelacakan Status Dokumen SIPADU...
          </p>
          <a
            href={lacakUrl}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Buka Pelacakan Dokumen</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
