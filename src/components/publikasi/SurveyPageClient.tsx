"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSurveysByType } from "@/lib/default-surveys";
import { Survey } from "@/types/admin";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface SurveyPageClientProps {
  title: string;
  surveyType: "hskm" | "hspak";
  description: string;
}

export function SurveyPageClient({ title, surveyType, description }: SurveyPageClientProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<number[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSurveysByType(surveyType);
        setSurveys(data);
        
        // Auto expand the most recent year
        if (data && data.length > 0) {
          setExpandedYears([data[0].year]);
        }
      } catch (error) {
        console.error("Error fetching surveys:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveys();
  }, [surveyType]);

  // Group by year
  const groupedSurveys = surveys.reduce((acc, survey) => {
    if (!acc[survey.year]) {
      acc[survey.year] = [];
    }
    acc[survey.year].push(survey);
    return acc;
  }, {} as Record<number, Survey[]>);

  const years = Object.keys(groupedSurveys)
    .map(Number)
    .sort((a, b) => b - a);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleOpenFullscreen = (fileUrl: string, title: string) => {
    if (fileUrl.startsWith("data:")) {
      const newWin = window.open();
      if (newWin) {
        newWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { margin: 0; background: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; height: auto; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${fileUrl}" alt="${title}" />
            </body>
          </html>
        `);
        newWin.document.close();
      }
    } else {
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center max-w-3xl mx-auto"
        >
          <Badge variant="neutral" className="mb-3 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
            Dokumen Publikasi
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-4">
            {title}
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            {description}
          </p>
        </motion.div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-500">
            <span className="material-symbols-outlined animate-spin text-5xl mb-4">progress_activity</span>
            <p className="text-slate-500 font-medium animate-pulse">Memuat data survei...</p>
          </div>
        ) : years.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Belum Ada Data</h3>
            <p className="text-slate-500">Data survei untuk kategori ini belum tersedia saat ini.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {years.map((year, index) => {
              const isExpanded = expandedYears.includes(year);
              const yearSurveys = groupedSurveys[year];

              return (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none bg-white hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">calendar_today</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          Tahun {year}
                        </h3>
                        <span className="text-xs text-slate-400 font-semibold">
                          {yearSurveys.length} Dokumen Survei
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isExpanded ? "bg-blue-600 text-white rotate-180" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {yearSurveys.map((survey) => (
                              <div
                                key={survey.id}
                                onClick={() => setSelectedSurvey(survey)}
                                className="group cursor-pointer bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all hover:shadow-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-blue-500 group-hover:text-blue-600 border border-slate-200">
                                    <span className="material-symbols-outlined text-[18px]">
                                      {survey.file_type === "pdf" ? "picture_as_pdf" : "image"}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                                      {survey.title}
                                    </h4>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                                      Lihat Detail
                                      <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">
                                        arrow_forward
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      </main>
      <Footer />

      {/* Survey Detail Modal */}
      <AnimatePresence>
        {selectedSurvey && (
          <ModalPortal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedSurvey(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/80">
                  <div className="pr-12">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="neutral" className="bg-white border border-slate-200 text-slate-700">Tahun {selectedSurvey.year}</Badge>
                      <Badge className={selectedSurvey.survey_type === 'hskm' ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}>
                        {selectedSurvey.survey_type.toUpperCase()}
                      </Badge>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
                      {selectedSurvey.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedSurvey(null)}
                    className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto p-6 bg-white flex-1">
                  {selectedSurvey.content && (
                    <div className="prose prose-slate max-w-none mb-8 prose-headings:font-bold prose-a:text-blue-600">
                      <div dangerouslySetInnerHTML={{ __html: selectedSurvey.content }} />
                    </div>
                  )}

                  {selectedSurvey.file_url && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                      {selectedSurvey.file_type === "pdf" ? (
                        <div className="h-[60vh] min-h-[400px]">
                          <iframe
                            src={`${selectedSurvey.file_url}#toolbar=0`}
                            className="w-full h-full"
                            title={selectedSurvey.title}
                          />
                        </div>
                      ) : (
                        <div className="p-4 flex justify-center">
                          <img
                            src={selectedSurvey.file_url}
                            alt={selectedSurvey.title}
                            className="max-w-full h-auto rounded-xl object-contain max-h-[70vh]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedSurvey.file_url && (
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleOpenFullscreen(selectedSurvey.file_url!, selectedSurvey.title)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 hover:-translate-y-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                        Buka Layar Penuh
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </>
  );
}
