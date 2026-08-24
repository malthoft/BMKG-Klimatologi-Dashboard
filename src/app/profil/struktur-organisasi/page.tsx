"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { OrgChartViewer } from "@/components/profile/org-chart-viewer";

export default function StrukturOrganisasiPage() {
  return (
    <>
      <Header activeRoute="/profil" />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] flex flex-col gap-[64px]">
        
        {/* Struktur Organisasi Section */}
        <section className="w-full">
          <AnimatedContainer animation="fadeInUp" once={true}>
            <div className="text-center mb-8">
              <h1 className="text-[2rem] font-bold text-text-primary uppercase">Struktur Organisasi</h1>
              <h2 className="text-[1.5rem] font-semibold text-text-secondary uppercase">Stasiun Klimatologi Kelas II Jawa Timur</h2>
            </div>
            <OrgChartViewer />
          </AnimatedContainer>
        </section>
        
      </main>
      <Footer />
    </>
  );
}
