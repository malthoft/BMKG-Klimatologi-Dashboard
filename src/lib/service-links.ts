import { supabaseFetch, supabaseInsert, supabaseUpdate } from "@/lib/supabase";

export interface ServiceLinks {
  sipaduAdmin: string;
  formulirPermohonan: string;
  lacakStatus: string;
}

export const DEFAULT_SERVICE_LINKS: ServiceLinks = {
  sipaduAdmin: "https://script.google.com/macros/s/AKfycbyYH9biqvAWfUKkmwvENg7gVw3amiWz_IIgO2UkQhj0yI2mY-_U-ekChvmRubuUQEv1/exec?p=admin",
  formulirPermohonan: "https://script.google.com/macros/s/AKfycbyYH9biqvAWfUKkmwvENg7gVw3amiWz_IIgO2UkQhj0yI2mY-_U-ekChvmRubuUQEv1/exec?p=daftar",
  lacakStatus: "https://script.google.com/macros/s/AKfycbyYH9biqvAWfUKkmwvENg7gVw3amiWz_IIgO2UkQhj0yI2mY-_U-ekChvmRubuUQEv1/exec?p=client",
};

const LOCAL_STORAGE_KEY = "bmkg_service_links_cache";

/**
 * Mendapatkan link layanan dari cache lokal secara sinkron (dengan fallback ke default)
 */
export function getStoredServiceLinks(): ServiceLinks {
  if (typeof window === "undefined") {
    return DEFAULT_SERVICE_LINKS;
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        sipaduAdmin: parsed.sipaduAdmin || DEFAULT_SERVICE_LINKS.sipaduAdmin,
        formulirPermohonan: parsed.formulirPermohonan || DEFAULT_SERVICE_LINKS.formulirPermohonan,
        lacakStatus: parsed.lacakStatus || DEFAULT_SERVICE_LINKS.lacakStatus,
      };
    }
  } catch (_) {}

  return DEFAULT_SERVICE_LINKS;
}

/**
 * Mengambil link layanan dari Supabase dan memperbarui cache lokal
 */
export async function fetchServiceLinks(): Promise<ServiceLinks> {
  const current = getStoredServiceLinks();

  try {
    const rows = await supabaseFetch("pelayanan_publik", "kategori=eq.service_links");
    if (rows && Array.isArray(rows) && rows.length > 0) {
      const result: ServiceLinks = { ...current };

      rows.forEach((row: any) => {
        if (row.judul === "sipadu_admin" && row.file_url) {
          result.sipaduAdmin = row.file_url;
        } else if (row.judul === "formulir_permohonan" && row.file_url) {
          result.formulirPermohonan = row.file_url;
        } else if (row.judul === "lacak_status" && row.file_url) {
          result.lacakStatus = row.file_url;
        }
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result));
        } catch (_) {}
      }

      return result;
    }
  } catch (err) {
    console.warn("Gagal mengambil link layanan dari Supabase, menggunakan cache:", err);
  }

  return current;
}

/**
 * Menyimpan link layanan baru ke Supabase dan cache lokal
 */
export async function saveServiceLinks(links: ServiceLinks): Promise<boolean> {
  // Update local storage first
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(links));
      window.dispatchEvent(new CustomEvent("service-links-updated", { detail: links }));
    } catch (_) {}
  }

  try {
    const existing = await supabaseFetch("pelayanan_publik", "kategori=eq.service_links");
    const existingMap = new Map<string, number>();
    if (existing && Array.isArray(existing)) {
      existing.forEach((row: any) => {
        if (row.judul && row.id) {
          existingMap.set(row.judul, row.id);
        }
      });
    }

    const entries = [
      { key: "sipadu_admin", url: links.sipaduAdmin, label: "Link Portal Sipadu Admin" },
      { key: "formulir_permohonan", url: links.formulirPermohonan, label: "Link Formulir Permohonan Informasi" },
      { key: "lacak_status", url: links.lacakStatus, label: "Link Lacak Status Dokumen" },
    ];

    for (const item of entries) {
      if (existingMap.has(item.key)) {
        const id = existingMap.get(item.key);
        await supabaseUpdate("pelayanan_publik", `id=eq.${id}`, {
          file_url: item.url,
          deskripsi: item.label,
        });
      } else {
        await supabaseInsert("pelayanan_publik", {
          kategori: "service_links",
          judul: item.key,
          file_url: item.url,
          deskripsi: item.label,
          penulis: "Admin",
        });
      }
    }

    return true;
  } catch (err) {
    console.error("Gagal menyimpan link layanan ke Supabase:", err);
    return false;
  }
}
