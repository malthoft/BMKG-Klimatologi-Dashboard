import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Metadata } from "next";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "Jam Operasional Pelayanan - BMKG Klimatologi Jawa Timur",
  description: "Informasi jam buka, hari kerja, dan waktu pelayanan publik di Stasiun Klimatologi Jawa Timur.",
};

export default function JamOperasionalPage() {
  return (
    <>
      <Header activeRoute="/pelayanan-publik/informasi-layanan/jam-operasional" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16 w-full">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <BackButton fallbackHref="/pelayanan-publik/informasi-layanan" className="inline-flex items-center gap-1 text-primary hover:text-secondary font-medium mb-6 transition-colors cursor-pointer bg-transparent border-0 p-0">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Informasi Layanan
          </BackButton>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header Card - Redesigned to Clean UI (Blue/Slate) */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-8 sm:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-lg">
                  <span className="material-symbols-outlined text-[36px] text-blue-200">schedule</span>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">Jam Operasional</h1>
                  <p className="text-blue-200 font-medium text-sm sm:text-base">Jadwal Pelayanan Publik PTSP BMKG Jawa Timur</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12">
              <p className="text-slate-600 leading-relaxed mb-8 text-base sm:text-lg">
                Pelayanan Terpadu Satu Pintu (PTSP) Stasiun Klimatologi Kelas I Jawa Timur buka pada hari kerja operasional pemerintah. Pemohon informasi, baik yang datang langsung maupun melalui sarana daring (online), akan dilayani pada waktu berikut:
              </p>

              {/* Jadwal Box - Redesigned with Clean UI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-white border-2 border-slate-100 hover:border-blue-100 rounded-2xl p-6 flex flex-col gap-2 transition-colors shadow-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Hari Kerja</span>
                  <span className="text-slate-800 font-black text-xl mb-3">Senin - Kamis</span>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl sm:text-4xl font-black text-blue-600">08:00</span>
                    <span className="text-slate-300 font-bold">-</span>
                    <span className="text-3xl sm:text-4xl font-black text-blue-600">16:00</span>
                    <span className="text-sm font-bold text-slate-400 ml-1">WIB</span>
                  </div>
                  
                  <div className="mt-2 text-sm text-slate-500 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">restaurant</span>
                    <span>Istirahat: <strong>12:00 - 13:00</strong> WIB</span>
                  </div>
                </div>
                
                <div className="bg-white border-2 border-slate-100 hover:border-blue-100 rounded-2xl p-6 flex flex-col gap-2 transition-colors shadow-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Hari Kerja</span>
                  <span className="text-slate-800 font-black text-xl mb-3">Jumat</span>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl sm:text-4xl font-black text-blue-600">08:00</span>
                    <span className="text-slate-300 font-bold">-</span>
                    <span className="text-3xl sm:text-4xl font-black text-blue-600">16:30</span>
                    <span className="text-sm font-bold text-slate-400 ml-1">WIB</span>
                  </div>
                  
                  <div className="mt-2 text-sm text-slate-500 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">mosque</span>
                    <span>Istirahat: <strong>11:30 - 13:30</strong> WIB</span>
                  </div>
                </div>
              </div>

              {/* Catatan Penting */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </div>
                  Catatan Penting
                </h3>
                <ul className="space-y-4 text-slate-600 text-sm sm:text-base">
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[20px] text-slate-400 shrink-0 mt-0.5">event_busy</span>
                    <span>Pelayanan tatap muka <strong>Tutup</strong> pada hari Sabtu, Minggu, dan Hari Libur Nasional / Cuti Bersama yang ditetapkan oleh Pemerintah.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[20px] text-slate-400 shrink-0 mt-0.5">speed</span>
                    <span>Permohonan layanan yang masuk di luar jam operasional (melalui SIPADU) akan diproses pada hari kerja berikutnya.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[20px] text-slate-400 shrink-0 mt-0.5">emergency</span>
                    <span>Layanan Informasi Peringatan Dini Cuaca dan Iklim Ekstrem tetap beroperasi <strong>24/7</strong> melalui kanal media sosial dan website resmi.</span>
                  </li>
                </ul>
              </div>
              
              {/* Lokasi */}
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 text-center shadow-sm">
                <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Lokasi Pelayanan</span>
                <p className="text-slate-800 font-black text-lg mb-1">Stasiun Klimatologi Kelas I Jawa Timur</p>
                <p className="text-slate-500 text-sm">Jl. Raya Ngijo No. 25, Kec. Karangploso, Kabupaten Malang, Jawa Timur 65152</p>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
