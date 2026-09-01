const fs = require('fs');
const code = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');
const lines = code.split('\n');

const dashboardContentIndex = lines.findIndex(l => l.includes('Dashboard Content'));

let newHeader = `
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabaseFetch } from "@/lib/supabase";

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
`;

let newBody = `
function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "stations";
  
  const setActiveTab = (tab: string) => {
    router.replace(\`/admin?tab=\${tab}\`, { scroll: false });
  };
  
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>({ iklim: true, profil: true });
  
  // --- Search State ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{id: string|number, type: string, label: string, title: string, tab: string}[]>([]);

  // Search logic aggregation
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const [berita, pengumuman, stations, org] = await Promise.all([
          supabaseFetch("berita", "order=created_at.desc"),
          supabaseFetch("pengumuman", "order=created_at.desc"),
          supabaseFetch("stations", "order=station_name.asc"),
          supabaseFetch("org_members", "order=name.asc")
        ]);
        
        const term = searchTerm.toLowerCase();
        const results: any[] = [];
        
        berita?.forEach((b: any) => {
          if (b.judul?.toLowerCase().includes(term) || b.deskripsi?.toLowerCase().includes(term)) {
            results.push({ id: b.id, type: 'berita', label: 'Berita & Kegiatan', title: b.judul, tab: 'berita' });
          }
        });
        pengumuman?.forEach((p: any) => {
          if (p.judul?.toLowerCase().includes(term) || p.deskripsi?.toLowerCase().includes(term)) {
            results.push({ id: p.id, type: 'pengumuman', label: 'Pengumuman', title: p.judul, tab: 'pengumuman' });
          }
        });
        stations?.forEach((s: any) => {
          if (s.station_id?.toLowerCase().includes(term) || s.station_name?.toLowerCase().includes(term)) {
            results.push({ id: s.id, type: 'station', label: 'Stasiun AWS', title: \`\${s.station_name} (\${s.station_id})\`, tab: 'stations' });
          }
        });
        org?.forEach((o: any) => {
          if (o.name?.toLowerCase().includes(term) || o.role_title?.toLowerCase().includes(term)) {
            results.push({ id: o.id || o.role_id, type: 'org', label: 'Pegawai / Org', title: \`\${o.name || '-'} - \${o.role_title || '-'}\`, tab: 'org' });
          }
        });
        
        setSearchResults(results.slice(0, 15));
      } catch (err) {
        console.error(err);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

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
      default: return <StationsTab />;
    }
  };
`;

let originalHtml = lines.slice(lines.findIndex(l => l.includes('return (')), dashboardContentIndex + 1).join('\n');
originalHtml = originalHtml.replace(/, badge: stations\.length/g, '');
originalHtml = originalHtml.replace(/, badge: orgMembers\.length/g, '');
originalHtml = originalHtml.replace(/, badge: rainfallForecasts\.length/g, '');
originalHtml = originalHtml.replace(/, badge: tempMaps\.length/g, '');
originalHtml = originalHtml.replace(/, badge: beritaKegiatan\.length/g, '');
originalHtml = originalHtml.replace(/, badge: pengumuman\.length/g, '');
originalHtml = originalHtml.replace(/, badge: instagramPosts\.length/g, '');

let newHtmlTail = `
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Memuat Panel Admin...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
`;

const finalFile = newHeader + '\n' + newBody + '\n' + originalHtml + '\n' + newHtmlTail;
fs.writeFileSync('src/app/admin/page.tsx', finalFile);
console.log('Successfully rewrote admin/page.tsx');
