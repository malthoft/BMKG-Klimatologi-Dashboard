"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search } from "lucide-react";
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
        
        // Batasi geseran pengguna HANYA di area data, dengan padding luas agar titik pinggir terlihat
        map.setMaxBounds(bounds.pad(1.0));
        map.options.maxBoundsViscosity = 1.0;
      }
    }
  }, [map, data]);

  return null;
}

function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    const container = map.getContainer();
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [map]);
  return null;
}

function SearchControl({ data }: { data: any[] }) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const [selectedPos, setSelectedPos] = useState<any>(null);
  
  const results = data.filter(d => 
    d.nama && d.kab && (
      d.nama.toLowerCase().includes(query.toLowerCase()) || 
      d.kab.toLowerCase().includes(query.toLowerCase())
    )
  ).slice(0, 5); // Maksimal 5 item

  const handleSelect = (pos: any) => {
    if (pos.lat && pos.lon) {
      map.flyTo([pos.lat, pos.lon], 13, { duration: 1.5 });
      setSelectedPos(pos);
    }
    setShow(false);
    setQuery(pos.nama);
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-[1000] w-64 md:w-80 shadow-lg rounded-xl bg-white border border-slate-200 flex flex-col overflow-hidden">
      <div className="flex items-center px-3 py-2 bg-white">
        <Search className="w-5 h-5 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Cari daerah..." 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShow(e.target.value.length > 0);
          }}
          onFocus={() => { if(query.length > 0) setShow(true); }}
          className="w-full outline-none text-sm font-medium bg-transparent text-slate-800 placeholder:text-slate-400"
        />
      </div>
      {show && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t border-slate-100 bg-white">
          {results.map((pos, idx) => (
            <button 
              key={idx}
              onClick={() => handleSelect(pos)}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col"
            >
              <span className="text-sm font-bold text-slate-700">{pos.nama}</span>
              <span className="text-xs text-slate-500">Kabupaten {pos.kab}</span>
            </button>
          ))}
        </div>
      )}

      {show && query.length > 0 && results.length === 0 && (
        <div className="px-4 py-3 text-sm text-slate-500 bg-white border-t border-slate-100 text-center">
          Daerah tidak ditemukan
        </div>
      )}
      </div>

      {selectedPos && (
        <Popup position={[selectedPos.lat, selectedPos.lon]} eventHandlers={{ remove: () => setSelectedPos(null) }} className="custom-bmkg-popup">
          <div className="p-1" style={{ minWidth: '180px', fontFamily: 'sans-serif' }}>
            <div className="flex justify-between items-center border-b pb-2 mb-2">
              <h6 className="font-bold m-0 text-primary" style={{ fontSize: '14px' }}>{selectedPos.nama}</h6>
              <span className="bg-slate-800 text-white px-2 py-0.5 rounded-full" style={{ fontSize: '10px' }}>{selectedPos.id}</span>
            </div>
            <div className="mb-2" style={{ fontSize: '12px' }}>
              <span className="material-symbols-outlined text-[12px] text-red-500 align-middle mr-1">location_on</span>
              Kab. {selectedPos.kab}
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
              <div style={{ fontSize: '11px', color: '#555' }}>Hari Tanpa Hujan:</div>
              <div className="font-bold text-lg text-slate-800">{selectedPos.hth || 0} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Hari</span></div>
              <div className="mt-1 px-2 py-1 rounded" style={{ background: getHTHColor(selectedPos.hth || 0), color: '#000', border: '1px solid #aaa', fontSize: '11px', fontWeight: 'bold' }}>
                {selectedPos.ket || "Masih Ada Hujan"}
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
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
          const validData = json.filter((item: any) => item.hth !== null && item.hth !== undefined && item.hth !== "");
          setData(validData);
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
        preferCanvas={true}
        center={[-7.7, 112.5]} 
        zoom={8} 
        zoomControl={false}
        className="w-full h-full absolute inset-0 rounded-2xl shadow-sm z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.bmkg.go.id">BMKG</a> | <a href="https://www.esri.com">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        
        <ResizeHandler />
        <SearchControl data={data} />
        <MapBoundsUpdater data={data} />
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-semibold text-slate-700 shadow-md pointer-events-none z-[1000] flex items-center gap-2 border border-slate-200 whitespace-nowrap">
          <span className="hidden md:inline">Gunakan scroll mouse untuk zoom peta</span>
          <span className="inline md:hidden">Gunakan dua jari untuk zoom peta</span>
        </div>

        {data.length === 0 && (
          <div className="absolute inset-0 z-[1000] bg-slate-50/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center gap-2 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-400">location_off</span>
              <p className="font-bold text-slate-700">Data Tidak Tersedia</p>
              <p className="text-xs text-slate-500">Belum ada data stasiun pemantau HTH.</p>
            </div>
          </div>
        )}

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
