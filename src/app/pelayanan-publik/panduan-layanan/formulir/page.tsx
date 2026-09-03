"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { fetchServiceLinks, getStoredServiceLinks, DEFAULT_SERVICE_LINKS } from "@/lib/service-links";

export default function FormulirPage() {
  const [formUrl, setFormUrl] = useState<string>(() => getStoredServiceLinks().formulirPermohonan);

  useEffect(() => {
    let isMounted = true;
    fetchServiceLinks().then(links => {
      if (isMounted) {
        setFormUrl(links.formulirPermohonan);
        window.location.href = links.formulirPermohonan;
      }
    }).catch(() => {
      if (isMounted) {
        window.location.href = formUrl || DEFAULT_SERVICE_LINKS.formulirPermohonan;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [formUrl]);

  return (
    <>
      <Header activeRoute="/pelayanan-publik/panduan-layanan/formulir" />
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">assignment</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Formulir Permohonan Informasi</h2>
          <p className="text-sm text-slate-500 mb-6">
            Sedang mengalihkan Anda ke portal Sistem Informasi Pelayanan Terpadu (SIPADU)...
          </p>
          <a
            href={formUrl}
            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Buka Formulir Sekarang</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
