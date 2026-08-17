"use client";

import { useState, useEffect } from "react";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseRpc, supabaseUploadFile, supabaseDeleteFile, supabaseGetPublicUrl } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { TemperatureLineChart } from "@/components/climate/temperature-line-chart";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function AdminPage() {
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState("stations");
  const [stations, setStations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  
  const [newStation, setNewStation] = useState({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });
  const [newOrgMember, setNewOrgMember] = useState({ role_id: "", role_title: "", name: "", nip: "" });

  // --- Climate CSV Admin States ---
  const [csvTextStripes, setCsvTextStripes] = useState("");
  const [climatePreviewStripes, setClimatePreviewStripes] = useState<ClimateParsedResult | null>(null);
  const [csvTextAnnual, setCsvTextAnnual] = useState("");
  const [climatePreviewAnnual, setClimatePreviewAnnual] = useState<ClimateParsedResult | null>(null);
  
  // Shared state for previews
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // --- Temperature Maps Admin States ---
  const [tempMaps, setTempMaps] = useState<any[]>([]);
  const [newTempMap, setNewTempMap] = useState({ year: new Date().getFullYear(), category: "Normal", file: null as File | null });
  const [isUploadingTempMap, setIsUploadingTempMap] = useState(false);
  const [editTempMapId, setEditTempMapId] = useState<number | null>(null);

  // --- Confirm Dialog State ---
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    loadStations();
    loadAnnouncements();
    loadClimateData();
    loadOrgMembers();
    loadTempMaps();
  }, []);

  const loadStations = async () => {
    let sts = await supabaseFetch("stations");
    if (!sts || sts.length === 0) {
      sts = FALLBACK_STATIONS;
    }
    setStations(sts);
  };

  const loadAnnouncements = async () => {
    const anns = await supabaseFetch("announcements", "order=published_at.desc");
    setAnnouncements(anns || []);
  };

  const loadOrgMembers = async () => {
    const org = await supabaseFetch("organization_structure");
    setOrgMembers(org || []);
  };

  const loadTempMaps = async () => {
    const maps = await supabaseFetch("temperature_maps", "order=year.desc,created_at.desc");
    setTempMaps(maps || []);
  };

  const loadClimateData = async () => {
    // Load Warming Stripes
    try {
      let stripesRes = await fetch(supabaseGetPublicUrl("climate-data", "warming-stripes.csv"), { cache: 'no-store' });
      if (stripesRes.ok) {
        const text = await stripesRes.text();
        setCsvTextStripes(text);
        setClimatePreviewStripes(parseCSVText(text));
      } else {
        // Fallback
        const res = await fetch("/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv");
        if (res.ok) {
          const text = await res.text();
          setCsvTextStripes(text);
          setClimatePreviewStripes(parseCSVText(text));
        }
      }
    } catch (e) {
      console.error("Gagal memuat data iklim (stripes) di admin", e);
    }

    // Load Annual Temps
    try {
      let tempRes = await fetch(supabaseGetPublicUrl("climate-data", "annual-temperatures.csv"), { cache: 'no-store' });
      if (tempRes.ok) {
        const text = await tempRes.text();
        setCsvTextAnnual(text);
        setClimatePreviewAnnual(parseCSVText(text));
      } else {
        // Fallback
        const res = await fetch("/Rata_Rata_Suhu_Tahunan.csv");
        if (res.ok) {
          const text = await res.text();
          setCsvTextAnnual(text);
          setClimatePreviewAnnual(parseCSVText(text));
        }
      }
    } catch (e) {
      console.error("Gagal memuat data iklim (annual) di admin", e);
    }
  };

  const processAndUploadCSV = async (textToProcess: string, type: 'stripes' | 'annual') => {
    try {
      const parsed = parseCSVText(textToProcess);
      const filename = type === 'stripes' ? 'warming-stripes.csv' : 'annual-temperatures.csv';
      
      // Update preview immediately
      if (type === 'stripes') {
        setClimatePreviewStripes(parsed);
        setCsvTextStripes(textToProcess);
      } else {
        setClimatePreviewAnnual(parsed);
        setCsvTextAnnual(textToProcess);
      }
      
      // Upload to Supabase Storage as a Blob
      const fileBlob = new Blob([textToProcess], { type: 'text/csv' });
      const fileObj = new File([fileBlob], filename, { type: 'text/csv' });
      
      const uploadedUrl = await supabaseUploadFile("climate-data", filename, fileObj);
      
      if (uploadedUrl) {
        toast.success(`Berhasil mengunggah data CSV ${type === 'stripes' ? 'Warming Stripes' : 'Suhu Tahunan'}!`);
      } else {
        toast.error("Gagal mengunggah file ke Supabase Storage. Cek bucket 'climate-data'.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses file CSV.");
    }
  };

  const handleFileUpload = (evt: React.ChangeEvent<HTMLInputElement>, type: 'stripes' | 'annual') => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        processAndUploadCSV(text, type);
      }
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  const handleClearCSV = (type: 'stripes' | 'annual') => {
    openConfirm(
      "Kosongkan Data",
      `Apakah Anda yakin ingin mengosongkan data CSV iklim (${type}) dari Supabase Storage?`,
      async () => {
        closeConfirm();
        const filename = type === 'stripes' ? 'warming-stripes.csv' : 'annual-temperatures.csv';
        const deleted = await supabaseDeleteFile("climate-data", filename);
        if (deleted) {
          if (type === 'stripes') {
            setCsvTextStripes("");
            setClimatePreviewStripes(null);
          } else {
            setCsvTextAnnual("");
            setClimatePreviewAnnual(null);
          }
          toast.success("Data CSV berhasil dihapus dari storage.");
        } else {
          toast.error("Gagal menghapus file dari storage.");
        }
      }
    );
  };

  const handleResetDefaultCSV = (type: 'stripes' | 'annual') => {
    openConfirm(
      "Kembalikan ke Default",
      `Apakah Anda yakin ingin mereset data (${type}) ke dataset default bawaan sistem? Ini akan mengunggah file default ke Supabase Storage.`,
      async () => {
        closeConfirm();
        try {
          const fallbackPath = type === 'stripes' ? "/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv" : "/Rata_Rata_Suhu_Tahunan.csv";
          const res = await fetch(fallbackPath);
          if (res.ok) {
            const text = await res.text();
            await processAndUploadCSV(text, type);
          } else {
            toast.error("Gagal mengambil dataset default.");
          }
        } catch (e) {
          toast.error("Gagal mereset CSV default.");
        }
      }
    );
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await supabaseInsert("stations", {
      station_id: newStation.id_sta,
      station_name: newStation.name,
      table_name: newStation.table,
      latitude: parseFloat(newStation.lat) || 0,
      longitude: parseFloat(newStation.lng) || 0,
      status: newStation.status,
      show_on_home: true,
      show_on_realtime: true
    });
    
    if (result) {
      await supabaseRpc("create_aws_table", { tbl_name: newStation.table });
      toast.success("Stasiun dan tabel berhasil ditambahkan!");
      setNewStation({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
      loadStations();
    } else {
      toast.error("Gagal menambahkan stasiun. Pastikan tabel 'stations' sudah ada di database Supabase Anda.");
    }
  };

  const handleDeleteStation = (id: number) => {
    openConfirm(
      "Hapus Stasiun",
      "Yakin ingin menghapus stasiun ini? Data terkait tabel tersebut di database tidak akan terhapus secara otomatis.",
      async () => {
        closeConfirm();
        await supabaseDelete("stations", `id=eq.${id}`);
        loadStations();
        toast.success("Stasiun berhasil dihapus.");
      }
    );
  };

  const handleToggleVisibility = async (id: number, field: string, currentValue: boolean) => {
    await supabaseUpdate("stations", `id=eq.${id}`, { [field]: !currentValue });
    loadStations();
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await supabaseInsert("announcements", {
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      category: newAnnouncement.category,
      priority: newAnnouncement.priority,
      image_url: newAnnouncement.image_url || null,
      instagram_url: newAnnouncement.instagram_url || null,
      is_featured: newAnnouncement.is_featured,
      published_at: new Date().toISOString()
    });
    
    if (result) {
      toast.success("Pengumuman berhasil dipublikasikan!");
      setNewAnnouncement({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });
      loadAnnouncements();
    } else {
      toast.error("Gagal mempublikasikan. Pastikan tabel 'announcements' sudah ada.");
    }
  };

  const handleDeleteAnnouncement = (id: number) => {
    openConfirm(
      "Hapus Pengumuman",
      "Yakin ingin menghapus pengumuman ini?",
      async () => {
        closeConfirm();
        await supabaseDelete("announcements", `id=eq.${id}`);
        loadAnnouncements();
        toast.success("Pengumuman berhasil dihapus.");
      }
    );
  };

  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabaseDelete("organization_structure", `role_id=eq.${newOrgMember.role_id}`);
    const result = await supabaseInsert("organization_structure", {
      role_id: newOrgMember.role_id,
      role_title: newOrgMember.role_title,
      name: newOrgMember.name,
      nip: newOrgMember.nip
    });
    if (result) {
      toast.success("Anggota organisasi berhasil disimpan!");
      setNewOrgMember({ role_id: "", role_title: "", name: "", nip: "" });
      loadOrgMembers();
    }
  };

  const handleDeleteOrgMember = (id: number) => {
    openConfirm(
      "Hapus Anggota",
      "Yakin ingin menghapus data anggota ini?",
      async () => {
        closeConfirm();
        await supabaseDelete("organization_structure", `id=eq.${id}`);
        loadOrgMembers();
        toast.success("Anggota berhasil dihapus.");
      }
    );
  };

  const handleAddTempMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTempMap.file) {
      toast.error("Harap pilih file gambar peta terlebih dahulu!");
      return;
    }

    setIsUploadingTempMap(true);
    
    const fileExt = newTempMap.file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${newTempMap.year}/${fileName}`;
    
    const imageUrl = await supabaseUploadFile("temperature-maps", filePath, newTempMap.file);
    
    if (!imageUrl) {
      toast.error("Gagal mengupload gambar ke Supabase Storage.");
      setIsUploadingTempMap(false);
      return;
    }

    const result = await supabaseInsert("temperature_maps", {
      year: newTempMap.year,
      category: newTempMap.category,
      image_url: imageUrl
    });
    
    if (result) {
      toast.success("Peta perubahan suhu berhasil ditambahkan!");
      setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
      loadTempMaps();
    } else {
      toast.error("Gagal menyimpan data ke database.");
      await supabaseDeleteFile("temperature-maps", filePath);
    }
    
    setIsUploadingTempMap(false);
  };

  const handleEditTempMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTempMapId) return;

    setIsUploadingTempMap(true);
    let imageUrl = "";

    if (newTempMap.file) {
      const fileExt = newTempMap.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${newTempMap.year}/${fileName}`;
      
      const uploadedUrl = await supabaseUploadFile("temperature-maps", filePath, newTempMap.file);
      if (!uploadedUrl) {
        toast.error("Gagal mengupload gambar baru ke Supabase Storage.");
        setIsUploadingTempMap(false);
        return;
      }
      imageUrl = uploadedUrl;

      const oldMap = tempMaps.find(m => m.id === editTempMapId);
      if (oldMap && oldMap.image_url) {
        const urlParts = oldMap.image_url.split('/temperature-maps/');
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          await supabaseDeleteFile("temperature-maps", oldFilePath);
        }
      }
    }

    const updateData: any = {
      year: newTempMap.year,
      category: newTempMap.category,
    };
    if (imageUrl) {
      updateData.image_url = imageUrl;
    }

    const result = await supabaseUpdate("temperature_maps", updateData, `id=eq.${editTempMapId}`);
    
    if (result) {
      toast.success("Peta perubahan suhu berhasil diperbarui!");
      setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
      setEditTempMapId(null);
      loadTempMaps();
    } else {
      toast.error("Gagal memperbarui data di database.");
    }
    
    setIsUploadingTempMap(false);
  };

  const startEditTempMap = (map: any) => {
    setEditTempMapId(map.id);
    setNewTempMap({ year: map.year, category: map.category, file: null });
  };

  const cancelEditTempMap = () => {
    setEditTempMapId(null);
    setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
  };

  const handleDeleteTempMap = (id: number, imageUrl: string) => {
    openConfirm(
      "Hapus Peta Suhu",
      "Yakin ingin menghapus peta ini? Gambar juga akan dihapus dari storage.",
      async () => {
        closeConfirm();
        const deleted = await supabaseDelete("temperature_maps", `id=eq.${id}`);
        if (deleted) {
          const bucketPathStr = "/temperature-maps/";
          const pathIndex = imageUrl.indexOf(bucketPathStr);
          if (pathIndex !== -1) {
            const filePath = imageUrl.substring(pathIndex + bucketPathStr.length);
            await supabaseDeleteFile("temperature-maps", filePath);
          }
          loadTempMaps();
          toast.success("Peta suhu berhasil dihapus.");
        }
      }
    );
  };

  return (
    <>
      <ConfirmDialog {...confirmConfig} onCancel={closeConfirm} />
      <div className="h-screen bg-background text-on-surface font-sans flex">
        {/* Sidebar */}
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0 hidden md:flex flex-col h-full sticky top-0 shadow-sm z-10">
          <div className="p-6 border-b border-border">
            <h1 className="text-[1.75rem] text-primary font-bold">Panel Admin</h1>
            <p className="text-[14px] text-secondary mt-1">BMKG Malang</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <a 
              onClick={() => setActiveTab('stations')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'stations' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">sensors</span>
              <span className="text-[14px] font-medium">Manage Stations</span>
            </a>
            <a 
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'announcements' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">campaign</span>
              <span className="text-[14px] font-medium">Announcements</span>
            </a>
            <a 
              onClick={() => setActiveTab('climate')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'climate' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">thermostat</span>
              <span className="text-[14px] font-medium">Visualisasi Iklim (CSV)</span>
            </a>
            <a 
              onClick={() => setActiveTab('org')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'org' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">account_tree</span>
              <span className="text-[14px] font-medium">Struktur Organisasi</span>
            </a>
            <a 
              onClick={() => setActiveTab('tempmaps')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'tempmaps' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">map</span>
              <span className="text-[14px] font-medium">Peta Suhu</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full z-0">
          {/* Header */}
          <header className="bg-surface border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm w-full">
            <div className="md:hidden">
              <h1 className="text-[1.75rem] text-primary font-bold">Panel Admin</h1>
            </div>
            <div className="hidden md:block">
              <h2 className="text-[28px] font-semibold text-text-primary">
                {activeTab === 'stations' && 'Manage Stations (AWS)'}
                {activeTab === 'announcements' && 'Announcements'}
                {activeTab === 'climate' && 'Visualisasi Perubahan Iklim (Warming Stripes)'}
                {activeTab === 'org' && 'Struktur Organisasi'}
                {activeTab === 'tempmaps' && 'Peta Suhu'}
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-primary">account_circle</span>
                <div className="hidden lg:block">
                  <p className="text-[14px] font-bold text-on-surface">Admin Utama</p>
                  <p className="text-[14px] text-secondary text-xs">admin@bmkg.go.id</p>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-6 max-w-7xl mx-auto w-full space-y-8 pb-32">
            
            {activeTab === 'stations' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manage AWS Table Card */}
                <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[1.75rem] font-semibold text-on-surface">Daftar AWS</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-secondary text-[14px]">
                          <th className="py-2 px-2 font-medium">Station ID</th>
                          <th className="py-2 px-2 font-medium">Location</th>
                          <th className="py-2 px-2 font-medium">Status</th>
                          <th className="py-2 px-2 font-medium">Visibility</th>
                          <th className="py-2 px-2 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {stations.map(st => (
                          <tr key={st.id} className="border-b border-border/50 hover:bg-surface-container-low transition-colors">
                            <td className="py-4 px-2 font-medium">{st.station_id}</td>
                            <td className="py-4 px-2">{st.station_name}</td>
                            <td className="py-4 px-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.status === 'Online' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                <span className={`w-2 h-2 rounded-full ${st.status === 'Online' ? 'bg-success' : 'bg-warning'}`}></span> {st.status}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex gap-2">
                                <label className="flex items-center cursor-pointer">
                                  <input type="checkbox" checked={st.show_on_home} onChange={() => handleToggleVisibility(st.id, 'show_on_home', st.show_on_home)} className="mr-1" />
                                  <span className="text-xs text-secondary">Home</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                  <input type="checkbox" checked={st.show_on_realtime} onChange={() => handleToggleVisibility(st.id, 'show_on_realtime', st.show_on_realtime)} className="mr-1" />
                                  <span className="text-xs text-secondary">RT</span>
                                </label>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <button onClick={() => handleDeleteStation(st.id)} className="text-secondary hover:text-error transition-colors p-1"><span className="material-symbols-outlined text-sm">delete</span></button>
                            </td>
                          </tr>
                        ))}
                        {stations.length === 0 && <tr><td colSpan={5} className="py-4 text-center">Belum ada stasiun</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add New Station Form */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Quick Add AWS</h3>
                  <form className="space-y-4 flex-1" onSubmit={handleAddStation}>
                    <div>
                      <label className="block text-[14px] text-on-surface-variant mb-1">Station ID</label>
                      <input required value={newStation.id_sta} onChange={e => setNewStation({...newStation, id_sta: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. AWS-KJN-04" type="text"/>
                    </div>
                    <div>
                      <label className="block text-[14px] text-on-surface-variant mb-1">Nama Lokasi</label>
                      <input required value={newStation.name} onChange={e => setNewStation({...newStation, name: e.target.value, table: `aws_${e.target.value.toLowerCase().replace(/\s+/g, '_')}`})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. AWS Kepanjen" type="text"/>
                    </div>
                    <div>
                      <label className="block text-[14px] text-on-surface-variant mb-1">Nama Tabel DB (Auto)</label>
                      <input required value={newStation.table} onChange={e => setNewStation({...newStation, table: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" type="text"/>
                    </div>
                    <div>
                      <label className="block text-[14px] text-on-surface-variant mb-1">Initial Status</label>
                      <select value={newStation.status} onChange={e => setNewStation({...newStation, status: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none">
                        <option>Online</option>
                        <option>Offline</option>
                        <option>Maintenance</option>
                      </select>
                    </div>
                    <div className="pt-2 mt-auto">
                      <button type="submit" className="w-full bg-primary-container text-on-primary py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">Add Station</button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {activeTab === 'announcements' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Pengumuman */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Buat Pengumuman</h3>
                  <form className="space-y-4 flex-1" onSubmit={handleAddAnnouncement}>
                    <div>
                      <label className="block text-[14px] mb-1">Judul</label>
                      <input required value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text"/>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Kategori</label>
                      <select value={newAnnouncement.category} onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="info">Informasi Umum</option>
                        <option value="peringatan_dini">Peringatan Dini</option>
                        <option value="kegiatan">Kegiatan BMKG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Prioritas</label>
                      <select value={newAnnouncement.priority} onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="normal">Normal</option>
                        <option value="tinggi">Tinggi (Merah)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Isi Konten</label>
                      <textarea required rows={4} value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm"/>
                    </div>
                    <div className="pt-2 mt-auto">
                      <button type="submit" className="w-full bg-primary-container text-on-primary py-2 rounded-lg font-medium hover:opacity-90">Publikasikan</button>
                    </div>
                  </form>
                </div>

                {/* Daftar Pengumuman */}
                <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Daftar Pengumuman</h3>
                  <div className="space-y-3">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-4 rounded-xl border border-border flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-bold uppercase text-primary tracking-wider">{ann.category}</span>
                          <h4 className="font-bold text-text-primary text-base mt-1">{ann.title}</h4>
                          <p className="text-xs text-text-secondary line-clamp-2 mt-1">{ann.content}</p>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-secondary hover:text-error transition-colors p-1 shrink-0">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    {announcements.length === 0 && <p className="text-sm text-text-secondary">Belum ada pengumuman.</p>}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'climate' && (
              <section className="space-y-8">
                {/* 1. Warming Stripes Management */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h3 className="text-[1.75rem] font-semibold text-on-surface">Kelola Data CSV Warming Stripes</h3>
                      <p className="text-sm text-secondary mt-1">
                        Unggah berkas CSV baru ke Supabase Storage. Sistem akan otomatis mendeteksi kolom tahun dan wilayah.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('stripes')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-surface-container-low text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-primary">restart_alt</span>
                        <span>Reset ke Data Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('stripes')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                        <span>Kosongkan Data</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputStripes")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3"
                    >
                      <input
                        type="file"
                        id="adminCsvInputStripes"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'stripes')}
                      />
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-base">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-xs text-text-secondary mt-1">Format .csv dengan Anomali Suhu</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Atau Tempelkan (Paste) Teks Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextStripes}
                        onChange={(e) => setCsvTextStripes(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,-0.338,-0.834&#10;..."
                        className="w-full border border-border rounded-xl p-3 text-xs font-mono bg-white focus:ring-2 focus:ring-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextStripes, 'stripes')}
                        className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-base">cloud_upload</span>
                        Proses &amp; Unggah Data CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
                    <h4 className="font-bold mb-4">Preview Warming Stripes</h4>
                    <WarmingStripesViewer parsedData={climatePreviewStripes} selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
                  </div>
                </div>

                {/* 2. Annual Temperatures Management */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h3 className="text-[1.75rem] font-semibold text-on-surface">Kelola Data CSV Suhu Tahunan</h3>
                      <p className="text-sm text-secondary mt-1">
                        Unggah berkas CSV berisi suhu absolut untuk ditampilkan sebagai grafik garis.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('annual')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-surface-container-low text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-primary">restart_alt</span>
                        <span>Reset ke Data Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('annual')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                        <span>Kosongkan Data</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputAnnual")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3"
                    >
                      <input
                        type="file"
                        id="adminCsvInputAnnual"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'annual')}
                      />
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-base">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-xs text-text-secondary mt-1">Format .csv dengan Suhu Absolut Rata-rata</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Atau Tempelkan (Paste) Teks Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextAnnual}
                        onChange={(e) => setCsvTextAnnual(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,24.41,27.22&#10;..."
                        className="w-full border border-border rounded-xl p-3 text-xs font-mono bg-white focus:ring-2 focus:ring-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextAnnual, 'annual')}
                        className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-base">cloud_upload</span>
                        Proses &amp; Unggah Data CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
                    <h4 className="font-bold mb-4">Preview Grafik Suhu</h4>
                    <TemperatureLineChart parsedData={climatePreviewAnnual} selectedRegion={selectedRegion} />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'org' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Anggota */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Input Data Anggota</h3>
                  <form className="space-y-4 flex-1" onSubmit={handleAddOrgMember}>
                    <div>
                      <label className="block text-[14px] mb-1">Posisi Jabatan (Role ID)</label>
                      <select required value={newOrgMember.role_id} onChange={e => setNewOrgMember({...newOrgMember, role_id: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="">-- Pilih Posisi --</option>
                        <option value="kepala">KEPALA UPT</option>
                        <option value="kasubag">KEPALA SUB BAGIAN TATA USAHA</option>
                        <option value="tim_1">KETUA TIM KERJA ANALISA...</option>
                        <option value="tim_2">KETUA TIM KERJA MANAJEMEN...</option>
                        <option value="tim_3">KETUA TIM KERJA OBSERVASI...</option>
                        <option value="tim_4">KETUA TIM KERJA PELAYANAN...</option>
                        <option value="tim_5">KETUA TIM KERJA INSTRUMENTASI...</option>
                        <option value="tim_6">KETUA TIM KERJA TATA USAHA</option>
                        <option value="fungsional_pmg">FUNGSIONAL PMG</option>
                        <option value="fungsional_non_pmg">FUNGSIONAL NON PMG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Nama Jabatan Ditampilkan</label>
                      <input required value={newOrgMember.role_title} onChange={e => setNewOrgMember({...newOrgMember, role_title: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text" placeholder="e.g. KEPALA UPT" />
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Nama Pegawai</label>
                      <input required value={newOrgMember.name} onChange={e => setNewOrgMember({...newOrgMember, name: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text" placeholder="Nama beserta gelar" />
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">NIP (Opsional)</label>
                      <input value={newOrgMember.nip} onChange={e => setNewOrgMember({...newOrgMember, nip: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text" placeholder="1974..." />
                    </div>
                    <div className="pt-2 mt-auto">
                      <button type="submit" className="w-full bg-primary-container text-on-primary py-2 rounded-lg font-medium hover:opacity-90">Simpan Anggota</button>
                    </div>
                  </form>
                </div>

                {/* Daftar Anggota */}
                <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Daftar Anggota Saat Ini</h3>
                  <div className="space-y-3">
                    {orgMembers.map(m => (
                      <div key={m.id} className="p-4 rounded-xl border border-border flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-bold uppercase text-primary tracking-wider">{m.role_id}</span>
                          <h4 className="font-bold text-text-primary text-base mt-1">{m.role_title}</h4>
                          <p className="text-sm text-text-primary mt-1 font-semibold">{m.name}</p>
                          <p className="text-xs text-text-secondary mt-1">NIP: {m.nip || "-"}</p>
                        </div>
                        <button onClick={() => handleDeleteOrgMember(m.id)} className="text-secondary hover:text-error transition-colors p-1 shrink-0">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    {orgMembers.length === 0 && <p className="text-sm text-text-secondary">Belum ada data anggota struktur organisasi.</p>}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'tempmaps' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                {/* Form Upload/Edit */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col h-full">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">
                    {editTempMapId ? "Edit Peta Suhu" : "Upload Peta Suhu Baru"}
                  </h3>
                  <form onSubmit={editTempMapId ? handleEditTempMap : handleAddTempMap} className="flex flex-col gap-4 flex-1">
                    <div>
                      <label className="block text-[14px] mb-1 font-medium">Gambar Peta {editTempMapId && "(Opsional)"}</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        required={!editTempMapId}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setNewTempMap({...newTempMap, file});
                        }} 
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1 font-medium">Tahun</label>
                      <input 
                        required 
                        type="number" 
                        min="1900" 
                        max="2100"
                        value={newTempMap.year} 
                        onChange={e => setNewTempMap({...newTempMap, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1 font-medium">Kategori Kejadian</label>
                      <select 
                        required 
                        value={newTempMap.category} 
                        onChange={e => setNewTempMap({...newTempMap, category: e.target.value})} 
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="El Niño">El Niño</option>
                        <option value="La Niña">La Niña</option>
                      </select>
                    </div>
                    <div className="pt-2 mt-auto">
                      <button 
                        type="submit" 
                        disabled={isUploadingTempMap}
                        className={`w-full text-on-primary py-2 rounded-lg font-medium transition-opacity flex items-center justify-center gap-2 ${isUploadingTempMap ? 'bg-primary/70 cursor-wait' : 'bg-primary hover:opacity-90'}`}
                      >
                        {isUploadingTempMap ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <span>{editTempMapId ? "Simpan Perubahan" : "Simpan Peta"}</span>
                        )}
                      </button>
                      {editTempMapId && (
                        <button 
                          type="button" 
                          onClick={cancelEditTempMap}
                          disabled={isUploadingTempMap}
                          className="w-full text-text-secondary py-2 mt-2 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Daftar Peta */}
                <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Daftar Peta Suhu ({tempMaps.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tempMaps.map(m => (
                      <div key={m.id} className="rounded-xl border border-border overflow-hidden bg-white shadow-sm flex flex-col group relative">
                        <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden">
                          <img 
                            src={m.image_url} 
                            alt={`Peta Suhu ${m.year} - ${m.category}`} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                            <span className="bg-white/90 backdrop-blur-sm text-text-primary px-2 py-1 rounded text-xs font-bold shadow-sm">
                              {m.year}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-bold shadow-sm text-white backdrop-blur-sm ${m.category === 'El Niño' ? 'bg-error/90' : m.category === 'La Niña' ? 'bg-primary/90' : 'bg-emerald-600/90'}`}>
                              {m.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-white flex justify-between items-center border-t border-border">
                          <span className="text-xs text-text-secondary truncate pr-2">ID: {m.id}</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startEditTempMap(m)} 
                              className="text-primary hover:text-primary-dark bg-slate-50 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                              title="Edit Peta"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteTempMap(m.id, m.image_url)} 
                              className="text-secondary hover:text-error bg-slate-50 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                              title="Hapus Peta"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tempMaps.length === 0 && (
                      <div className="col-span-full py-8 text-center text-text-secondary bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                        Belum ada data peta suhu. Silakan upload melalui form di samping.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
