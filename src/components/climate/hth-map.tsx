"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabaseGetPublicUrl } from "@/lib/supabase";

// Fix Leaflet icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function getHTHColor(hth: number) {
  if (hth === 0) return '#006400';       // Hijau Tua (Masih Ada Hujan)
  if (hth <= 5)  return '#7FFF00';       // Hijau Muda (Sangat Pendek)
  if (hth <= 10) return '#FFFF00';       // Kuning (Pendek)
  if (hth <= 20) return '#D2691E';       // Orange/Coklat Muda (Menengah)
  if (hth <= 30) return '#8B4513';       // Coklat Tua (Panjang)
  if (hth <= 60) return '#FFC0CB';       // Pink (Sangat Panjang)
  return '#FF0000';                      // Merah (Ekstrem)
}

function MapBoundsUpdater({ data }: { data: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (data && data.length > 0) {
      const validPoints = data
        .filter(d => typeof d.lat === 'number' && typeof d.lon === 'number' && !isNaN(d.lat) && !isNaN(d.lon))
        .map(d => L.latLng(d.lat, d.lon));

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        // Tambahkan padding agar titik terluar tidak tertutup tepi peta
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Batasi view ke wilayah Indonesia dan sekitarnya (seperti prakiraan curah hujan)
    const maxBounds = L.latLngBounds(
      L.latLng(-15.0, 90.0), // South West
      L.latLng(10.0, 145.0)  // North East
    );
    map.setMaxBounds(maxBounds);
    map.options.maxBoundsViscosity = 1.0;
  }, [map, data]);

  return null;
}

export function HTHMap() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const publicUrl = supabaseGetPublicUrl("rainfall-data", "hth/data.json");
        // Append timestamp to prevent caching
        const res = await fetch(`${publicUrl}?t=${new Date().getTime()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          console.warn("Failed to fetch HTH data");
        }
      } catch (error) {
        console.error("Error fetching HTH data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Memuat Peta HTH...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[-7.7, 112.5]} 
        zoom={8} 
        zoomControl={true}
        className="w-full h-full min-h-[500px] rounded-2xl shadow-sm z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.bmkg.go.id">BMKG</a> | Staklim Jatim'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapBoundsUpdater data={data} />

        {data.map((pos, idx) => {
          if (!pos.lat || !pos.lon) return null;
          const fillColor = getHTHColor(pos.hth || 0);

          return (
            <CircleMarker
              key={idx}
              center={[pos.lat, pos.lon]}
              pathOptions={{
                fillColor: fillColor,
                color: "#333", // Border hitam tipis agar kontras
                weight: 1,
                opacity: 1,
                fillOpacity: 1
              }}
              radius={6}
            >
              <Popup className="custom-bmkg-popup">
                <div className="p-1" style={{ minWidth: '180px', fontFamily: 'sans-serif' }}>
                  <div className="flex justify-between items-center border-b pb-2 mb-2">
                    <h6 className="font-bold m-0 text-primary" style={{ fontSize: '14px' }}>{pos.nama}</h6>
                    <span className="bg-slate-800 text-white px-2 py-0.5 rounded-full" style={{ fontSize: '10px' }}>{pos.id}</span>
                  </div>
                  <div className="mb-2" style={{ fontSize: '12px' }}>
                    <span className="material-symbols-outlined text-[12px] text-red-500 align-middle mr-1">location_on</span>
                    Kab. {pos.kab}
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <div style={{ fontSize: '11px', color: '#555' }}>Hari Tanpa Hujan:</div>
                    <div className="font-bold text-lg text-slate-800">{pos.hth || 0} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Hari</span></div>
                    <div className="mt-1 px-2 py-1 rounded" style={{ background: fillColor, color: '#000', border: '1px solid #aaa', fontSize: '11px', fontWeight: 'bold' }}>
                      {pos.ket || "Masih Ada Hujan"}
                    </div>
                  </div>
                  <div className="mt-2 text-slate-400 italic text-right border-t pt-1" style={{ fontSize: '9px' }}>
                    PIC: {pos.pic}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
