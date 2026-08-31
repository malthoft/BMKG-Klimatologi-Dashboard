"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface PdfViewerProps {
  url: string;
  title?: string;
  className?: string;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export function PdfViewer({ url, title = "Dokumen PDF", className = "" }: PdfViewerProps) {
  if (!url) return null;

  const trimmed = url.trim();
  const isGoogleDrive = trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com");

  // State
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"single" | "continuous">("continuous");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const pdfDocRef = useRef<any>(null);
  const renderTaskRefs = useRef<{ [key: number]: any }>({});

  // 1. Load PDF.js Library dynamically from CDN
  useEffect(() => {
    if (isGoogleDrive) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadPdfJs = async () => {
      try {
        if (!window.pdfjsLib) {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

          // Load PDF Document
          setIsLoading(true);
          setErrorMsg(null);
          
          const loadingTask = window.pdfjsLib.getDocument({
            url: trimmed,
            cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
            cMapPacked: true,
          });

          const pdf = await loadingTask.promise;
          if (isMounted) {
            pdfDocRef.current = pdf;
            setNumPages(pdf.numPages);
            setCurrentPage(1);
            setIsLoading(false);
          }
        }
      } catch (err: any) {
        console.error("Error loading PDF via PDF.js:", err);
        if (isMounted) {
          setErrorMsg("Gagal memuat PDF interaktif. Anda dapat membuka atau mengunduhnya secara langsung.");
          setIsLoading(false);
        }
      }
    };

    loadPdfJs();

    return () => {
      isMounted = false;
      // Cancel any ongoing render tasks
      Object.values(renderTaskRefs.current).forEach((task) => {
        if (task && task.cancel) {
          try { task.cancel(); } catch (_) {}
        }
      });
    };
  }, [trimmed, isGoogleDrive]);

  // 2. Render Page on Canvas with High-DPI support for mobile & desktop
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement | null) => {
      if (!canvas || !pdfDocRef.current) return;

      try {
        // Cancel existing render on this canvas if active
        if (renderTaskRefs.current[pageNumber]) {
          try {
            renderTaskRefs.current[pageNumber].cancel();
          } catch (_) {}
        }

        const page = await pdfDocRef.current.getPage(pageNumber);
        const containerWidth = containerRef.current
          ? Math.min(containerRef.current.clientWidth - 24, 1000)
          : 600;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const autoScale = (containerWidth / unscaledViewport.width) * zoomScale;
        const viewport = page.getViewport({ scale: autoScale });

        const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRefs.current[pageNumber] = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    },
    [zoomScale]
  );

  // 3. Trigger re-rendering when page / zoom / viewMode changes
  useEffect(() => {
    if (!pdfDocRef.current || isLoading) return;

    if (viewMode === "single") {
      const canvas = canvasRefs.current[currentPage];
      renderPage(currentPage, canvas);
    } else {
      // Continuous mode: render all pages
      for (let i = 1; i <= numPages; i++) {
        const canvas = canvasRefs.current[i];
        renderPage(i, canvas);
      }
    }
  }, [currentPage, zoomScale, viewMode, numPages, isLoading, renderPage]);

  // Handle window resize for responsiveness
  useEffect(() => {
    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!pdfDocRef.current || isLoading) return;
        if (viewMode === "single") {
          renderPage(currentPage, canvasRefs.current[currentPage]);
        } else {
          for (let i = 1; i <= numPages; i++) {
            renderPage(i, canvasRefs.current[i]);
          }
        }
      }, 250);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentPage, viewMode, numPages, isLoading, renderPage]);

  // Zoom handlers
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.25, 0.6));
  const handleResetZoom = () => setZoomScale(1.0);

  // Google Drive fallback
  if (isGoogleDrive) {
    const drivePreviewUrl = trimmed.replace(/\/view.*$/, "/preview").replace(/\/edit.*$/, "/preview");
    return (
      <div className={`w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white flex flex-col ${className}`}>
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate block">{title}</h4>
              <span className="text-[10px] text-slate-500 block">Dokumen Lampiran Google Drive</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={trimmed}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              <span>Buka Tab Baru</span>
            </a>
          </div>
        </div>
        <div className="w-full h-[75vh] sm:h-[80vh] md:h-[850px] relative bg-slate-100">
          <iframe src={drivePreviewUrl} className="w-full h-full border-none block" title={title} allow="autoplay" />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white flex flex-col ${className}`}>
      {/* Top Toolbar */}
      <div className="bg-slate-900 text-white px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 sticky top-0 z-20">
        {/* Title & Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate block max-w-[150px] sm:max-w-xs md:max-w-md">
              {title}
            </h4>
          </div>
        </div>

        {/* Controls: Zoom & View Mode & Page Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Zoom In / Out */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              disabled={zoomScale <= 0.6}
              title="Perkecil"
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_out</span>
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Ukuran"
              className="px-1.5 text-[11px] font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoomScale >= 2.5}
              title="Perbesar"
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_in</span>
            </button>
          </div>

          {/* Page Counter & Controls in Single View */}
          {numPages > 1 && (
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode(viewMode === "single" ? "continuous" : "single")}
                className="px-2 py-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {viewMode === "single" ? "auto_stories" : "splitscreen"}
                </span>
                <span>{viewMode === "single" ? "1 Hal" : "Semua"}</span>
              </button>
            </div>
          )}

          {viewMode === "single" && numPages > 1 && (
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-300 px-1.5">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
                disabled={currentPage >= numPages}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* Action: Open in New Tab & Download */}
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Tab Baru"
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
          <a
            href={trimmed}
            download
            target="_blank"
            rel="noopener noreferrer"
            title="Unduh Berkas PDF"
            className="inline-flex items-center gap-1 bg-primary hover:bg-blue-600 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span className="hidden sm:inline">Unduh</span>
          </a>
        </div>
      </div>

      {/* Main Canvas Scroll Area (Mobile & Desktop Native Canvas Rendering) */}
      <div
        ref={containerRef}
        className="w-full h-[70vh] sm:h-[78vh] md:h-[800px] overflow-y-auto overflow-x-auto bg-slate-800/95 flex flex-col items-center p-3 sm:p-6 space-y-4 touch-pan-y"
      >
        {isLoading ? (
          <div className="m-auto flex flex-col items-center justify-center py-16 gap-3 text-white">
            <div className="w-10 h-10 border-4 border-white/20 border-t-sky-400 rounded-full animate-spin"></div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-300 animate-pulse">
              Memuat halaman PDF langsung...
            </span>
          </div>
        ) : errorMsg ? (
          <div className="m-auto max-w-md bg-white p-6 rounded-2xl shadow-xl text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-amber-500">warning</span>
            <p className="text-sm font-bold text-slate-800">{errorMsg}</p>
            <div className="flex items-center justify-center gap-3">
              <a
                href={trimmed}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Buka di Tab Baru
              </a>
              <a
                href={trimmed}
                download
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Unduh PDF
              </a>
            </div>
          </div>
        ) : viewMode === "single" ? (
          /* Single Page View */
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col items-center transition-transform">
            <canvas
              ref={(el) => {
                canvasRefs.current[currentPage] = el;
              }}
              className="block max-w-full h-auto"
            />
          </div>
        ) : (
          /* Continuous Scroll View (All Pages) */
          Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => (
            <div
              key={pageNum}
              className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col items-center relative group"
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[pageNum] = el;
                }}
                className="block max-w-full h-auto"
              />
              <div className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
                Hal {pageNum} / {numPages}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Bar: Total Pages Indicator on Mobile */}
      {!isLoading && !errorMsg && numPages > 1 && (
        <div className="bg-slate-900/90 text-slate-400 px-4 py-2 text-[11px] font-medium flex items-center justify-between border-t border-slate-800">
          <span>Total: <strong>{numPages} Halaman</strong></span>
          <span className="text-sky-400 font-bold">
            {viewMode === "continuous" ? "Gulir ke bawah untuk melihat semua halaman" : `Halaman aktif: ${currentPage}`}
          </span>
        </div>
      )}
    </div>
  );
}
