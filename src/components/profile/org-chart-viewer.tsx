"use client";

import { useEffect, useState, useRef } from "react";
import { supabaseFetch } from "@/lib/supabase";

export interface OrgMember {
  id?: number;
  role_id: string;
  role_title: string;
  name: string;
  nip: string;
}

const OrgBox = ({ member, roleIdFallback }: { member?: OrgMember, roleIdFallback: string }) => {
  if (!member) {
    return (
      <div className={`w-full h-full min-h-[140px] rounded-2xl border-[2px] border-slate-200 bg-white flex flex-col items-center justify-center p-4 md:p-6 gap-3 shadow-sm animate-pulse`}>
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
  }

  return (
    <div className={`w-full h-full bg-[#fdfdfd] rounded-2xl border-[2px] ${borderColor} flex flex-col items-center justify-center text-center p-4 md:p-5 shadow-[5px_5px_0_0_rgba(226,232,240,0.6)] hover:shadow-[5px_5px_0_0_rgba(203,213,225,0.8)] transition-all hover:-translate-y-1`}>
      <div className={`w-full font-black text-[15px] md:text-[18px] leading-snug mb-3 px-3 py-2 rounded-lg ${themeText} ${themeBg}`}>
        {member.role_title}
      </div>
      <span className="text-slate-800 text-[16px] md:text-[19px] font-bold leading-tight mb-1.5">{member.name || "-"}</span>
      <span className="text-slate-500 text-[13px] md:text-[15px] font-medium">{member.nip ? `NIP: ${member.nip}` : ""}</span>
    </div>
  );
};

const MobileOrgChart = ({ members, getMember }: { members: OrgMember[], getMember: (id: string) => OrgMember | undefined }) => {
  return (
    <div className="w-full flex flex-col md:hidden py-5 px-3 bg-slate-50/50 rounded-3xl border border-slate-100">
      <div className="flex justify-center w-full relative z-10 mb-2">
        <div className="w-[98%] max-w-[400px]">
          <OrgBox member={getMember("kepala")} roleIdFallback="kepala" />
        </div>
      </div>
      
      <div className="relative w-full pt-6 z-0">
        <div className="absolute left-1/2 top-0 w-[3px] h-[16px] bg-slate-300 -ml-[1.5px]" />
        <div className="absolute right-1/2 top-[16px] w-[calc(50%-20px)] h-[3px] bg-slate-300" />
        <div className="absolute left-[20px] top-[16px] bottom-[60px] w-[3px] bg-slate-300" />

        {[
          "kasubag",
          "tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6",
          "fungsional_pmg", "fungsional_non_pmg"
        ].map((role) => (
          <div key={role} className="w-full flex justify-end relative mb-5">
            <div className="absolute left-[20px] top-1/2 w-[24px] h-[3px] bg-slate-300 -mt-[1.5px]" />
            <div className="w-[calc(100%-44px)]">
              <OrgBox member={getMember(role)} roleIdFallback={role} />
            </div>
          </div>
        ))}
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
      if (outerRef.current.clientWidth === 0) return; // Hidden on mobile
      
      const containerWidth = outerRef.current.clientWidth;
      
      // Ukuran 1750px untuk memberikan ukuran box raksasa dan jarak rapat
      const CANVAS_WIDTH = 1750; 
      
      const newScale = containerWidth / CANVAS_WIDTH;
      // Jangan paksa maksimum 1, karena scale up di layar sangat besar akan menguntungkan font size
      setScale(newScale);
      
      const innerHeight = innerRef.current.offsetHeight;
      setWrapperHeight(innerHeight * newScale);
    });

    observer.observe(outerRef.current);
    observer.observe(innerRef.current);
    
    return () => observer.disconnect();
  }, [loading, members]);

  const getMember = (role_id: string) => members.find(m => m.role_id === role_id);

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
      {/* Mobile Vertical Tree View (md:hidden) */}
      <MobileOrgChart members={members} getMember={getMember} />

      {/* Desktop Horizontal Canvas View */}
      <div className="hidden md:block w-full overflow-hidden bg-slate-50/50 rounded-3xl border border-slate-100 p-6" ref={outerRef}>
        <div className="relative w-full mx-auto transition-all duration-300" style={{ height: wrapperHeight }}>
          <div 
            ref={innerRef}
            className="absolute top-0 left-1/2 origin-top-left flex flex-col items-center pb-12"
            style={{ 
              width: 1750,
              transform: `scale(${scale}) translateX(-50%)`,
            }}
          >
            {/* Row 1: Kepala */}
            <div className="w-[480px] relative z-10 pt-4">
              <OrgBox member={getMember("kepala")} roleIdFallback="kepala" />
            </div>

            {/* Connector 1: Down from Kepala */}
            <div className="w-[3px] h-[50px] bg-slate-300" />

            {/* Row 1.5: Horizontal branch & Kasubag */}
            <div className="w-full flex justify-center relative">
              <div className="w-[3px] h-[220px] bg-slate-300" />
              <div className="absolute top-0 left-1/2 w-[525px] h-[3px] bg-slate-300" />
              <div className="absolute top-0 left-[calc(50%+525px)] w-[3px] h-[50px] bg-slate-300" />
              <div className="absolute top-[50px] left-[calc(50%+325px)] w-[400px] z-10">
                  <OrgBox member={getMember("kasubag")} roleIdFallback="kasubag" />
              </div>
            </div>

            {/* Connector 2: Horizontal line for Teams */}
            {/* 1615 - 135 = 1480 */}
            <div className="w-[1480px] h-[3px] bg-slate-300" />

            {/* Row 3: 6 Teams */}
            <div className="w-[1750px] flex justify-between items-stretch mt-0 px-0">
              {["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId) => (
                <div key={roleId} className="w-[270px] flex flex-col items-center">
                  <div className="w-[3px] h-[50px] bg-slate-300 shrink-0" />
                  <div className="w-full flex-1 flex flex-col">
                    <OrgBox member={getMember(roleId)} roleIdFallback={roleId} />
                  </div>
                </div>
              ))}
            </div>

            {/* Row 3.5: Down connectors from Teams */}
            <div className="w-[1750px] flex justify-between relative mt-0">
              {/* Horizontal line for PMG under Teams 1-5 */}
              {/* Left: 135 (Center Tim 1), Width: 1184 (Center Tim 5 is 1319) */}
              <div className="absolute left-[135px] bottom-0 w-[1184px] h-[3px] bg-slate-300" />
              {["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId, idx) => (
                <div key={roleId} className="w-[270px] flex flex-col items-center">
                  <div className="w-[3px] h={idx < 5 ? '[60px]' : '[110px]'} bg-slate-300" style={{ height: idx < 5 ? 60 : 110 }} />
                </div>
              ))}
            </div>

            {/* Row 4: PMG & Non PMG */}
            <div className="w-[1750px] relative h-[140px] mt-0">
              {/* Vertical down to PMG (from Team 3 center: 135 + 2*(270+26) = 135 + 592 = 727) */}
              <div className="absolute left-[727px] top-0 w-[3px] h-[50px] bg-slate-300" />

              {/* Box PMG (Center at 727. Width 480. Left = 727 - 240 = 487) */}
              <div className="absolute left-[487px] top-[50px] w-[480px]">
                  <OrgBox member={getMember("fungsional_pmg")} roleIdFallback="fungsional_pmg" />
              </div>

              {/* Box Non PMG (under Team 6: center is 1615. Width 320. Left = 1615 - 160 = 1455) */}
              <div className="absolute left-[1455px] top-[50px] w-[320px]">
                  <OrgBox member={getMember("fungsional_non_pmg")} roleIdFallback="fungsional_non_pmg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
