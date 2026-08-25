import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center pt-[100px] md:pt-[120px]">
        {/* Animated Construction Visual */}
        <div className="relative mb-8 flex justify-center items-center">
          <div className="absolute inset-0 bg-blue-100/50 blur-3xl rounded-full w-40 h-40 m-auto"></div>
          
          <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 bg-white shadow-xl shadow-blue-900/5 border border-slate-100 rounded-[2rem] flex items-center justify-center animate-[bounce_3s_ease-in-out_infinite]">
            <span className="material-symbols-outlined text-[56px] text-blue-600">engineering</span>
          </div>
          
          <div className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-12 h-12 sm:w-14 sm:h-14 bg-white shadow-lg border border-slate-100 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-[24px] sm:text-[28px] text-amber-500">warning</span>
          </div>
        </div>

        <div className="inline-block bg-amber-50 border border-amber-200 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
          Status: Under Construction
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 mb-4 tracking-tight leading-tight">
          Segera Hadir
        </h1>
        
        <p className="text-slate-500 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-medium">
          Mohon maaf, halaman atau fitur yang Anda tuju saat ini masih dalam tahap perancangan dan pengembangan. Kami sedang berusaha menghadirkan layanan ini secepatnya.
        </p>

        <Link href="/">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-full transition-all hover:-translate-y-1 hover:shadow-xl shadow-blue-600/30 flex items-center gap-2 outline-none focus:ring-4 focus:ring-blue-600/20 active:scale-95">
            <span className="material-symbols-outlined text-[20px]">home</span>
            Kembali ke Beranda
          </button>
        </Link>
      </main>

      <Footer />
    </div>
  );
}
