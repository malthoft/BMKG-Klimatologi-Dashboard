"use client";

import { useEffect, useState, useRef, useMemo, useLayoutEffect, useCallback } from "react";
import { supabaseFetch } from "@/lib/supabase";
import { OrgMember, OrgPosition } from "@/types/admin";
import { fetchOrgPositions } from "@/lib/org-positions";

// Node Card Component matching BMKG Official Design
interface OrgCardProps {
  member: OrgMember;
  position?: OrgPosition;
  isKasubagGroup?: boolean;
  className?: string;
}

const OrgCard = ({ member, position, isKasubagGroup = false, className = "" }: OrgCardProps) => {
  const defaultColor = isKasubagGroup ? "#15803d" : (position?.color || "#1e3a8a");
  const color = position?.color || defaultColor;
  const showTitle = member.show_role_title !== false;

  return (
    <div
      className={`bg-white rounded-2xl border-[2px] text-center flex flex-col items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 w-[220px] sm:w-[240px] md:w-[250px] shrink-0 relative z-20 group overflow-hidden ${className}`}
      style={{ borderColor: color }}
    >
      {/* Title Header Badge with Solid Fill */}
      {showTitle && (
        <div
          className="w-full font-black text-[10px] sm:text-[11px] md:text-xs tracking-wider uppercase px-2.5 py-2 text-white line-clamp-2 leading-tight"
          style={{ backgroundColor: color }}
        >
          {member.role_title || position?.position_name || member.role_id}
        </div>
      )}

      {/* Person Name & NIP Container */}
      <div className="p-2.5 sm:p-3 md:p-3.5 w-full flex flex-col items-center justify-center">
        <h3 className="text-slate-900 text-[11px] sm:text-xs md:text-sm font-black uppercase leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
          {member.name || "-"}
        </h3>

        {member.nip && (
          <span className="text-[9px] sm:text-[10px] md:text-[11px] font-mono font-bold text-slate-500">
            NIP : {member.nip}
          </span>
        )}
      </div>
    </div>
  );
};

