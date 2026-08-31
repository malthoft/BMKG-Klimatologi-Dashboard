"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const SKM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScHygPWIQEjdlxp8Yv1hAdyQSvKzDzYiRP5vGDZGP2W6RxYAQ/viewform";

export default function SkmPage() {
  useEffect(() => {
    window.location.href = SKM_URL;
  }, []);

  return (
    <>
      <Header activeRoute="/pelayanan-publik/pengaduan/skm" />
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">rate_review</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Survei Kepuasan Masyarakat</h2>
          <p className="text-sm text-slate-500 mb-6">
            Sedang mengalihkan Anda ke formulir Survei Kepuasan Masyarakat (SKM) BMKG Jawa Timur...
          </p>
          <a
            href={SKM_URL}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Buka Formulir SKM</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
