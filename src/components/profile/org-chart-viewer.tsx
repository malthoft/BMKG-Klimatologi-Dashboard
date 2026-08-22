"use client";

import { useEffect, useState, useRef } from "react";
import { supabaseFetch } from "@/lib/supabase";

export interface OrgMember {
  id?: number;
  role_id: string;
  role_title: string;
  name: string;
  nip: string;
  parent_role_id?: string;
  show_role_title?: boolean;
  sort_order?: number;
}

const OrgBox = ({ member, roleIdFallback }: { member?: OrgMember, roleIdFallback: string }) => {
  if (!member) {
    return (
      <div className={`w-full min-h-[140px] rounded-2xl border-[2px] border-slate-200 bg-white flex flex-col items-center justify-center p-4 md:p-6 gap-3 shadow-sm animate-pulse`}>
        <div className="h-6 w-3/4 bg-slate-200 rounded" />
        <div className="h-5 w-full bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
      </div>
    );
  }

  const role = member.role_id || roleIdFallback;
  let borderColor = "border-slate-300";
  let themeText = "text-slate-700";
  let themeBg = "bg-slate-100";

  if (role === "kepala") {
    borderColor = "border-[#1e3a8a]"; themeText = "text-[#1e3a8a]"; themeBg = "bg-[#1e3a8a]/10";
  } else if (role === "kasubag" || role === "tim_6" || role === "fungsional_non_pmg") {
    borderColor = "border-[#15803d]"; themeText = "text-[#15803d]"; themeBg = "bg-[#15803d]/10";
  } else if (role === "tim_1" || role === "fungsional_pmg") {
    borderColor = "border-[#c2410c]"; themeText = "text-[#c2410c]"; themeBg = "bg-[#c2410c]/10";
  } else if (role === "tim_2") {
    borderColor = "border-[#0369a1]"; themeText = "text-[#0369a1]"; themeBg = "bg-[#0369a1]/10";
  } else if (role === "tim_3") {
    borderColor = "border-[#4338ca]"; themeText = "text-[#4338ca]"; themeBg = "bg-[#4338ca]/10";
  } else if (role === "tim_4") {
    borderColor = "border-[#be185d]"; themeText = "text-[#be185d]"; themeBg = "bg-[#be185d]/10";
  } else if (role === "tim_5") {
    borderColor = "border-[#7e22ce]"; themeText = "text-[#7e22ce]"; themeBg = "bg-[#7e22ce]/10";
  } else if (role.startsWith("anggota")) {
    borderColor = "border-[#475569]"; themeText = "text-[#475569]"; themeBg = "bg-[#475569]/10";
  }

  // Fallback to true if undefined
  const showTitle = member.show_role_title !== false;

  return (
    <div className={`w-full bg-[#fdfdfd] rounded-2xl border-[2px] ${borderColor} flex flex-col items-center justify-center text-center p-4 md:p-5 shadow-[5px_5px_0_0_rgba(226,232,240,0.6)] hover:shadow-[5px_5px_0_0_rgba(203,213,225,0.8)] transition-all hover:-translate-y-1`}>
      {showTitle && (
        <div className={`w-full font-black text-[15px] md:text-[18px] leading-snug mb-3 px-3 py-2 rounded-lg ${themeText} ${themeBg}`}>
          {member.role_title}
        </div>
      )}
      <span className="text-slate-800 text-[16px] md:text-[19px] font-bold leading-tight mb-1.5">{member.name || "-"}</span>
      <span className="text-slate-500 text-[13px] md:text-[15px] font-medium">{member.nip ? `NIP: ${member.nip}` : ""}</span>
    </div>
  );
};

