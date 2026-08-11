"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface TemperatureMap {
  id: number;
  year: number;
  category: string;
  image_url: string;
  created_at: string;
}

interface TemperatureMapSliderProps {
  maps: TemperatureMap[];
}

export function TemperatureMapSlider({ maps }: TemperatureMapSliderProps) {
  const [filter, setFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerView, setItemsPerView] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(window.innerWidth >= 768 ? 2 : 1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMaps = useMemo(() => {
    let filtered = maps;
    if (filter === "el_nino") {
      filtered = maps.filter(m => m.category === "El Niño");
    } else if (filter === "la_nina") {
      filtered = maps.filter(m => m.category === "La Niña");
    } else if (filter === "normal") {
      filtered = maps.filter(m => m.category === "Normal");
    } else if (filter !== "all") {
      // Must be a specific year
      filtered = maps.filter(m => m.year.toString() === filter);
    }
    
    // Reset index when filter changes
    setCurrentIndex(0);
    return filtered;
  }, [maps, filter]);

  const filterOptions = useMemo(() => {
    return [
      { value: "all", label: "Semua Kategori" },
      { value: "normal", label: "Normal" },
      { value: "el_nino", label: "El Niño" },
      { value: "la_nina", label: "La Niña" },
    ];
  }, []);

  const filteredOptions = useMemo(() => {
    let opts = filterOptions;
    if (searchQuery) {
      opts = filterOptions.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()));
      // If user types a number, allow searching by year dynamically
      if (!isNaN(Number(searchQuery)) && searchQuery.trim().length > 0) {
        opts.push({ value: searchQuery.trim(), label: `Tahun ${searchQuery.trim()}` });
      }
    }
    return opts;
  }, [searchQuery, filterOptions]);

  const maxIndex = Math.max(0, Math.ceil(filteredMaps.length / itemsPerView) - 1);

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (maps.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm w-full max-w-2xl">
        <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">filter_list</span>
          Filter Peta:
        </span>
        <div className="relative" ref={dropdownRef}>
          <div 
            className="w-[240px] border border-border rounded-lg px-4 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-primary outline-none flex items-center justify-between cursor-pointer"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setSearchQuery("");
            }}
          >
            <span>{filterOptions.find(o => o.value === filter)?.label || "Pilih Filter"}</span>
            <span className="material-symbols-outlined text-text-secondary text-lg">expand_more</span>
          </div>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-border rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-border bg-slate-50">
                <input 
                  type="text" 
                  placeholder="Cari kategori..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>
              <ul className="max-h-[200px] overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => (
                    <li 
                      key={opt.value} 
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${filter === opt.value ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-text-primary'}`}
                      onClick={() => {
                        setFilter(opt.value);
                        setDropdownOpen(false);
                      }}
                    >
                      {opt.label}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-sm text-text-secondary text-center">Kategori tidak ditemukan</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative w-full overflow-hidden rounded-3xl bg-slate-50/50 border border-slate-100 p-2 md:p-6 shadow-inner">
        
        {filteredMaps.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            Peta tidak ditemukan untuk filter yang dipilih.
          </div>
        ) : (
          <div className="relative w-full">
            {/* The carousel track */}
            <div className="overflow-hidden rounded-xl">
              <motion.div 
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                animate={{ 
                  x: `calc(-${currentIndex} * 100%)` 
                }}
              >
                {filteredMaps.map((map) => (
                  <div 
                    key={map.id} 
                    className="w-full md:w-1/2 flex-shrink-0 px-2 flex flex-col items-center"
                  >
                    <div className="relative w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group">
                      {/* Badge overlay */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                        <span className="bg-white/95 backdrop-blur-md text-text-primary px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border border-slate-100">
                          {map.year}
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm text-white backdrop-blur-md ${map.category === 'El Niño' ? 'bg-error/95 border border-error' : map.category === 'La Niña' ? 'bg-primary/95 border border-primary' : 'bg-emerald-600/95 border border-emerald-600'}`}>
                          {map.category}
                        </span>
                      </div>
                      
                      {/* Image container: shrink-wraps the image vertically to remove empty space */}
                      <div className="w-full flex items-center justify-center pt-14 pb-3 px-3 md:pt-16 md:pb-4 md:px-4 bg-slate-50/80 group-hover:bg-slate-100/80 transition-colors duration-500 min-h-[300px]">
                        <img 
                          src={map.image_url} 
                          alt={`Peta Suhu ${map.year} - ${map.category}`}
                          className="w-auto h-auto max-w-full max-h-[50vh] md:max-h-[420px] object-contain drop-shadow-lg transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-5 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center transition-all z-20 text-primary ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-110 hover:shadow-xl'}`}
              aria-label="Previous slide"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>

            <button 
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-5 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center transition-all z-20 text-primary ${currentIndex >= maxIndex ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-110 hover:shadow-xl'}`}
              aria-label="Next slide"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress Dots - Hidden on Mobile */}
      {maxIndex > 0 && (
        <div className="hidden md:flex gap-2 items-center justify-center mt-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${currentIndex === i ? 'w-6 bg-primary' : 'w-2 bg-slate-300'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
