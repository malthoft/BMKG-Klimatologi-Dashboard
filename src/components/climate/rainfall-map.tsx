"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, ZoomControl, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Search } from "lucide-react";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface ForecastOption {
  id: number;
  category: string;
  year: number;
  month: string;
  label: string;
  file_path: string;
}

interface RainfallMapProps {
  forecast: ForecastOption | null;
}

// Skala warna sesuai standar BMKG (Curah Hujan)
const getColor = (d: number) => {
  return d > 300 ? "#006400" : // Sangat Tinggi (Dark Green)
         d > 200 ? "#2E8B57" : // Tinggi (SeaGreen)
         d > 150 ? "#8FBC8F" : // Tinggi (Light Green)
         d > 100 ? "#C0D860" : // Menengah (Light Green-Yellow)
         d > 75  ? "#FFFF00" : // Menengah (Yellow)
         d > 50  ? "#DAA520" : // Menengah (Goldenrod)
         d > 20  ? "#D2691E" : // Rendah (Chocolate/Orange)
         d > 10  ? "#8B4513" : // Rendah (SaddleBrown)
                   "#5C3A21";  // Rendah (Brown)
};

const getLabel = (d: number) => {
  return d > 300 ? "> 300 mm (Sangat Tinggi)" :
         d > 200 ? "201 - 300 mm (Tinggi)" :
         d > 150 ? "151 - 200 mm (Tinggi)" :
         d > 100 ? "101 - 150 mm (Menengah)" :
         d > 75  ? "76 - 100 mm (Menengah)" :
         d > 50  ? "51 - 75 mm (Menengah)" :
         d > 20  ? "21 - 50 mm (Rendah)" :
         d > 10  ? "11 - 20 mm (Rendah)" :
                   "0 - 10 mm (Sangat Rendah)";
};

// Komponen untuk update boundary dan maxBounds
function MapUpdater({ geoData }: { geoData: any }) {
  const map = useMap();
  useEffect(() => {
    if (geoData && geoData.features && geoData.features.length > 0) {
      try {
        const bounds = L.geoJSON(geoData).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
          map.setMaxBounds(bounds.pad(1.0));
          map.options.maxBoundsViscosity = 1.0;
        }
      } catch (e) {
        console.error("Gagal mengatur bounds peta", e);
      }
    }
  }, [map, geoData]);
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

