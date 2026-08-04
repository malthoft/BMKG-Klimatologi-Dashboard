"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabaseFetch } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { formatUTCtoWIB } from "@/lib/utils";

interface StationData {
  id: string;
  station_id: string;
  station_name: string;
  table_name: string;
  latitude: number;
  longitude: number;
}

interface StationCardData {
  station: StationData;
  time: string;
  temp: number;
  rh: number;
  rr: number;
  condition: string;
  icon: string;
}

// Helper to determine weather condition and icon based on temp, rh, rr
const getWeatherCondition = (temp: number, rh: number, rr: number) => {
  if (rr > 5) return { text: "Hujan Lebat", icon: "rainy" };
  if (rr > 0) return { text: "Hujan Ringan", icon: "rainy" };
  if (rh > 85) return { text: "Berawan Tebal", icon: "cloud" };
  if (rh > 70) return { text: "Cerah Berawan", icon: "partly_cloudy_day" };
  return { text: "Cerah", icon: "sunny" };
};

export function StationSlider() {
  const [cards, setCards] = useState<StationCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch stations meant for home screen
        let stations: StationData[] | null = await supabaseFetch("stations", "show_on_home=eq.true");
        
        if (!stations || stations.length === 0) {
          // Fallback static data from sql schema if table not created
          stations = FALLBACK_STATIONS;
        }

        const cardsData: StationCardData[] = [];
        
        for (const st of stations) {
          // Fetch latest data from this station's table
          const latest = await supabaseFetch(st.table_name, "order=timestamp.desc&limit=1");
          
          if (latest && latest.length > 0) {
            const data = latest[0];
            const w = getWeatherCondition(data.temp, data.rh, data.rr);
            cardsData.push({
              station: st,
              time: `${formatUTCtoWIB(data.time)} WIB`,
              temp: Math.round(data.temp),
              rh: data.rh,
              rr: data.rr,
              condition: w.text,
              icon: w.icon
            });
          } else {
            // No data yet, show offline/empty state
            cardsData.push({
              station: st,
              time: "--:-- WIB",
              temp: 0,
              rh: 0,
              rr: 0,
              condition: "Offline",
              icon: "cloud_off"
            });
          }
        }
        
        setCards(cardsData);
      } catch (e) {
        console.error("Error loading stations for slider", e);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 260; // rough width of a card + gap
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className="w-full h-[240px] flex items-center justify-center text-text-secondary">Memuat data stasiun...</div>;
  }

  return (
    <div className="relative w-full overflow-hidden group py-4">
      <button 
        onClick={() => scroll('left')} 
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-surface border border-border w-10 h-10 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <span className="material-symbols-outlined text-secondary">chevron_left</span>
      </button>
      
      <div 
        ref={scrollRef}
        className="flex gap-[16px] overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cards.map((card, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="snap-start shrink-0 w-[240px]"
          >
            <Link href={`/realtime-data?station=${card.station.table_name}`}>
              <div className="bg-[#f0f5fc] hover:bg-[#e4eff9] border border-[#d6e5f5] rounded-2xl p-6 flex flex-col items-center justify-between min-h-[280px] cursor-pointer transition-colors text-center h-full shadow-sm">
                <div>
                  <h3 className="font-bold text-text-primary text-[1.125rem]">{card.station.station_name.replace("AWS ", "")}</h3>
                  <p className="text-secondary text-[0.75rem] mt-1 font-medium">{card.time}</p>
                </div>
                
                <div className="my-6">
                  <span className="material-symbols-outlined text-[64px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {card.icon}
                  </span>
                </div>
                
                <div>
                  <div className="text-[2.5rem] font-bold text-text-primary tracking-tighter leading-none">
                    {card.temp !== 0 ? `${card.temp} °C` : '--'}
                  </div>
                  <p className="text-secondary text-[0.875rem] mt-3 font-medium">{card.condition}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <button 
        onClick={() => scroll('right')} 
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-surface border border-border w-10 h-10 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined text-secondary">chevron_right</span>
      </button>
    </div>
  );
}
