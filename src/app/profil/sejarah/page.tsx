import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sejarah - BMKG Klimatologi Jawa Timur",
  description: "Sejarah berdirinya Stasiun Klimatologi Jawa Timur dan perkembangannya dari masa ke masa.",
};

const timelineData = [
  {
    year: "1879",
    title: "Pendirian Pengamatan Awal",
    description: "Kegiatan pengamatan meteorologi dan klimatologi di Indonesia sudah dimulai sejak era kolonial Belanda, diinisiasi oleh Dr. Pieter Melchior Magnetisch en Meteorologisch Observatorium.",
    icon: "history",
    era: "Kolonial Belanda",
  },
  {
    year: "1942 - 1945",
    title: "Masa Pendudukan Jepang",
    description: "Pada masa pendudukan Jepang, instansi meteorologi berganti nama menjadi Kisho Kanku Sho. Kegiatan pengamatan cuaca tetap dilanjutkan terutama untuk mendukung keperluan militer.",
    icon: "military_tech",
    era: "Pendudukan Jepang",
  },
  {
    year: "1945",
    title: "Era Kemerdekaan",
    description: "Setelah proklamasi kemerdekaan, instansi tersebut diresmikan menjadi Biro Meteorologi di bawah naungan pemerintah Republik Indonesia yang berkedudukan di Yogyakarta.",
    icon: "flag",
    era: "Kemerdekaan RI",
  },
  {
    year: "1972",
    title: "Pembentukan BMG",
    description: "Instansi berubah nama menjadi Pusat Meteorologi dan Geofisika, yang kemudian diubah lagi menjadi Badan Meteorologi dan Geofisika (BMG) di bawah Departemen Perhubungan.",
    icon: "account_balance",
    era: "Pemerintahan RI",
  },
  {
    year: "2008",
    title: "Lahirnya BMKG",
    description: "Melalui Perpres No. 61 Tahun 2008 dan UU No. 31 Tahun 2009, BMG resmi berganti nama menjadi Badan Meteorologi, Klimatologi, dan Geofisika (BMKG), dengan status sebagai Lembaga Pemerintah Non Departemen.",
    icon: "balance",
    era: "Lembaga Pemerintah",
  },
  {
    year: "Era Modern",
    title: "Stasiun Klimatologi Jatim",
    description: "Stasiun Klimatologi Kelas I Jawa Timur di Karangploso terus berinovasi mengelola jaringan pos hujan di seluruh wilayah Jawa Timur dengan peralatan otomatis berbasis digital.",
    icon: "sensors",
    era: "Era Digital & Otomatisasi",
  },
];