// Komponen rekursif untuk me-render anak buah secara vertikal
const VerticalStack = ({ parentId, members, width = "100%" }: { parentId: string, members: OrgMember[], width?: string }) => {
  const children = members
    .filter(m => m.parent_role_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  if (children.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center relative z-10">
      {children.map(child => (
        <div key={child.id || child.role_id} className="w-full flex flex-col items-center">
          <div className="w-[3px] h-[30px] bg-slate-300 shrink-0" />
          <div style={{ width }} className="flex flex-col shrink-0 relative z-20">
            <OrgBox member={child} roleIdFallback={child.role_id} />
          </div>
          <VerticalStack parentId={child.role_id} members={members} width={width} />
        </div>
      ))}
    </div>
  );
};

export function OrgChartViewer() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [wrapperHeight, setWrapperHeight] = useState(1000);
  const [wrapperWidth, setWrapperWidth] = useState(1750);

  useEffect(() => {
    async function fetchOrg() {
      try {
        const data = await supabaseFetch("organization_structure");
        if (data) setMembers(data);
      } catch (err) {
        console.error("Failed to fetch org structure", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, []);

  useEffect(() => {
    if (!outerRef.current || !innerRef.current) return;
    
    const observer = new ResizeObserver(() => {
      if (!outerRef.current || !innerRef.current) return;
      
      const containerWidth = outerRef.current.clientWidth;
      if (containerWidth === 0) return;
      
      const CANVAS_WIDTH = 1750; 
      const isDesktop = window.innerWidth >= 768;
      const padding = isDesktop ? 48 : 16;
      const availableWidth = containerWidth - padding;
      
      let rawScale = availableWidth / CANVAS_WIDTH;
      const newScale = isDesktop ? rawScale : Math.max(rawScale, 0.65);
      
      setScale(newScale);
      
      const innerHeight = innerRef.current.offsetHeight;
      setWrapperHeight(innerHeight * newScale);
      setWrapperWidth(CANVAS_WIDTH * newScale);
    });

    observer.observe(outerRef.current);
    // Use a small delay for innerRef to ensure DOM has settled with recursive children
    setTimeout(() => {
      if (innerRef.current) observer.observe(innerRef.current);
    }, 100);
    
    return () => observer.disconnect();
  }, [loading, members]);

  useEffect(() => {
    if (!outerRef.current || loading) return;
    const timeout = setTimeout(() => {
      if (outerRef.current) {
        const container = outerRef.current;
        if (container.scrollWidth > container.clientWidth) {
          container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        }
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [loading, scale]);

  const getMember = (role_id: string) => members.find(m => m.role_id === role_id);

  // Function to calculate Kasubag container height to prevent overlap
  const kasubagChildren = members.filter(m => m.parent_role_id === "kasubag");
  const hasKasubagChildren = kasubagChildren.length > 0;
  // Estimate height: base 220 + ~170 per child
  const row15Height = Math.max(220, 150 + (kasubagChildren.length * 170));

  if (loading) {
    return <div className="py-20 text-center font-bold text-slate-400 text-lg">Memuat Desain Struktur...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
        <span className="material-symbols-outlined text-4xl mb-2">account_tree</span>
        <p className="text-lg">Data struktur organisasi belum tersedia.</p>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={outerRef} 
        className="w-full overflow-x-auto overflow-y-hidden md:overflow-hidden bg-slate-50/50 rounded-3xl border border-slate-100 p-2 md:p-6 scroll-smooth scrollbar-hide"
      >
        <div 
          className="relative mx-auto transition-all duration-300" 
          style={{ height: wrapperHeight, width: wrapperWidth }}
        >
          <div 
            ref={innerRef}
            className="absolute top-0 left-0 origin-top-left flex flex-col items-center pb-12"
            style={{ 
              width: 1750,
              transform: `scale(${scale})`,
            }}
          >
            {/* Row 1: Kepala */}
            <div className="w-[480px] relative z-10 pt-4 flex flex-col items-center">
              <OrgBox member={getMember("kepala")} roleIdFallback="kepala" />
              <VerticalStack parentId="kepala" members={members} />
            </div>

            {/* Connector 1: Down from Kepala */}
            <div className="w-[3px] h-[50px] bg-slate-300" />

            {/* Row 1.5: Horizontal branch & Kasubag */}
            <div className="w-full flex justify-center relative" style={{ height: row15Height }}>
              <div className="w-[3px] h-full bg-slate-300" />
              <div className="absolute top-0 left-1/2 w-[525px] h-[3px] bg-slate-300" />
              <div className="absolute top-0 left-[calc(50%+525px)] w-[3px] h-[50px] bg-slate-300" />
              <div className="absolute top-[50px] left-[calc(50%+325px)] w-[400px] z-10 flex flex-col items-center">
                  <OrgBox member={getMember("kasubag")} roleIdFallback="kasubag" />
                  <VerticalStack parentId="kasubag" members={members} width="90%" />
              </div>
            </div>

            {/* Connector 2: Horizontal line for Teams */}
            <div className="w-[1480px] h-[3px] bg-slate-300" />

            {/* Row 3: 6 Teams */}
            <div className="w-[1750px] flex justify-between items-stretch mt-0 px-0">
              {["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId) => (
                <div key={roleId} className="w-[270px] flex flex-col items-center relative z-10">
                  <div className="w-[3px] h-[50px] bg-slate-300 shrink-0" />
                  <div className="w-full flex flex-col shrink-0">
                    <OrgBox member={getMember(roleId)} roleIdFallback={roleId} />
                  </div>
                  <VerticalStack parentId={roleId} members={members} width="90%" />
                  {/* Flexible line to stretch to bottom if column is shorter */}
                  <div className="w-[3px] flex-1 min-h-[1px] bg-slate-300" />
                </div>
              ))}
            </div>

            {/* Row 3.5: Down connectors from Teams */}
            <div className="w-[1750px] flex justify-between relative mt-0">
              {/* Horizontal line for PMG under Teams 1-5 */}
              <div className="absolute left-[135px] bottom-0 w-[1184px] h-[3px] bg-slate-300" />
              {["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId, idx) => (
                <div key={roleId} className="w-[270px] flex flex-col items-center">
                  <div className="w-[3px] h-[60px] bg-slate-300" style={{ height: idx < 5 ? 60 : 110 }} />
                </div>
              ))}
            </div>

            {/* Row 4: PMG & Non PMG */}
            <div className="w-[1750px] flex relative mt-0 pb-[150px]">
              {/* Vertical down to PMG (from Team 3 center: 727) */}
              <div className="absolute left-[727px] top-0 w-[3px] h-[50px] bg-slate-300" />

              {/* Box PMG */}
              <div className="absolute left-[487px] top-[50px] w-[480px] flex flex-col items-center">
                  <OrgBox member={getMember("fungsional_pmg")} roleIdFallback="fungsional_pmg" />
                  <VerticalStack parentId="fungsional_pmg" members={members} width="90%" />
              </div>

              {/* Box Non PMG (under Team 6) */}
              <div className="absolute left-[1455px] top-[50px] w-[320px] flex flex-col items-center">
                  <OrgBox member={getMember("fungsional_non_pmg")} roleIdFallback="fungsional_non_pmg" />
                  <VerticalStack parentId="fungsional_non_pmg" members={members} width="90%" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Swipe Indicator (Khusus Mobile) */}
      <div className="flex justify-center items-center gap-2 text-slate-500 mt-4 mb-2 md:hidden animate-pulse">
        <span className="material-symbols-outlined text-sm">swipe</span>
        <span className="text-xs font-medium">Geser layar untuk melihat seluruh struktur</span>
      </div>
    </>
  );
}
