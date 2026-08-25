"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseFetch } from "@/lib/supabase";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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
                  <span className="material-symbols-outlined text-[24px]">photo_camera</span>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {posts.map((post) => (
                <a 
                  key={post.id} 
                  href={post.post_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block aspect-square bg-slate-100 rounded-xl overflow-hidden relative group shadow-sm border border-slate-200 cursor-pointer"
                >
                  <img
                    alt="Instagram Post"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={post.image_url}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="flex items-center gap-4 text-white text-sm font-medium">
                      <span className="flex items-center gap-1.5 font-bold"><span className="material-symbols-outlined text-[20px]">open_in_new</span> Lihat di Instagram</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">photo_library</span>
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
