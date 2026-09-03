import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panduan Layanan - BMKG Klimatologi Jawa Timur",
  description: "Panduan lengkap prosedur, persyaratan, tarif, dan alur permohonan informasi iklim di BMKG Jawa Timur.",
};

const panduanCards = [
  {
    title: "Alur Pelayanan",
    description: "Langkah-langkah proses permohonan informasi dan jasa dari awal pengajuan hingga dokumen diterbitkan.",
    icon: "route",
    href: "/pelayanan-publik/panduan-layanan/alur",
    color: "from-blue-500 to-indigo-600",
    isExternal: false,
  },
  {
    title: "Formulir Permohonan",
    description: "Akses Sistem Informasi Pelayanan Terpadu (SIPADU) untuk mengisi form pengajuan data iklim dan layanan jasa secara online.",
    icon: "assignment",
    href: "/pelayanan-publik/panduan-layanan/formulir",
    color: "from-emerald-500 to-teal-600",
    isExternal: false,
  },
  {
    title: "Lacak Status Dokumen",
    description: "Pantau sejauh mana proses permohonan Anda yang sedang dikerjakan oleh tim pelayanan kami.",
    icon: "track_changes",
    href: "/pelayanan-publik/panduan-layanan/lacak",
    color: "from-amber-500 to-orange-600",
    isExternal: false,
  },
  {
    title: "Jenis & Tarif PNBP",
    description: "Daftar tarif resmi Penerimaan Negara Bukan Pajak atas produk data dan layanan jasa BMKG.",
    icon: "payments",
    href: "/pelayanan-publik/panduan-layanan/pnbp",
    color: "from-rose-500 to-pink-600",
    isExternal: false,
  },
  {
    title: "Tarif Nol Rupiah",
    description: "Syarat dan ketentuan untuk mendapatkan pembebasan tarif layanan BMKG (Tarif Rp 0,00).",
    icon: "money_off",
    href: "/pelayanan-publik/panduan-layanan/tarif-nol",
    color: "from-cyan-500 to-blue-500",
    isExternal: false,
  },
  {
    title: "Peta Pos Hujan",
    description: "Informasi titik koordinat dan sebaran pos pengamatan hujan di wilayah kerja Jawa Timur.",
    icon: "map",
    href: "/pelayanan-publik/panduan-layanan/peta-pos",
    color: "from-purple-500 to-fuchsia-600",
    isExternal: false,
  },
  {
    title: "FAQ",
    description: "Kumpulan jawaban dari pertanyaan yang sering diajukan terkait pelayanan BMKG.",
    icon: "help",
    href: "/pelayanan-publik/panduan-layanan/faq",
    color: "from-slate-600 to-slate-800",
    isExternal: false,
  }
];

export default function PanduanLayananPage() {
  return (
    <>
      <Header activeRoute="/pelayanan-publik/panduan-layanan" />
      <main className="min-h-screen bg-slate-50 w-full overflow-hidden">
        
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30"></div>
          <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Panduan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-600">Layanan & Jasa</span>
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Semua informasi yang Anda butuhkan untuk mengajukan permohonan data, mengecek tarif, hingga melacak status permohonan Anda.
            </p>
          </div>
        </section>

        {/* Grid Navigation */}
        <section className="py-12 pb-24 relative z-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {panduanCards.map((card, idx) => {
                const CardWrapper = card.isExternal ? 'a' : Link;
                const linkProps = card.isExternal ? { href: card.href, target: "_blank", rel: "noopener noreferrer" } : { href: card.href };
                
                return (
                  <CardWrapper
                    key={idx}
                    {...linkProps}
                    className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl border border-slate-100 hover:border-transparent transition-all duration-300 flex flex-col h-full overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-10 transition-all duration-500 -mr-10 -mt-10`}></div>
                    
                    <div className="flex flex-col h-full z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${card.color} text-white shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                          <span className="material-symbols-outlined text-[28px]">{card.icon}</span>
                        </div>
                        {card.isExternal && (
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                          </div>
                        )}
                      </div>
                      
                      <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                        {card.title}
                      </h2>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                        {card.description}
                      </p>
                      
                      <div className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 mt-auto">
                        <span>{card.isExternal ? "Kunjungi Portal" : "Lihat Detail"}</span>
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
