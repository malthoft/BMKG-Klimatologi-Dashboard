import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pelayanan Publik - BMKG Klimatologi Jawa Timur",
  description: "Portal pelayanan publik Stasiun Klimatologi Kelas I Jawa Timur: informasi layanan, panduan permohonan data, dokumen kinerja, dan kanal pengaduan.",
};

const sections = [
  {
    title: "Informasi Layanan",
    description: "Maklumat, standar, jenis layanan, dan jam operasional pelayanan publik BMKG Klimatologi Jawa Timur.",
    icon: "info",
    href: "/pelayanan-publik/informasi-layanan",
    color: "from-blue-500 to-indigo-600",
    items: ["Maklumat Pelayanan", "Standar Pelayanan", "Jenis Layanan", "Jam Operasional"],
  },
  {
    title: "Panduan Layanan",
    description: "Prosedur, alur, formulir permohonan, tarif PNBP, dan panduan lengkap untuk mengakses layanan kami.",
    icon: "menu_book",
    href: "/pelayanan-publik/panduan-layanan",
    color: "from-emerald-500 to-teal-600",
    items: ["Alur Pelayanan", "Formulir Online", "Tarif PNBP", "FAQ"],
  },
  {
    title: "Dokumen Kinerja",
    description: "Transparansi akuntabilitas kinerja melalui dokumen PK, LAKIP, dan RKT yang dapat diunduh publik.",
    icon: "folder_open",
    href: "/pelayanan-publik/dokumen-kinerja",
    color: "from-amber-500 to-orange-600",
    items: ["Perjanjian Kinerja (PK)", "LAKIP", "RKT"],
  },
  {
    title: "Pengaduan & Survei",
    description: "Sampaikan pengaduan, laporkan masalah, atau berikan penilaian terhadap kualitas pelayanan kami.",
    icon: "campaign",
    href: "/pelayanan-publik/pengaduan",
    color: "from-rose-500 to-red-600",
    items: ["SP4N LAPOR!", "Survei Kepuasan", "Whistleblowing"],
  },
];

export default function PelayananPublikPage() {
  return (
    <>
      <Header activeRoute="/pelayanan-publik" />
      <main className="min-h-screen bg-slate-50 w-full overflow-hidden">

        {/* Hero Section */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-slate-900">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900/80 to-slate-900"></div>
            <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          </div>

          <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/20 text-blue-300 font-bold tracking-widest uppercase text-xs mb-6 border border-blue-400/30 backdrop-blur-sm">
              Portal Layanan Publik
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
              Pelayanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">Publik</span>
            </h1>
            <p className="text-slate-300 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed">
              Komitmen Stasiun Klimatologi Kelas I Jawa Timur untuk menghadirkan layanan informasi iklim yang <strong className="text-white">Cepat, Tepat, Akurat, Luas, dan Mudah Dipahami</strong>.
            </p>
          </div>
        </section>

        {/* Sections Grid */}
        <section className="py-16 sm:py-24 relative z-20 -mt-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {sections.map((section, idx) => (
                <Link
                  key={idx}
                  href={section.href}
                  className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-100 hover:border-transparent transition-all duration-300 flex flex-col h-full overflow-hidden"
                >
                  {/* Background glow */}
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${section.color} opacity-5 rounded-full blur-3xl group-hover:scale-[2] group-hover:opacity-10 transition-all duration-500 -mr-10 -mt-10`}></div>

                  {/* Icon + Title */}
                  <div className="flex items-start gap-5 mb-5 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${section.color} text-white shadow-lg shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                      <span className="material-symbols-outlined text-[28px]">{section.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {section.title}
                      </h2>
                      <p className="text-slate-500 text-sm leading-relaxed mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="flex flex-wrap gap-2 mt-auto relative z-10">
                    {section.items.map((item, i) => (
                      <span key={i} className="text-xs font-semibold bg-slate-50 text-slate-500 px-3 py-1 rounded-lg border border-slate-100">
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Arrow */}
                  <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Motto BMKG */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-3 bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100 mb-6">
              <span className="material-symbols-outlined text-blue-600 text-3xl">verified</span>
              <span className="text-blue-800 font-bold text-lg">Zona Integritas — Wilayah Bebas Korupsi</span>
            </div>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
              BMKG berkomitmen mewujudkan Wilayah Bebas dari Korupsi (WBK) dan Wilayah Birokrasi Bersih dan Melayani (WBBM) demi pelayanan publik yang optimal dan berintegritas.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
