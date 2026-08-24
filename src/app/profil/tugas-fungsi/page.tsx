"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnimatedContainer } from "@/components/ui/animated-container";

export default function TugasFungsiPage() {
  return (
    <>
      <Header activeRoute="/profil" />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] flex flex-col gap-[64px]">
        
        <section className="max-w-4xl mx-auto w-full">
          <AnimatedContainer animation="fadeInUp" once={true}>
            <h1 className="text-[2.5rem] font-bold text-text-primary mb-2 text-center">Tugas dan Fungsi</h1>
            <h2 className="text-[1.5rem] font-semibold text-text-secondary mb-8 text-center">BMKG Stasiun Klimatologi Kelas II Provinsi Jawa Timur</h2>
            
            <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm text-text-secondary text-[1.05rem] leading-relaxed space-y-8">
              <div>
                <p className="italic text-sm text-slate-500 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  Mengutip dari Peraturan Badan Meteorologi, Klimatologi, dan Geofisika Nomor 6 Tahun 2020 Tentang Organisasi dan Tata Kerja Balai Besar Meteorologi, Klimatologi, dan Geofisika, dan Stasiun Meteorologi, Stasiun Klimatologi, dan Stasiun Geofisika
                </p>
              </div>

              <div>
                <h3 className="text-[1.5rem] font-bold text-primary mb-4 border-b border-primary/20 pb-2">Tugas</h3>
                <p>
                  Stasiun Klimatologi mempunyai tugas melaksanakan pengamatan, pengelolaan data, pelayanan informasi, jasa klimatologi, dan pemeliharaan alat klimatologi.
                </p>
              </div>

              <div>
                <h3 className="text-[1.5rem] font-bold text-primary mb-4 border-b border-primary/20 pb-2">Fungsi</h3>
                <p className="mb-4">
                  Dalam melaksanakan tugas sebagaimana dimaksud dalam Pasal 14, Stasiun Klimatologi menyelenggarakan fungsi:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mt-0.5">a</span>
                    <span>pengamatan klimatologi;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mt-0.5">b</span>
                    <span>pengelolaan data klimatologi;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mt-0.5">c</span>
                    <span>pelayanan informasi dan jasa klimatologi;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mt-0.5">d</span>
                    <span>pemeliharaan alat klimatologi;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mt-0.5">e</span>
                    <span>koordinasi/kerja sama; dan</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mt-0.5">f</span>
                    <span>pelaksanaan administrasi dan kerumahtanggaan stasiun.</span>
                  </li>
                </ul>
              </div>
            </div>
          </AnimatedContainer>
        </section>
        
      </main>
      <Footer />
    </>
  );
}
