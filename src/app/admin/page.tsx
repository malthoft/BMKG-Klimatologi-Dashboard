"use client";

import { useState, useEffect } from "react";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseRpc } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("stations");
  const [stations, setStations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  const [newStation, setNewStation] = useState({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });

  useEffect(() => {
    loadStations();
    loadAnnouncements();
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

  return (
    <div className="h-screen bg-background text-on-surface font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex-shrink-0 hidden md:flex flex-col h-full sticky top-0 shadow-sm">
        <div className="p-6 border-b border-border">
          <h1 className="text-[1.75rem] text-primary font-bold">Panel Admin</h1>
          <p className="text-[14px] text-secondary mt-1">BMKG Malang</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <a className="flex items-center gap-4 px-4 py-2 rounded-lg text-secondary hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-[14px] font-medium">Dashboard</span>
          </a>
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
          <a className="flex items-center gap-4 px-4 py-2 rounded-lg text-secondary hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-[14px] font-medium">Settings</span>
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
              {activeTab === 'stations' ? 'Manage Stations (AWS)' : 'Announcements'}
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
                    <label className="block text-[14px] mb-1">Konten / Deskripsi</label>
                    <textarea required value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm h-24" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[14px] mb-1">Kategori</label>
                      <select value={newAnnouncement.category} onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                        <option value="info">Info</option>
                        <option value="peringatan_dini">Peringatan Dini</option>
                        <option value="kegiatan">Kegiatan</option>
                        <option value="buletin">Buletin</option>
                        <option value="instagram">Instagram</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Prioritas</label>
                      <select value={newAnnouncement.priority} onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[14px] mb-1">Image URL (Optional)</label>
                    <input value={newAnnouncement.image_url} onChange={e => setNewAnnouncement({...newAnnouncement, image_url: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text"/>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" id="featured" checked={newAnnouncement.is_featured} onChange={e => setNewAnnouncement({...newAnnouncement, is_featured: e.target.checked})} />
                    <label htmlFor="featured" className="text-sm">Jadikan Hero / Featured</label>
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full bg-primary-container text-on-primary py-2 rounded-lg font-medium hover:opacity-90">Publikasikan</button>
                  </div>
                </form>
              </div>

              {/* Daftar Pengumuman */}
              <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Daftar Pengumuman</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.map(ann => (
                    <div key={ann.id} className="border border-border rounded-lg p-4 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${ann.priority === 'high' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                          {ann.category}
                        </span>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-error opacity-0 group-hover:opacity-100"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                      <h4 className="font-bold text-on-surface mb-1">{ann.title}</h4>
                      <p className="text-sm text-secondary line-clamp-2">{ann.content}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && <p className="text-secondary col-span-2 text-center py-8">Belum ada pengumuman.</p>}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
