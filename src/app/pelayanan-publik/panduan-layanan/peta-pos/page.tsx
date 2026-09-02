import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Metadata } from "next";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "Peta Sebaran Pos Hujan - BMKG Klimatologi Jawa Timur",
  description: "Informasi lokasi dan sebaran pos pengamatan curah hujan di seluruh wilayah kerja Jawa Timur.",
};

const kabupatenData = [
  { kabupaten: "Kab. Malang", jumlahPos: 34, status: "Aktif" },
  { kabupaten: "Kota Malang", jumlahPos: 5, status: "Aktif" },
  { kabupaten: "Kota Batu", jumlahPos: 4, status: "Aktif" },
  { kabupaten: "Kab. Pasuruan", jumlahPos: 18, status: "Aktif" },
  { kabupaten: "Kota Pasuruan", jumlahPos: 2, status: "Aktif" },
  { kabupaten: "Kab. Probolinggo", jumlahPos: 15, status: "Aktif" },
  { kabupaten: "Kota Probolinggo", jumlahPos: 3, status: "Aktif" },
  { kabupaten: "Kab. Lumajang", jumlahPos: 14, status: "Aktif" },
  { kabupaten: "Kab. Jember", jumlahPos: 22, status: "Aktif" },
  { kabupaten: "Kab. Bondowoso", jumlahPos: 12, status: "Aktif" },
  { kabupaten: "Kab. Situbondo", jumlahPos: 10, status: "Aktif" },
  { kabupaten: "Kab. Banyuwangi", jumlahPos: 20, status: "Aktif" },
  { kabupaten: "Kab. Kediri", jumlahPos: 16, status: "Aktif" },
  { kabupaten: "Kota Kediri", jumlahPos: 3, status: "Aktif" },
  { kabupaten: "Kab. Blitar", jumlahPos: 14, status: "Aktif" },
  { kabupaten: "Kota Blitar", jumlahPos: 2, status: "Aktif" },
  { kabupaten: "Kab. Tulungagung", jumlahPos: 12, status: "Aktif" },
  { kabupaten: "Kab. Trenggalek", jumlahPos: 10, status: "Aktif" },
  { kabupaten: "Kab. Ponorogo", jumlahPos: 13, status: "Aktif" },
  { kabupaten: "Kab. Pacitan", jumlahPos: 9, status: "Aktif" },
  { kabupaten: "Kab. Madiun", jumlahPos: 10, status: "Aktif" },
  { kabupaten: "Kota Madiun", jumlahPos: 2, status: "Aktif" },
  { kabupaten: "Kab. Ngawi", jumlahPos: 11, status: "Aktif" },
  { kabupaten: "Kab. Magetan", jumlahPos: 9, status: "Aktif" },
  { kabupaten: "Kab. Nganjuk", jumlahPos: 12, status: "Aktif" },
  { kabupaten: "Kab. Jombang", jumlahPos: 11, status: "Aktif" },
  { kabupaten: "Kab. Mojokerto", jumlahPos: 12, status: "Aktif" },
  { kabupaten: "Kota Mojokerto", jumlahPos: 2, status: "Aktif" },
  { kabupaten: "Kab. Sidoarjo", jumlahPos: 8, status: "Aktif" },
  { kabupaten: "Kota Surabaya", jumlahPos: 10, status: "Aktif" },
  { kabupaten: "Kab. Gresik", jumlahPos: 9, status: "Aktif" },
  { kabupaten: "Kab. Lamongan", jumlahPos: 12, status: "Aktif" },
  { kabupaten: "Kab. Tuban", jumlahPos: 11, status: "Aktif" },
  { kabupaten: "Kab. Bojonegoro", jumlahPos: 14, status: "Aktif" },
  { kabupaten: "Kab. Bangkalan", jumlahPos: 8, status: "Aktif" },
  { kabupaten: "Kab. Sampang", jumlahPos: 7, status: "Aktif" },
  { kabupaten: "Kab. Pamekasan", jumlahPos: 7, status: "Aktif" },
  { kabupaten: "Kab. Sumenep", jumlahPos: 10, status: "Aktif" },
];

export default function PetaPosPage() {
  const totalPos = kabupatenData.reduce((acc, d) => acc + d.jumlahPos, 0);

  return (
    <>
      <Header activeRoute="/pelayanan-publik/panduan-layanan/peta-pos" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <BackButton fallbackHref="/pelayanan-publik/panduan-layanan" className="inline-flex items-center gap-1 text-primary hover:text-secondary font-medium mb-6 transition-colors cursor-pointer bg-transparent border-0 p-0">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Panduan Layanan
          </BackButton>

          {/* Hero Card - Clean UI Redesign */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 relative overflow-hidden mb-10 shadow-sm">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-blue-100">
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  Infrastruktur Pengamatan
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
                  Peta Sebaran Pos Hujan
                </h1>
                
                <p className="text-slate-600 leading-relaxed max-w-2xl text-base sm:text-lg">
                  Stasiun Klimatologi Kelas I Jawa Timur mengelola jaringan pos pengamatan curah hujan yang tersebar di seluruh 38 kabupaten/kota di Provinsi Jawa Timur. Data curah hujan dari pos-pos ini menjadi dasar analisis iklim, prakiraan musim, dan deteksi dini.
                </p>
              </div>
              
              {/* Statistics Panel */}
              <div className="w-full md:w-auto bg-slate-900 rounded-2xl p-6 shadow-xl shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-1 gap-6 text-center md:text-left">
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Pos Hujan</span>
                    <span className="text-4xl font-black text-white">{totalPos}</span>
                  </div>
                  <div className="w-px h-full bg-slate-800 hidden md:block my-2"></div>
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Cakupan Wilayah</span>
                    <div className="flex items-end justify-center md:justify-start gap-2">
                      <span className="text-4xl font-black text-blue-400">38</span>
                      <span className="text-sm font-medium text-slate-300 pb-1">Kab/Kota</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Data Sebaran Per Kabupaten/Kota
                </h2>
                <p className="text-sm text-slate-500 mt-1">Daftar lengkap jumlah pos pengamatan hujan aktif.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 sm:px-8 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider w-20">No.</th>
                    <th className="text-left px-4 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Kabupaten / Kota</th>
                    <th className="text-center px-4 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider w-32">Jumlah Pos</th>
                    <th className="text-center px-6 sm:px-8 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kabupatenData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 sm:px-8 py-3.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">{row.kabupaten}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] bg-slate-100 text-slate-700 font-bold text-xs px-2 py-1 rounded-md border border-slate-200">
                          {row.jumlahPos}
                        </span>
                      </td>
                      <td className="px-6 sm:px-8 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 border-t-2 border-slate-800">
                    <td className="px-6 sm:px-8 py-4"></td>
                    <td className="px-4 py-4 font-black text-white text-right">Total Seluruh Jawa Timur</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[40px] bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-md shadow-sm">
                        {totalPos}
                      </span>
                    </td>
                    <td className="px-6 sm:px-8 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Catatan */}
          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pt-1">
              <strong>Catatan Penting:</strong> Jumlah pos hujan bersifat estimasi dan dapat berubah sesuai kondisi operasional di lapangan. Data aktual tercatat secara sistematis dalam pengawasan Stasiun Klimatologi Jawa Timur. Untuk kebutuhan data teknis dan pemetaan lebih detail, silakan ajukan permohonan melalui layanan kami.
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
