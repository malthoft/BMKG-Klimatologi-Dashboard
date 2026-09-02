import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokumen Kinerja - BMKG Klimatologi Jawa Timur",
  description: "Akses dokumen transparansi kinerja: Perjanjian Kinerja (PK), LAKIP, dan Rencana Kinerja Tahunan (RKT).",
};

const dokumenCards = [
  {
    title: "Perjanjian Kinerja (PK)",
    description: "Dokumen kesepakatan kinerja antara pimpinan dan atasan langsung yang memuat sasaran strategis, indikator kinerja utama, dan target capaian tahunan.",
    icon: "handshake",
    href: "/pelayanan-publik/dokumen-kinerja/pk",
    color: "from-blue-500 to-indigo-600",
    badge: "Tahunan",
  },
  {
    title: "LAKIP",
    description: "Laporan Akuntabilitas Kinerja Instansi Pemerintah yang mempertanggungjawabkan pelaksanaan tugas dan fungsi dalam mencapai visi dan misi organisasi.",
    icon: "assessment",
    href: "/pelayanan-publik/dokumen-kinerja/lakip",
    color: "from-emerald-500 to-teal-600",
    badge: "Akuntabilitas",
  },
  {
    title: "Rencana Kinerja Tahunan (RKT)",
    description: "Dokumen perencanaan yang memuat program kerja, kegiatan, dan anggaran yang akan dilaksanakan dalam kurun waktu satu tahun anggaran.",
    icon: "event_note",
    href: "/pelayanan-publik/dokumen-kinerja/rkt",
    color: "from-amber-500 to-orange-600",
    badge: "Perencanaan",
  },
];

export default function DokumenKinerjaPage() {
  return (
    <>
      <Header activeRoute="/pelayanan-publik/dokumen-kinerja" />
      <main className="min-h-screen bg-slate-50 w-full overflow-hidden">

        {/* Hero Section */}
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30"></div>
          <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/50 border border-amber-200 text-amber-700 text-xs font-bold mb-6">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>Transparansi & Akuntabilitas</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Dokumen <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">Kinerja</span>
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Wujud transparansi dan akuntabilitas kinerja Stasiun Klimatologi Kelas I Jawa Timur yang dapat diakses oleh publik secara terbuka.
            </p>
          </div>
        </section>

        {/* Cards Grid */}
        <section className="py-12 pb-24 relative z-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {dokumenCards.map((card, idx) => (
                <Link
                  key={idx}
                  href={card.href}
                  className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-100 hover:border-transparent transition-all duration-300 flex flex-col h-full overflow-hidden text-center"
                >
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br ${card.color} opacity-5 rounded-full blur-3xl group-hover:scale-[2] group-hover:opacity-10 transition-all duration-500 -mt-16`}></div>
                  
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${card.color} text-white shadow-lg mx-auto mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                    <span className="material-symbols-outlined text-[32px]">{card.icon}</span>
                  </div>
                  
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full mx-auto mb-4 border border-slate-100">
                    {card.badge}
                  </span>

                  <h2 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                    {card.description}
                  </p>
                  
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 mx-auto mt-auto">
                    <span>Lihat Dokumen</span>
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
