import { OrgPosition } from "@/types/admin";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase";

export const DEFAULT_POSITIONS: OrgPosition[] = [
  { position_id: "kepala", position_name: "KEPALA UPT", color: "#1e3a8a", hierarchy_level: 1, sort_order: 1, is_visible: true },
  { position_id: "kasubag", position_name: "KEPALA SUB BAGIAN", color: "#15803d", hierarchy_level: 2, sort_order: 2, is_visible: true },
  { position_id: "tim_1", position_name: "KETUA TIM KERJA TATA USAHA", color: "#15803d", hierarchy_level: 3, sort_order: 3, is_visible: true },
  { position_id: "tim_2", position_name: "KETUA TIM DATA", color: "#0284c7", hierarchy_level: 3, sort_order: 4, is_visible: true },
  { position_id: "tim_3", position_name: "KETUA TIM ANALISA DAN INFORMASI", color: "#4f46e5", hierarchy_level: 3, sort_order: 5, is_visible: true },
  { position_id: "tim_4", position_name: "KETUA TIM TEKNISI JARINGAN & KOMUNIKASI", color: "#e11d48", hierarchy_level: 3, sort_order: 6, is_visible: true },
  { position_id: "tim_5", position_name: "KETUA TIM OBSERVASI", color: "#9333ea", hierarchy_level: 3, sort_order: 7, is_visible: true },
  { position_id: "fungsional_pmg", position_name: "FUNGSIONAL PMG", color: "#d97706", hierarchy_level: 4, sort_order: 8, is_visible: true },
  { position_id: "fungsional_non_pmg", position_name: "FUNGSIONAL NON PMG", color: "#0d9488", hierarchy_level: 4, sort_order: 9, is_visible: true },
  { position_id: "anggota", position_name: "ANGGOTA / STAF", color: "#475569", hierarchy_level: 5, sort_order: 10, is_visible: true }
];

export const COLOR_PRESETS = [
  { label: "Biru Tua", hex: "#1e3a8a" },
  { label: "Biru BMKG", hex: "#0284c7" },
  { label: "Nila / Indigo", hex: "#4f46e5" },
  { label: "Ungu", hex: "#9333ea" },
  { label: "Merah Muda / Rose", hex: "#e11d48" },
  { label: "Merah / Red", hex: "#dc2626" },
  { label: "Oranye", hex: "#ea580c" },
  { label: "Kuning Tua / Amber", hex: "#d97706" },
  { label: "Hijau", hex: "#15803d" },
  { label: "Hijau Emerald", hex: "#059669" },
  { label: "Teal", hex: "#0d9488" },
  { label: "Slate / Abu", hex: "#475569" },
];

const LOCAL_STORAGE_KEY = "bmkg_custom_org_positions";

export async function fetchOrgPositions(): Promise<OrgPosition[]> {
  try {
    const data = await supabaseFetch("org_positions", "order=sort_order.asc");
    if (data && Array.isArray(data) && data.length > 0) {
      // Sync to local cache
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (_) {}
      }
      return data;
    }
  } catch (err) {
    console.warn("Could not fetch org_positions from database, using local fallback", err);
  }

  // Fallback to localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with DEFAULT_POSITIONS ensuring any default is not lost
          const existingIds = new Set(parsed.map((p: OrgPosition) => p.position_id));
          const missingDefaults = DEFAULT_POSITIONS.filter(p => !existingIds.has(p.position_id));
          return [...parsed, ...missingDefaults].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
      }
    } catch (_) {}
  }

  return DEFAULT_POSITIONS;
}

export async function saveOrgPosition(position: OrgPosition): Promise<boolean> {
  // 1. Try Supabase
  let dbSuccess = false;
  try {
    const res = await supabaseInsert("org_positions", position);
    if (res) dbSuccess = true;
  } catch (e) {
    console.warn("Could not insert into org_positions in DB (table might not exist yet)", e);
  }

  // 2. Always persist to localStorage
  if (typeof window !== "undefined") {
    try {
      const current = await fetchOrgPositions();
      const existingIdx = current.findIndex(p => p.position_id === position.position_id);
      let updated: OrgPosition[];
      if (existingIdx >= 0) {
        updated = current.map((p, idx) => idx === existingIdx ? { ...p, ...position } : p);
      } else {
        updated = [...current, position];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }

  return dbSuccess;
}

export async function updateOrgPosition(positionId: string, payload: Partial<OrgPosition>): Promise<boolean> {
  // 1. Try Supabase
  try {
    await supabaseUpdate("org_positions", `position_id=eq.${positionId}`, payload);
  } catch (_) {}

  // 2. LocalStorage
  if (typeof window !== "undefined") {
    try {
      const current = await fetchOrgPositions();
      const updated = current.map(p => p.position_id === positionId ? { ...p, ...payload } : p);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (_) {}
  }
  return true;
}

export async function deleteOrgPosition(positionId: string): Promise<boolean> {
  // 1. Try Supabase
  try {
    await supabaseDelete("org_positions", `position_id=eq.${positionId}`);
  } catch (_) {}

  // 2. LocalStorage
  if (typeof window !== "undefined") {
    try {
      const current = await fetchOrgPositions();
      const updated = current.filter(p => p.position_id !== positionId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (_) {}
  }
  return true;
}
