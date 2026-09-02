import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informasi Layanan - BMKG Klimatologi Jawa Timur",
  description: "Informasi lengkap mengenai maklumat, standar, jenis, dan jam operasional layanan publik BMKG Klimatologi Jawa Timur.",
};

const layananCards = [
  {
    title: "Maklumat Pelayanan",
    description: "Pernyataan komitmen kesanggupan seluruh jajaran kami dalam menyelenggarakan pelayanan prima sesuai standar yang ditetapkan.",
    icon: "badge",
    href: "/pelayanan-publik/informasi-layanan/maklumat",
    color: "from-blue-500 to-blue-700",
  },
  {
    title: "Standar Pelayanan",
    description: "Pedoman dan tolok ukur acuan penilaian kualitas penyelenggaraan pelayanan publik di lingkungan BMKG Jawa Timur.",
    icon: "verified",
    href: "/pelayanan-publik/informasi-layanan/standar",
    color: "from-emerald-500 to-teal-700",
  },
  {
    title: "Jenis Layanan",
    description: "Informasi ragam produk dan jasa layanan meteorologi, klimatologi, dan geofisika yang dapat diakses masyarakat.",
    icon: "category",
    href: "/pelayanan-publik/informasi-layanan/jenis",
    color: "from-violet-500 to-purple-700",
  },
  {
    title: "Jam Operasional",
    description: "Jadwal dan waktu pelayanan tatap muka maupun daring di kantor Stasiun Klimatologi Kelas I Jawa Timur.",
    icon: "schedule",
    href: "/pelayanan-publik/informasi-layanan/jam-operasional",
    color: "from-amber-500 to-orange-600",
  }
];

export default function InformasiLayananPage() {
  return (
    <>
      <Header activeRoute="/pelayanan-publik/informasi-layanan" />
      <main className="min-h-screen bg-slate-50 w-full overflow-hidden">
        
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30"></div>
          <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Informasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pelayanan Publik</span>
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Komitmen nyata kami untuk menghadirkan layanan informasi Meteorologi, Klimatologi, dan Geofisika yang Cepat, Tepat, Akurat, Luas, dan Mudah Dipahami (Cetak Luas).
            </p>
          </div>
        </section>

        {/* Grid Navigation */}
        <section className="py-12 pb-24 relative z-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {layananCards.map((card, idx) => (
                <Link
                  key={idx}
                  href={card.href}
                  className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-100 hover:border-transparent transition-all duration-300 flex flex-col h-full overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-10 transition-all duration-500 -mr-10 -mt-10`}></div>
                  
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${card.color} text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <span className="material-symbols-outlined text-[32px]">{card.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                        {card.title}
                      </h2>
                      <p className="text-slate-600 leading-relaxed mb-6">
                        {card.description}
                      </p>
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                        <span>Lihat Detail</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
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