function SearchControl({ kecamatanData, geoData }: { kecamatanData: any, geoData: any }) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const [selectedResult, setSelectedResult] = useState<{
    latlng: [number, number];
    name: string;
    kabupaten: string;
    value: number;
  } | null>(null);
  
  const results = useMemo(() => {
    if (!kecamatanData?.features || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    return kecamatanData.features.filter((f: any) => {
      const p = f.properties || {};
      const namakec = (p.KECAMATAN || p.NAMAKEC || p.NAMOBJ || "").toLowerCase();
      const kab = (p.KABUPATEN || p.WADMKK || "").toLowerCase();
      return namakec.includes(q) || kab.includes(q);
    }).slice(0, 8);
  }, [kecamatanData, query]);

  const handleSelect = (feature: any) => {
    try {
      const bounds = L.geoJSON(feature).getBounds();
      if (bounds.isValid()) {
        const center = bounds.getCenter();
        const p = feature.properties || {};
        const name = p.KECAMATAN || p.NAMAKEC || p.NAMOBJ || "Wilayah";
        const kab = p.KABUPATEN || p.WADMKK || "-";

        let val = p._ch_value || 0;

        // Jika belum ada nilai, interpolasi menggunakan point atau polygon
        if (!val && geoData && geoData.features && geoData.features.length > 0) {
          try {
            if (geoData.features[0].geometry.type === 'Point') {
              const centroid = turf.centroid(feature as any);
              const nearest = turf.nearestPoint(centroid, geoData as any);
              val = nearest ? (nearest.properties.gridcode || nearest.properties.value || nearest.properties.CH || 0) : 0;
            } else {
              const pt = turf.point([center.lng, center.lat]);
              for (const poly of geoData.features) {
                if (turf.booleanPointInPolygon(pt, poly)) {
                  val = poly.properties.gridcode || poly.properties.value || poly.properties.CH || 0;
                  break;
                }
              }
            }
          } catch (err) {
            console.error("Gagal menghitung nilai curah hujan search:", err);
          }
        }

        setSelectedResult({
          latlng: [center.lat, center.lng],
          name: name,
          kabupaten: kab,
          value: val
        });

        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
      }
    } catch(e) {
      console.error("Error on select search item:", e);
    }
    setShow(false);
    setQuery(feature.properties?.KECAMATAN || feature.properties?.NAMAKEC || feature.properties?.NAMOBJ || "");
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-[1000] w-64 md:w-80 shadow-lg rounded-xl bg-white border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex items-center px-3 py-2 bg-white">
          <Search className="w-5 h-5 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Cari kecamatan atau kabupaten..." 
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
          <div className="max-h-56 overflow-y-auto border-t border-slate-100 bg-white divide-y divide-slate-50">
            {results.map((f: any, idx: number) => {
              const p = f.properties || {};
              const namakec = p.KECAMATAN || p.NAMAKEC || p.NAMOBJ || "Kecamatan";
              const kab = p.KABUPATEN || p.WADMKK || "-";
              return (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(f)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50/60 transition-colors flex flex-col cursor-pointer group"
                >
                  <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{namakec}</span>
                  <span className="text-xs text-slate-500">Kabupaten {kab}</span>
                </button>
              );
            })}
          </div>
        )}
        {show && query.length > 0 && results.length === 0 && (
          <div className="px-4 py-3 text-sm text-slate-500 bg-white border-t border-slate-100 text-center">
            Daerah tidak ditemukan
          </div>
        )}
      </div>
      
      {selectedResult && (
        <Popup 
          position={selectedResult.latlng} 
          eventHandlers={{ remove: () => setSelectedResult(null) }}
          className="custom-bmkg-popup"
        >
          <div style={{ minWidth: "220px", padding: 0, fontFamily: "sans-serif" }}>
            <div style={{ backgroundColor: "#0d6efd", color: "white", padding: "10px 15px", fontWeight: "bold", textAlign: "center", fontSize: "14px" }}>
              DETAIL INFO
            </div>
            <div style={{ padding: "15px", background: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e2e8f0", paddingBottom: "8px", marginBottom: "10px", fontSize: "13px" }}>
                <span style={{ color: "#475569" }}>Kecamatan:</span>
                <span style={{ color: "#0d6efd", fontWeight: "bold" }}>{selectedResult.name}</span>
              </div>
              {selectedResult.kabupaten && selectedResult.kabupaten !== "-" && (
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e2e8f0", paddingBottom: "8px", marginBottom: "12px", fontSize: "12px" }}>
                  <span style={{ color: "#475569" }}>Kabupaten:</span>
                  <span style={{ color: "#1e293b", fontWeight: "600" }}>{selectedResult.kabupaten}</span>
                </div>
              )}
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", marginBottom: "6px" }}>Prakiraan Hujan</span>
                <div style={{ backgroundColor: getColor(selectedResult.value), color: selectedResult.value > 150 || selectedResult.value <= 20 ? "white" : "black", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", display: "inline-block", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", fontSize: "12px" }}>
                  {getLabel(selectedResult.value)}
                </div>
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

export function RainfallMap({ forecast }: RainfallMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [kabupatenData, setKabupatenData] = useState<any>(null);
  const [kecamatanData, setKecamatanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Layer Control States
  const [showForecast, setShowForecast] = useState(true);
  const [showKabupaten, setShowKabupaten] = useState(true);
  const [showKecamatan, setShowKecamatan] = useState(true);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const geoJsonRef = useRef<L.GeoJSON>(null);
  const kecamatanGeoJsonRef = useRef<L.GeoJSON>(null);
  const kabupatenGeoJsonRef = useRef<L.GeoJSON>(null);

  // Load batas wilayah dari public folder
  useEffect(() => {
    fetch("/batas_kabupaten.json")
      .then(res => res.json())
      .then(data => setKabupatenData(data))
      .catch(err => console.error("Gagal memuat batas kabupaten:", err));
      
    fetch("/batas_kecamatan.json")
      .then(res => res.json())
      .then(data => setKecamatanData(data))
      .catch(err => console.error("Gagal memuat batas kecamatan:", err));
  }, []);

  // Load data prakiraan ketika forecast berubah
  useEffect(() => {
    if (!forecast) {
      setGeoData(null);
      return;
    }
    
    const loadGeoJson = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(forecast.file_path);
        if (!res.ok) throw new Error("Gagal mengambil data prakiraan");
        const data = await res.json();
        setGeoData(data);
      } catch (err) {
        console.error("Gagal memuat GeoJSON prakiraan:", err);
        setGeoData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGeoJson();
  }, [forecast]);

  // Handle Find Location
  const handleFindLocation = () => {
    if (!map) return;
    
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur Geolocation.");
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
        setUserLocation(latlng);
        map.flyTo(latlng, 9);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Gagal mendapatkan lokasi Anda.";
        if (error.code === 1) errorMsg = "Izin lokasi ditolak oleh browser atau sistem operasi Anda.";
        if (error.code === 2) errorMsg = "Sinyal/sensor GPS tidak tersedia di perangkat ini.";
        if (error.code === 3) errorMsg = "Waktu pencarian lokasi habis (Timeout).";
        
        alert(errorMsg + " Pastikan izin lokasi (Location Privacy) di pengaturan Windows dan Browser sudah aktif.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false, // Matikan high accuracy agar tidak timeout di PC Desktop tanpa GPS
        timeout: 20000,
        maximumAge: 0
      }
    );
  };

  // Interpolasi data titik ke poligon kecamatan
  const coloredKecamatanData = useMemo(() => {
    if (!kecamatanData || !geoData || !geoData.features || geoData.features.length === 0) return kecamatanData;
    if (geoData.features[0].geometry.type !== 'Point') return kecamatanData;

    try {
      const newData = {
        ...kecamatanData,
        features: kecamatanData.features.map((f: any) => {
          const centroid = turf.centroid(f as any);
          const nearest = turf.nearestPoint(centroid, geoData as any);
          const val = nearest ? (nearest.properties.gridcode || nearest.properties.value || nearest.properties.CH || 0) : 0;
          return { ...f, properties: { ...f.properties, _ch_value: val } };
        })
      };
      return newData;
    } catch (e) {
      console.error("Turf interpolation error:", e);
      return kecamatanData;
    }
  }, [kecamatanData, geoData]);

  // Interpolasi data titik ke poligon kabupaten
  const coloredKabupatenData = useMemo(() => {
    if (!kabupatenData || !geoData || !geoData.features || geoData.features.length === 0) return kabupatenData;
    if (geoData.features[0].geometry.type !== 'Point') return kabupatenData;

    try {
      const newData = {
        ...kabupatenData,
        features: kabupatenData.features.map((f: any) => {
          const centroid = turf.centroid(f as any);
          const nearest = turf.nearestPoint(centroid, geoData as any);
          const val = nearest ? (nearest.properties.gridcode || nearest.properties.value || nearest.properties.CH || 0) : 0;
          return { ...f, properties: { ...f.properties, _ch_value: val } };
        })
      };
      return newData;
    } catch (e) {
      console.error("Turf interpolation error:", e);
      return kabupatenData;
    }
  }, [kabupatenData, geoData]);

  const style = (feature: any) => {
    const value = feature.properties.gridcode || feature.properties.value || feature.properties.CH || 0;
    return {
      fillColor: getColor(value),
      weight: 0.5,
      opacity: 0.8,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.8
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const value = feature.properties.gridcode || feature.properties.value || feature.properties.CH || 0;
    layer.bindPopup(`
      <div class="p-2">
        <h4 class="font-bold text-slate-800">Prakiraan Curah Hujan</h4>
        <div class="mt-1 flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm" style="background-color: ${getColor(value)}"></span>
          <span class="text-sm">Curah Hujan: <b>${value} mm</b></span>
        </div>
      </div>
    `);
    
    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({ weight: 2, color: "#333", dashArray: "", fillOpacity: 0.95 });
        target.bringToFront();
      },
      mouseout: (e) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      }
    });
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 min-h-[600px]">
      <style dangerouslySetInnerHTML={{__html: `
        .kabupaten-label {
          background: transparent;
          border: none;
          box-shadow: none;
          color: #1f2937;
          font-weight: 800;
          font-size: 11px;
          text-shadow: 1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white;
          text-align: center;
          pointer-events: none;
        }
        .custom-bmkg-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        .custom-bmkg-popup .leaflet-popup-content {
          margin: 0;
          width: 250px !important;
        }
        .custom-bmkg-popup .leaflet-popup-close-button {
          color: white !important;
          padding: 8px 8px 0 0 !important;
          font-weight: bold;
        }
      `}} />

      {/* Area Peta */}
      <div className="flex-1 relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 z-0 min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 z-[1000] bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="font-bold text-slate-700">Memuat data spasial...</span>
            </div>
          </div>
        )}
        
        <MapContainer 
          preferCanvas={true}
          center={[-7.7, 112.5]} 
          zoom={8} 
          zoomControl={false}
          className="w-full h-full absolute inset-0 rounded-2xl shadow-sm z-0"
          ref={setMap as any}
        >
          
          <TileLayer
            attribution='&copy; <a href="https://www.bmkg.go.id">BMKG</a> | <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />
          <MapUpdater geoData={geoData} />
          <ResizeHandler />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-semibold text-slate-700 shadow-md pointer-events-none z-[1000] flex items-center gap-2 border border-slate-200 whitespace-nowrap">
            <span className="hidden md:inline">Gunakan scroll mouse untuk zoom peta</span>
            <span className="inline md:hidden">Gunakan dua jari untuk zoom peta</span>
          </div>

          <SearchControl kecamatanData={coloredKecamatanData || kecamatanData} geoData={geoData} />

          {showForecast && geoData && (
            <GeoJSON 
              key={forecast?.id + "-data-points"}
              data={geoData} 
              pointToLayer={(feature, latlng) => {
                const value = feature.properties?.gridcode || feature.properties?.value || feature.properties?.CH || 0;
                return L.circleMarker(latlng, { 
                  radius: 5, 
                  fillColor: getColor(value),
                  color: getColor(value),
                  weight: 1,
                  opacity: 0.8,
                  fillOpacity: 0.6
                }); 
              }}
              ref={geoJsonRef}
            />
          )}

          {showKecamatan && coloredKecamatanData && (
            <GeoJSON 
              key={forecast?.id + "-batas-kecamatan-" + (geoData ? "loaded" : "none")}
              data={coloredKecamatanData}
              style={(feature) => {
                const value = feature?.properties?._ch_value || 0;
                return { 
                  color: value ? getColor(value) : "#9ca3af", 
                  weight: 0.5, 
                  fillOpacity: value ? 0.7 : 0, 
                  opacity: 0.8,
                  fillColor: value ? getColor(value) : "transparent"
                };
              }}
              interactive={true}
              ref={kecamatanGeoJsonRef}
              onEachFeature={(feature, layer) => {
                 const name = feature.properties?.KECAMATAN || feature.properties?.NAMAKEC || feature.properties?.NAMOBJ || "Tidak Diketahui";
                 const value = feature.properties?._ch_value || 0;

                 const popupHtml = `
                   <div style="min-width: 200px; padding: 0; font-family: sans-serif;">
                     <div style="background-color: #0d6efd; color: white; padding: 10px 15px; font-weight: bold; text-align: center; font-size: 14px;">
                       DETAIL INFO
                     </div>
                     <div style="padding: 15px; background: white;">
                       <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; font-size: 14px;">
                         <span style="color: #475569;">Wilayah:</span>
                         <span style="color: #0d6efd; font-weight: 500;">${name}</span>
                       </div>
                       <div style="text-align: center;">
                         <span style="color: #64748b; font-size: 12px; display: block; margin-bottom: 8px;">Prakiraan Hujan</span>
                         <div style="background-color: ${getColor(value)}; color: ${value > 150 || value <= 20 ? 'white' : 'black'}; padding: 6px 12px; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 13px;">
                           ${getLabel(value)}
                         </div>
                       </div>
                     </div>
                   </div>
                 `;
                 
                 layer.bindPopup(popupHtml, { className: 'custom-bmkg-popup' });
                 
                 layer.on({
                   popupopen: (e) => {
                     e.target.setStyle({ color: "#00ffff", weight: 3, dashArray: "5, 5", fillOpacity: 0.8 });
                     e.target.bringToFront();
                   },
                   popupclose: (e) => {
                     if (kecamatanGeoJsonRef.current) kecamatanGeoJsonRef.current.resetStyle(e.target);
                   }
                 });
              }}
            />
          )}

          {showKabupaten && coloredKabupatenData && (
            <GeoJSON 
              key={forecast?.id + "-batas-kabupaten-" + (geoData ? "loaded" : "none")}
              data={coloredKabupatenData}
              ref={kabupatenGeoJsonRef}
              style={(feature) => {
                const value = feature?.properties?._ch_value || 0;
                return { 
                  color: "#1f2937", 
                  weight: 2, 
                  fillOpacity: (!showKecamatan && value) ? 0.7 : 0, 
                  opacity: 0.9,
                  fillColor: (!showKecamatan && value) ? getColor(value) : "transparent"
                };
              }}
              interactive={!showKecamatan}
              onEachFeature={(feature, layer) => {
                const name = feature.properties?.KABUPATEN || feature.properties?.kabupaten || feature.properties?.WADMKK || "Tidak Diketahui";
                
                layer.bindTooltip(name, {
                  permanent: true,
                  direction: "center",
                  className: "kabupaten-label"
                });
                
                // Tambahkan click interaction hanya jika kecamatan disembunyikan
                if (!showKecamatan) {
                   const value = feature.properties?._ch_value || 0;

                   const popupHtml = `
                     <div style="min-width: 200px; padding: 0; font-family: sans-serif;">
                       <div style="background-color: #0d6efd; color: white; padding: 10px 15px; font-weight: bold; text-align: center; font-size: 14px;">
                         DETAIL INFO
                       </div>
                       <div style="padding: 15px; background: white;">
                         <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; font-size: 14px;">
                           <span style="color: #475569;">Wilayah:</span>
                           <span style="color: #0d6efd; font-weight: 500;">${name}</span>
                         </div>
                         <div style="text-align: center;">
                           <span style="color: #64748b; font-size: 12px; display: block; margin-bottom: 8px;">Prakiraan Hujan</span>
                           <div style="background-color: ${getColor(value)}; color: ${value > 150 || value <= 20 ? 'white' : 'black'}; padding: 6px 12px; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 13px;">
                             ${getLabel(value)}
                           </div>
                         </div>
                       </div>
                     </div>
                   `;
                   
                   layer.bindPopup(popupHtml, { className: 'custom-bmkg-popup' });
                   
                   layer.on({
                     popupopen: (e) => {
                       e.target.setStyle({ color: "#00ffff", weight: 3, dashArray: "5, 5", fillOpacity: 0.8 });
                       e.target.bringToFront();
                     },
                     popupclose: (e) => {
                       if (kabupatenGeoJsonRef.current) kabupatenGeoJsonRef.current.resetStyle(e.target);
                     }
                   });
                }
              }}
            />
          )}
          
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                <div className="text-center">
                  <span className="font-bold text-slate-800 block">Lokasi Anda Saat Ini</span>
                  <span className="text-xs text-slate-500">{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Sidebar Kontrol & Legend di Luar Peta */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5 z-10 relative">
        
        {/* Panel Kontrol Layer Modern */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">layers</span>
            Kontrol Layer Peta
          </h4>
          
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Data Prakiraan Hujan</span>
              <div className="relative flex items-center">
                <input type="checkbox" checked={showForecast} onChange={e => setShowForecast(e.target.checked)} className="peer sr-only" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Batas Kabupaten</span>
              <div className="relative flex items-center">
                <input type="checkbox" checked={showKabupaten} onChange={e => setShowKabupaten(e.target.checked)} className="peer sr-only" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Batas Kecamatan</span>
              <div className="relative flex items-center">
                <input type="checkbox" checked={showKecamatan} onChange={e => setShowKecamatan(e.target.checked)} className="peer sr-only" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>

          <hr className="my-5 border-slate-100" />

          {/* Tombol Lokasi Saya */}
          <button 
            onClick={handleFindLocation}
            disabled={isLocating}
            className="w-full py-3 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLocating ? (
              <div className="w-5 h-5 border-2 border-blue-600 group-hover:border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined text-[20px]">my_location</span>
            )}
            {isLocating ? "Mencari Lokasi..." : "Lokasi Saya Saat Ini"}
          </button>
        </div>

        {/* Panel Legend */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex-1 h-fit">
          <h4 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
             <span className="material-symbols-outlined text-amber-500">water_drop</span>
             Skala Curah Hujan
          </h4>
          <div className="flex flex-col gap-3 text-[13px] font-semibold text-slate-700">
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#5C3A21] border border-black/10"></span> 0 - 10 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">Rendah</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#8B4513] border border-black/10"></span> 11 - 20 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">Rendah</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#D2691E] border border-black/10"></span> 21 - 50 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">Rendah</span></div>
            
            <div className="flex items-center justify-between mt-1"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#DAA520] border border-black/10"></span> 51 - 75 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">Menengah</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#FFFF00] border border-black/10"></span> 76 - 100 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">Menengah</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#C0D860] border border-black/10"></span> 101 - 150 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">Menengah</span></div>
            
            <div className="flex items-center justify-between mt-1"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#8FBC8F] border border-black/10"></span> 151 - 200 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">Tinggi</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#2E8B57] border border-black/10"></span> 201 - 300 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">Tinggi</span></div>
            
            <div className="flex items-center justify-between mt-1"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-[#006400] border border-black/10"></span> &gt; 300 mm</div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-red-100 text-red-600 px-2 py-1 rounded-md">Ekstrem</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
