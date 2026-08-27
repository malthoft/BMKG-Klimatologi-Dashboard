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

const OrgBox = ({ member, roleIdFallback, hasChildren = false }: { member?: OrgMember, roleIdFallback: string, hasChildren?: boolean }) => {
  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[140px] relative">
        {hasChildren && <div className="absolute top-0 bottom-0 left-1/2 w-[3px] bg-slate-300 -translate-x-1/2" />}
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

// Komponen rekursif untuk me-render anak buah (side-spine tree layout)
const VerticalStack = ({ parentId, members }: { parentId: string, members: OrgMember[] }) => {
  const children = members
    .filter(m => m.parent_role_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  if (children.length === 0) return null;

  return (
    <div className="w-full relative z-10 pt-[20px]">
      {/* Line dropping from parent center */}
      <div className="absolute top-0 left-1/2 w-[3px] h-[20px] bg-slate-300 -translate-x-1/2" />
      
      {/* Horizontal connector from center to spine */}
      <div className="absolute top-[20px] left-[24px] right-[calc(50%-1px)] h-[3px] bg-slate-300" />
      
      <div className="flex flex-col w-full relative">
        {children.map((child, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === children.length - 1;
          const hasChildren = members.some(m => m.parent_role_id === child.role_id);
          
          return (
            <div key={child.id || child.role_id} className="w-full flex relative py-3">
              {/* Spine segment */}
              <div 
                 className="absolute left-[24px] w-[3px] bg-slate-300"
                 style={{
                    top: 0,
                    bottom: isLast ? '50%' : 0,
                    height: (isFirst && isLast) ? '50%' : undefined
                 }} 
              />
              
              {/* Horizontal connector to box */}
              <div className="absolute left-[24px] top-1/2 w-[20px] h-[3px] bg-slate-300 -translate-y-1/2" />
              
              <div className="flex-1 ml-[44px] mr-[16px] relative z-20">
                <OrgBox member={child} roleIdFallback={child.role_id} hasChildren={hasChildren} />
                <VerticalStack parentId={child.role_id} members={members} />
              </div>
            </div>
          );
        })}
      </div>
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
              <OrgBox member={getMember("kepala")} roleIdFallback="kepala" hasChildren={members.some(m => m.parent_role_id === "kepala")} />
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
                  <OrgBox member={getMember("kasubag")} roleIdFallback="kasubag" hasChildren={members.some(m => m.parent_role_id === "kasubag")} />
                  <VerticalStack parentId="kasubag" members={members} />
              </div>
            </div>

            {/* Connector 2: Horizontal line for Teams */}
            <div className="w-[1480px] h-[3px] bg-slate-300" />

            {/* Row 3: 6 Teams */}
            <div className="w-[1750px] flex justify-between items-stretch mt-0 px-0">
              {["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId) => {
                const hasLeader = !!getMember(roleId);
                const hasChildren = members.some(m => m.parent_role_id === roleId);
                const showTeam = hasLeader || hasChildren;
                return (
                  <div key={roleId} className="w-[270px] flex flex-col items-center relative z-10">
                    {showTeam && <div className="w-[3px] h-[50px] bg-slate-300 shrink-0" />}
                    {!showTeam && <div className="w-[3px] h-[50px] shrink-0 opacity-0" />}
                    
                    <div className="w-full flex flex-col shrink-0">
                      <OrgBox member={getMember(roleId)} roleIdFallback={roleId} hasChildren={hasChildren} />
                    </div>
                    <VerticalStack parentId={roleId} members={members} />
                  </div>
                );
              })}
            </div>

            {/* Row 4: PMG & Non PMG (Floating functional groups) */}
            <div className="w-[1750px] flex relative mt-16 pb-[100px]">
              {/* Box PMG */}
              <div className="absolute left-[487px] top-0 w-[480px] flex flex-col items-center">
                  <OrgBox member={getMember("fungsional_pmg")} roleIdFallback="fungsional_pmg" hasChildren={members.some(m => m.parent_role_id === "fungsional_pmg")} />
                  <VerticalStack parentId="fungsional_pmg" members={members} />
              </div>

              {/* Box Non PMG (under Team 6) */}
              <div className="absolute left-[1455px] top-0 w-[320px] flex flex-col items-center">
                  <OrgBox member={getMember("fungsional_non_pmg")} roleIdFallback="fungsional_non_pmg" hasChildren={members.some(m => m.parent_role_id === "fungsional_non_pmg")} />
                  <VerticalStack parentId="fungsional_non_pmg" members={members} />
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
