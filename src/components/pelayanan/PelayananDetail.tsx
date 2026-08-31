"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackButton } from "@/components/ui/back-button";
import { supabaseFetch, supabaseGetPublicUrl } from "@/lib/supabase";
import { PelayananPublik } from "@/types/admin";
import { PdfViewer } from "@/components/ui/pdf-viewer";
import { formatDescriptionHtml } from "@/lib/utils";

interface PelayananDetailProps {
  basePath: string;
  categoryLabel: string;
  defaultFileType: "pdf" | "image" | "image_text";
}

export function PelayananDetail({
  basePath,
  categoryLabel,
  defaultFileType,
}: PelayananDetailProps) {
  const { id } = useParams();
  const [data, setData] = useState<PelayananPublik | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        const res = await supabaseFetch("pelayanan_publik", `id=eq.${id}`);
        if (res && res.length > 0) {
          setData(res[0]);
        }
      } catch (err) {
        console.error("Error loading detail pelayanan:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const fileUrl = data?.file_url ? supabaseGetPublicUrl("pelayanan-publik-files", data.file_url) : null;
  const isPdf = data?.file_url?.toLowerCase().endsWith(".pdf") || defaultFileType === "pdf";

  return (
    <>
      <Header activeRoute={basePath} />
      <main className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <BackButton fallbackHref={basePath} label="Kembali" />

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium animate-pulse">Memuat dokumen...</p>
            </div>
          ) : data ? (
            <div className="flex flex-col gap-6 w-full max-w-full">
              {/* Header Title Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8 md:p-10 w-full max-w-full overflow-hidden">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-primary/10 text-primary px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {categoryLabel}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isPdf ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {isPdf ? "Dokumen PDF" : "Infografis / Gambar"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                  {data.judul}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-xs sm:text-sm font-medium text-slate-500 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">person</span>
                    <span>Pengelola: <strong className="text-slate-700">{data.penulis || "Tim BMKG"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">calendar_month</span>
                    <span>Diunggah: <strong className="text-slate-700">{formatDate(data.created_at)}</strong></span>
                  </div>
                </div>
              </div>

              {/* PDF Document Viewer Viewport */}
              {isPdf && fileUrl && (
                <div className="w-full">
                  <PdfViewer url={fileUrl} title={data.judul} />
                </div>
              )}

              {/* Image Viewport */}
              {!isPdf && fileUrl && (
                <div className="w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                  <div className="relative w-full h-auto max-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-slate-100/60">
                    <img
                      src={fileUrl}
                      alt={data.judul}
                      className="object-contain w-full h-full max-h-[80vh] rounded-2xl shadow-sm"
                    />
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Gambar Panduan / Maklumat Resmi</span>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_full</span>
                      <span>Buka Ukuran Penuh</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Rich Text Description Card (if any) */}
              {data.deskripsi && data.deskripsi.trim() !== "" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8 md:p-10 w-full max-w-full overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">info</span>
                    Rincian & Keterangan Layanan
                  </h3>
                  <div
                    className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed sm:leading-loose w-full max-w-full overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: formatDescriptionHtml(data.deskripsi) }}
                  />

                  <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 font-medium">
                    <p>Dibuat: {formatDate(data.created_at)}</p>
                    {data.updated_at && <p className="mt-1">Terakhir diperbarui: {formatDate(data.updated_at)}</p>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">error</span>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Dokumen Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 mb-6">Dokumen ini mungkin telah dipindahkan atau dihapus oleh pengelola.</p>
              <BackButton fallbackHref={basePath} className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl inline-flex items-center gap-2" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
