export interface Station {
  id: number;
  station_id: string;
  station_name: string;
  display_name?: string;
  table_name: string;
  status: string;
  lat?: number;
  lon?: number;
  show_on_home: boolean;
  show_on_realtime: boolean;
  created_at?: string;
}

export interface BeritaKegiatan {
  id: number;
  judul: string;
  deskripsi: string;
  kategori: string;
  penulis: string;
  file_url?: string;
  published_at?: string;
  created_at?: string;
}

export interface Pengumuman {
  id: number;
  judul: string;
  deskripsi: string;
  kategori: string;
  file_url?: string;
  published_at?: string;
  created_at?: string;
}

export interface InstagramPost {
  id: number;
  post_url: string;
  created_at?: string;
}

export interface OrgMember {
  id: number;
  role_id: string;
  role_title: string;
  name: string;
  image_url?: string;
}

export interface HthData {
  id: number;
  station_name: string;
  lat: number;
  lon: number;
  hth: number;
}

export interface TempMap {
  id: number;
  year: number;
  category: string;
  image_url: string;
  created_at?: string;
}

export interface RainfallForecast {
  id: number;
  year: number;
  month: string;
  category: string;
  label: string;
  data_type: string;
  file_url: string;
  created_at?: string;
}

export interface PelayananPublik {
  id: number;
  kategori: "pk" | "lakip" | "rkt" | "maklumat" | "standar" | "jenis" | "pnbp" | "tarif-nol" | string;
  judul: string;
  file_url: string;
  deskripsi?: string;
  penulis?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EBuletin {
  id: number;
  wilayah: string;
  judul: string;
  edisi?: string;
  pdf_url: string;
  penulis?: string;
  created_at?: string;
  updated_at?: string;
}

