import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaduan & Survei - BMKG Klimatologi Jawa Timur",
  description: "Kanal resmi pengaduan, saran, survei kepuasan, dan pelaporan pelanggaran BMKG Klimatologi Jawa Timur.",
};

const channels = [
  {
    title: "SP4N LAPOR!",
    description: "Sistem Pengelolaan Pengaduan Pelayanan Publik Nasional — platform resmi pemerintah untuk menyampaikan aspirasi, pengaduan, dan pelaporan terkait pelayanan publik.",
    icon: "sms",
    href: "https://www.lapor.go.id/",
    color: "from-blue-500 to-blue-700",
    tag: "Pengaduan Resmi",
  },
  {
    title: "Survei Kepuasan Masyarakat",
    description: "Bantu kami meningkatkan kualitas layanan dengan mengisi survei kepuasan masyarakat (SKM) secara anonim.",
    icon: "rate_review",
    href: "https://docs.google.com/forms/d/e/1FAIpQLScHygPWIQEjdlxp8Yv1hAdyQSvKzDzYiRP5vGDZGP2W6RxYAQ/viewform",
    color: "from-emerald-500 to-teal-600",
    tag: "Survei",
  },
  {
    title: "Survei Persepsi Anti Korupsi",
    description: "Berikan penilaian Anda terhadap integritas dan penerapan anti korupsi di lingkungan kerja kami.",
    icon: "gavel",
    href: "https://bit.ly/surveypresepsikorupsiKPO",
    color: "from-purple-500 to-violet-600",
    tag: "Integritas",
  },
  {
    title: "Whistleblowing System",
    description: "Laporkan dugaan pelanggaran, penyalahgunaan wewenang, atau tindak pidana korupsi secara rahasia dan terlindungi.",
    icon: "security",
    href: "https://wbs.bmkg.go.id/",
    color: "from-red-500 to-rose-600",
    tag: "Pelaporan Rahasia",
  },
  {
    title: "Pengaduan Internal",
    description: "Formulir khusus bagi internal pegawai BMKG untuk menyampaikan keluhan, masukan, atau laporan internal.",
    icon: "feedback",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSfzolWmVwsvkYTjesQORdidf0dPiGTuuV_zXnF2E0ARdfdIuw/viewform",
    color: "from-amber-500 to-orange-600",
    tag: "Internal",
  },
];

export default function PengaduanPage() {
  return (
    <>
      <Header activeRoute="/pelayanan-publik/pengaduan" />
      <main className="min-h-screen bg-slate-50 w-full overflow-hidden">

        {/* Hero Section */}
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-white to-red-50/30"></div>
          <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100/50 border border-rose-200 text-rose-700 text-xs font-bold mb-6">
              <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
              <span>Suara Anda Penting Bagi Kami</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Pengaduan, Saran <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-500">&amp; Survei</span>
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Kami membuka berbagai kanal resmi untuk menampung aspirasi, pengaduan, dan penilaian Anda demi perbaikan berkelanjutan.
            </p>
          </div>
        </section>

        {/* Channels Grid */}
        <section className="py-12 pb-24 relative z-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((ch, idx) => (
                <a
                  key={idx}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-3xl p-7 shadow-sm hover:shadow-xl border border-slate-100 hover:border-transparent transition-all duration-300 flex flex-col h-full overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${ch.color} opacity-5 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-10 transition-all duration-500 -mr-8 -mt-8`}></div>

                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${ch.color} text-white shadow-md group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                      <span className="material-symbols-outlined text-[24px]">{ch.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                      {ch.tag}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors relative z-10">
                    {ch.title}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-1 relative z-10">
                    {ch.description}
                  </p>
                  
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 mt-auto relative z-10">
                    <span>Buka Portal</span>
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">open_in_new</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-slate-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/10 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
            <span className="material-symbols-outlined text-4xl text-rose-400 mb-4">support_agent</span>
            <h2 className="text-3xl font-black text-white mb-4">Butuh Bantuan Langsung?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Hubungi kami melalui email <strong className="text-white">staklim.karangploso@bmkg.go.id</strong> atau kunjungi kantor kami di Jl. Raya Ngijo No. 25, Karangploso, Malang.
            </p>
            <a
              href="mailto:staklim.karangploso@bmkg.go.id"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">mail</span>
              Kirim Email
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
