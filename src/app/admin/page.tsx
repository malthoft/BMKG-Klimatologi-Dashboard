"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseRpc, supabaseUploadFile, supabaseDeleteFile, supabaseGetPublicUrl } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { TemperatureLineChart } from "@/components/climate/temperature-line-chart";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  const activeTab = searchParams.get("tab") || "stations";
  const setActiveTab = (tab: string) => {
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };
  const [stations, setStations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  
  const [newStation, setNewStation] = useState({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });
  const [newOrgMember, setNewOrgMember] = useState({ role_id: "", role_title: "", name: "", nip: "", parent_role_id: "", show_role_title: true });

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
    
    // Generate unique role_id if they select 'anggota' to allow multiple members
    let finalRoleId = newOrgMember.role_id;
    if (finalRoleId === "anggota") {
      finalRoleId = `anggota_${Date.now()}`;
    } else {
      // If it's a fixed role (kepala, kasubag, dll), delete the old one first
      await supabaseDelete("organization_structure", `role_id=eq.${finalRoleId}`);
    }

    const result = await supabaseInsert("organization_structure", {
      role_id: finalRoleId,
      role_title: newOrgMember.role_title,
      name: newOrgMember.name,
      nip: newOrgMember.nip,
      parent_role_id: newOrgMember.parent_role_id || null,
      show_role_title: newOrgMember.show_role_title
    });
    if (result) {
      toast.success("Anggota organisasi berhasil disimpan!");
      setNewOrgMember({ role_id: "", role_title: "", name: "", nip: "", parent_role_id: "", show_role_title: true });
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
        <aside className="w-[280px] bg-white border-r border-slate-100 flex-shrink-0 hidden md:flex flex-col h-full sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">dashboard</span>
              </div>
              <div>
                <h1 className="text-xl text-slate-800 font-extrabold tracking-tight">Panel Admin</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">BMKG Jawa Timur</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {[
              { id: 'stations', icon: 'sensors', label: 'Daftar AWS', badge: stations.length },
              { id: 'announcements', icon: 'campaign', label: 'Pengumuman', badge: announcements.length },
              { id: 'climate', icon: 'thermostat', label: 'Warming Stripes' },
              { id: 'org', icon: 'account_tree', label: 'Struktur Organisasi', badge: orgMembers.length },
              { id: 'tempmaps', icon: 'map', label: 'Peta Suhu', badge: tempMaps.length },
            ].map(tab => (
              <a 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 text-primary font-bold shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                {activeTab === tab.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                  <span className="text-[14px]">{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                    {tab.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full z-0 bg-slate-50/50">
          {/* Header */}
          <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-center sticky top-0 z-10 shadow-sm w-full gap-4 md:gap-0">
            <div className="flex justify-between items-center w-full md:w-auto">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                  {activeTab === 'stations' && 'Manajemen AWS'}
                  {activeTab === 'announcements' && 'Kelola Pengumuman'}
                  {activeTab === 'climate' && 'Data Iklim (Warming Stripes)'}
                  {activeTab === 'org' && 'Struktur Organisasi'}
                  {activeTab === 'tempmaps' && 'Peta Perubahan Suhu'}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola data dan konfigurasi sistem</p>
              </div>
              
              {/* Mobile Profile Icon */}
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <span className="material-symbols-outlined text-xl text-slate-600">person</span>
                </div>
              </div>
            </div>

            {/* Desktop Profile Info */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right">
                <p className="text-[14px] font-bold text-slate-800">Admin Utama</p>
                <p className="text-[12px] text-slate-500">Stasiun Klimatologi Jatim</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <span className="material-symbols-outlined text-2xl text-slate-600">person</span>
              </div>
            </div>

            {/* Mobile Tab Navigation (Horizontal Scroll) */}
            <div className="md:hidden flex overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 gap-2">
               {[
                  { id: 'stations', label: 'AWS' },
                  { id: 'announcements', label: 'Pengumuman' },
                  { id: 'climate', label: 'Stripes' },
                  { id: 'org', label: 'Organisasi' },
                  { id: 'tempmaps', label: 'Peta Suhu' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 pb-32">
            
            {activeTab === 'stations' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manage AWS Table Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">sensors</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Daftar Stasiun AWS</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[13px] uppercase tracking-wider">
                          <th className="py-3 px-6 font-semibold">Station ID</th>
                          <th className="py-3 px-6 font-semibold">Location</th>
                          <th className="py-3 px-6 font-semibold">Status</th>
                          <th className="py-3 px-6 font-semibold">Visibility</th>
                          <th className="py-3 px-6 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {stations.map((st, i) => (
                          <tr key={st.id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors group ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/10'}`}>
                            <td className="py-4 px-6 font-semibold text-slate-700">{st.station_id}</td>
                            <td className="py-4 px-6 text-slate-600">
                              <div className="text-xs text-slate-400 mb-1">{st.station_name}</div>
                              <input 
                                type="text"
                                placeholder="Nama Publik..."
                                defaultValue={st.display_name || ""}
                                onBlur={(e) => supabaseUpdate("stations", `id=eq.${st.id}`, { display_name: e.target.value })}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                              />
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.status === 'Online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span> {st.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-4">
                                <label className="flex items-center cursor-pointer group/chk gap-2">
                                  <div className="relative">
                                    <input type="checkbox" checked={st.show_on_home} onChange={() => handleToggleVisibility(st.id, 'show_on_home', st.show_on_home)} className="peer sr-only" />
                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-500 group-hover/chk:text-slate-800 transition-colors">Slider</span>
                                </label>
                                <label className="flex items-center cursor-pointer group/chk gap-2">
                                  <div className="relative">
                                    <input type="checkbox" checked={st.show_on_realtime} onChange={() => handleToggleVisibility(st.id, 'show_on_realtime', st.show_on_realtime)} className="peer sr-only" />
                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-500 group-hover/chk:text-slate-800 transition-colors">Realtime</span>
                                </label>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button onClick={() => handleDeleteStation(st.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 ml-auto focus:opacity-100">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {stations.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada stasiun</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add New Station Form */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Quick Add AWS</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddStation}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Station ID</label>
                      <input required value={newStation.id_sta} onChange={e => setNewStation({...newStation, id_sta: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="e.g. AWS-KJN-04" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lokasi</label>
                      <input required value={newStation.name} onChange={e => setNewStation({...newStation, name: e.target.value, table: `aws_${e.target.value.toLowerCase().replace(/\s+/g, '_')}`})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="e.g. AWS Kepanjen" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Tabel DB (Auto)</label>
                      <input required value={newStation.table} onChange={e => setNewStation({...newStation, table: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-500 bg-slate-50" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Initial Status</label>
                      <select value={newStation.status} onChange={e => setNewStation({...newStation, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option>Online</option>
                        <option>Offline</option>
                        <option>Maintenance</option>
                      </select>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Tambahkan Stasiun
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {activeTab === 'announcements' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Pengumuman */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">campaign</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Buat Pengumuman</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddAnnouncement}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Pengumuman</label>
                      <input required value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Masukkan judul..."/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                      <select value={newAnnouncement.category} onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="info">Informasi Umum</option>
                        <option value="peringatan_dini">Peringatan Dini</option>
                        <option value="kegiatan">Kegiatan BMKG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Prioritas</label>
                      <select value={newAnnouncement.priority} onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="normal">Normal</option>
                        <option value="tinggi">Tinggi (Merah)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Isi Konten</label>
                      <textarea required rows={4} value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 resize-none" placeholder="Tulis isi pengumuman di sini..."/>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">send</span>
                        Publikasikan
                      </button>
                    </div>
                  </form>
                </div>

                {/* Daftar Pengumuman */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Pengumuman Aktif</h3>
                  </div>
                  <div className="space-y-4">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${ann.priority === 'tinggi' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{ann.category}</span>
                            {ann.priority === 'tinggi' && <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">Penting</span>}
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg leading-tight">{ann.title}</h4>
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed">{ann.content}</p>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">campaign</span>
                        <p className="text-sm font-medium">Belum ada pengumuman.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'climate' && (
              <section className="space-y-8">
                {/* 1. Warming Stripes Management */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">thermostat</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Kelola Data CSV Warming Stripes</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Sistem akan otomatis mendeteksi kolom tahun dan wilayah.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('stripes')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        <span>Reset ke Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('stripes')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        <span>Kosongkan</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputStripes")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group"
                    >
                      <input
                        type="file"
                        id="adminCsvInputStripes"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'stripes')}
                      />
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-sm text-slate-500 mt-1">Format .csv dengan Anomali Suhu</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Atau Tempelkan (Paste) Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextStripes}
                        onChange={(e) => setCsvTextStripes(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,-0.338,-0.834&#10;..."
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextStripes, 'stripes')}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-900 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        Proses &amp; Unggah CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">visibility</span> Preview Warming Stripes</h4>
                    <WarmingStripesViewer parsedData={climatePreviewStripes} selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
                  </div>
                </div>

                {/* 2. Annual Temperatures Management */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">timeline</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Kelola Data CSV Suhu Tahunan</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Suhu absolut rata-rata untuk ditampilkan sebagai grafik garis.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('annual')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        <span>Reset ke Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('annual')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        <span>Kosongkan</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputAnnual")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group"
                    >
                      <input
                        type="file"
                        id="adminCsvInputAnnual"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'annual')}
                      />
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-sm text-slate-500 mt-1">Format .csv dengan Suhu Absolut</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Atau Tempelkan (Paste) Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextAnnual}
                        onChange={(e) => setCsvTextAnnual(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,24.41,27.22&#10;..."
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextAnnual, 'annual')}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-900 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        Proses &amp; Unggah CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">monitoring</span> Preview Grafik Suhu</h4>
                    <TemperatureLineChart parsedData={climatePreviewAnnual} selectedRegion={selectedRegion} />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'org' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Anggota */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Input Data Anggota</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddOrgMember}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Posisi / Kategori Visual (Role ID)</label>
                      <select required value={newOrgMember.role_id} onChange={e => setNewOrgMember({...newOrgMember, role_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="">-- Pilih Posisi --</option>
                        <option value="kepala">KEPALA UPT (Biru Tua)</option>
                        <option value="kasubag">KEPALA SUB BAGIAN (Hijau)</option>
                        <option value="tim_1">KETUA TIM KERJA 1 (Oranye)</option>
                        <option value="tim_2">KETUA TIM KERJA 2 (Biru)</option>
                        <option value="tim_3">KETUA TIM KERJA 3 (Nila)</option>
                        <option value="tim_4">KETUA TIM KERJA 4 (Merah Muda)</option>
                        <option value="tim_5">KETUA TIM KERJA 5 (Ungu)</option>
                        <option value="tim_6">KETUA TIM KERJA 6 (Hijau)</option>
                        <option value="fungsional_pmg">FUNGSIONAL PMG (Oranye)</option>
                        <option value="fungsional_non_pmg">FUNGSIONAL NON PMG (Hijau)</option>
                        <option value="anggota">ANGGOTA / STAF BARU</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Di Bawah Siapa (Parent)</label>
                      <select value={newOrgMember.parent_role_id} onChange={e => setNewOrgMember({...newOrgMember, parent_role_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="">-- Posisi Teratas (Tidak ada atasan) --</option>
                        {orgMembers.map(m => (
                          <option key={m.id} value={m.role_id}>{m.name} ({m.role_title})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Jabatan Ditampilkan</label>
                      <input required value={newOrgMember.role_title} onChange={e => setNewOrgMember({...newOrgMember, role_title: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="e.g. KEPALA UPT, ANGGOTA" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Pegawai</label>
                      <input required value={newOrgMember.name} onChange={e => setNewOrgMember({...newOrgMember, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Nama beserta gelar" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">NIP (Opsional)</label>
                      <input value={newOrgMember.nip} onChange={e => setNewOrgMember({...newOrgMember, nip: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="1974..." />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        id="showTitle"
                        checked={newOrgMember.show_role_title}
                        onChange={(e) => setNewOrgMember({...newOrgMember, show_role_title: e.target.checked})}
                        className="w-5 h-5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <label htmlFor="showTitle" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                        Tampilkan Nama Jabatan di Profil
                      </label>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Simpan Anggota
                      </button>
                    </div>
                  </form>
                </div>

                {/* Daftar Anggota */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Anggota Saat Ini</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgMembers.map(m => (
                      <div key={m.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
                        <div className="flex-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {m.role_id.startsWith('anggota') ? 'ANGGOTA' : m.role_id}
                          </span>
                          {m.parent_role_id && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              ↓ {orgMembers.find(o => o.role_id === m.parent_role_id)?.name || m.parent_role_id}
                            </span>
                          )}
                          <h4 className="font-bold text-slate-800 text-sm mt-3 leading-tight">
                            {m.role_title} 
                            {!m.show_role_title && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 rounded uppercase">Hidden</span>}
                          </h4>
                          <p className="text-base text-primary mt-1 font-bold">{m.name}</p>
                          <p className="text-xs text-slate-500 mt-1 font-mono">NIP: {m.nip || "-"}</p>
                        </div>
                        <button onClick={() => handleDeleteOrgMember(m.id)} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    {orgMembers.length === 0 && (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
                        <p className="text-sm font-medium">Belum ada data anggota.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'tempmaps' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Upload/Edit */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">map</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {editTempMapId ? "Edit Peta Suhu" : "Upload Peta Suhu Baru"}
                    </h3>
                  </div>
                  <form onSubmit={editTempMapId ? handleEditTempMap : handleAddTempMap} className="flex flex-col gap-4 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gambar Peta {editTempMapId && "(Opsional)"}</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        required={!editTempMapId}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setNewTempMap({...newTempMap, file});
                        }} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tahun</label>
                      <input 
                        required 
                        type="number" 
                        min="1900" 
                        max="2100"
                        value={newTempMap.year} 
                        onChange={e => setNewTempMap({...newTempMap, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Kejadian</label>
                      <select 
                        required 
                        value={newTempMap.category} 
                        onChange={e => setNewTempMap({...newTempMap, category: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="Normal">Normal</option>
                        <option value="El Niño">El Niño</option>
                        <option value="La Niña">La Niña</option>
                      </select>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button 
                        type="submit" 
                        disabled={isUploadingTempMap}
                        className={`w-full text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isUploadingTempMap ? 'bg-primary/70 cursor-wait' : 'bg-gradient-to-r from-primary to-blue-600 hover:scale-[1.02] active:scale-95'}`}
                      >
                        {isUploadingTempMap ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[20px]">{editTempMapId ? 'save' : 'cloud_upload'}</span>
                            <span>{editTempMapId ? "Simpan Perubahan" : "Simpan Peta"}</span>
                          </>
                        )}
                      </button>
                      {editTempMapId && (
                        <button 
                          type="button" 
                          onClick={cancelEditTempMap}
                          disabled={isUploadingTempMap}
                          className="w-full text-slate-600 py-3 mt-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Daftar Peta */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">photo_library</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Galeri Peta Suhu ({tempMaps.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tempMaps.map(m => (
                      <div key={m.id} className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative">
                        <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden group-hover:brightness-90 transition-all">
                          <img 
                            src={m.image_url} 
                            alt={`Peta Suhu ${m.year} - ${m.category}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                            <span className="bg-white/95 backdrop-blur-md text-slate-800 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">
                              {m.year}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-sm text-white backdrop-blur-md ${m.category === 'El Niño' ? 'bg-red-600/90' : m.category === 'La Niña' ? 'bg-blue-600/90' : 'bg-emerald-600/90'}`}>
                              {m.category}
                            </span>
                          </div>
                          
                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                              onClick={() => startEditTempMap(m)} 
                              className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-lg"
                              title="Edit Peta"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteTempMap(m.id, m.image_url)} 
                              className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-red-600 hover:text-white hover:scale-110 transition-all shadow-lg"
                              title="Hapus Peta"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tempMaps.length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">map</span>
                        <p className="text-sm font-medium">Belum ada data peta suhu.</p>
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

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background text-primary font-bold text-xl"><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat Panel Admin...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
