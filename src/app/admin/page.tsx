"use client";

import { useState, useEffect } from "react";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseRpc } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("stations");
  const [stations, setStations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  
  const [newStation, setNewStation] = useState({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });
  const [newOrgMember, setNewOrgMember] = useState({ role_id: "", role_title: "", name: "", nip: "" });

  // --- Climate CSV Admin States ---
  const [csvText, setCsvText] = useState("");
  const [climatePreview, setClimatePreview] = useState<ClimateParsedResult | null>(null);
  const [csvMessage, setCsvMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadStations();
    loadAnnouncements();
    loadClimateData();
    loadOrgMembers();
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

  const loadClimateData = async () => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("climate_csv_data") : null;
      if (stored) {
        setCsvText(stored);
        const parsed = parseCSVText(stored);
        setClimatePreview(parsed);
        return;
      }
      // Fallback
      const res = await fetch("/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv");
      if (res.ok) {
        const text = await res.text();
        setCsvText(text);
        const parsed = parseCSVText(text);
        setClimatePreview(parsed);
      }
    } catch (e) {
      console.error("Gagal memuat data iklim di admin", e);
    }
  };

  const handleFileUpload = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCsvText(text);
        processCSV(text);
      }
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  const processCSV = (textToProcess: string) => {
    setCsvMessage(null);
    try {
      const parsed = parseCSVText(textToProcess);
      setClimatePreview(parsed);
      if (typeof window !== "undefined") {
        localStorage.setItem("climate_csv_data", textToProcess);
      }
      setCsvMessage({
        type: "success",
        text: `Berhasil memproses dan mempublikasikan data! Terdeteksi ${Object.keys(parsed.regionsData).length} lokasi/kabupaten periode ${parsed.years[0]} - ${parsed.years[parsed.years.length - 1]}.`,
      });
    } catch (err: any) {
      setCsvMessage({
        type: "error",
        text: err.message || "Gagal memproses file CSV.",
      });
    }
  };

  const handleClearCSV = () => {
    if (confirm("Apakah Anda yakin ingin mengosongkan semua data CSV iklim?")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("climate_csv_data");
      }
      setCsvText("");
      setClimatePreview(null);
      setCsvMessage({
        type: "success",
        text: "Data CSV iklim berhasil dikosongkan.",
      });
    }
  };

  const handleResetDefaultCSV = async () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan data ke dataset default (38 Kabupaten/Kota)?")) {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("climate_csv_data");
        }
        const res = await fetch("/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv");
        if (res.ok) {
          const text = await res.text();
          setCsvText(text);
          const parsed = parseCSVText(text);
          setClimatePreview(parsed);
          setCsvMessage({
            type: "success",
            text: "Data iklim berhasil dikembalikan ke dataset sampel 38 Kabupaten/Kota bawaan.",
          });
        }
      } catch (e) {
        alert("Gagal mereset CSV default.");
      }
    }
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
      alert("Stasiun dan tabel berhasil ditambahkan!");
      setNewStation({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
      loadStations();
    } else {
      alert("Gagal menambahkan stasiun. Pastikan tabel 'stations' sudah ada di database Supabase Anda.");
    }
  };

  const handleDeleteStation = async (id: number) => {
    if(confirm("Yakin ingin menghapus stasiun ini?")) {
      await supabaseDelete("stations", `id=eq.${id}`);
      loadStations();
    }
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
      alert("Pengumuman berhasil dipublikasikan!");
      setNewAnnouncement({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });
      loadAnnouncements();
    } else {
      alert("Gagal mempublikasikan. Pastikan tabel 'announcements' sudah ada di database Supabase Anda.");
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if(confirm("Yakin ingin menghapus pengumuman ini?")) {
      await supabaseDelete("announcements", `id=eq.${id}`);
      loadAnnouncements();
    }
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
      alert("Anggota organisasi berhasil disimpan!");
      setNewOrgMember({ role_id: "", role_title: "", name: "", nip: "" });
      loadOrgMembers();
    }
  };

  const handleDeleteOrgMember = async (id: number) => {
    if(confirm("Yakin ingin menghapus anggota ini?")) {
      await supabaseDelete("organization_structure", `id=eq.${id}`);
      loadOrgMembers();
    }
  };

  return (
    <div className="h-screen bg-background text-on-surface font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex-shrink-0 hidden md:flex flex-col h-full sticky top-0 shadow-sm">
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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
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
        <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
          
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
              {/* CSV Upload & Management Panel */}
              <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <h3 className="text-[1.75rem] font-semibold text-on-surface">Kelola Data CSV Warming Stripes</h3>
                    <p className="text-sm text-secondary mt-1">
                      Unggah berkas CSV baru atau masukan teks CSV. Sistem akan otomatis mendeteksi kolom tahun dan wilayah, kemudian mempublikasikan ke halaman Perubahan Iklim publik.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetDefaultCSV}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-surface-container-low text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-primary">restart_alt</span>
                      <span>Reset ke Data Default (38 Kabupaten)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCSV}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">delete_sweep</span>
                      <span>Kosongkan Data</span>
                    </button>
                  </div>
                </div>

                {/* File Dropzone & Text Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File Dropzone */}
                  <div
                    onClick={() => document.getElementById("adminCsvInput")?.click()}
                    className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3"
                  >
                    <input
                      type="file"
                      id="adminCsvInput"
                      accept=".csv"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary text-base">Klik untuk Memilih Berkas CSV</h4>
                      <p className="text-xs text-text-secondary mt-1">Format .csv dengan kolom Waktu (Tahun) dan Kolom Wilayah</p>
                    </div>
                  </div>

                  {/* Manual CSV Textarea */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Atau Tempelkan (Paste) Teks Raw CSV:
                    </label>
                    <textarea
                      rows={5}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,-0.338,-0.834&#10;..."
                      className="w-full border border-border rounded-xl p-3 text-xs font-mono bg-white focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => processCSV(csvText)}
                      className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <span className="material-symbols-outlined text-base">publish</span>
                      Proses &amp; Publikasikan Data CSV
                    </button>
                  </div>
                </div>

                {/* Status Message Alert */}
                {csvMessage && (
                  <div
                    className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                      csvMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {csvMessage.type === "success" ? "check_circle" : "error"}
                    </span>
                    <span>{csvMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Live Preview Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">preview</span>
                  <h3 className="text-[1.5rem] font-bold text-text-primary">Live Preview Tampilan Publik</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Berikut adalah pratinjau langsung (*live preview*) dari grafik Warming Stripes dan kartu statistik yang akan dilihat oleh masyarakat umum pada halaman <code>/perubahan-iklim</code>.
                </p>

                <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
                  <WarmingStripesViewer parsedData={climatePreview} />
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

        </div>
      </main>
    </div>
  );
}
