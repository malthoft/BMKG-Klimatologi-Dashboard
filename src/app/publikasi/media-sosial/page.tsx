import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media Sosial - BMKG Klimatologi Jawa Timur",
  description: "Terhubung dengan BMKG Klimatologi Jawa Timur melalui berbagai platform media sosial resmi kami.",
};

export default function MediaSosialPage() {
  const socialMedia = [
    {
      platform: "Instagram",
      username: "@bmkg.iklimjatim",
      url: "https://www.instagram.com/bmkg.iklimjatim/",
      icon: "photo_camera", // material symbol placeholder for IG
      color: "from-pink-500 via-rose-500 to-orange-500",
      description: "Infografis peringatan dini, edukasi iklim, dan update cuaca harian yang dikemas secara visual dan menarik.",
    },
    {
      platform: "YouTube",
      username: "Stasiun Klimatologi Karangploso",
      url: "https://www.youtube.com/c/StasiunklimatologiKarangplosomalang",
      icon: "smart_display",
      color: "from-red-600 to-red-500",
      description: "Video rilis prakiraan musim, analisis iklim bulanan, dan liputan kegiatan resmi stasiun.",
    },
    {
      platform: "X (Twitter)",
      username: "@bmkgiklimjatim",
      url: "https://www.twitter.com/bmkgiklimjatim",
      icon: "alternate_email", // material symbol placeholder for X
      color: "from-slate-800 to-slate-900",
      description: "Informasi real-time gempa bumi, cuaca ekstrem, dan update peringatan dini secara cepat.",
    },
    {
      platform: "Facebook",
      username: "BMKGIklimJatim",
      url: "https://www.facebook.com/BMKGIklimJatim",
      icon: "facebook",
      color: "from-blue-600 to-blue-700",
      description: "Berita resmi, dokumentasi kegiatan, dan forum diskusi publik terkait iklim dan cuaca Jawa Timur.",
    },
    {
      platform: "TikTok",
      username: "@bmkg.iklimjatim",
      url: "https://www.tiktok.com/@bmkg.iklimjatim",
      icon: "music_note",
      color: "from-slate-900 via-slate-800 to-slate-900",
      description: "Konten video singkat yang edukatif dan menghibur tentang fenomena iklim dan cuaca.",
    },
    {
      platform: "Telegram Bot",
      username: "BMKGstaklimmalang_bot",
      url: "https://t.me/BMKGstaklimmalang_bot",
      icon: "smart_toy",
      color: "from-sky-500 to-blue-500",
      description: "Akses otomatis informasi cuaca dan iklim harian melalui layanan Bot Telegram kami.",
    },
    {
      platform: "Telegram Channel",
      username: "bmkg_jatim",
      url: "https://t.me/s/bmkg_jatim",
      icon: "campaign",
      color: "from-sky-400 to-sky-600",
      description: "Saluran penyiaran resmi untuk notifikasi langsung peringatan dini ke perangkat Anda.",
    },
    {
      platform: "WhatsApp Channel",
      username: "Info BMKG Jatim",
      url: "https://whatsapp.com/channel/0029VaHHLONCBtx7a6adTF2N",
      icon: "chat",
      color: "from-emerald-500 to-green-600",
      description: "Dapatkan update terkini seputar informasi iklim langsung di aplikasi WhatsApp Anda.",
    },
    {
      platform: "WhatsApp Chat",
      username: "0816-1609-937",
      url: "https://wa.me/628161609937",
      icon: "support_agent",
      color: "from-green-500 to-emerald-600",
      description: "Layanan chat interaktif untuk pertanyaan langsung seputar layanan data PTSP BMKG Jatim.",
    },
    {
      platform: "Email",
      username: "staklim.jatim@bmkg.go.id",
      url: "mailto:staklim.jatim@bmkg.go.id",
      icon: "mail",
      color: "from-teal-500 to-emerald-500",
      description: "Layanan persuratan resmi, permohonan data berbayar/nol rupiah, dan pertanyaan spesifik lainnya.",
    },
  ];

  return (
    <>
      <Header activeRoute="/publikasi/media-sosial" />
      <main className="min-h-screen bg-slate-50 w-full overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-sky-50/30"></div>
          
          <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-xs font-bold mb-6">
              <span className="material-symbols-outlined text-[16px]">connect_without_contact</span>
              <span>Kanal Resmi BMKG Jatim</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Tetap Terhubung dengan <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                Informasi Tercepat & Terakurat
              </span>
            </h1>
            
            <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Ikuti media sosial resmi BMKG Stasiun Klimatologi Kelas I Jawa Timur untuk mendapatkan update peringatan dini, prakiraan iklim, edukasi cuaca, dan berbagai informasi layanan kami secara langsung di genggaman Anda.
            </p>
          </div>
        </section>

        {/* Social Media Grid */}
        <section className="py-16 sm:py-24 relative z-20 -mt-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {socialMedia.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl border border-slate-100 hover:border-transparent transition-all duration-300 flex flex-col h-full z-10 overflow-hidden"
                >
                  {/* Hover background gradient glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${social.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`}></div>
                  
                  {/* Icon Header */}
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${social.color} shadow-lg shadow-${social.color.split(' ')[0].replace('from-', '')}/30 text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                      <span className="material-symbols-outlined text-[28px]">{social.icon}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors truncate">
                      {social.platform}
                    </h3>
                    <p className="text-sm font-semibold text-blue-600 mb-4 font-mono tracking-tight truncate">
                      {social.username}
                    </p>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-4">
                      {social.description}
                    </p>
                    
                    {/* Fake Button */}
                    <div className={`inline-flex items-center gap-2 text-sm font-bold mt-auto transition-colors bg-gradient-to-r ${social.color} bg-clip-text text-transparent opacity-80 group-hover:opacity-100`}>
                      <span>Kunjungi Profil</span>
                      <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:translate-x-1 transition-all">arrow_right_alt</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
