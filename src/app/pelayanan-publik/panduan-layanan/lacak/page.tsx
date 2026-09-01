"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const LACAK_URL = "https://script.google.com/macros/s/AKfycbyYH9biqvAWfUKkmwvENg7gVw3amiWz_IIgO2UkQhj0yI2mY-_U-ekChvmRubuUQEv1/exec?p=client";

export default function LacakPage() {
  useEffect(() => {
    window.location.href = LACAK_URL;
  }, []);

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
            href={LACAK_URL}
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
