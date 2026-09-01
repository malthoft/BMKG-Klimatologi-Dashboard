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
  const [viewMode, setViewMode] = useState<"single" | "continuous">("single");
  const [pageSizes, setPageSizes] = useState<{ [key: number]: { width: number; height: number } }>({});

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
          setErrorMsg("Gagal memuat PDF secara langsung. Silakan buka tab baru atau unduh dokumen.");
          setIsLoading(false);
        }
      }
    };

    loadPdfJs();

    return () => {
      isMounted = false;
      Object.values(renderTaskRefs.current).forEach((task) => {
        if (task && task.cancel) {
          try { task.cancel(); } catch (_) {}
        }
      });
    };
  }, [trimmed, isGoogleDrive]);

  // 2. Render Page onto Canvas with true aspect ratio & High-DPI support
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement | null) => {
      if (!canvas || !pdfDocRef.current) return;

      try {
        if (renderTaskRefs.current[pageNumber]) {
          try {
            renderTaskRefs.current[pageNumber].cancel();
          } catch (_) {}
        }

        const page = await pdfDocRef.current.getPage(pageNumber);

        // Determine container width accurately
        let containerWidth = 600;
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          containerWidth = rect.width > 50 ? rect.width - 32 : window.innerWidth - 48;
        } else if (typeof window !== "undefined") {
          containerWidth = window.innerWidth - 48;
        }

        const availableWidth = Math.max(Math.min(containerWidth, 900), 280);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        const scale = (availableWidth / unscaledViewport.width) * zoomScale;
        const viewport = page.getViewport({ scale });

        // Save calculated page sizes in state
        setPageSizes((prev) => ({
          ...prev,
          [pageNumber]: { width: Math.floor(viewport.width), height: Math.floor(viewport.height) },
        }));

        const dpr = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2) : 2;

        // Set canvas internal resolution for crisp retina rendering
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);

        // Set explicit CSS dimensions with important styling to prevent any stylesheet compression
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.style.minHeight = `${Math.floor(viewport.height)}px`;
        canvas.style.maxHeight = "none";
        canvas.style.display = "block";

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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

  // 3. Trigger render when state changes
  useEffect(() => {
    if (!pdfDocRef.current || isLoading) return;

    if (viewMode === "single") {
      const canvas = canvasRefs.current[currentPage];
      renderPage(currentPage, canvas);
    } else {
      for (let i = 1; i <= numPages; i++) {
        const canvas = canvasRefs.current[i];
        renderPage(i, canvas);
      }
    }
  }, [currentPage, zoomScale, viewMode, numPages, isLoading, renderPage]);

  // Window resize handler
  useEffect(() => {
    let timer: any;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!pdfDocRef.current || isLoading) return;
        if (viewMode === "single") {
          renderPage(currentPage, canvasRefs.current[currentPage]);
        } else {
          for (let i = 1; i <= numPages; i++) {
            renderPage(i, canvasRefs.current[i]);
          }
        }
      }, 300);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentPage, viewMode, numPages, isLoading, renderPage]);

  // Controls
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.2, 2.4));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setZoomScale(1.0);

  // Google Drive URL handling
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
    <div className={`w-full rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-slate-950 flex flex-col ${className}`}>
      {/* Top Toolbar */}
      <div className="bg-slate-900 text-white px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 sticky top-0 z-20">
        {/* Title & Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate block max-w-[140px] sm:max-w-xs md:max-w-md">
              {title}
            </h4>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              disabled={zoomScale <= 0.6}
              title="Perkecil (-)"
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_out</span>
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Ukuran (100%)"
              className="px-1.5 text-[11px] font-mono font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoomScale >= 2.4}
              title="Perbesar (+)"
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_in</span>
            </button>
          </div>

          {/* Toggle View Mode: 1 Halaman vs Semua Halaman */}
          {numPages > 1 && (
            <button
              onClick={() => setViewMode(viewMode === "single" ? "continuous" : "single")}
              className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title={viewMode === "single" ? "Tampilkan Semua Halaman (Scroll)" : "Tampilkan 1 Halaman"}
            >
              <span className="material-symbols-outlined text-[15px]">
                {viewMode === "single" ? "splitscreen" : "auto_stories"}
              </span>
              <span className="text-[11px]">{viewMode === "single" ? "Semua" : "1 Hal"}</span>
            </button>
          )}

          {/* Page Navigation in Single View Mode */}
          {viewMode === "single" && numPages > 1 && (
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                title="Halaman Sebelumnya"
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-200 px-2">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
                disabled={currentPage >= numPages}
                title="Halaman Selanjutnya"
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* External Tab & Download */}
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Dokumen di Tab Baru"
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
          <a
            href={trimmed}
            download
            target="_blank"
            rel="noopener noreferrer"
            title="Unduh Berkas PDF"
            className="inline-flex items-center gap-1 bg-primary hover:bg-blue-600 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span className="hidden sm:inline">Unduh</span>
          </a>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="w-full h-[70vh] sm:h-[78vh] md:h-[820px] overflow-y-auto overflow-x-auto bg-slate-900 flex flex-col items-center p-2 sm:p-6 space-y-6 touch-pan-y"
      >
        {isLoading ? (
          <div className="m-auto flex flex-col items-center justify-center py-20 gap-3 text-white">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin"></div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-300 animate-pulse">
              Memuat dokumen PDF...
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
          /* Single Page View - Full Height Complete Document Page */
          <div
            className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/60 flex flex-col items-center relative shrink-0 transition-all"
            style={{
              width: pageSizes[currentPage] ? `${pageSizes[currentPage].width}px` : "auto",
              minHeight: pageSizes[currentPage] ? `${pageSizes[currentPage].height}px` : "auto",
            }}
          >
            <canvas
              ref={(el) => {
                canvasRefs.current[currentPage] = el;
              }}
              className="block shrink-0"
            />
          </div>
        ) : (
          /* Continuous Scroll View - All Full Height Document Pages */
          Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => (
            <div
              key={pageNum}
              className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/60 flex flex-col items-center relative shrink-0 group transition-all"
              style={{
                width: pageSizes[pageNum] ? `${pageSizes[pageNum].width}px` : "auto",
                minHeight: pageSizes[pageNum] ? `${pageSizes[pageNum].height}px` : "auto",
              }}
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[pageNum] = el;
                }}
                className="block shrink-0"
              />
              <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-md opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none">
                Hal {pageNum} / {numPages}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Bar: Page Status & Navigation Helper */}
      {!isLoading && !errorMsg && numPages > 0 && (
        <div className="bg-slate-900 text-slate-400 px-4 py-2.5 text-xs font-medium flex items-center justify-between border-t border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-sky-400">description</span>
            <span>Total: <strong className="text-slate-200">{numPages} Halaman</strong></span>
          </span>
          <span className="text-sky-300 font-semibold text-[11px] sm:text-xs">
            {viewMode === "single"
              ? `Halaman ${currentPage} dari ${numPages} (Gunakan tombol < > untuk ganti halaman)`
              : "Mode Gulir Penuh (Scroll ke bawah untuk melihat semua halaman)"}
          </span>
        </div>
      )}
    </div>
  );
}