export default function SejarahPage() {
  return (
    <>
      <Header activeRoute="/profil/sejarah" />
      <main className="min-h-screen bg-slate-50 w-full overflow-hidden">
        {/* Hero Banner - Light Theme Matching Data Pengamatan */}
        <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-r from-blue-50 via-slate-50 to-sky-50 border-b border-slate-200/80">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl mix-blend-multiply opacity-70"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl mix-blend-multiply opacity-70"></div>
            <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-10"></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-6 relative z-20 text-center">
            <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100/80 text-blue-700 font-bold tracking-widest uppercase text-xs mb-6 border border-blue-200/80 shadow-sm backdrop-blur-sm">
              Profil Instansi
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Sejarah <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">BMKG</span>
            </h1>
            <p className="text-slate-600 text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
              Perjalanan panjang pelayanan informasi iklim dan cuaca di Indonesia, dari era pengamatan konvensional hingga modernisasi stasiun digital di Jawa Timur.
            </p>
          </div>
        </section>

        {/* Tentang Kami / Intro Section */}
        <section className="py-16 sm:py-24 bg-white relative">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-sm border border-blue-100">
              <span className="material-symbols-outlined text-[32px]">public</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Mengenal Stasiun Klimatologi Jatim</h2>
            <p className="text-slate-600 leading-loose text-lg">
              Stasiun Klimatologi Kelas I Jawa Timur yang berlokasi di Karangploso, Kabupaten Malang, 
              merupakan Unit Pelaksana Teknis (UPT) BMKG yang memiliki tugas pokok melaksanakan pengamatan, 
              pengelolaan data, pelayanan informasi, serta pemeliharaan sarana dan prasarana di bidang klimatologi 
              dan kualitas udara untuk seluruh wilayah Provinsi Jawa Timur.
            </p>
          </div>
        </section>

        {/* Timeline Section - Horizontal Redesign */}
        <section className="py-16 sm:py-24 bg-slate-50 relative border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Jejak Langkah Masa ke Masa</h2>
              <div className="w-20 h-1.5 bg-blue-600 rounded-full mx-auto"></div>
            </div>

            {/* Timeline Container - S-Curve Layout */}
            <div className="relative mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-y-16 relative z-10">
                {timelineData.map((item, index) => {
                  // Tentukan CSS order untuk membentuk pola S terbalik di desktop
                  let orderClass = "";
                  if (index === 0) orderClass = "lg:order-1";
                  else if (index === 1) orderClass = "lg:order-2";
                  else if (index === 2) orderClass = "lg:order-3";
                  else if (index === 3) orderClass = "lg:order-6";
                  else if (index === 4) orderClass = "lg:order-5";
                  else if (index === 5) orderClass = "lg:order-4";

                  return (
                    <div key={index} className={`relative group pt-12 lg:pt-16 ${orderClass}`}>
                      
                      {/* Mobile Line (Vertical connecting line) */}
                      {index !== timelineData.length - 1 && (
                        <div className="lg:hidden absolute top-12 left-1/2 -translate-x-1/2 w-[3px] h-[calc(100%+2rem)] bg-slate-200 z-0 rounded-full"></div>
                      )}

                      {/* Desktop S-Curve Lines - Solid Color */}
                      {/* Horizontal line for index 0 and 1 (going right) */}
                      {(index === 0 || index === 1) && (
                        <div className="hidden lg:block absolute top-6 left-1/2 w-[calc(100%+2rem)] h-[3px] bg-slate-200 z-0 rounded-full"></div>
                      )}
                      
                      {/* Vertical line for index 2 (going down to index 3) */}
                      {index === 2 && (
                        <div className="hidden lg:block absolute top-6 left-1/2 -translate-x-1/2 w-[3px] h-[calc(100%+4rem)] bg-slate-200 z-0 rounded-full"></div>
                      )}
                      
                      {/* Horizontal line for index 3 and 4 (going left) */}
                      {(index === 3 || index === 4) && (
                        <div className="hidden lg:block absolute top-6 right-1/2 w-[calc(100%+2rem)] h-[3px] bg-slate-200 z-0 rounded-full"></div>
                      )}

                      {/* Anchor Line from Dot to Card */}
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[3px] h-6 bg-slate-200 group-hover:bg-blue-300 transition-colors z-0"></div>

                      {/* Timeline Dot */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-[3px] border-slate-200 shadow-sm flex items-center justify-center group-hover:border-blue-500 group-hover:scale-110 transition-all duration-300 z-10">
                        <div className="w-3 h-3 rounded-full bg-slate-300 group-hover:bg-blue-600 transition-colors"></div>
                      </div>

                      {/* Content Card */}
                      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-200/80 group-hover:shadow-xl group-hover:border-blue-300 transition-all duration-300 relative overflow-hidden h-full flex flex-col text-center mt-[14px] group-hover:-translate-y-1">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                        </div>
                        
                        <div className="inline-block px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 mx-auto border border-slate-100">
                          {item.era}
                        </div>
                        
                        <h3 className="text-2xl lg:text-3xl font-black text-slate-800 mb-2 font-mono tracking-tight group-hover:text-blue-600 transition-colors">{item.year}</h3>
                        <h4 className="text-lg font-bold text-slate-700 mb-3 leading-snug">{item.title}</h4>
                        <p className="text-slate-500 leading-relaxed text-sm flex-1">
                          {item.description}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
