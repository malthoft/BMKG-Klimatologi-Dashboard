"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { supabaseFetch } from "@/lib/supabase";
import { User, Briefcase, Hash, Building2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface Employee {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  bagian: string;
  foto: string[];
}

function EmployeeCard({ emp, index }: { emp: Employee, index: number }) {
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => {
    if (!emp.foto || emp.foto.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % emp.foto.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [emp.foto]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!emp.foto) return;
    setCurrentPhoto((prev) => (prev === 0 ? emp.foto.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!emp.foto) return;
    setCurrentPhoto((prev) => (prev + 1) % emp.foto.length);
  };

  return (
    <AnimatedContainer 
      key={emp.id} 
      animation="scaleIn" 
      delay={0.05 * (index % 8)} 
      once={true}
      className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full"
    >
      <div className="w-full aspect-[3/4] relative bg-slate-100 overflow-hidden shrink-0">
        {emp.foto && emp.foto.length > 0 ? (
          <>
            <Image 
              src={emp.foto[currentPhoto]} 
              alt={`Foto ${emp.nama}`}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
            {emp.foto.length > 1 && (
              <>
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 pointer-events-none">
                  {currentPhoto + 1} / {emp.foto.length}
                </div>
                {/* Navigation Buttons */}
                <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10">
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-2 left-0 w-full flex justify-center gap-1.5 z-10">
                  {emp.foto.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentPhoto ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <User className="w-20 h-20 text-slate-300" />
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-5 flex flex-col gap-3 flex-grow">
        <div>
          <h3 className="font-bold text-text-primary text-[1.1rem] leading-tight line-clamp-2" title={emp.nama}>
            {emp.nama}
          </h3>
        </div>
        
        <div className="space-y-2 mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="font-semibold w-[60px] shrink-0 text-slate-500">NIP</span>
            <span className="shrink-0 text-slate-400">:</span>
            <span className="line-clamp-1" title={emp.nip}>{emp.nip || "-"}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="font-semibold w-[60px] shrink-0 text-slate-500">Jabatan</span>
            <span className="shrink-0 text-slate-400">:</span>
            <span className="line-clamp-2" title={emp.jabatan}>{emp.jabatan || "-"}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="font-semibold w-[60px] shrink-0 text-slate-500">Bagian</span>
            <span className="shrink-0 text-slate-400">:</span>
            <span className="line-clamp-2" title={emp.bagian}>{emp.bagian || "-"}</span>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );
}

export default function SdmPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await supabaseFetch("employees?order=order_index.asc,created_at.asc");
        if (data) {
          setEmployees(data);
        }
      } catch (error) {
        console.error("Failed to load employees:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <Header activeRoute="/profil" />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] flex flex-col gap-[64px]">
        
        <section className="w-full">
          <AnimatedContainer animation="fadeInUp" once={true}>
            <div className="text-center mb-12">
              <h1 className="text-[2.5rem] font-bold text-text-primary uppercase mb-4">SDM / Profil Pegawai</h1>
              <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full text-primary font-semibold">
                <Users className="w-5 h-5" />
                <span className="text-[1.1rem]">Total Pegawai: {loading ? "..." : employees.length} Orang</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="animate-pulse bg-surface border border-border rounded-2xl overflow-hidden shadow-sm h-[320px]">
                    <div className="w-full h-48 bg-slate-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-3 bg-slate-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-500">Belum ada data pegawai</h3>
                <p className="text-slate-400 mt-2">Data pegawai akan muncul di sini setelah ditambahkan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {employees.map((emp, index) => (
                  <EmployeeCard key={emp.id} emp={emp} index={index} />
                ))}
              </div>
            )}
          </AnimatedContainer>
        </section>
        
      </main>
      <Footer />
    </>
  );
}
