"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import shpjs from "shpjs";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseRpc, supabaseUploadFile, supabaseDeleteFile, supabaseGetPublicUrl } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { TemperatureLineChart } from "@/components/climate/temperature-line-chart";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";
import { parseObservationExcel, ParsedDailyObservation, ParsedHourlyObservation } from "@/lib/excel-parser";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  const activeTab = searchParams.get("tab") || "stations";
  const setActiveTab = (tab: string) => {
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };
  const [stations, setStations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  
  const [newStation, setNewStation] = useState({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });
  const [newOrgMember, setNewOrgMember] = useState({ role_id: "", role_title: "", name: "", nip: "", parent_role_id: "", show_role_title: true });

  // --- Observation Data States ---
  const [observationDaily, setObservationDaily] = useState<ParsedDailyObservation>({
    tanggal_pengamatan: "",
    source_file: "",
    suhu_maksimum: 0,
    suhu_minimum: 0,
    curah_hujan_mm: 0,
    kategori_hujan: "Tidak Ada Hujan",
    suhu_udara_rata: 0,
    kelembaban_rata: 0,
    tekanan_udara_rata: 0,
    angin_arah_dominan: "-",
    angin_kecepatan_rata_kt: 0,
    angin_kecepatan_max_kt: 0,
    rangkuman_info: "",
  });
  const [observationHourly, setObservationHourly] = useState<ParsedHourlyObservation[]>([]);
  const [activeObservationDate, setActiveObservationDate] = useState<string>("");
  const [activeObservationSync, setActiveObservationSync] = useState<string>("");
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  
  const [isAddHourlyModalOpen, setIsAddHourlyModalOpen] = useState(false);
  const [newHourlyRow, setNewHourlyRow] = useState<ParsedHourlyObservation>({
    jam: "",
    suhu_c: 25.0,
    kelembaban_percent: 75,
    tekanan_mbar: 948.0,
    kecepatan_angin_kt: 4,
    arah_angin: "-",
  });

  // --- Climate CSV Admin States ---
  const [csvTextStripes, setCsvTextStripes] = useState("");
  const [climatePreviewStripes, setClimatePreviewStripes] = useState<ClimateParsedResult | null>(null);
  const [csvTextAnnual, setCsvTextAnnual] = useState("");
  const [climatePreviewAnnual, setClimatePreviewAnnual] = useState<ClimateParsedResult | null>(null);
  
  // Shared state for previews
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // --- Temperature Maps Admin States ---
  const [tempMaps, setTempMaps] = useState<any[]>([]);
  const [newTempMap, setNewTempMap] = useState({ year: new Date().getFullYear(), category: "Normal", file: null as File | null });
  const [isUploadingTempMap, setIsUploadingTempMap] = useState(false);
  const [editTempMapId, setEditTempMapId] = useState<number | null>(null);

  // --- Confirm Dialog State ---
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // --- Rainfall Forecast Admin States ---
  const [rainfallForecasts, setRainfallForecasts] = useState<any[]>([]);
  const [newRainfall, setNewRainfall] = useState({ category: "dasarian", year: new Date().getFullYear(), month: "01", label: "", uploadMode: "shp", fileShp: null as File | null, fileDbf: null as File | null, fileJson: null as File | null });
  const [isUploadingRainfall, setIsUploadingRainfall] = useState(false);

  // --- HTH Admin States ---
  const [hthConfig, setHthConfig] = useState({ judul: "MONITORING HARI TANPA HUJAN", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTi79gYQsWbuErXu85VpBLIiuMD7v2XnWEjWRBCPSIpyhxB_BxloWkztP19sAOOVQ/pub?gid=655976518&single=true&output=csv" });
  const [isSyncingHth, setIsSyncingHth] = useState(false);
  const [hthStats, setHthStats] = useState({ totalData: 0, lastUpdate: "-" });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    loadStations();
    loadAnnouncements();
    loadClimateData();
    loadOrgMembers();
    loadTempMaps();
    loadObservationData();
    loadRainfallForecasts();
    loadHthData();
  }, []);

  const loadHthData = async () => {
    try {
      let currentConfig: any = null;
      const publicUrl = supabaseGetPublicUrl("rainfall-data", "hth/config.json");
      const res = await fetch(`${publicUrl}?t=${new Date().getTime()}`);
      if (res.ok) {
        currentConfig = await res.json();
        setHthConfig(prev => ({ ...prev, ...currentConfig }));
      }
      const dataUrl = supabaseGetPublicUrl("rainfall-data", "hth/data.json");
      const resData = await fetch(`${dataUrl}?t=${new Date().getTime()}`);
      if (resData.ok) {
        const hthData = await resData.json();
        setHthStats({ totalData: hthData.length || 0, lastUpdate: currentConfig?.lastUpdate || new Date().toLocaleString('id-ID') });
      }
    } catch (e) {
      console.warn("Failed to load HTH data", e);
    }
  };

  const loadObservationData = async () => {
    try {
      let dailyResult = await supabaseFetch("daily_observations", "order=id.desc&limit=1");
      if (!dailyResult || dailyResult.length === 0) {
        dailyResult = await supabaseFetch("daily_observations", "id=eq.1");
      }
      if (dailyResult && dailyResult.length > 0) {
        const d = dailyResult[0];
        setObservationDaily({
          tanggal_pengamatan: d.tanggal_pengamatan || "",
          source_file: d.source_file || "",
          suhu_maksimum: d.suhu_maksimum ?? 0,
          suhu_minimum: d.suhu_minimum ?? 0,
          curah_hujan_mm: d.curah_hujan_mm ?? 0,
          kategori_hujan: d.kategori_hujan || "Tidak Ada Hujan",
          suhu_udara_rata: d.suhu_udara_rata ?? 0,
          kelembaban_rata: d.kelembaban_rata ?? 0,
          tekanan_udara_rata: d.tekanan_udara_rata ?? 0,
          angin_arah_dominan: d.angin_arah_dominan || "-",
          angin_kecepatan_rata_kt: d.angin_kecepatan_rata_kt ?? 0,
          angin_kecepatan_max_kt: d.angin_kecepatan_max_kt ?? 0,
          rangkuman_info: d.rangkuman_info || "",
        });
        setActiveObservationDate(d.tanggal_pengamatan || "-");
        setActiveObservationSync(d.synced_at || d.updated_at || "");
      }

      const hourlyResult = await supabaseFetch("hourly_observations", "order=id.asc");
      if (hourlyResult && hourlyResult.length > 0) {
        const sorted = [...hourlyResult].sort((a, b) => (a.jam || "").localeCompare(b.jam || ""));
        setObservationHourly(sorted);
      }
    } catch (e) {
      console.error("Gagal memuat data pengamatan di admin", e);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    await loadObservationData();
    setTimeout(() => setIsRefreshingData(false), 800);
  };

  const handleExcelUpload = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    // Validate file size (Max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar! Maksimal 10 MB.");
      evt.target.value = "";
      return;
    }

    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error("Format file tidak didukung! Harap unggah file .xlsx, .xls, atau .csv.");
      evt.target.value = "";
      return;
    }

    setIsParsingExcel(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseObservationExcel(buffer, file.name);
      setObservationDaily(result.daily);
      setObservationHourly(result.hourly);
      
      if (result.hourly.length === 0) {
        toast.info("File berhasil dibaca, namun tidak ada data per jam yang terdeteksi. Silakan isi manual jika perlu.");
      } else {
        toast.success(`Berhasil mengekstrak ${file.name}! Terdeteksi ${result.hourly.length} data observasi jam.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses file Excel.");
    } finally {
      setIsParsingExcel(false);
      evt.target.value = "";
    }
  };

  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    openConfirm(
      "Simpan & Aktifkan Data",
      "Apakah Anda yakin ingin menimpa data pengamatan harian sebelumnya? Tindakan ini akan mengganti data yang sedang aktif di website.",
      async () => {
        closeConfirm();
        setIsSavingObservation(true);
        try {
          const nowIso = new Date().toISOString();
          const dailyPayload = {
            tanggal_pengamatan: observationDaily.tanggal_pengamatan,
            source_file: observationDaily.source_file || "Manual Input.xlsx",
            suhu_maksimum: parseFloat(String(observationDaily.suhu_maksimum)) || 0,
            suhu_minimum: parseFloat(String(observationDaily.suhu_minimum)) || 0,
            curah_hujan_mm: parseFloat(String(observationDaily.curah_hujan_mm)) || 0,
            kategori_hujan: observationDaily.kategori_hujan || "Tidak Ada Hujan",
            suhu_udara_rata: parseFloat(String(observationDaily.suhu_udara_rata)) || 0,
            kelembaban_rata: parseFloat(String(observationDaily.kelembaban_rata)) || 0,
            tekanan_udara_rata: parseFloat(String(observationDaily.tekanan_udara_rata)) || 0,
            angin_arah_dominan: observationDaily.angin_arah_dominan || "-",
            angin_kecepatan_rata_kt: parseFloat(String(observationDaily.angin_kecepatan_rata_kt)) || 0,
            angin_kecepatan_max_kt: parseFloat(String(observationDaily.angin_kecepatan_max_kt)) || 0,
            rangkuman_info: observationDaily.rangkuman_info || "",
            synced_at: nowIso,
            updated_at: nowIso,
          };

          const existingDaily = await supabaseFetch("daily_observations", "id=eq.1");
          let saveDailyOk = false;
          if (existingDaily && existingDaily.length > 0) {
            const res = await supabaseUpdate("daily_observations", "id=eq.1", dailyPayload);
            saveDailyOk = !!res;
          } else {
            const res = await supabaseInsert("daily_observations", { id: 1, ...dailyPayload });
            saveDailyOk = !!res;
          }

          if (!saveDailyOk) {
            throw new Error("Gagal menyimpan ringkasan harian ke database.");
          }

          if (observationHourly.length > 0) {
            await supabaseDelete("hourly_observations", "id=gt.0");
            const hourlyClean = observationHourly.map((h) => ({
              jam: h.jam,
              suhu_c: parseFloat(String(h.suhu_c)) || 0,
              kelembaban_percent: parseFloat(String(h.kelembaban_percent)) || 0,
              tekanan_mbar: parseFloat(String(h.tekanan_mbar)) || 0,
              kecepatan_angin_kt: parseFloat(String(h.kecepatan_angin_kt)) || 0,
              arah_angin: String(h.arah_angin || "-"),
            }));
            await supabaseInsert("hourly_observations", hourlyClean);
          } else {
            // If no hourly data is provided, still purge old data to stay consistent
            await supabaseDelete("hourly_observations", "id=gt.0");
          }

          toast.success("Data pengamatan harian berhasil diperbarui dan aktif di website!");
          setActiveObservationDate(observationDaily.tanggal_pengamatan);
          setActiveObservationSync(nowIso);
          loadObservationData();
        } catch (err: any) {
          toast.error(err.message || "Gagal menyimpan data pengamatan.");
        } finally {
          setIsSavingObservation(false);
        }
      }
    );
  };

  const handleHourlyRowChange = (index: number, field: keyof ParsedHourlyObservation, val: any) => {
    setObservationHourly((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleOpenAddHourlyModal = () => {
    const nextHour = String(observationHourly.length + 7).padStart(2, "0") + ":00";
    setNewHourlyRow({
      jam: nextHour,
      suhu_c: 25.0,
      kelembaban_percent: 75,
      tekanan_mbar: 948.0,
      kecepatan_angin_kt: 4,
      arah_angin: "-",
    });
    setIsAddHourlyModalOpen(true);
  };

  const handleConfirmAddHourlyRow = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Format Jam (HH:MM)
    const jamRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!jamRegex.test(newHourlyRow.jam)) {
      toast.error("Format jam tidak valid! Gunakan format HH:MM (contoh: 07:00 atau 14:30).");
      return;
    }

    // Pastikan format selalu 2 digit (misal 7:00 menjadi 07:00)
    const normalizedJam = newHourlyRow.jam.padStart(5, '0');
    const rowToSave = { ...newHourlyRow, jam: normalizedJam };

    // Validasi Duplikasi Jam
    const isDuplicate = observationHourly.some(row => row.jam === normalizedJam);
    if (isDuplicate) {
      toast.error(`Data untuk jam ${normalizedJam} sudah ada di dalam tabel!`);
      return;
    }

    // Validasi Rentang Logis
    if (rowToSave.suhu_c < 0 || rowToSave.suhu_c > 50) {
      toast.error("Nilai suhu tidak masuk akal (harus antara 0 - 50 °C).");
      return;
    }
    if (rowToSave.kelembaban_percent < 0 || rowToSave.kelembaban_percent > 100) {
      toast.error("Nilai kelembaban harus antara 0 - 100 %.");
      return;
    }
    if (rowToSave.tekanan_mbar < 800 || rowToSave.tekanan_mbar > 1100) {
      toast.error("Nilai tekanan QFE tidak valid (biasanya antara 800 - 1100 mbar).");
      return;
    }

    setObservationHourly((prev) => {
      const newArray = [...prev, rowToSave];
      // Pastikan array selalu urut berdasarkan jam setelah penambahan
      return newArray.sort((a, b) => a.jam.localeCompare(b.jam));
    });
    
    toast.success(`Data observasi untuk jam ${normalizedJam} berhasil ditambahkan!`);
    setIsAddHourlyModalOpen(false);
  };

  const handleRemoveHourlyRow = (index: number) => {
    setObservationHourly((prev) => prev.filter((_, i) => i !== index));
  };

  const loadStations = async () => {
    let sts = await supabaseFetch("stations");
    if (!sts || sts.length === 0) {
      sts = FALLBACK_STATIONS;
    }
    setStations(sts);
  };

  const loadAnnouncements = async () => {
    const anns = await supabaseFetch("announcements", "order=published_at.desc");
    setAnnouncements(anns || []);
  };

  const loadOrgMembers = async () => {
    const org = await supabaseFetch("organization_structure");
    setOrgMembers(org || []);
  };

  const loadTempMaps = async () => {
    const maps = await supabaseFetch("temperature_maps", "order=year.desc,created_at.desc");
    setTempMaps(maps || []);
  };

  const loadRainfallForecasts = async () => {
    const data = await supabaseFetch("rainfall_forecasts", "order=year.desc,month.desc,created_at.desc");
    setRainfallForecasts(data || []);
  };

  const loadClimateData = async () => {
    // Load Warming Stripes
    try {
      let stripesRes = await fetch(supabaseGetPublicUrl("climate-data", "warming-stripes.csv"), { cache: 'no-store' });
      if (stripesRes.ok) {
        const text = await stripesRes.text();
        setCsvTextStripes(text);
        setClimatePreviewStripes(parseCSVText(text));
      } else {
        // Fallback
        const res = await fetch("/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv");
        if (res.ok) {
          const text = await res.text();
          setCsvTextStripes(text);
          setClimatePreviewStripes(parseCSVText(text));
        }
      }
    } catch (e) {
      console.error("Gagal memuat data iklim (stripes) di admin", e);
    }

    // Load Annual Temps
    try {
      let tempRes = await fetch(supabaseGetPublicUrl("climate-data", "annual-temperatures.csv"), { cache: 'no-store' });
      if (tempRes.ok) {
        const text = await tempRes.text();
        setCsvTextAnnual(text);
        setClimatePreviewAnnual(parseCSVText(text));
      } else {
        // Fallback
        const res = await fetch("/Rata_Rata_Suhu_Tahunan.csv");
        if (res.ok) {
          const text = await res.text();
          setCsvTextAnnual(text);
          setClimatePreviewAnnual(parseCSVText(text));
        }
      }
    } catch (e) {
      console.error("Gagal memuat data iklim (annual) di admin", e);
    }
  };

  const processAndUploadCSV = async (textToProcess: string, type: 'stripes' | 'annual') => {
    try {
      const parsed = parseCSVText(textToProcess);
      const filename = type === 'stripes' ? 'warming-stripes.csv' : 'annual-temperatures.csv';
      
      // Update preview immediately
      if (type === 'stripes') {
        setClimatePreviewStripes(parsed);
        setCsvTextStripes(textToProcess);
      } else {
        setClimatePreviewAnnual(parsed);
        setCsvTextAnnual(textToProcess);
      }
      
      // Upload to Supabase Storage as a Blob
      const fileBlob = new Blob([textToProcess], { type: 'text/csv' });
      const fileObj = new File([fileBlob], filename, { type: 'text/csv' });
      
      const uploadedUrl = await supabaseUploadFile("climate-data", filename, fileObj);
      
      if (uploadedUrl) {
        toast.success(`Berhasil mengunggah data CSV ${type === 'stripes' ? 'Warming Stripes' : 'Suhu Tahunan'}!`);
      } else {
        toast.error("Gagal mengunggah file ke Supabase Storage. Cek bucket 'climate-data'.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses file CSV.");
    }
  };

  const handleFileUpload = (evt: React.ChangeEvent<HTMLInputElement>, type: 'stripes' | 'annual') => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        processAndUploadCSV(text, type);
      }
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  const handleClearCSV = (type: 'stripes' | 'annual') => {
    openConfirm(
      "Kosongkan Data",
      `Apakah Anda yakin ingin mengosongkan data CSV iklim (${type}) dari Supabase Storage?`,
      async () => {
        closeConfirm();
        const filename = type === 'stripes' ? 'warming-stripes.csv' : 'annual-temperatures.csv';
        const deleted = await supabaseDeleteFile("climate-data", filename);
        if (deleted) {
          if (type === 'stripes') {
            setCsvTextStripes("");
            setClimatePreviewStripes(null);
          } else {
            setCsvTextAnnual("");
            setClimatePreviewAnnual(null);
          }
          toast.success("Data CSV berhasil dihapus dari storage.");
        } else {
          toast.error("Gagal menghapus file dari storage.");
        }
      }
    );
  };

  const handleResetDefaultCSV = (type: 'stripes' | 'annual') => {
    openConfirm(
      "Kembalikan ke Default",
      `Apakah Anda yakin ingin mereset data (${type}) ke dataset default bawaan sistem? Ini akan mengunggah file default ke Supabase Storage.`,
      async () => {
        closeConfirm();
        try {
          const fallbackPath = type === 'stripes' ? "/Hasil_Anomali_38_Kabupaten_1991_2025_v2.csv" : "/Rata_Rata_Suhu_Tahunan.csv";
          const res = await fetch(fallbackPath);
          if (res.ok) {
            const text = await res.text();
            await processAndUploadCSV(text, type);
          } else {
            toast.error("Gagal mengambil dataset default.");
          }
        } catch (e) {
          toast.error("Gagal mereset CSV default.");
        }
      }
    );
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await supabaseInsert("stations", {
      station_id: newStation.id_sta,
      station_name: newStation.name,
      table_name: newStation.table,
      latitude: parseFloat(newStation.lat) || 0,
      longitude: parseFloat(newStation.lng) || 0,
      status: newStation.status,
      show_on_home: true,
      show_on_realtime: true
    });
    
    if (result) {
      await supabaseRpc("create_aws_table", { tbl_name: newStation.table });
      toast.success("Stasiun dan tabel berhasil ditambahkan!");
      setNewStation({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
      loadStations();
    } else {
      toast.error("Gagal menambahkan stasiun. Pastikan tabel 'stations' sudah ada di database Supabase Anda.");
    }
  };

  const handleDeleteStation = (id: number) => {
    openConfirm(
      "Hapus Stasiun",
      "Yakin ingin menghapus stasiun ini? Data terkait tabel tersebut di database tidak akan terhapus secara otomatis.",
      async () => {
        closeConfirm();
        await supabaseDelete("stations", `id=eq.${id}`);
        loadStations();
        toast.success("Stasiun berhasil dihapus.");
      }
    );
  };

  const handleToggleVisibility = async (id: number, field: string, currentValue: boolean) => {
    await supabaseUpdate("stations", `id=eq.${id}`, { [field]: !currentValue });
    loadStations();
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await supabaseInsert("announcements", {
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      category: newAnnouncement.category,
      priority: newAnnouncement.priority,
      image_url: newAnnouncement.image_url || null,
      instagram_url: newAnnouncement.instagram_url || null,
      is_featured: newAnnouncement.is_featured,
      published_at: new Date().toISOString()
    });
    
    if (result) {
      toast.success("Pengumuman berhasil dipublikasikan!");
      setNewAnnouncement({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });
      loadAnnouncements();
    } else {
      toast.error("Gagal mempublikasikan. Pastikan tabel 'announcements' sudah ada.");
    }
  };

  const handleDeleteAnnouncement = (id: number) => {
    openConfirm(
      "Hapus Pengumuman",
      "Yakin ingin menghapus pengumuman ini?",
      async () => {
        closeConfirm();
        await supabaseDelete("announcements", `id=eq.${id}`);
        loadAnnouncements();
        toast.success("Pengumuman berhasil dihapus.");
      }
    );
  };

  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate unique role_id if they select 'anggota' to allow multiple members
    let finalRoleId = newOrgMember.role_id;
    if (finalRoleId === "anggota") {
      finalRoleId = `anggota_${Date.now()}`;
    } else {
      // If it's a fixed role (kepala, kasubag, dll), delete the old one first
      await supabaseDelete("organization_structure", `role_id=eq.${finalRoleId}`);
    }

    const result = await supabaseInsert("organization_structure", {
      role_id: finalRoleId,
      role_title: newOrgMember.role_title,
      name: newOrgMember.name,
      nip: newOrgMember.nip,
      parent_role_id: newOrgMember.parent_role_id || null,
      show_role_title: newOrgMember.show_role_title
    });
    if (result) {
      toast.success("Anggota organisasi berhasil disimpan!");
      setNewOrgMember({ role_id: "", role_title: "", name: "", nip: "", parent_role_id: "", show_role_title: true });
      loadOrgMembers();
    }
  };

  const handleDeleteOrgMember = (id: number) => {
    openConfirm(
      "Hapus Anggota",
      "Yakin ingin menghapus data anggota ini?",
      async () => {
        closeConfirm();
        await supabaseDelete("organization_structure", `id=eq.${id}`);
        loadOrgMembers();
        toast.success("Anggota berhasil dihapus.");
      }
    );
  };

  const handleAddTempMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTempMap.file) {
      toast.error("Harap pilih file gambar peta terlebih dahulu!");
      return;
    }

    setIsUploadingTempMap(true);
    
    const fileExt = newTempMap.file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${newTempMap.year}/${fileName}`;
    
    const imageUrl = await supabaseUploadFile("temperature-maps", filePath, newTempMap.file);
    
    if (!imageUrl) {
      toast.error("Gagal mengupload gambar ke Supabase Storage.");
      setIsUploadingTempMap(false);
      return;
    }

    const result = await supabaseInsert("temperature_maps", {
      year: newTempMap.year,
      category: newTempMap.category,
      image_url: imageUrl
    });
    
    if (result) {
      toast.success("Peta perubahan suhu berhasil ditambahkan!");
      setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
      loadTempMaps();
    } else {
      toast.error("Gagal menyimpan data ke database.");
      await supabaseDeleteFile("temperature-maps", filePath);
    }
    
    setIsUploadingTempMap(false);
  };

  const handleEditTempMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTempMapId) return;

    setIsUploadingTempMap(true);
    let imageUrl = "";

    if (newTempMap.file) {
      const fileExt = newTempMap.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${newTempMap.year}/${fileName}`;
      
      const uploadedUrl = await supabaseUploadFile("temperature-maps", filePath, newTempMap.file);
      if (!uploadedUrl) {
        toast.error("Gagal mengupload gambar baru ke Supabase Storage.");
        setIsUploadingTempMap(false);
        return;
      }
      imageUrl = uploadedUrl;

      const oldMap = tempMaps.find(m => m.id === editTempMapId);
      if (oldMap && oldMap.image_url) {
        const urlParts = oldMap.image_url.split('/temperature-maps/');
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          await supabaseDeleteFile("temperature-maps", oldFilePath);
        }
      }
    }

    const updateData: any = {
      year: newTempMap.year,
      category: newTempMap.category,
    };
    if (imageUrl) {
      updateData.image_url = imageUrl;
    }

    const result = await supabaseUpdate("temperature_maps", updateData, `id=eq.${editTempMapId}`);
    
    if (result) {
      toast.success("Peta perubahan suhu berhasil diperbarui!");
      setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
      setEditTempMapId(null);
      loadTempMaps();
    } else {
      toast.error("Gagal memperbarui data di database.");
    }
    
    setIsUploadingTempMap(false);
  };

  const startEditTempMap = (map: any) => {
    setEditTempMapId(map.id);
    setNewTempMap({ year: map.year, category: map.category, file: null });
  };

  const cancelEditTempMap = () => {
    setEditTempMapId(null);
    setNewTempMap({ year: new Date().getFullYear(), category: "Normal", file: null });
  };

  const handleDeleteTempMap = (id: number, imageUrl: string) => {
    openConfirm(
      "Hapus Peta Suhu",
      "Yakin ingin menghapus peta ini? Gambar juga akan dihapus dari storage.",
      async () => {
        closeConfirm();
        const deleted = await supabaseDelete("temperature_maps", `id=eq.${id}`);
        if (deleted) {
          const bucketPathStr = "/temperature-maps/";
          const pathIndex = imageUrl.indexOf(bucketPathStr);
          if (pathIndex !== -1) {
            const filePath = imageUrl.substring(pathIndex + bucketPathStr.length);
            await supabaseDeleteFile("temperature-maps", filePath);
          }
          loadTempMaps();
          toast.success("Peta suhu berhasil dihapus.");
        }
      }
    );
  };

  const handleAddRainfall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRainfall.uploadMode === 'shp' && (!newRainfall.fileShp || !newRainfall.fileDbf)) {
      toast.error("Harap pilih file .shp DAN .dbf secara bersamaan!");
      return;
    }
    if (newRainfall.uploadMode === 'json' && !newRainfall.fileJson) {
      toast.error("Harap pilih file .json!");
      return;
    }
    setIsUploadingRainfall(true);

    try {
      let finalFileName = `prakiraan/${Date.now()}-${Math.random().toString(36).substring(7)}.json`;
      let fileToUpload: File;

      if (newRainfall.uploadMode === 'shp') {
        const shapefile = require('shapefile');
        const shpBytes = await newRainfall.fileShp!.arrayBuffer();
        const dbfBytes = await newRainfall.fileDbf!.arrayBuffer();
        
        const geojson = await shapefile.read(shpBytes, dbfBytes);
        
        const geojsonStr = JSON.stringify(geojson);
        fileToUpload = new File([geojsonStr], 'converted.json', { type: 'application/json' });
      } else {
        fileToUpload = newRainfall.fileJson!;
      }

      const uploadedUrl = await supabaseUploadFile("rainfall-data", finalFileName, fileToUpload);
      if (!uploadedUrl) throw new Error("Gagal mengupload file ke Storage");

      const result = await supabaseInsert("rainfall_forecasts", {
        category: newRainfall.category,
        year: newRainfall.year,
        month: newRainfall.month,
        label: newRainfall.label,
        file_path: uploadedUrl
      });

      if (result) {
        setNewRainfall({ category: "dasarian", year: new Date().getFullYear(), month: "01", label: "", uploadMode: "shp", fileShp: null, fileDbf: null, fileJson: null });
        toast.success("Data Prakiraan Curah Hujan berhasil ditambahkan!");
        loadRainfallForecasts();
      } else {
        throw new Error("Gagal menyimpan ke database");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memproses data.");
    } finally {
      setIsUploadingRainfall(false);
    }
  };

  const handleDeleteRainfall = (id: number, filePath: string) => {
    openConfirm(
      "Hapus Prakiraan Hujan",
      "Yakin ingin menghapus data ini? File GeoJSON di storage juga akan dihapus.",
      async () => {
        closeConfirm();
        const deleted = await supabaseDelete("rainfall_forecasts", `id=eq.${id}`);
        if (deleted) {
          const bucketPathStr = "/rainfall-data/";
          const pathIndex = filePath.indexOf(bucketPathStr);
          if (pathIndex !== -1) {
            const relativePath = filePath.substring(pathIndex + bucketPathStr.length);
            await supabaseDeleteFile("rainfall-data", relativePath);
          }
          loadRainfallForecasts();
          toast.success("Data prakiraan berhasil dihapus.");
        }
      }
    );
  };

  const handleSaveHthTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configStr = JSON.stringify({ ...hthConfig, lastUpdate: hthStats.lastUpdate });
      const fileToUpload = new File([configStr], 'config.json', { type: 'application/json' });
      const uploadedUrl = await supabaseUploadFile("rainfall-data", "hth/config.json", fileToUpload);
      if (uploadedUrl) {
        toast.success("Judul HTH berhasil diperbarui!");
      } else {
        throw new Error("Gagal upload config");
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal memperbarui judul HTH");
    }
  };

  const handleSyncHth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hthConfig.url) {
      toast.error("URL Google Sheets tidak boleh kosong");
      return;
    }
    setIsSyncingHth(true);
    try {
      // 1. Fetch and Parse CSV
      const { fetchAndParseHTHCsv } = await import("@/lib/hth-parser");
      const data = await fetchAndParseHTHCsv(hthConfig.url);
      
      if (!data || data.length === 0) {
        throw new Error("Gagal mengambil data atau data kosong");
      }

      // 2. Upload Data JSON to Storage
      const dataStr = JSON.stringify(data);
      const dataFile = new File([dataStr], 'data.json', { type: 'application/json' });
      await supabaseUploadFile("rainfall-data", "hth/data.json", dataFile);

      // 3. Update Config & Stats
      const now = new Date().toLocaleString('id-ID');
      const configStr = JSON.stringify({ ...hthConfig, lastUpdate: now });
      const configFile = new File([configStr], 'config.json', { type: 'application/json' });
      await supabaseUploadFile("rainfall-data", "hth/config.json", configFile);

      setHthStats({ totalData: data.length, lastUpdate: now });
      toast.success(`Sukses! Sinkronisasi berhasil. Total ${data.length} data pos diperbarui.`);
    } catch (e: any) {
      toast.error(e.message || "Gagal sinkronisasi HTH");
    } finally {
      setIsSyncingHth(false);
    }
  };

  return (
    <>
      <ConfirmDialog {...confirmConfig} onCancel={closeConfirm} />
      <div className="h-screen bg-background text-on-surface font-sans flex">
        {/* Sidebar */}
        <aside className="w-[280px] bg-white border-r border-slate-100 flex-shrink-0 hidden md:flex flex-col h-full sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">dashboard</span>
              </div>
              <div>
                <h1 className="text-xl text-slate-800 font-extrabold tracking-tight">Panel Admin</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">BMKG Jawa Timur</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {[
              { id: 'stations', icon: 'sensors', label: 'Daftar AWS', badge: stations.length },
              { id: 'observations', icon: 'fact_check', label: 'Data Pengamatan' },
              { id: 'announcements', icon: 'campaign', label: 'Pengumuman', badge: announcements.length },
              { id: 'climate', icon: 'thermostat', label: 'Warming Stripes' },
              { id: 'org', icon: 'account_tree', label: 'Struktur Organisasi', badge: orgMembers.length },
              { id: 'tempmaps', icon: 'map', label: 'Peta Suhu', badge: tempMaps.length },
              { id: 'rainfall', icon: 'rainy', label: 'Prakiraan Hujan', badge: rainfallForecasts.length },
              { id: 'hth', icon: 'wb_sunny', label: 'Hari Tanpa Hujan' },
            ].map(tab => (
              <a 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 text-primary font-bold shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                {activeTab === tab.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                  <span className="text-[14px]">{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                    {tab.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full z-0 bg-slate-50/50">
          {/* Header */}
          <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-center sticky top-0 z-10 shadow-sm w-full gap-4 md:gap-0">
            <div className="flex justify-between items-center w-full md:w-auto">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                  { activeTab === 'stations' && 'Manajemen AWS' }
                  { activeTab === 'observations' && 'Data Pengamatan (Excel)' }
                  { activeTab === 'announcements' && 'Kelola Pengumuman' }
                  { activeTab === 'climate' && 'Data Iklim (Warming Stripes)' }
                  { activeTab === 'org' && 'Struktur Organisasi' }
                  { activeTab === 'tempmaps' && 'Peta Perubahan Suhu' }
                  { activeTab === 'rainfall' && 'Prakiraan Curah Hujan' }
                  { activeTab === 'hth' && 'Update Data HTH' }
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola data dan konfigurasi sistem</p>
              </div>
              
              {/* Mobile Profile Icon */}
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <span className="material-symbols-outlined text-xl text-slate-600">person</span>
                </div>
              </div>
            </div>

            {/* Desktop Profile Info */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right">
                <p className="text-[14px] font-bold text-slate-800">Admin Utama</p>
                <p className="text-[12px] text-slate-500">Stasiun Klimatologi Jatim</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <span className="material-symbols-outlined text-2xl text-slate-600">person</span>
              </div>
            </div>

            {/* Mobile Tab Navigation (Horizontal Scroll) */}
            <div className="md:hidden flex overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 gap-2">
               {[
                  { id: 'stations', label: 'AWS' },
                  { id: 'announcements', label: 'Pengumuman' },
                  { id: 'climate', label: 'Stripes' },
                  { id: 'org', label: 'Organisasi' },
                  { id: 'tempmaps', label: 'Peta Suhu' },
                  { id: 'rainfall', label: 'Hujan' },
                  { id: 'hth', label: 'HTH' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 pb-32">
            
            {activeTab === 'stations' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manage AWS Table Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">sensors</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Daftar Stasiun AWS</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[13px] uppercase tracking-wider">
                          <th className="py-3 px-6 font-semibold">Station ID</th>
                          <th className="py-3 px-6 font-semibold">Location</th>
                          <th className="py-3 px-6 font-semibold">Status</th>
                          <th className="py-3 px-6 font-semibold">Visibility</th>
                          <th className="py-3 px-6 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {stations.map((st, i) => (
                          <tr key={st.id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors group ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/10'}`}>
                            <td className="py-4 px-6 font-semibold text-slate-700">{st.station_id}</td>
                            <td className="py-4 px-6 text-slate-600">
                              <div className="text-xs text-slate-400 mb-1">{st.station_name}</div>
                              <input 
                                type="text"
                                placeholder="Nama Publik..."
                                defaultValue={st.display_name || ""}
                                onBlur={(e) => supabaseUpdate("stations", `id=eq.${st.id}`, { display_name: e.target.value })}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                              />
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.status === 'Online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span> {st.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-4">
                                <label className="flex items-center cursor-pointer group/chk gap-2">
                                  <div className="relative">
                                    <input type="checkbox" checked={st.show_on_home} onChange={() => handleToggleVisibility(st.id, 'show_on_home', st.show_on_home)} className="peer sr-only" />
                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-500 group-hover/chk:text-slate-800 transition-colors">Slider</span>
                                </label>
                                <label className="flex items-center cursor-pointer group/chk gap-2">
                                  <div className="relative">
                                    <input type="checkbox" checked={st.show_on_realtime} onChange={() => handleToggleVisibility(st.id, 'show_on_realtime', st.show_on_realtime)} className="peer sr-only" />
                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-500 group-hover/chk:text-slate-800 transition-colors">Realtime</span>
                                </label>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button onClick={() => handleDeleteStation(st.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 ml-auto focus:opacity-100">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {stations.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada stasiun</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add New Station Form */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Quick Add AWS</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddStation}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Station ID</label>
                      <input required value={newStation.id_sta} onChange={e => setNewStation({...newStation, id_sta: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="e.g. AWS-KJN-04" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lokasi</label>
                      <input required value={newStation.name} onChange={e => setNewStation({...newStation, name: e.target.value, table: `aws_${e.target.value.toLowerCase().replace(/\s+/g, '_')}`})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="e.g. AWS Kepanjen" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Tabel DB (Auto)</label>
                      <input required value={newStation.table} onChange={e => setNewStation({...newStation, table: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-500 bg-slate-50" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Initial Status</label>
                      <select value={newStation.status} onChange={e => setNewStation({...newStation, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option>Online</option>
                        <option>Offline</option>
                        <option>Maintenance</option>
                      </select>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Tambahkan Stasiun
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {activeTab === 'observations' && (
              <section className="space-y-8">
                {/* 1. Header Banner & Status */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-[1.75rem] font-semibold text-on-surface">Data Pengamatan Harian (BMKG)</h3>
                    <p className="text-sm text-secondary mt-1">
                      Unggah berkas Excel pengamatan harian (.xlsx / .xls) untuk otomatis mengekstrak parameter, atau lakukan input/edit data langsung di bawah.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                    <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-xs">
                      <span className="text-slate-500 font-medium block">Data Aktif di Website:</span>
                      <span className="font-bold text-primary text-sm">{activeObservationDate || "Belum Ada Data"}</span>
                      {activeObservationSync && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Sinkron: {
                            (() => {
                              let safeStr = activeObservationSync;
                              if (safeStr.includes(" ") && !safeStr.includes("T")) safeStr = safeStr.replace(" ", "T");
                              if (!safeStr.endsWith("Z") && !safeStr.includes("+") && safeStr.length === 19) safeStr += "+07:00";
                              return new Date(safeStr).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':');
                            })()
                          } WIB
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshData}
                      disabled={isRefreshingData}
                      className="px-5 py-2 rounded-full text-sm font-bold border-[1.5px] border-primary bg-white text-primary hover:bg-primary hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm group disabled:opacity-70 disabled:cursor-wait"
                      title="Muat ulang dari database"
                    >
                      <span className={`material-symbols-outlined text-[20px] ${isRefreshingData ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>sync</span>
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* 2. Upload Excel Dropzone */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <h4 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">upload_file</span>
                    Unggah Berkas Excel (.xlsx / .xls)
                  </h4>
                  <div
                    onClick={() => document.getElementById("adminExcelInputObservation")?.click()}
                    className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3"
                  >
                    <input
                      type="file"
                      id="adminExcelInputObservation"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: "none" }}
                      onChange={handleExcelUpload}
                    />
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">
                        {isParsingExcel ? "progress_activity" : "description"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary text-base">
                        {isParsingExcel ? "Sedang Membaca Berkas..." : "Klik atau Seret Berkas Excel (.xlsx) ke Sini"}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        Sistem akan otomatis mengekstrak tanggal, ringkasan cuaca (Tx, Tn, Curah Hujan), dan data per jam.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Form Editor: Parameter Harian & Tabel Jam */}
                <form onSubmit={handleSaveObservation} className="space-y-6">
                  {/* Parameter Harian Card */}
                  <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">thermostat</span>
                        Ringkasan Parameter Cuaca Harian (24 Jam)
                      </h4>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                        File: {observationDaily.source_file || "Manual"}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Metode Upload</label>
                      <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={newRainfall.uploadMode === 'shp'} onChange={() => setNewRainfall({...newRainfall, uploadMode: 'shp'})} className="accent-primary" />
                          <span className="text-sm font-medium">Konversi Otomatis (SHP & DBF)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={newRainfall.uploadMode === 'json'} onChange={() => setNewRainfall({...newRainfall, uploadMode: 'json'})} className="accent-primary" />
                          <span className="text-sm font-medium">Upload File GeoJSON (.json)</span>
                        </label>
                      </div>

                      {newRainfall.uploadMode === 'shp' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                              <MapIcon className="h-4 w-4 text-blue-500" />
                              File Geometri (.shp)
                            </label>
                            <input 
                              type="file" 
                              accept=".shp"
                              onChange={(e) => setNewRainfall({...newRainfall, fileShp: e.target.files?.[0] || null})}
                              className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                              <TableCellsIcon className="h-4 w-4 text-emerald-500" />
                              File Atribut (.dbf)
                            </label>
                            <input 
                              type="file" 
                              accept=".dbf"
                              onChange={(e) => setNewRainfall({...newRainfall, fileDbf: e.target.files?.[0] || null})}
                              className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                          </div>
                          <div className="col-span-full mt-1">
                            <p className="text-xs text-slate-500 flex items-start gap-1.5">
                              <InformationCircleIcon className="h-4 w-4 shrink-0 text-amber-500" />
                              File SHP dan DBF akan diekstrak dan dikonversi menjadi GeoJSON secara aman di dalam browser sebelum disimpan. Pastikan kedua file adalah pasangan yang valid.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <CloudArrowUpIcon className="h-4 w-4 text-primary" />
                            File GeoJSON (.json)
                          </label>
                          <input 
                            type="file" 
                            accept=".json,application/json"
                            onChange={(e) => setNewRainfall({...newRainfall, fileJson: e.target.files?.[0] || null})}
                            className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors border border-slate-200 rounded-lg cursor-pointer bg-white"
                          />
                          <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-2">
                            <InformationCircleIcon className="h-4 w-4 shrink-0 text-blue-500" />
                            Upload file GeoJSON hasil konversi manual.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Tanggal Pengamatan
                        </label>
                        <input
                          required
                          type="text"
                          value={observationDaily.tanggal_pengamatan}
                          onChange={(e) => setObservationDaily({ ...observationDaily, tanggal_pengamatan: e.target.value })}
                          placeholder="e.g. 19 AGUSTUS 2026"
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white font-semibold text-primary focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Nama File Sumber
                        </label>
                        <input
                          type="text"
                          value={observationDaily.source_file}
                          onChange={(e) => setObservationDaily({ ...observationDaily, source_file: e.target.value })}
                          placeholder="e.g. 19-08-2026.xlsx"
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Curah Hujan (mm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={observationDaily.curah_hujan_mm}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setObservationDaily({
                              ...observationDaily,
                              curah_hujan_mm: val,
                              kategori_hujan: val <= 0 ? "Tidak Ada Hujan" : val <= 20 ? "Hujan Ringan" : val <= 50 ? "Hujan Sedang" : "Hujan Lebat",
                            });
                          }}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Kategori Hujan
                        </label>
                        <select
                          value={observationDaily.kategori_hujan}
                          onChange={(e) => setObservationDaily({ ...observationDaily, kategori_hujan: e.target.value })}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="Tidak Ada Hujan">Tidak Ada Hujan</option>
                          <option value="Hujan Sangat Ringan (Jejak)">Hujan Sangat Ringan (Jejak)</option>
                          <option value="Hujan Ringan">Hujan Ringan</option>
                          <option value="Hujan Sedang">Hujan Sedang</option>
                          <option value="Hujan Lebat">Hujan Lebat</option>
                          <option value="Hujan Sangat Lebat">Hujan Sangat Lebat</option>
                          <option value="Hujan Ekstrim">Hujan Ekstrim</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Suhu Maksimum (°C)
                        </label>
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={observationDaily.suhu_maksimum}
                          onChange={(e) => setObservationDaily({ ...observationDaily, suhu_maksimum: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white text-orange-600 font-bold focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Suhu Minimum (°C)
                        </label>
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={observationDaily.suhu_minimum}
                          onChange={(e) => setObservationDaily({ ...observationDaily, suhu_minimum: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white text-blue-600 font-bold focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Suhu Udara Rata-rata (°C)
                        </label>
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={observationDaily.suhu_udara_rata}
                          onChange={(e) => setObservationDaily({ ...observationDaily, suhu_udara_rata: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Kelembaban Udara Rata-rata (%)
                        </label>
                        <input
                          required
                          type="number"
                          step="1"
                          value={observationDaily.kelembaban_rata}
                          onChange={(e) => setObservationDaily({ ...observationDaily, kelembaban_rata: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Tekanan Udara QFE (mbar)
                        </label>
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={observationDaily.tekanan_udara_rata}
                          onChange={(e) => setObservationDaily({ ...observationDaily, tekanan_udara_rata: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Arah Angin Dominan
                        </label>
                        <input
                          type="text"
                          value={observationDaily.angin_arah_dominan}
                          onChange={(e) => setObservationDaily({ ...observationDaily, angin_arah_dominan: e.target.value })}
                          placeholder="e.g. Timur / 180"
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Kecepatan Angin Rata-rata (Knot)
                        </label>
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={observationDaily.angin_kecepatan_rata_kt}
                          onChange={(e) => setObservationDaily({ ...observationDaily, angin_kecepatan_rata_kt: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Kecepatan Angin Maksimum (Knot)
                        </label>
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={observationDaily.angin_kecepatan_max_kt}
                          onChange={(e) => setObservationDaily({ ...observationDaily, angin_kecepatan_max_kt: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Rangkuman Cuaca Ekstrim / Catatan Khusus
                      </label>
                      <textarea
                        rows={3}
                        value={observationDaily.rangkuman_info}
                        onChange={(e) => setObservationDaily({ ...observationDaily, rangkuman_info: e.target.value })}
                        placeholder="e.g. Suhu Minimum terendah : \n- Bulan Juli : 15.8˚C"
                        className="w-full border border-border rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* Tabel Data Per Jam */}
                  <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-3">
                      <div>
                        <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">schedule</span>
                          Data Pengamatan Tiap Jam ({observationHourly.length} Jam Observasi)
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Data ini digunakan untuk menghasilkan Grafik Suhu vs Kelembaban &amp; Tekanan vs Angin di halaman publik.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddHourlyModal}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-primary border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        <span>Tambah Baris Jam</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                          <tr className="border-b border-border text-secondary text-xs">
                            <th className="py-2.5 px-3 font-bold">Jam</th>
                            <th className="py-2.5 px-3 font-bold">Suhu (°C)</th>
                            <th className="py-2.5 px-3 font-bold">RH (%)</th>
                            <th className="py-2.5 px-3 font-bold">Tekanan (mbar)</th>
                            <th className="py-2.5 px-3 font-bold">Angin (Knot)</th>
                            <th className="py-2.5 px-3 font-bold">Arah</th>
                            <th className="py-2.5 px-3 font-bold text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {observationHourly.map((row, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={row.jam}
                                  onChange={(e) => handleHourlyRowChange(idx, "jam", e.target.value)}
                                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold bg-white"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={row.suhu_c}
                                  onChange={(e) => handleHourlyRowChange(idx, "suhu_c", parseFloat(e.target.value) || 0)}
                                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-orange-600 font-semibold"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={row.kelembaban_percent}
                                  onChange={(e) => handleHourlyRowChange(idx, "kelembaban_percent", parseFloat(e.target.value) || 0)}
                                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-cyan-600 font-semibold"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={row.tekanan_mbar}
                                  onChange={(e) => handleHourlyRowChange(idx, "tekanan_mbar", parseFloat(e.target.value) || 0)}
                                  className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-purple-600 font-semibold"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={row.kecepatan_angin_kt}
                                  onChange={(e) => handleHourlyRowChange(idx, "kecepatan_angin_kt", parseFloat(e.target.value) || 0)}
                                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-lime-600 font-semibold"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={row.arah_angin}
                                  onChange={(e) => handleHourlyRowChange(idx, "arah_angin", e.target.value)}
                                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveHourlyRow(idx)}
                                  className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                                  title="Hapus baris jam"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {observationHourly.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                                Belum ada data jam. Unggah file Excel atau klik "Tambah Baris Jam".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Submit Button Bar */}
                  <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3 sticky bottom-4 z-20">
                    <div className="text-xs text-text-secondary font-medium">
                      Pastikan parameter sudah sesuai sebelum menyimpan ke database.
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={loadObservationData}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border border-border bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer w-full sm:w-auto text-center"
                      >
                        Batal / Muat Ulang
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingObservation}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto ${
                          isSavingObservation ? "bg-primary/70 cursor-wait" : "bg-primary hover:bg-primary-dark hover:shadow-lg"
                        }`}
                      >
                        {isSavingObservation ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                            <span>Menyimpan ke Database...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-base">save</span>
                            <span>Simpan &amp; Aktifkan di Website</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            )}

            {activeTab === 'announcements' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Pengumuman */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">campaign</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Buat Pengumuman</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddAnnouncement}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Pengumuman</label>
                      <input required value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Masukkan judul..."/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                      <select value={newAnnouncement.category} onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="info">Informasi Umum</option>
                        <option value="peringatan_dini">Peringatan Dini</option>
                        <option value="kegiatan">Kegiatan BMKG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Prioritas</label>
                      <select value={newAnnouncement.priority} onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="normal">Normal</option>
                        <option value="tinggi">Tinggi (Merah)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Isi Konten</label>
                      <textarea required rows={4} value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 resize-none" placeholder="Tulis isi pengumuman di sini..."/>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">send</span>
                        Publikasikan
                      </button>
                    </div>
                  </form>
                </div>

                {/* Daftar Pengumuman */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Pengumuman Aktif</h3>
                  </div>
                  <div className="space-y-4">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${ann.priority === 'tinggi' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{ann.category}</span>
                            {ann.priority === 'tinggi' && <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">Penting</span>}
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg leading-tight">{ann.title}</h4>
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed">{ann.content}</p>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">campaign</span>
                        <p className="text-sm font-medium">Belum ada pengumuman.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'climate' && (
              <section className="space-y-8">
                {/* 1. Warming Stripes Management */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">thermostat</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Kelola Data CSV Warming Stripes</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Sistem akan otomatis mendeteksi kolom tahun dan wilayah.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('stripes')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        <span>Reset ke Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('stripes')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        <span>Kosongkan</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputStripes")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group"
                    >
                      <input
                        type="file"
                        id="adminCsvInputStripes"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'stripes')}
                      />
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-sm text-slate-500 mt-1">Format .csv dengan Anomali Suhu</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Atau Tempelkan (Paste) Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextStripes}
                        onChange={(e) => setCsvTextStripes(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,-0.338,-0.834&#10;..."
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextStripes, 'stripes')}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-900 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        Proses &amp; Unggah CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">visibility</span> Preview Warming Stripes</h4>
                    <WarmingStripesViewer parsedData={climatePreviewStripes} selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
                  </div>
                </div>

                {/* 2. Annual Temperatures Management */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">timeline</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Kelola Data CSV Suhu Tahunan</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Suhu absolut rata-rata untuk ditampilkan sebagai grafik garis.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('annual')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        <span>Reset ke Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('annual')}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        <span>Kosongkan</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputAnnual")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group"
                    >
                      <input
                        type="file"
                        id="adminCsvInputAnnual"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'annual')}
                      />
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-sm text-slate-500 mt-1">Format .csv dengan Suhu Absolut</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Atau Tempelkan (Paste) Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextAnnual}
                        onChange={(e) => setCsvTextAnnual(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,24.41,27.22&#10;..."
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextAnnual, 'annual')}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-900 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        Proses &amp; Unggah CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">monitoring</span> Preview Grafik Suhu</h4>
                    <TemperatureLineChart parsedData={climatePreviewAnnual} selectedRegion={selectedRegion} />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'org' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Anggota */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Input Data Anggota</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddOrgMember}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Posisi / Kategori Visual (Role ID)</label>
                      <select required value={newOrgMember.role_id} onChange={e => setNewOrgMember({...newOrgMember, role_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="">-- Pilih Posisi --</option>
                        <option value="kepala">KEPALA UPT (Biru Tua)</option>
                        <option value="kasubag">KEPALA SUB BAGIAN (Hijau)</option>
                        <option value="tim_1">KETUA TIM KERJA 1 (Oranye)</option>
                        <option value="tim_2">KETUA TIM KERJA 2 (Biru)</option>
                        <option value="tim_3">KETUA TIM KERJA 3 (Nila)</option>
                        <option value="tim_4">KETUA TIM KERJA 4 (Merah Muda)</option>
                        <option value="tim_5">KETUA TIM KERJA 5 (Ungu)</option>
                        <option value="tim_6">KETUA TIM KERJA 6 (Hijau)</option>
                        <option value="fungsional_pmg">FUNGSIONAL PMG (Oranye)</option>
                        <option value="fungsional_non_pmg">FUNGSIONAL NON PMG (Hijau)</option>
                        <option value="anggota">ANGGOTA / STAF BARU</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Di Bawah Siapa (Parent)</label>
                      <select value={newOrgMember.parent_role_id} onChange={e => setNewOrgMember({...newOrgMember, parent_role_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="">-- Posisi Teratas (Tidak ada atasan) --</option>
                        {orgMembers.map(m => (
                          <option key={m.id} value={m.role_id}>{m.name} ({m.role_title})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Jabatan Ditampilkan</label>
                      <input required value={newOrgMember.role_title} onChange={e => setNewOrgMember({...newOrgMember, role_title: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="e.g. KEPALA UPT, ANGGOTA" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Pegawai</label>
                      <input required value={newOrgMember.name} onChange={e => setNewOrgMember({...newOrgMember, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Nama beserta gelar" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">NIP (Opsional)</label>
                      <input value={newOrgMember.nip} onChange={e => setNewOrgMember({...newOrgMember, nip: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="1974..." />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        id="showTitle"
                        checked={newOrgMember.show_role_title}
                        onChange={(e) => setNewOrgMember({...newOrgMember, show_role_title: e.target.checked})}
                        className="w-5 h-5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <label htmlFor="showTitle" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                        Tampilkan Nama Jabatan di Profil
                      </label>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Simpan Anggota
                      </button>
                    </div>
                  </form>
                </div>

                {/* Daftar Anggota */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Anggota Saat Ini</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgMembers.map(m => (
                      <div key={m.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
                        <div className="flex-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {m.role_id.startsWith('anggota') ? 'ANGGOTA' : m.role_id}
                          </span>
                          {m.parent_role_id && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              ↓ {orgMembers.find(o => o.role_id === m.parent_role_id)?.name || m.parent_role_id}
                            </span>
                          )}
                          <h4 className="font-bold text-slate-800 text-sm mt-3 leading-tight">
                            {m.role_title} 
                            {!m.show_role_title && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 rounded uppercase">Hidden</span>}
                          </h4>
                          <p className="text-base text-primary mt-1 font-bold">{m.name}</p>
                          <p className="text-xs text-slate-500 mt-1 font-mono">NIP: {m.nip || "-"}</p>
                        </div>
                        <button onClick={() => handleDeleteOrgMember(m.id)} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    {orgMembers.length === 0 && (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
                        <p className="text-sm font-medium">Belum ada data anggota.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'tempmaps' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Upload/Edit */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">map</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {editTempMapId ? "Edit Peta Suhu" : "Upload Peta Suhu Baru"}
                    </h3>
                  </div>
                  <form onSubmit={editTempMapId ? handleEditTempMap : handleAddTempMap} className="flex flex-col gap-4 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gambar Peta {editTempMapId && "(Opsional)"}</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        required={!editTempMapId}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setNewTempMap({...newTempMap, file});
                        }} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tahun</label>
                      <input 
                        required 
                        type="number" 
                        min="1900" 
                        max="2100"
                        value={newTempMap.year} 
                        onChange={e => setNewTempMap({...newTempMap, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Kejadian</label>
                      <select 
                        required 
                        value={newTempMap.category} 
                        onChange={e => setNewTempMap({...newTempMap, category: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="Normal">Normal</option>
                        <option value="El Niño">El Niño</option>
                        <option value="La Niña">La Niña</option>
                      </select>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button 
                        type="submit" 
                        disabled={isUploadingTempMap}
                        className={`w-full text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isUploadingTempMap ? 'bg-primary/70 cursor-wait' : 'bg-gradient-to-r from-primary to-blue-600 hover:scale-[1.02] active:scale-95'}`}
                      >
                        {isUploadingTempMap ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[20px]">{editTempMapId ? 'save' : 'cloud_upload'}</span>
                            <span>{editTempMapId ? "Simpan Perubahan" : "Simpan Peta"}</span>
                          </>
                        )}
                      </button>
                      {editTempMapId && (
                        <button 
                          type="button" 
                          onClick={cancelEditTempMap}
                          disabled={isUploadingTempMap}
                          className="w-full text-slate-600 py-3 mt-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Daftar Peta */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">photo_library</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Galeri Peta Suhu ({tempMaps.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tempMaps.map(m => (
                      <div key={m.id} className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative">
                        <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden group-hover:brightness-90 transition-all">
                          <img 
                            src={m.image_url} 
                            alt={`Peta Suhu ${m.year} - ${m.category}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                            <span className="bg-white/95 backdrop-blur-md text-slate-800 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">
                              {m.year}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-sm text-white backdrop-blur-md ${m.category === 'El Niño' ? 'bg-red-600/90' : m.category === 'La Niña' ? 'bg-blue-600/90' : 'bg-emerald-600/90'}`}>
                              {m.category}
                            </span>
                          </div>
                          
                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                              onClick={() => startEditTempMap(m)} 
                              className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-lg"
                              title="Edit Peta"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteTempMap(m.id, m.image_url)} 
                              className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-red-600 hover:text-white hover:scale-110 transition-all shadow-lg"
                              title="Hapus Peta"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tempMaps.length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">map</span>
                        <p className="text-sm font-medium">Belum ada data peta suhu.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rainfall' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Upload */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Upload Prakiraan Hujan
                    </h3>
                  </div>
                  <form onSubmit={handleAddRainfall} className="flex flex-col gap-4 flex-1">
                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Metode Upload</label>
                      <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={newRainfall.uploadMode === 'shp'} onChange={() => setNewRainfall({...newRainfall, uploadMode: 'shp'})} className="accent-primary" />
                          <span className="text-sm font-medium">SHP & DBF (Konversi Otomatis)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={newRainfall.uploadMode === 'json'} onChange={() => setNewRainfall({...newRainfall, uploadMode: 'json'})} className="accent-primary" />
                          <span className="text-sm font-medium">File GeoJSON (.json)</span>
                        </label>
                      </div>

                      {newRainfall.uploadMode === 'shp' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                              <span>File .SHP (Geometri)</span>
                              {newRainfall.fileShp && <span className="text-emerald-500"><i className="fas fa-check-circle"></i> Terpilih</span>}
                            </label>
                            <input 
                              type="file" 
                              accept=".shp" 
                              onChange={e => setNewRainfall({...newRainfall, fileShp: e.target.files?.[0] || null})} 
                              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                              <span>File .DBF (Atribut)</span>
                              {newRainfall.fileDbf && <span className="text-emerald-500"><i className="fas fa-check-circle"></i> Terpilih</span>}
                            </label>
                            <input 
                              type="file" 
                              accept=".dbf" 
                              onChange={e => setNewRainfall({...newRainfall, fileDbf: e.target.files?.[0] || null})} 
                              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                            />
                          </div>
                          <div className="col-span-full mt-1">
                            <p className="text-xs text-slate-500 flex items-start gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0">info</span>
                              File akan diekstrak dan dikonversi secara aman di browser sebelum disimpan. Pastikan kedua file valid.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                            <span>File GeoJSON (.json)</span>
                            {newRainfall.fileJson && <span className="text-emerald-500"><i className="fas fa-check-circle"></i> Terpilih</span>}
                          </label>
                          <input 
                            type="file" 
                            accept=".json,application/json" 
                            onChange={e => setNewRainfall({...newRainfall, fileJson: e.target.files?.[0] || null})} 
                            className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          />
                          <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-blue-500 shrink-0">info</span>
                            Upload file GeoJSON yang sebelumnya sudah Anda konversi (seperti analisis_xxx.json).
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tahun</label>
                      <input 
                        required 
                        type="number" 
                        min="2000" 
                        max="2100"
                        value={newRainfall.year} 
                        onChange={e => setNewRainfall({...newRainfall, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bulan</label>
                      <select 
                        required 
                        value={newRainfall.month} 
                        onChange={e => setNewRainfall({...newRainfall, month: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => {
                          const monthStr = m.toString().padStart(2, '0');
                          const monthName = new Date(2000, m - 1, 1).toLocaleString('id-ID', { month: 'long' });
                          return <option key={monthStr} value={monthStr}>{monthName}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Waktu</label>
                      <select 
                        required 
                        value={newRainfall.category} 
                        onChange={e => setNewRainfall({...newRainfall, category: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="dasarian">Dasarian</option>
                        <option value="bulanan">Bulanan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Label Tambahan</label>
                      <input 
                        type="text" 
                        value={newRainfall.label} 
                        onChange={e => setNewRainfall({...newRainfall, label: e.target.value})} 
                        placeholder="e.g. Dasarian I"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                      />
                    </div>
                    <div className="pt-4 mt-auto">
                      <button 
                        type="submit" 
                        disabled={isUploadingRainfall}
                        className={`w-full text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isUploadingRainfall ? 'bg-primary/70 cursor-wait' : 'bg-gradient-to-r from-primary to-blue-600 hover:scale-[1.02] active:scale-95'}`}
                      >
                        {isUploadingRainfall ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                            <span>Upload Data</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Daftar Prakiraan */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Data Prakiraan ({rainfallForecasts.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rainfallForecasts.map(r => (
                      <div key={r.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all flex flex-col gap-2 relative group">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {r.category}
                            </span>
                            <h4 className="font-bold text-slate-800 mt-2 text-sm">{new Date(r.year, parseInt(r.month)-1, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h4>
                            <p className="text-xs text-slate-500 font-medium">{r.label}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteRainfall(r.id, r.file_path)} 
                            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                            title="Hapus Data"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400 break-all font-mono bg-white p-2 rounded-lg border border-slate-100 line-clamp-1" title={r.file_path}>
                          {r.file_path.split('/').pop()}
                        </div>
                      </div>
                    ))}
                    {rainfallForecasts.length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">cloud_off</span>
                        <p className="text-sm font-medium">Belum ada data prakiraan curah hujan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HTH Tab */}
            {activeTab === 'hth' && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">settings</span>
                        Konfigurasi & Sinkronisasi Data HTH
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Tarik data Hari Tanpa Hujan dari Google Sheets secara langsung.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <form onSubmit={handleSaveHthTitle} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Judul Peta HTH</label>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                            value={hthConfig.judul} 
                            onChange={e => setHthConfig({...hthConfig, judul: e.target.value})} 
                          />
                          <button type="submit" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                            Simpan Judul
                          </button>
                        </div>
                      </div>
                    </form>

                    <hr className="border-slate-100" />

                    <form onSubmit={handleSyncHth} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">URL Google Sheets (CSV Format)</label>
                        <p className="text-xs text-slate-500 mb-2 italic">Pastikan Google Sheet sudah di-Publish to Web dengan format CSV.</p>
                        <input 
                          type="url" 
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                          placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                          value={hthConfig.url} 
                          onChange={e => setHthConfig({...hthConfig, url: e.target.value})} 
                        />
                      </div>
                      
                      <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div>
                          <div className="text-sm font-bold text-slate-700">Status Data Saat Ini:</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Total Data: <strong className="text-primary">{hthStats.totalData} Pos</strong> &bull; Terakhir Diperbarui: <strong>{hthStats.lastUpdate}</strong>
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={isSyncingHth}
                          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSyncingHth ? (
                            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Menyinkronkan...</>
                          ) : (
                            <><span className="material-symbols-outlined">sync</span> Tarik Data Terbaru</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modal Tambah Baris Jam */}
      {isAddHourlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Tambah Data Per Jam
              </h3>
              <button 
                onClick={() => setIsAddHourlyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
              {/* Panduan Pengisian */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-primary mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span> Panduan Pengisian:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><strong>Jam</strong>: Format 24 jam (misal 07:00, 13:00, 22:00).</li>
                  <li><strong>Suhu (°C)</strong>: Rentang normal BMKG (15.0 - 40.0 °C).</li>
                  <li><strong>RH (%)</strong>: Kelembaban relatif udara (30 - 100%).</li>
                  <li><strong>Tekanan (mbar)</strong>: Tekanan QFE lokal (900.0 - 1050.0).</li>
                  <li><strong>Angin (Knot)</strong>: Kecepatan angin rata-rata jam tersebut (0 - 40).</li>
                </ul>
              </div>

              <form id="addHourlyForm" onSubmit={handleConfirmAddHourlyRow} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Jam (HH:MM)</label>
                  <input required type="text" value={newHourlyRow.jam} onChange={e => setNewHourlyRow({...newHourlyRow, jam: e.target.value})} placeholder="07:00" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Suhu (°C)</label>
                  <input required type="number" step="0.1" value={newHourlyRow.suhu_c} onChange={e => setNewHourlyRow({...newHourlyRow, suhu_c: parseFloat(e.target.value) || 0})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kelembaban (%)</label>
                  <input required type="number" step="1" value={newHourlyRow.kelembaban_percent} onChange={e => setNewHourlyRow({...newHourlyRow, kelembaban_percent: parseFloat(e.target.value) || 0})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tekanan (mbar)</label>
                  <input required type="number" step="0.1" value={newHourlyRow.tekanan_mbar} onChange={e => setNewHourlyRow({...newHourlyRow, tekanan_mbar: parseFloat(e.target.value) || 0})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kecepatan Angin (Knot)</label>
                  <input required type="number" step="0.1" value={newHourlyRow.kecepatan_angin_kt} onChange={e => setNewHourlyRow({...newHourlyRow, kecepatan_angin_kt: parseFloat(e.target.value) || 0})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Arah Angin</label>
                  <input required type="text" value={newHourlyRow.arah_angin} onChange={e => setNewHourlyRow({...newHourlyRow, arah_angin: e.target.value})} placeholder="Timur / 90" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAddHourlyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold border border-border bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="addHourlyForm"
                className="px-6 py-2 rounded-xl text-sm font-bold bg-primary hover:bg-primary-dark text-white shadow-md transition-colors flex items-center gap-2"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background text-primary font-bold text-xl"><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat Panel Admin...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
