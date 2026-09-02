import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Alur Pelayanan - BMKG Klimatologi Jawa Timur",
  description: "Langkah-langkah dan alur permohonan data serta informasi meteorologi, klimatologi, dan geofisika.",
};

const alurSteps = [
  {
    step: 1,
    title: "Registrasi Pemohon",
    description: "Pemohon membuka portal SIPADU dan mengisi formulir permohonan informasi/data beserta KTP dan surat pengantar.",
    icon: "how_to_reg",
    color: "from-blue-500 to-blue-600"
  },
  {
    step: 2,
    title: "Verifikasi Berkas",
    description: "Petugas PTSP memverifikasi kelengkapan dan keabsahan berkas permohonan. Jika kurang lengkap, akan diinformasikan kembali.",
    icon: "fact_check",
    color: "from-indigo-500 to-indigo-600"
  },
  {
    step: 3,
    title: "Penetapan Tarif",
    description: "Pejabat menetapkan biaya PNBP. Jika pemohon memenuhi syarat tarif Rp. 0,- (Tarif Nol), maka akan diproses persetujuannya.",
    icon: "request_quote",
    color: "from-cyan-500 to-cyan-600"
  },
  {
    step: 4,
    title: "Pembayaran PNBP",
    description: "Pemohon menerima e-Billing dan melakukan pembayaran. Setelah membayar, pemohon mengunggah bukti bayar di sistem.",
    icon: "payments",
    color: "from-emerald-500 to-teal-600"
  },
  {
    step: 5,
    title: "Penyiapan Data",
    description: "Tim Teknis BMKG melakukan kompilasi, pengolahan, dan penyiapan data/informasi sesuai dengan permohonan yang diajukan.",
    icon: "database",
    color: "from-amber-500 to-orange-500"
  },
  {
    step: 6,
    title: "Penyerahan Data",
    description: "Data yang telah selesai akan disahkan oleh Pejabat berwenang, kemudian diserahkan kepada pemohon melalui sistem SIPADU.",
    icon: "check_circle",
    color: "from-emerald-500 to-emerald-600"
  }
];

export default function AlurPelayananPage() {
  return (
    <>
      <Header activeRoute="/pelayanan-publik/panduan-layanan/alur" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <BackButton fallbackHref="/pelayanan-publik/panduan-layanan" className="inline-flex items-center gap-1 text-primary hover:text-secondary font-medium mb-6 transition-colors cursor-pointer bg-transparent border-0 p-0">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Panduan Layanan
          </BackButton>

          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-xs font-bold mb-4">
              <span className="material-symbols-outlined text-[16px]">linear_scale</span>
              <span>Standar Operasional Prosedur</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">Alur Pelayanan Data & Informasi</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Langkah-langkah pengajuan permohonan data dan jasa di Stasiun Klimatologi Jawa Timur dari awal hingga dokumen diserahkan.
            </p>
          </div>

          {/* Timeline Container - S-Curve Layout */}
          <div className="relative mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-y-16 relative z-10">
              {alurSteps.map((step, index) => {
                // Tentukan CSS order untuk membentuk pola S terbalik di desktop
                let orderClass = "";
                if (index === 0) orderClass = "lg:order-1";
                else if (index === 1) orderClass = "lg:order-2";
                else if (index === 2) orderClass = "lg:order-3";
                else if (index === 3) orderClass = "lg:order-6";
                else if (index === 4) orderClass = "lg:order-5";
                else if (index === 5) orderClass = "lg:order-4";

                return (
                  <div key={index} className={`relative group pt-14 lg:pt-16 ${orderClass}`}>
                    
                    {/* Mobile Line (Vertical connecting line) */}
                    {index !== alurSteps.length - 1 && (
                      <div className="lg:hidden absolute top-14 left-1/2 -translate-x-1/2 w-[3px] h-[calc(100%+2rem)] bg-slate-200 z-0 rounded-full"></div>
                    )}

                    {/* Desktop S-Curve Lines - Solid Color */}
                    {/* Horizontal line for index 0 and 1 (going right) */}
                    {(index === 0 || index === 1) && (
                      <div className="hidden lg:block absolute top-7 left-1/2 w-[calc(100%+2rem)] h-[3px] bg-slate-200 z-0 rounded-full"></div>
                    )}
                    
                    {/* Vertical line for index 2 (going down to index 3) */}
                    {index === 2 && (
                      <div className="hidden lg:block absolute top-7 left-1/2 -translate-x-1/2 w-[3px] h-[calc(100%+4rem)] bg-slate-200 z-0 rounded-full"></div>
                    )}
                    
                    {/* Horizontal line for index 3 and 4 (going left) */}
                    {(index === 3 || index === 4) && (
                      <div className="hidden lg:block absolute top-7 right-1/2 w-[calc(100%+2rem)] h-[3px] bg-slate-200 z-0 rounded-full"></div>
                    )}

                    {/* Anchor Line from Circle Node to Card */}
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[3px] h-6 bg-slate-200 group-hover:bg-blue-300 transition-colors z-0"></div>

                    {/* Circle Node with Step Number (Outside Card) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-[3px] border-slate-200 shadow-sm flex items-center justify-center group-hover:border-blue-500 group-hover:scale-110 transition-all duration-300 z-20">
                      <span className="font-black text-slate-400 group-hover:text-blue-600 text-xl">{step.step}</span>
                    </div>

                    {/* Content Card */}
                    <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-200/80 group-hover:shadow-xl group-hover:border-blue-300 transition-all duration-300 flex flex-col h-full text-center mt-[14px] group-hover:-translate-y-1 relative z-10 overflow-hidden">
                      <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.color} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <span className="material-symbols-outlined text-[32px]">{step.icon}</span>
                      </div>
                      
                      <div className="mb-3">
                        <span className="inline-block bg-blue-50 text-blue-600 text-xs font-black px-3 py-1 rounded-full mb-3 border border-blue-100 uppercase tracking-widest">
                          LANGKAH {step.step}
                        </span>
                        <h3 className="text-xl font-bold text-slate-800">{step.title}</h3>
                      </div>
                      <p className="text-slate-500 leading-relaxed text-sm flex-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
