"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnimatedContainer } from "@/components/ui/animated-container";

export default function VisiMisiPage() {
  return (
    <>
      <Header activeRoute="/profil/visi-misi" />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] flex flex-col gap-[64px]">
        
        {/* Visi Section */}
        <section className="max-w-4xl mx-auto text-center">
          <AnimatedContainer animation="fadeInUp" once={true}>
            <h1 className="text-[2.5rem] font-bold text-text-primary mb-6">VISI BMKG</h1>
            <p className="text-text-secondary text-[1.1rem] leading-relaxed mb-6 text-left">
              Dalam rangka mendukung pelaksanaan visi Presiden maka visi Badan Meteorologi, Klimatologi, dan Geofisika 2020-2024 dirumuskan sebagai berikut:
            </p>
            <blockquote className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-xl mb-6 text-left">
              <p className="text-[1.25rem] font-bold text-primary italic leading-snug">
                "BMKG yang berkelas dunia dengan spirit socio entrepreneur untuk mewujudkan lndonesia Maju yang Berdaulat, Mandiri, dan berkepribadian berlandaskan Gotong-Royong"
              </p>
            </blockquote>
            <p className="text-text-secondary text-[1rem] leading-relaxed text-left">
              Terminologi di dalam visi tersebut dapat dijelaskan sebagai berikut:<br/><br/>
              <strong>Kelas Dunia</strong>, BMKG dalam hal ini menjadi rujukan tingkat regional dan global. Dimana informasi BMKG menjadi rujukan masyarakat intemasional, SDM BMKG berperan aktif dalam organisasi MKG Internasional dan menjadi Regional Modelling Centre.<br/><br/>
              <strong>Socio-Entrepreneur</strong> dimaksudkan BMKG dalam menjalankan bisnis pelayanan MKG tidak hanya sekedar melakukan pelayarian informasi untuk publik dan berbagai sektor antara lain sektor transportasi, pariwisata, pertahanan dan keamanan, pertanian dan kehutanan, sumber daya air, energi dan pertambangan, penanggulangan bencana, namun juga memproduksi informasi premium untuk kesejateraan masyarakat menuju penguatan kemandirian keuangan BMKG.
            </p>
          </AnimatedContainer>
        </section>

        {/* Misi Section */}
        <section className="max-w-4xl mx-auto w-full">
          <AnimatedContainer animation="fadeInUp" delay={0.1} once={true}>
            <h2 className="text-[2rem] font-bold text-text-primary mb-6 text-center">MISI BMKG</h2>
            <p className="text-text-secondary text-[1rem] leading-relaxed mb-6">
              BMKG melaksanakan misi Presiden dan Wakil Presiden nomor 1 (Peningkatan Kualitas Manusia Indonesia), Nomor 4 (Mencapai Lingkungan Hidup yang Berkelanjutan), dan Nomor 7 (Perlindungan bagi Segenap Bangsa dan Memberikan Rasa Aman pada Seluruh Warga), dengan uraian sebagai berikut:
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 bg-surface border border-border p-5 rounded-xl shadow-sm">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</span>
                <p className="text-text-primary font-medium text-[1.05rem]">Menjadikan informasi BMKG sebagai rujukan masyarakat intemasional dan mewujudkan Regional Modelling Centre.</p>
              </li>
              <li className="flex items-start gap-4 bg-surface border border-border p-5 rounded-xl shadow-sm">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</span>
                <p className="text-text-primary font-medium text-[1.05rem]">Mendorong SDM BMKG berperan aktif dalam organisasi MKG Internasional.</p>
              </li>
              <li className="flex items-start gap-4 bg-surface border border-border p-5 rounded-xl shadow-sm">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</span>
                <p className="text-text-primary font-medium text-[1.05rem]">Mewujudkan sebagian unit layanan jasa dan informasi BMKG, mejadi unit Badan Layanan Umum (BLU).</p>
              </li>
            </ul>
          </AnimatedContainer>
        </section>

        {/* Tujuan Section */}
        <section className="max-w-4xl mx-auto w-full">
          <AnimatedContainer animation="fadeInUp" delay={0.2} once={true}>
            <h2 className="text-[2rem] font-bold text-text-primary mb-6 text-center">TUJUAN BMKG</h2>
            <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm text-text-secondary text-[1.05rem] leading-relaxed space-y-4">
              <p>
                Undang-Undang Nomor 31 Tahun 2009 tentang Meteorologi, Klimatologi, dan Geofisika mengamanatkan BMKG dalam penyelenggaraan meteorologi, klimatologi, dan geofisika untuk mendukung keselamatan jiwa dan harta, melindungi kepentingan dan potensi nasional, meningkatkan kemandirian bangsa dalam penguasaan dan penerapan ilmu pengetahuan dan teknologi, mewujudkan kesejahteraan masyarakat, meningkatkan layanan informasi secara luas, cepat, tepat, akurat dan mudah dipahami, mewujudkan kelestarian lingkungan hidup serta mempererat hubungan antar bangsa melalui kerja sama intemasional.
              </p>
              <p>
                Tujuan strategis dalam kurun waktu 5 Tahun kedepan ini merupakan penjabaran dan implementasi dari pemyataan misi yang akan dicapai.
              </p>
              <p>
                Untuk merealisasikan visi dan misi, perlu dirumuskan tujuan strategis BMKG 2020-2024 yang dapat menggambarkan terlaksana dan tercapainya visi dan misi.
              </p>
              <p className="font-semibold text-text-primary pt-4">
                Rumusan Tujuan BMKG adalah sebagai berikut:
              </p>
              <ul className="list-disc pl-5 space-y-3">
                <li>Menjamin terselenggaranya pelayanan informasi dan jasa meteorologi, klimatologi, kualitas udara, dan geofisika yang cepat, tepat, akurat, luas cakupan dan mudah dipahami untuk keselamatan, kesejahteraan, ketahanan dan berkelanjutan yang menjadi rujukan masyarakat internasional;</li>
                <li>Terwujudnya ketangguhan ekonomi dan masyarakat terhadap faktor MKG;</li>
                <li>Terwujudnya lembaga dengan tata kelola yang transparan, bersih, akuntabel dan berkualitas, serta mampu mewujudkan layanan premium menuju penguatan kemandirian keuangan BMKG.</li>
              </ul>
            </div>
          </AnimatedContainer>
        </section>
        
      </main>
      <Footer />
    </>
  );
}
