"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { InstagramIcon as Instagram } from "@/components/ui/instagram-icon";
import { supabaseFetch } from "@/lib/supabase";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getDirectImageUrl } from "@/lib/utils";

export default function GaleriInstagram() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const result = await supabaseFetch("instagram_posts", "order=created_at.desc");
        if (result) setPosts(result);
      } catch (error) {
        console.error("Failed to load galeri:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 flex flex-col pt-[72px]">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-pink-500/30 shrink-0">
                  <Instagram size={24} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Galeri Instagram</h1>
                  <p className="text-slate-500 mt-1">Dokumentasi kegiatan dan informasi dari @bmkg.iklimjatim</p>
                </div>
              </div>
              <a 
                href="https://www.instagram.com/bmkg.iklimjatim/" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 group"
              >
                Kunjungi Instagram Asli
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">open_in_new</span>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 w-full flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {posts.map((post, idx) => (
                <a 
                  key={post.id} 
                  href={post.post_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block rounded-2xl overflow-hidden relative group shadow-sm hover:shadow-2xl hover:-translate-y-1.5 border border-slate-200/60 w-full cursor-pointer bg-white transition-all duration-300"
                >
                  {/* Fake IG Header */}
                  <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white z-20 relative">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px]">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-[1.5px] overflow-hidden">
                          <Image src="/LogoStaklimJatim.jpg" alt="BMKG Malang" width={24} height={24} className="rounded-full w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-800">bmkg_malang</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-none mt-0.5">Stasiun Klimatologi Jatim</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">more_horiz</span>
                  </div>

                  {/* Image Area */}
                  <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                    {/* Blurred Background */}
                    <div className="absolute inset-0 w-full h-full">
                      <Image
                        alt="Background Blur"
                        src={getDirectImageUrl(post.image_url)}
                        fill
                        unoptimized
                        className="object-cover opacity-50 blur-xl scale-125 saturate-150"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    
                    {/* Foreground Image */}
                    <Image
                      alt={`Instagram Post ${idx + 1}`}
                      className="object-contain transition-transform duration-700 group-hover:scale-105 z-10"
                      src={getDirectImageUrl(post.image_url)}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    
                    {/* Center Hover Icon */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                       <div className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-500 delay-75">
                         <Instagram size={22} className="text-[#dc2743]" />
                       </div>
                    </div>
                  </div>

                  {/* Fake IG Footer */}
                  <div className="p-3 bg-white z-20 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-slate-800 hover:text-slate-500 transition-colors">favorite</span>
                        <span className="material-symbols-outlined text-[20px] text-slate-800 hover:text-slate-500 transition-colors">mode_comment</span>
                        <span className="material-symbols-outlined text-[20px] text-slate-800 hover:text-slate-500 transition-colors -rotate-45 -mt-1">send</span>
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-slate-800 hover:text-slate-500 transition-colors">bookmark</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 mb-1">Disukai oleh bmkg_malang dan lainnya</div>
                    <div className="text-[10px] text-slate-400 font-medium">Buka di Instagram...</div>
                  </div>

                </a>
              ))}
            </div>
          ) : (
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center shadow-sm">
              <Instagram size={60} className="text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">Galeri Kosong</h3>
              <p className="text-slate-500 font-medium max-w-md">Belum ada postingan Instagram yang ditambahkan. Silakan tambahkan melalui Panel Admin.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
