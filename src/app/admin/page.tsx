"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabaseFetch } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// Tabs
import { StationsTab } from "@/components/admin/tabs/StationsTab";
import { BeritaTab } from "@/components/admin/tabs/BeritaTab";
import { PengumumanTab } from "@/components/admin/tabs/PengumumanTab";
import { InstagramTab } from "@/components/admin/tabs/InstagramTab";
import { OrgTab } from "@/components/admin/tabs/OrgTab";
import { SdmTab } from "@/components/admin/tabs/SdmTab";
import { ClimateTab } from "@/components/admin/tabs/ClimateTab";
import { ObservationTab } from "@/components/admin/tabs/ObservationTab";
import { RainfallTab } from "@/components/admin/tabs/RainfallTab";
import { TempMapsTab } from "@/components/admin/tabs/TempMapsTab";
import { HthTab } from "@/components/admin/tabs/HthTab";
import { IklimPublikasiTab } from "@/components/admin/tabs/IklimPublikasiTab";
import { AdminUsersTab } from "@/components/admin/tabs/AdminUsersTab";
import { ProfileDropdown } from "@/components/admin/ProfileDropdown";
import { AccountSettingsModal } from "@/components/admin/AccountSettingsModal";

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "stations";
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  
  const setActiveTab = (tab: string) => {
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };
  
  // Default all nav groups to open
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>({
    beranda: true,
    profil: false,
    iklim: false,
    publikasi: false,
    admin_control: false
  });
  
  // --- Profile State ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [offlineCount, setOfflineCount] = useState(0);

  // Fetch offline stations count for badge
  useEffect(() => {
    if (!user) return;
    const fetchOffline = async () => {
      try {
        const stations = await supabaseFetch("stations");
        if (stations) {
          const count = stations.filter((s: any) => s.status !== "Online").length;
          setOfflineCount(count);
        }
      } catch (e) {
        // fail silently
      }
    };
    fetchOffline();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchOffline, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);



  const renderContent = () => {
    switch (activeTab) {
      case 'stations': return <StationsTab />;
      case 'berita': return <BeritaTab />;
      case 'pengumuman': return <PengumumanTab />;
      case 'instagram': return <InstagramTab />;
      case 'org': return <OrgTab />;
      case 'sdm': return <SdmTab />;
      case 'climate': return <ClimateTab />;
      case 'observations': return <ObservationTab />;
      case 'rainfall': return <RainfallTab />;
      case 'tempmaps': return <TempMapsTab />;
      case 'hth': return <HthTab />;
      case 'iklim_publikasi': return <IklimPublikasiTab />;
      case 'admin_users': return <AdminUsersTab />;
      default: return <StationsTab />;
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div><p className="text-slate-500 font-medium animate-pulse">Memverifikasi akses...</p></div>;
  if (!user) return null;

  return (
    <div className="h-screen bg-background text-on-surface font-sans flex">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-slate-200 flex-shrink-0 hidden md:flex flex-col h-full sticky top-0 shadow-sm z-20">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-shrink-0">
              <Image src="/logobmkg.png" alt="BMKG Logo" width={38} height={46} className="object-contain drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-[17px] text-slate-800 font-extrabold tracking-tight">Panel Admin</h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">BMKG Jawa Timur</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Beranda Group */}
          <div>
            <button onClick={() => setOpenNavGroups({...openNavGroups, beranda: !openNavGroups.beranda})} className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 hover:text-slate-600 transition-colors">
              <span>Beranda & Umum</span>
              <span className="material-symbols-outlined text-[16px]">{openNavGroups.beranda ? 'expand_less' : 'expand_more'}</span>
            </button>
            <div className={`space-y-1 pl-2 border-l-2 border-slate-100 ml-3 transition-all overflow-hidden ${openNavGroups.beranda ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {[
                { id: 'stations', icon: 'sensors', label: 'Daftar AWS' },
              ].map(tab => (
                <a 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100/50' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-blue-600 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined transition-transform duration-200 text-[18px] ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                    <span className="text-[13px]">{tab.label}</span>
                  </div>
                  {tab.id === 'stations' && offlineCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                      {offlineCount}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {user?.role === "super_admin" && (
          
          <div>
            <button onClick={() => setOpenNavGroups({...openNavGroups, profil: !openNavGroups.profil})} className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 hover:text-slate-600 transition-colors">
              <span>Profil</span>
              <span className="material-symbols-outlined text-[16px]">{openNavGroups.profil ? 'expand_less' : 'expand_more'}</span>
            </button>
            <div className={`space-y-1 pl-2 border-l-2 border-slate-100 ml-3 transition-all overflow-hidden ${openNavGroups.profil ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {[
                { id: 'org', icon: 'account_tree', label: 'Struktur Organisasi' },
                { id: 'sdm', icon: 'groups', label: 'SDM / Pegawai' },
              ].map(tab => (
                <a 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100/50' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-blue-600 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined transition-transform duration-200 text-[18px] ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                    <span className="text-[13px]">{tab.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
          )}

          {user?.role === "super_admin" && (
          
          <div>
            <button onClick={() => setOpenNavGroups({...openNavGroups, admin_control: !openNavGroups.admin_control})} className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 hover:text-slate-600 transition-colors">
              <span>Sistem & Akses</span>
              <span className="material-symbols-outlined text-[16px]">{openNavGroups.admin_control ? "expand_less" : "expand_more"}</span>
            </button>
            <div className={`space-y-1 pl-2 border-l-2 border-slate-100 ml-3 transition-all overflow-hidden ${openNavGroups.admin_control ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}>
              <a 
                  onClick={() => setActiveTab("admin_users")}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative ${activeTab === "admin_users" ? "bg-blue-50 text-blue-700 font-bold border border-blue-100/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent"}`}
                >
                  {activeTab === "admin_users" && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-blue-600 rounded-r-full" />}
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined transition-transform duration-200 text-[18px] ${activeTab === "admin_users" ? "scale-110" : "group-hover:scale-110"}`}>admin_panel_settings</span>
                    <span className="text-[13px]">Kelola Admin Users</span>
                  </div>
                </a>
            </div>
          </div>
          )}

          {/* Iklim Group */}
          <div>
            <button onClick={() => setOpenNavGroups({...openNavGroups, iklim: !openNavGroups.iklim})} className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 hover:text-slate-600 transition-colors">
              <span>Iklim</span>
              <span className="material-symbols-outlined text-[16px]">{openNavGroups.iklim ? 'expand_less' : 'expand_more'}</span>
            </button>
            <div className={`space-y-1 pl-2 border-l-2 border-slate-100 ml-3 transition-all overflow-hidden ${openNavGroups.iklim ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {[
                { id: 'observations', icon: 'fact_check', label: 'Data Pengamatan' },
                { id: 'climate', icon: 'thermostat', label: 'Warming Stripes' },
                { id: 'rainfall', icon: 'rainy', label: 'Prakiraan Hujan' },
                { id: 'tempmaps', icon: 'map', label: 'Peta Suhu' },
                { id: 'hth', icon: 'wb_sunny', label: 'Hari Tanpa Hujan' },
                { id: 'iklim_publikasi', icon: 'menu_book', label: 'Publikasi Iklim' },
              ].map(tab => (
                <a 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100/50' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-blue-600 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined transition-transform duration-200 text-[18px] ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                    <span className="text-[13px]">{tab.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Publikasi Group */}
          <div>
            <button onClick={() => setOpenNavGroups({...openNavGroups, publikasi: !openNavGroups.publikasi})} className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 hover:text-slate-600 transition-colors">
              <span>Publikasi</span>
              <span className="material-symbols-outlined text-[16px]">{openNavGroups.publikasi ? 'expand_less' : 'expand_more'}</span>
            </button>
            <div className={`space-y-1 pl-2 border-l-2 border-slate-100 ml-3 transition-all overflow-hidden ${openNavGroups.publikasi ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {[
                { id: 'berita', icon: 'newspaper', label: 'Berita & Kegiatan' },
                { id: 'pengumuman', icon: 'campaign', label: 'Pengumuman' },
                { id: 'instagram', icon: 'photo_library', label: 'Galeri Instagram' },
              ].map(tab => (
                <a 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100/50' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-blue-600 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined transition-transform duration-200 text-[18px] ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                    <span className="text-[13px]">{tab.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full z-0 bg-[#f8fafc]">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-center sticky top-0 z-30 shadow-sm w-full gap-4 md:gap-0">
          <div className="flex justify-between items-center w-full md:w-auto">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
                { activeTab === 'stations' && 'Manajemen AWS' }
                { activeTab === 'observations' && 'Data Pengamatan (Excel)' }
                { activeTab === 'berita' && 'Kelola Berita & Kegiatan' }
                { activeTab === 'pengumuman' && 'Kelola Pengumuman' }
                { activeTab === 'instagram' && 'Kelola Galeri Instagram' }
                { activeTab === 'climate' && 'Data Iklim (Warming Stripes)' }
                { activeTab === 'org' && 'Struktur Organisasi' }
                { activeTab === 'tempmaps' && 'Peta Perubahan Suhu' }
                { activeTab === 'rainfall' && 'Prakiraan Curah Hujan' }
                { activeTab === 'hth' && 'Update Data HTH' }
                { activeTab === 'iklim_publikasi' && 'Publikasi & Prediksi Iklim' }
                { activeTab === 'sdm' && 'SDM / Profil Pegawai' }
                { activeTab === 'admin_users' && 'Kelola Admin Sistem' }
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola data dan konfigurasi sistem</p>
            </div>
            
            {/* Mobile Profile Icon */}
            <div className="md:hidden flex items-center gap-2 relative">
              <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 cursor-pointer">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 z-50">
                    <ProfileDropdown 
                      user={user!}
                      onLogout={logout}
                      onOpenSettings={() => setIsAccountModalOpen(true)}
                      onClose={() => setIsProfileOpen(false)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search and Profile Info */}
          <div className="flex items-center justify-end w-full md:w-auto gap-4">

            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition-colors text-left"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">{user?.display_name || "Admin"}</p>
                    <p className="text-[11px] text-slate-500 uppercase font-bold mt-0.5">{user?.role === "super_admin" ? "Super Admin" : "Admin"}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">person</span>
                  </div>
                </button>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-2 z-50">
                      <ProfileDropdown 
                        user={user!}
                        onLogout={logout}
                        onOpenSettings={() => setIsAccountModalOpen(true)}
                        onClose={() => setIsProfileOpen(false)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Tab Navigation (Dropdown) */}
          <div className="md:hidden px-4 pb-4 mt-4 w-full">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pilih Menu Admin</label>
            <div className="relative">
              <select 
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <optgroup label="Beranda & Umum">
                  <option value="stations">Daftar AWS</option>
                </optgroup>
                <optgroup label="Iklim">
                  <option value="observations">Data Pengamatan</option>
                  <option value="climate">Warming Stripes</option>
                  <option value="rainfall">Prakiraan Hujan</option>
                  <option value="tempmaps">Peta Suhu</option>
                  <option value="hth">Hari Tanpa Hujan</option>
                </optgroup>
                <optgroup label="Publikasi">
                  <option value="berita">Berita & Kegiatan</option>
                  <option value="pengumuman">Pengumuman</option>
                  <option value="instagram">Galeri Instagram</option>
                </optgroup>
                {user?.role === "super_admin" && (
                <optgroup label="Profil">
                  <option value="org">Struktur Organisasi</option>
                  <option value="sdm">SDM / Pegawai</option>
                </optgroup>
                )}
                {user?.role === "super_admin" && (
                <optgroup label="Sistem & Akses">
                  <option value="admin_users">Kelola Admin Users</option>
                </optgroup>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 pb-32">
          {renderContent()}
        </div>
      </main>

      <AccountSettingsModal
        user={user!}
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onUpdateSuccess={(newToken) => {
          setIsAccountModalOpen(false);
          if (newToken) {
             refreshUser(newToken);
          }
        }}
      />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Memuat Panel Admin...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
