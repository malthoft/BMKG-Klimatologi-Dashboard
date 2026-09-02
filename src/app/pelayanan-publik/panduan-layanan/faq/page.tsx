"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackButton } from "@/components/ui/back-button";
import { useState } from "react";

const faqs = [
  {
    question: "Apakah layanan informasi data BMKG berbayar?",
    answer: "Sebagian besar penyediaan data terperinci dikenakan tarif Penerimaan Negara Bukan Pajak (PNBP) sesuai PP No. 47 Tahun 2021. Namun, untuk permohonan dari instansi pemerintah, TNI/Polri, pendidikan/penelitian, sosial, dan keagamaan dapat mengajukan tarif Rp. 0,- (Nol Rupiah) dengan menyertakan surat pengantar resmi."
  },
  {
    question: "Bagaimana cara mendapatkan data iklim/cuaca?",
    answer: "Anda dapat mengajukan permohonan secara online melalui portal SIPADU (Sistem Informasi Pelayanan Terpadu) BMKG. Lengkapi formulir pendaftaran, unggah KTP dan surat pengantar/permohonan resmi, lalu tim PTSP kami akan memverifikasi permohonan Anda."
  },
  {
    question: "Berapa lama proses pelayanan permintaan data?",
    answer: "Waktu penyelesaian bervariasi tergantung pada jumlah dan kerumitan data yang diminta. Secara standar, proses verifikasi memakan waktu 1-2 hari kerja, dan penyediaan data akan diestimasi oleh tim teknis setelah pembayaran PNBP (jika berbayar) diselesaikan."
  },
  {
    question: "Apa saja produk layanan informasi yang tersedia?",
    answer: "Kami menyediakan data historis cuaca (suhu, curah hujan, angin, kelembapan), prakiraan musim, prakiraan cuaca bulanan, analisis iklim, informasi kualitas udara, serta jasa konsultasi meteorologi dan klimatologi."
  },
  {
    question: "Apakah mahasiswa/peneliti bisa mendapatkan data secara gratis?",
    answer: "Bisa. Mahasiswa yang sedang melakukan tugas akhir/penelitian dapat mengajukan Tarif Nol Rupiah dengan melampirkan Surat Pengantar Permintaan Data dari Universitas/Fakultas yang ditandatangani oleh pimpinan (Dekan/Ketua Jurusan), Kartu Tanda Mahasiswa, KTP, dan proposal penelitian yang disetujui."
  },
  {
    question: "Jam berapa operasional pelayanan PTSP BMKG Jatim?",
    answer: "Pelayanan tatap muka dan online beroperasi pada hari Senin - Kamis pukul 08:00 - 16:00 WIB, dan hari Jumat pukul 08:00 - 16:30 WIB. Kami tutup pada akhir pekan dan hari libur nasional."
  },
  {
    question: "Apakah saya bisa melacak status permohonan saya?",
    answer: "Ya, Anda bisa melacak status permohonan secara mandiri melalui menu 'Lacak Status Dokumen' menggunakan nomor resi/pendaftaran yang diberikan saat pengajuan."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Header activeRoute="/pelayanan-publik/panduan-layanan/faq" />
      <main className="min-h-screen bg-slate-50 pt-24 pb-24 w-full">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <BackButton fallbackHref="/pelayanan-publik/panduan-layanan" className="inline-flex items-center gap-1 text-primary hover:text-secondary font-medium mb-6 transition-colors cursor-pointer bg-transparent border-0 p-0">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Panduan Layanan
          </BackButton>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Frequently Asked Questions (FAQ)</h1>
            <p className="text-slate-500">
              Pertanyaan yang sering diajukan terkait layanan informasi dan data BMKG.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className={`border-b border-slate-100 last:border-0 transition-colors ${isOpen ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full text-left px-6 py-5 sm:px-8 sm:py-6 flex justify-between items-center gap-4 focus:outline-none"
                  >
                    <span className={`font-bold text-base sm:text-lg transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-700'}`}>
                      {faq.question}
                    </span>
                    <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out`}
                    style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
                  >
                    <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 text-slate-600 leading-relaxed text-sm sm:text-base">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center p-8 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20">
            <span className="material-symbols-outlined text-4xl mb-4 text-blue-200">support_agent</span>
            <h2 className="text-2xl font-bold mb-2">Masih Memiliki Pertanyaan?</h2>
            <p className="text-blue-100 mb-6 max-w-lg mx-auto text-sm">
              Tim pelayanan kami siap membantu Anda. Silakan hubungi kami melalui WhatsApp, Email, atau Portal SP4N LAPOR!.
            </p>
            <a 
              href="/pelayanan-publik/pengaduan"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-full font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
