"use client";

import { useEffect, useState } from "react";
import { H1, H2, Body } from "@/components/ui/typography";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { supabaseFetch } from "@/lib/supabase";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");

  useEffect(() => {
    async function loadData() {
      const anns = await supabaseFetch("announcements", "order=published_at.desc");
      setAnnouncements(anns || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const featured = announcements.find(a => a.is_featured);
  
  let filtered = announcements.filter(a => a.id !== featured?.id);
  if (filter !== "Semua") {
    filtered = filtered.filter(a => {
       if(filter === "Peringatan Dini") return a.category === "peringatan_dini";
       if(filter === "Kegiatan") return a.category === "kegiatan";
       if(filter === "Instagram") return a.category === "instagram";
       return true;
    });
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'peringatan_dini': return 'bg-error/10 text-error';
      case 'info': return 'bg-primary/10 text-primary';
      case 'kegiatan': return 'bg-success/10 text-success';
      case 'instagram': return 'bg-secondary/10 text-secondary';
      default: return 'bg-surface-container-low text-primary';
    }
  };

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case 'peringatan_dini': return 'Peringatan Dini';
      case 'info': return 'Informasi';
      case 'kegiatan': return 'Kegiatan';
      case 'buletin': return 'Buletin';
      case 'instagram': return 'Instagram';
      default: return cat;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Header activeRoute="/announcements" />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-[32px] py-[64px] flex flex-col gap-[32px]">
        {/* Page Header */}
        <section className="flex flex-col gap-[8px] max-w-3xl">
          <AnimatedContainer animation="slideInLeft" once={true}>
            <H1 className="leading-[1.1] text-text-primary">Pengumuman &amp; Berita</H1>
            <Body className="text-text-secondary mt-2">
              Tetap terinformasi dengan pembaruan terbaru, peringatan dini, dan kegiatan dari BMKG Malang.
            </Body>
          </AnimatedContainer>
        </section>

        {/* Featured Announcement (Hero Card) */}
        {!loading && featured && (
          <section className="w-full bg-[#FEE2E2] border border-error/20 rounded-[16px] p-[24px] md:p-[32px] flex flex-col md:flex-row gap-[24px] items-start md:items-center relative overflow-hidden shadow-sm">
            <div className="absolute -right-10 -top-10 opacity-10">
              <span className="material-symbols-outlined text-[200px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div className="bg-error text-white p-3 rounded-full flex-shrink-0 z-10">
              <span className="material-symbols-outlined">campaign</span>
            </div>
            <div className="flex flex-col gap-[8px] z-10">
              <div className="flex items-center gap-[8px]">
                <span className="text-[14px] bg-error/20 text-error px-2 py-1 rounded-full uppercase tracking-wider font-medium">Peringatan Dini</span>
                <span className="text-[14px] text-text-secondary flex items-center gap-[4px]">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  {formatDate(featured.published_at)}
                </span>
              </div>
              <H2 className="text-text-primary">{featured.title}</H2>
              <Body className="text-text-secondary max-w-2xl">{featured.content}</Body>
            </div>
          </section>
        )}

        {/* Filter / Tab Bar */}
        <section className="flex flex-wrap gap-[8px] items-center border-b border-border pb-[16px]">
          {['Semua', 'Peringatan Dini', 'Kegiatan', 'Instagram'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[14px] font-medium px-[24px] py-[8px] rounded-full transition-colors active:scale-95 ${filter === f ? 'bg-primary-container text-on-primary' : 'bg-surface border border-border text-text-secondary hover:bg-surface-container-low'}`}
            >
              {f === 'Instagram' ? (
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">photo_camera</span> {f}</span>
              ) : f}
            </button>
          ))}
        </section>

        {/* Main Feed Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {loading && <div className="col-span-full py-12 text-center text-text-secondary">Memuat pengumuman...</div>}
          {!loading && filtered.length === 0 && <div className="col-span-full py-12 text-center text-text-secondary">Tidak ada pengumuman yang sesuai.</div>}
          
          {filtered.map((ann, idx) => (
            <AnimatedContainer key={ann.id} animation="fadeInUp" delay={0.1 * (idx % 3)} once={true}>
              {ann.category === 'instagram' ? (
                /* Type B: Instagram Card */
                <article className="bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow group h-full relative min-h-[350px]">
                  <div className="w-full h-48 bg-surface-container-low relative">
                    {ann.image_url ? (
                      <img className="w-full h-full object-cover" src={ann.image_url} alt="Instagram Post" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/10"><span className="material-symbols-outlined text-4xl text-secondary">image</span></div>
                    )}
                    <div className="absolute top-2 right-2 bg-surface/80 backdrop-blur-sm p-1.5 rounded-full">
                      <span className="material-symbols-outlined text-text-primary text-[18px]">photo_camera</span>
                    </div>
                  </div>
                  <div className="p-[24px] flex-grow flex flex-col gap-[8px]">
                    <div className="flex items-center gap-[8px] mb-[4px]">
                      <span className="text-[14px] text-text-secondary">{formatDate(ann.published_at)}</span>
                    </div>
                    <p className="text-[1rem] text-text-primary line-clamp-3">{ann.content}</p>
                    <a className="mt-auto pt-[16px] inline-flex items-center gap-[4px] text-[14px] text-primary hover:underline font-medium" href={ann.instagram_url || "#"} target="_blank" rel="noreferrer">
                      Lihat di Instagram <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                  </div>
                </article>
              ) : (
                /* Type A: Manual Card */
                <article className="bg-surface border border-border rounded-[16px] p-[24px] flex flex-col gap-[16px] shadow-sm hover:shadow-md transition-shadow group h-full min-h-[300px]">
                  <div className="flex justify-between items-start">
                    <span className={`text-[12px] px-2 py-1 rounded-full font-medium ${getCategoryColor(ann.category)}`}>
                      {getCategoryName(ann.category)}
                    </span>
                    <span className="material-symbols-outlined text-text-secondary text-[20px]">article</span>
                  </div>
                  <div className="flex-grow flex flex-col gap-[8px]">
                    <h3 className="text-[1.25rem] font-bold text-text-primary group-hover:text-primary transition-colors">{ann.title}</h3>
                    <p className="text-[1rem] text-text-secondary line-clamp-3">{ann.content}</p>
                  </div>
                  <div className="flex justify-between items-center pt-[16px] border-t border-border mt-auto">
                    <span className="text-[14px] text-text-secondary">{formatDate(ann.published_at)}</span>
                    <button className="text-primary hover:text-primary-container transition-colors p-[8px] rounded-full hover:bg-surface-container-low">
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </div>
                </article>
              )}
            </AnimatedContainer>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