// Recursive subordinate stack for levels below teams (PMG, Non-PMG, Staf)
const SubordinateTree = ({ parentId, allMembers, positionMap }: { parentId: string; allMembers: OrgMember[]; positionMap: Map<string, OrgPosition> }) => {
  const children = allMembers
    .filter(m => m.parent_role_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (children.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full pt-0">
      {/* Stem down from parent */}
      <div className="w-[2px] h-6 bg-slate-500 shrink-0" />

      {/* Children row */}
      <div className="flex items-start justify-center">
        {children.map((child, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === children.length - 1;
          const isOnly = children.length === 1;

          return (
            <div key={child.id || child.role_id} className="relative flex flex-col items-center px-2">
              {!isOnly && (
                <div
                  className="absolute top-0 h-[2px] bg-slate-500"
                  style={{
                    left: isFirst ? "50%" : "0%",
                    right: isLast ? "50%" : "0%",
                  }}
                />
              )}
              <div className="w-[2px] h-6 bg-slate-500 shrink-0" />
              <OrgCard member={child} position={positionMap.get(child.role_id)} />
              <SubordinateTree parentId={child.role_id} allMembers={allMembers} positionMap={positionMap} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function OrgChartViewer() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [loading, setLoading] = useState(true);

  // Zoom & Pan controls
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  // DOM Refs for dynamic SVG path calculations
  const kepalaRef = useRef<HTMLDivElement>(null);
  const kasubagRef = useRef<HTMLDivElement>(null);
  const directTeamRefs = useRef<(HTMLDivElement | null)[]>([]);
  const kasubagTeamRefs = useRef<(HTMLDivElement | null)[]>([]);

  // SVG connector lines path string
  const [svgPathData, setSvgPathData] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const [orgData, posData] = await Promise.all([
          supabaseFetch("organization_structure"),
          fetchOrgPositions()
        ]);
        if (orgData && Array.isArray(orgData)) {
          setMembers(orgData);
        }
        if (posData && Array.isArray(posData)) {
          setPositions(posData);
        }
      } catch (err) {
        console.error("Gagal memuat struktur organisasi:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const positionMap = useMemo(() => {
    const map = new Map<string, OrgPosition>();
    positions.forEach(p => map.set(p.position_id, p));
    return map;
  }, [positions]);

  // =========================================================================
  // FILTER VISIBLE MEMBERS & POSITIONS
  // =========================================================================
  const visibleMembers = useMemo(() => {
    const visibleList = members.filter(m => {
      const isMemberVisible = m.is_visible !== false;
      const isPosVisible = positionMap.get(m.role_id)?.is_visible !== false;
      return isMemberVisible && isPosVisible;
    });

    const visibleSet = new Set(visibleList.map(m => m.role_id));
    const allMembersMap = new Map<string, OrgMember>();
    members.forEach(m => allMembersMap.set(m.role_id, m));

    // Resolve nearest visible ancestor if immediate parent is hidden
    const getNearestVisibleParent = (parentId: string | null | undefined): string | null => {
      if (!parentId) return null;
      if (visibleSet.has(parentId)) return parentId;
      const ancestor = allMembersMap.get(parentId);
      if (!ancestor) return null;
      return getNearestVisibleParent(ancestor.parent_role_id);
    };

    return visibleList.map(m => ({
      ...m,
      parent_role_id: getNearestVisibleParent(m.parent_role_id)
    }));
  }, [members, positionMap]);

  // =========================================================================
  // BMKG HYBRID TREE STRUCTURE CALCULATION
  // =========================================================================
  const { rootNode, kasubagNode, directTeams, kasubagTeams, hasKasubagBranch } = useMemo(() => {
    const memberRoleIds = new Set(visibleMembers.map(m => m.role_id));
    
    // 1. Root (Kepala UPT)
    const root = visibleMembers.find(m => !m.parent_role_id || !memberRoleIds.has(m.parent_role_id)) || visibleMembers[0];
    
    if (!root) {
      return { rootNode: null, kasubagNode: null, directTeams: [], kasubagTeams: [], hasKasubagBranch: false };
    }

    // 2. Kasubag Node (Level 2 side-branch reporting to root)
    const kasubag = visibleMembers.find(m => 
      m.parent_role_id === root.role_id && 
      (m.role_id === "kasubag" || m.role_id.includes("kasubag") || positionMap.get(m.role_id)?.hierarchy_level === 2)
    );

    // 3. Teams reporting directly to root (excluding Kasubag)
    const direct = visibleMembers
      .filter(m => m.parent_role_id === root.role_id && m.id !== kasubag?.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // 4. Teams reporting to Kasubag (e.g. tim_1 / Ketua Tim TU)
    const fromKasubag = kasubag
      ? visibleMembers
          .filter(m => m.parent_role_id === kasubag.role_id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      : [];

    const isHybrid = !!kasubag;

    return {
      rootNode: root,
      kasubagNode: kasubag || null,
      directTeams: direct,
      kasubagTeams: fromKasubag,
      hasKasubagBranch: isHybrid
    };
  }, [visibleMembers, positionMap]);

  // Helper to calculate element coordinates relative to chartWrapperRef
  const getRelativeBounds = useCallback((el: HTMLElement, parent: HTMLElement) => {
    let x = 0;
    let y = 0;
    let curr: HTMLElement | null = el;
    while (curr && curr !== parent) {
      x += curr.offsetLeft;
      y += curr.offsetTop;
      curr = curr.offsetParent as HTMLElement;
    }
    return {
      xCenter: Math.round(x + el.offsetWidth / 2),
      yTop: Math.round(y),
      yBottom: Math.round(y + el.offsetHeight)
    };
  }, []);

  // Update SVG connector lines whenever layout settles
  const updateConnectorPaths = useCallback(() => {
    if (!chartWrapperRef.current || !kepalaRef.current) return;
    const parent = chartWrapperRef.current;

    const kBounds = getRelativeBounds(kepalaRef.current, parent);
    const kasBounds = kasubagRef.current ? getRelativeBounds(kasubagRef.current, parent) : null;

    const teamBounds = directTeamRefs.current
      .filter((el): el is HTMLDivElement => !!el)
      .map(el => getRelativeBounds(el, parent));

    const kTeamBounds = kasubagTeamRefs.current
      .filter((el): el is HTMLDivElement => !!el)
      .map(el => getRelativeBounds(el, parent));

    let path = "";

    if (kasBounds) {
      // 1. Trunk from Kepala
      // Branch Y level is halfway between Kepala bottom and Kasubag top
      const yBranch = Math.round(kBounds.yBottom + (kasBounds.yTop - kBounds.yBottom) / 2);
      
      // Crossbar Y level is halfway between Kasubag bottom and Direct Teams top
      const teamTop = teamBounds.length > 0 ? teamBounds[0].yTop : (kasBounds.yBottom + 50);
      const yCrossbar = Math.round(kasBounds.yBottom + (teamTop - kasBounds.yBottom) / 2);

      // Line from Kepala down to crossbar
      path += `M ${kBounds.xCenter} ${kBounds.yBottom} V ${yCrossbar} `;

      // Line from Trunk branching right to Kasubag:
      // Starts at (xK, yBranch), goes horizontally to (xKas, yBranch), then down into Kasubag top
      path += `M ${kBounds.xCenter} ${yBranch} H ${kasBounds.xCenter} V ${kasBounds.yTop} `;

      // 2. Direct Teams Horizontal Crossbar & Drops
      if (teamBounds.length > 0) {
        const minX = Math.min(...teamBounds.map(t => t.xCenter));
        const maxX = Math.max(...teamBounds.map(t => t.xCenter));
        const crossbarLeft = Math.min(minX, kBounds.xCenter);
        const crossbarRight = Math.max(maxX, kBounds.xCenter);

        // Horizontal crossbar across all direct teams
        path += `M ${crossbarLeft} ${yCrossbar} H ${crossbarRight} `;

        // Vertical drop into each direct team
        teamBounds.forEach(t => {
          path += `M ${t.xCenter} ${yCrossbar} V ${t.yTop} `;
        });
      }

      // 3. Kasubag down to Kasubag Teams (e.g. Team TU)
      if (kTeamBounds.length === 1) {
        // Direct single drop straight from Kasubag bottom to Team TU top
        path += `M ${kasBounds.xCenter} ${kasBounds.yBottom} V ${kTeamBounds[0].yTop} `;
      } else if (kTeamBounds.length > 1) {
        // Multiple teams under Kasubag
        const minKX = Math.min(...kTeamBounds.map(t => t.xCenter));
        const maxKX = Math.max(...kTeamBounds.map(t => t.xCenter));
        path += `M ${kasBounds.xCenter} ${kasBounds.yBottom} V ${yCrossbar} `;
        path += `M ${minKX} ${yCrossbar} H ${maxKX} `;
        kTeamBounds.forEach(kt => {
          path += `M ${kt.xCenter} ${yCrossbar} V ${kt.yTop} `;
        });
      }
    } else {
      // Standard tree without Kasubag
      if (teamBounds.length > 0) {
        const yCrossbar = Math.round(kBounds.yBottom + (teamBounds[0].yTop - kBounds.yBottom) / 2);
        const minX = Math.min(...teamBounds.map(t => t.xCenter));
        const maxX = Math.max(...teamBounds.map(t => t.xCenter));

        path += `M ${kBounds.xCenter} ${kBounds.yBottom} V ${yCrossbar} `;
        path += `M ${Math.min(minX, kBounds.xCenter)} ${yCrossbar} H ${Math.max(maxX, kBounds.xCenter)} `;
        teamBounds.forEach(t => {
          path += `M ${t.xCenter} ${yCrossbar} V ${t.yTop} `;
        });
      }
    }

    setSvgPathData(path);
  }, [getRelativeBounds]);

  // Recalculate paths when data or layout changes
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      updateConnectorPaths();
    }, 50);
    return () => clearTimeout(timer);
  }, [members, positions, hasKasubagBranch, updateConnectorPaths]);

  // ResizeObserver on window resize
  useEffect(() => {
    const handleResize = () => {
      updateConnectorPaths();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateConnectorPaths]);

  // Center on load
  useEffect(() => {
    if (!containerRef.current || loading || members.length === 0) return;
    const timeout = setTimeout(() => {
      if (containerRef.current) {
        const c = containerRef.current;
        if (c.scrollWidth > c.clientWidth) {
          c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2;
        }
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [loading, members]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    containerRef.current.scrollLeft = scrollStart.left - dx;
    containerRef.current.scrollTop = scrollStart.top - dy;
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.15, 1.8));
    setTimeout(updateConnectorPaths, 50);
  };
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.15, 0.45));
    setTimeout(updateConnectorPaths, 50);
  };
  const handleZoomReset = () => {
    setZoom(1);
    setTimeout(updateConnectorPaths, 50);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-wide">Memuat Bagan Struktur Organisasi...</p>
      </div>
    );
  }

  if (members.length === 0 || !rootNode) {
    return (
      <div className="py-20 text-center text-slate-500 bg-slate-50 rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto">
        <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">account_tree</span>
        <h3 className="text-base font-extrabold text-slate-700 mb-1">Data Struktur Belum Tersedia</h3>
        <p className="text-xs text-slate-400">Silakan tambahkan anggota organisasi melalui panel Admin.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Floating Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-bold px-2">
          <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
          <span>Stasiun Klimatologi Kelas II Jawa Timur ({members.length} Pegawai)</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-white text-slate-600 hover:text-primary hover:shadow-sm transition-all flex items-center justify-center font-bold text-base"
            title="Perkecil (-)"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="px-2.5 h-8 rounded-lg bg-white text-slate-700 hover:text-primary hover:shadow-sm transition-all text-xs font-bold font-mono"
            title="Reset Ukuran (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-white text-slate-600 hover:text-primary hover:shadow-sm transition-all flex items-center justify-center font-bold text-base"
            title="Perbesar (+)"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>

      {/* Main Pannable / Scrollable Tree Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full overflow-x-auto overflow-y-auto bg-gradient-to-b from-slate-50/70 to-slate-100/50 rounded-3xl border border-slate-200/80 p-6 md:p-12 min-h-[580px] select-none scrollbar-thin transition-colors ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          ref={chartWrapperRef}
          className="relative flex flex-col items-center transition-transform duration-150 origin-top min-w-fit mx-auto pb-16"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* ============================================================= */}
          {/* SVG DYNAMIC CONNECTOR OVERLAY (Calculated from Real DOM Nodes)*/}
          {/* ============================================================= */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            {svgPathData && (
              <path
                d={svgPathData}
                fill="none"
                stroke="#475569"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* ============================================================= */}
          {/* BMKG HYBRID LAYOUT: KEPALA + KASUBAG (SIDE) + ALL TEAMS (ROW) */}
          {/* ============================================================= */}
          {hasKasubagBranch ? (
            <div className="flex flex-col items-center">
              {/* ROW 1: KEPALA UPT (Top Center) */}
              <div ref={kepalaRef} className="relative z-30">
                <OrgCard
                  member={rootNode}
                  position={positionMap.get(rootNode.role_id)}
                  className="w-[280px] sm:w-[320px] md:w-[340px]"
                />
              </div>

              {/* VERTICAL SPACING BETWEEN KEPALA AND ROW 2 (KASUBAG) */}
              <div className="h-12 md:h-14 w-full" />

              {/* TEAMS AND KASUBAG COLUMNS (All teams aligned in Row 3) */}
              <div className="flex items-start justify-center gap-3 sm:gap-4 md:gap-6">
                {/* ------------------------------------------------------ */}
                {/* DIRECT TEAMS COLUMNS (1 to N)                          */}
                {/* ------------------------------------------------------ */}
                {directTeams.map((team, idx) => (
                  <div key={team.id || team.role_id} className="flex flex-col items-center">
                    {/* Spacer matching Kasubag's card height */}
                    {kasubagNode && (
                      <div className="h-[95px] sm:h-[105px] md:h-[110px] w-full" />
                    )}

                    {/* Gap matching Kasubag-to-Team gap */}
                    {kasubagNode && <div className="h-10 md:h-12 w-full" />}

                    {/* Direct Team Card */}
                    <div ref={el => { directTeamRefs.current[idx] = el; }}>
                      <OrgCard
                        member={team}
                        position={positionMap.get(team.role_id)}
                      />
                    </div>

                    {/* Subordinates below this team if any */}
                    <SubordinateTree
                      parentId={team.role_id}
                      allMembers={visibleMembers}
                      positionMap={positionMap}
                    />
                  </div>
                ))}

                {/* ------------------------------------------------------ */}
                {/* KASUBAG COLUMN (Row 2: Kasubag, Row 3: Team TU)        */}
                {/* ------------------------------------------------------ */}
                {kasubagNode && (
                  <div className="flex flex-col items-center">
                    {/* Kasubag Card (Row 2: Intermediate Level on the Right) */}
                    <div ref={kasubagRef}>
                      <OrgCard
                        member={kasubagNode}
                        position={positionMap.get(kasubagNode.role_id)}
                        isKasubagGroup={true}
                        className="w-[220px] sm:w-[240px] md:w-[250px]"
                      />
                    </div>

                    {/* Vertical Gap between Kasubag and Team TU */}
                    <div className="h-10 md:h-12 w-full" />

                    {/* Kasubag's Team (Row 3: Aligned with other teams) */}
                    {kasubagTeams.map((kTeam, kIdx) => (
                      <div key={kTeam.id || kTeam.role_id} className="flex flex-col items-center">
                        <div ref={el => { kasubagTeamRefs.current[kIdx] = el; }}>
                          <OrgCard
                            member={kTeam}
                            position={positionMap.get(kTeam.role_id)}
                            isKasubagGroup={true}
                          />
                        </div>

                        {/* Subordinates below Team TU if any */}
                        <SubordinateTree
                          parentId={kTeam.role_id}
                          allMembers={visibleMembers}
                          positionMap={positionMap}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ============================================================= */
            /* FALLBACK: Standard Clean Recursive Tree (if no Kasubag)       */
            /* ============================================================= */
            <div className="flex flex-col items-center">
              <div ref={kepalaRef}>
                <OrgCard member={rootNode} position={positionMap.get(rootNode.role_id)} />
              </div>
              <div className="h-12 w-full" />
              <div className="flex items-start justify-center gap-4 md:gap-6">
                {directTeams.map((team, idx) => (
                  <div key={team.id || team.role_id} className="flex flex-col items-center">
                    <div ref={el => { directTeamRefs.current[idx] = el; }}>
                      <OrgCard member={team} position={positionMap.get(team.role_id)} />
                    </div>
                    <SubordinateTree parentId={team.role_id} allMembers={visibleMembers} positionMap={positionMap} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Hint */}
      <div className="flex justify-center items-center gap-2 text-slate-400 text-xs font-medium mt-3">
        <span className="material-symbols-outlined text-sm">pan_tool</span>
        <span>Klik dan geser (drag) bagan untuk menjelajahi posisi</span>
      </div>
    </div>
  );
}
