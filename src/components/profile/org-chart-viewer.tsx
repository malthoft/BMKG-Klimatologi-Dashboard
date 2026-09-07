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
  const titleText = (member.role_title || position?.position_name || member.role_id || "").trim();

  return (
    <div
      className={`bg-white rounded-2xl border-[2px] text-center flex flex-col items-center justify-between shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 w-[220px] sm:w-[240px] md:w-[250px] shrink-0 relative z-20 group overflow-hidden ${
        showTitle ? "h-[126px] sm:h-[134px] md:h-[140px]" : "min-h-[70px] sm:min-h-[76px]"
      } ${className}`}
      style={{ borderColor: color }}
    >
      {/* Title Header Badge with Solid Fill */}
      {showTitle && (
        <div
          className="w-full h-[54px] sm:h-[58px] md:h-[62px] px-2.5 py-1.5 flex items-center justify-center text-center overflow-hidden shrink-0 transition-colors"
          style={{ backgroundColor: color }}
          title={titleText}
        >
          <p className="font-black text-[9px] sm:text-[10px] md:text-[10.5px] tracking-tight uppercase text-white leading-tight line-clamp-3 break-words select-none w-full m-0">
            {titleText}
          </p>
        </div>
      )}

      {/* Person Name & NIP Container */}
      <div className="flex-1 w-full p-2 sm:p-2.5 md:p-3 flex flex-col items-center justify-center min-h-[66px] sm:min-h-[72px] md:min-h-[74px]">
        <h3 className="text-slate-900 text-[11px] sm:text-xs md:text-sm font-black uppercase leading-snug group-hover:text-primary transition-colors line-clamp-2 text-center w-full">
          {member.name || "-"}
        </h3>

        {member.nip && (
          <span className="text-[9px] sm:text-[10px] md:text-[11px] font-mono font-bold text-slate-500 mt-1 tracking-tight">
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
  const touchState = useRef<{ initialDist: number; initialZoom: number } | null>(null);

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

  // Auto-fit scale calculation for Desktop
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current) return;
    const isLargeScreen = window.innerWidth >= 1024;
    setIsDesktop(isLargeScreen);

    if (isLargeScreen) {
      const containerWidth = containerRef.current.clientWidth;
      // Content width of the 5 columns row is ~1380px with margins
      const contentWidth = 1380;
      const availableWidth = containerWidth - 48;
      const fit = Math.min(1, Math.max(0.4, availableWidth / contentWidth));
      setZoom(fit);
    } else {
      // Mobile default scale
      setZoom(0.85);
    }
  }, []);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      if (!isModalOpen) {
        calculateFitScale();
      }
      updateConnectorPaths();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateFitScale, updateConnectorPaths, isModalOpen]);

  // Trigger auto-fit once data has loaded into DOM
  useEffect(() => {
    if (!loading && members.length > 0 && !isModalOpen) {
      const timer = setTimeout(() => {
        calculateFitScale();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, members.length, isModalOpen, calculateFitScale]);

  // Update connector lines whenever zoom or modal changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateConnectorPaths();
    }, 40);
    return () => clearTimeout(timer);
  }, [zoom, isModalOpen, updateConnectorPaths]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
        setTimeout(calculateFitScale, 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, calculateFitScale]);

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

  // Touch Pinch-to-zoom handlers (two-finger zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchState.current = {
        initialDist: dist,
        initialZoom: zoom
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchState.current.initialDist;
      const newZoom = Math.min(2.5, Math.max(0.35, touchState.current.initialZoom * factor));
      setZoom(newZoom);
      setTimeout(updateConnectorPaths, 30);
    }
  };

  const handleTouchEnd = () => {
    touchState.current = null;
  };

  // Mouse wheel zoom (PC)
  const handleWheel = (e: React.WheelEvent) => {
    if (isModalOpen) {
      e.preventDefault();
      const step = e.deltaY < 0 ? 0.12 : -0.12;
      setZoom(prev => Math.min(2.5, Math.max(0.35, parseFloat((prev + step).toFixed(2)))));
    }
  };

  // Double-click to zoom (Gallery style on PC)
  const handleDoubleClick = () => {
    if (isModalOpen) {
      setZoom(prev => (prev >= 1.4 ? 1.0 : 1.8));
    }
  };

  // Double-tap for mobile
  const lastTapTime = useRef(0);
  const handleTouchStartWithTap = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isModalOpen) {
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        setZoom(prev => (prev >= 1.4 ? 1.0 : 1.8));
      }
      lastTapTime.current = now;
    }
    handleTouchStart(e);
  };

  // Zoom handlers (for modal view)
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.15, 2.2));
    setTimeout(updateConnectorPaths, 50);
  };
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.15, 0.35));
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
    <div
      className={
        isModalOpen
          ? "fixed inset-0 z-[9999] bg-slate-950 flex flex-col w-screen h-screen overflow-hidden select-none animate-in fade-in duration-150"
          : "w-full relative"
      }
    >
      {/* 1. Header Toolbar */}
      {isModalOpen ? (
        /* Modal Top Bar */
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white z-30 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(false);
              setTimeout(calculateFitScale, 50);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Kembali</span>
          </button>

          <div className="text-center min-w-0 px-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-white truncate">
              Struktur Organisasi BMKG
            </h2>
            <p className="text-[10px] text-slate-400 truncate">
              Stasiun Klimatologi Kelas I Jawa Timur ({members.length} Pegawai)
            </p>
          </div>

          {/* Modal Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl shrink-0 border border-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-sm transition-all"
              title="Perkecil (-)"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="px-2 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold font-mono transition-all"
              title="Reset Ukuran (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-sm transition-all"
              title="Perbesar (+)"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>
      ) : (
        /* Embedded Floating Header (NO +/- buttons) */
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold px-2">
            <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
            <span>Stasiun Klimatologi Kelas I Jawa Timur ({members.length} Pegawai)</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setIsModalOpen(true);
              setTimeout(updateConnectorPaths, 60);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_full</span>
            <span>Buka Tampilan Penuh</span>
          </button>
        </div>
      )}

      {/* Modal Tip Banner */}
      {isModalOpen && (
        <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5 text-[11px] text-cyan-200 text-center font-medium flex items-center justify-center gap-1.5 shrink-0">
          <span className="material-symbols-outlined text-[15px]">pinch</span>
          <span>Gunakan 2 jari untuk zoom (cubit layar), tombol +/- di atas, atau geser bagan untuk menjelajah</span>
        </div>
      )}

      {/* Main Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStartWithTap}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onClick={() => {
          if (!isDesktop && !isModalOpen) {
            setZoom(1);
            setIsModalOpen(true);
            setTimeout(updateConnectorPaths, 60);
          }
        }}
        className={
          isModalOpen
            ? `flex-1 w-full overflow-x-auto overflow-y-auto bg-slate-950 p-6 md:p-12 scrollbar-thin transition-colors ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`
            : `w-full ${
                isDesktop ? "overflow-x-hidden overflow-y-hidden" : "overflow-x-auto overflow-y-auto"
              } bg-gradient-to-b from-slate-50/70 to-slate-100/50 rounded-3xl border border-slate-200/80 p-4 md:p-8 min-h-[520px] select-none scrollbar-thin transition-all relative ${
                isDragging ? "cursor-grabbing" : isDesktop ? "cursor-default" : "cursor-pointer"
              }`
        }
      >
        {/* Mobile Tap Overlay Badge in Embedded Mode */}
        {!isDesktop && !isModalOpen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1.5 border border-white/20 animate-pulse">
              <span className="material-symbols-outlined text-[15px] text-primary">touch_app</span>
              <span>Ketuk untuk Buka Layar Penuh & Zoom</span>
            </div>
          </div>
        )}

        <div
          ref={chartWrapperRef}
          className="relative flex flex-col items-center transition-transform duration-150 origin-top min-w-fit mx-auto pb-16"
          style={{
            transform: `scale(${zoom})`,
            marginBottom: isDesktop && !isModalOpen && zoom < 1 ? `-${Math.round((1 - zoom) * 560)}px` : undefined
          }}
        >
          {/* ============================================================= */}
          {/* SVG DYNAMIC CONNECTOR OVERLAY (Calculated from Real DOM Nodes)*/}
          {/* ============================================================= */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            {svgPathData && (
              <path
                d={svgPathData}
                fill="none"
                stroke={isModalOpen ? "#94a3b8" : "#475569"}
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
                      <div className="h-[126px] sm:h-[134px] md:h-[140px] w-full" />
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

      {/* Camera-style Zoom Lens Switcher Pills (0.5x, 0.8x, 1x, 1.5x, 2x) */}
      {isModalOpen && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-xl border border-white/20 px-2.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 animate-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-[15px] text-amber-400 pl-1.5 pr-0.5">photo_camera</span>
          {[
            { label: "0.5x", value: 0.5, name: "Ultra-Wide" },
            { label: "0.8x", value: 0.8, name: "Fit" },
            { label: "1x", value: 1.0, name: "Normal" },
            { label: "1.5x", value: 1.5, name: "Dekat" },
            { label: "2x", value: 2.0, name: "Detail" }
          ].map(lens => {
            const isActive = Math.abs(zoom - lens.value) < 0.12;
            return (
              <button
                key={lens.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(lens.value);
                  setTimeout(updateConnectorPaths, 40);
                }}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-amber-400 text-slate-950 shadow-md scale-105 font-black"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title={`Lensa ${lens.name} (${lens.label})`}
              >
                {lens.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Hint Footer */}
      {!isModalOpen && (
        <div className="flex justify-center items-center gap-2 text-slate-400 text-xs font-medium mt-3">
          <span className="material-symbols-outlined text-sm">{isDesktop ? "fit_screen" : "touch_app"}</span>
          <span>
            {isDesktop
              ? "Bagan tertata pas sesuai ukuran layar desktop. Klik \"Buka Tampilan Penuh\" untuk melihat detail."
              : "Ketuk bagan untuk memperbesar atau membuka tampilan penuh"}
          </span>
        </div>
      )}
    </div>
  );
}
