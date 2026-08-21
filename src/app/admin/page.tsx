"use client";

import { useState, useEffect } from "react";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseRpc, supabaseUploadFile, supabaseDeleteFile, supabaseGetPublicUrl } from "@/lib/supabase";
import { FALLBACK_STATIONS } from "@/lib/constants";
import { WarmingStripesViewer } from "@/components/climate/warming-stripes-viewer";
import { TemperatureLineChart } from "@/components/climate/temperature-line-chart";
import { parseCSVText, ClimateParsedResult } from "@/lib/climate-parser";
import { parseObservationExcel, ParsedDailyObservation, ParsedHourlyObservation } from "@/lib/excel-parser";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function AdminPage() {
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState("stations");
  const [stations, setStations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  
  const [newStation, setNewStation] = useState({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", category: "info", priority: "normal", image_url: "", instagram_url: "", is_featured: false });
  const [newOrgMember, setNewOrgMember] = useState({ role_id: "", role_title: "", name: "", nip: "" });

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
  }, []);

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
    await supabaseDelete("organization_structure", `role_id=eq.${newOrgMember.role_id}`);
    const result = await supabaseInsert("organization_structure", {
      role_id: newOrgMember.role_id,
      role_title: newOrgMember.role_title,
      name: newOrgMember.name,
      nip: newOrgMember.nip
    });
    if (result) {
      toast.success("Anggota organisasi berhasil disimpan!");
      setNewOrgMember({ role_id: "", role_title: "", name: "", nip: "" });
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

  return (
    <>
      <ConfirmDialog {...confirmConfig} onCancel={closeConfirm} />
      <div className="h-screen bg-background text-on-surface font-sans flex">
        {/* Sidebar */}
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0 hidden md:flex flex-col h-full sticky top-0 shadow-sm z-10">
          <div className="p-6 border-b border-border">
            <h1 className="text-[1.75rem] text-primary font-bold">Panel Admin</h1>
            <p className="text-[14px] text-secondary mt-1">BMKG Malang</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <a 
              onClick={() => setActiveTab('stations')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'stations' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">sensors</span>
              <span className="text-[14px] font-medium">Manage Stations</span>
            </a>
            <a 
              onClick={() => setActiveTab('observations')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'observations' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">fact_check</span>
              <span className="text-[14px] font-medium">Data Pengamatan (Excel)</span>
            </a>
            <a 
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'announcements' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">campaign</span>
              <span className="text-[14px] font-medium">Announcements</span>
            </a>
            <a 
              onClick={() => setActiveTab('climate')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'climate' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">thermostat</span>
              <span className="text-[14px] font-medium">Visualisasi Iklim (CSV)</span>
            </a>
            <a 
              onClick={() => setActiveTab('org')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'org' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">account_tree</span>
              <span className="text-[14px] font-medium">Struktur Organisasi</span>
            </a>
            <a 
              onClick={() => setActiveTab('tempmaps')}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'tempmaps' ? 'bg-primary-container text-on-primary font-bold' : 'text-secondary hover:bg-surface-container-low hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">map</span>
              <span className="text-[14px] font-medium">Peta Suhu</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full z-0">
          {/* Header */}
          <header className="bg-surface border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm w-full">
            <div className="md:hidden">
              <h1 className="text-[1.75rem] text-primary font-bold">Panel Admin</h1>
            </div>
            <div className="hidden md:block">
              <h2 className="text-[28px] font-semibold text-text-primary">
                {activeTab === 'stations' && 'Manage Stations (AWS)'}
                {activeTab === 'observations' && 'Kelola Data Pengamatan Harian (Excel)'}
                {activeTab === 'announcements' && 'Announcements'}
                {activeTab === 'climate' && 'Visualisasi Perubahan Iklim (Warming Stripes)'}
                {activeTab === 'org' && 'Struktur Organisasi'}
                {activeTab === 'tempmaps' && 'Peta Suhu'}
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-primary">account_circle</span>
                <div className="hidden lg:block">
                  <p className="text-[14px] font-bold text-on-surface">Admin Utama</p>
                  <p className="text-[14px] text-secondary text-xs">admin@bmkg.go.id</p>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-6 max-w-7xl mx-auto w-full space-y-8 pb-32">
            
            {activeTab === 'stations' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manage AWS Table Card */}
                <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[1.75rem] font-semibold text-on-surface">Daftar AWS</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-secondary text-[14px]">
                          <th className="py-2 px-2 font-medium">Station ID</th>
                          <th className="py-2 px-2 font-medium">Location</th>
                          <th className="py-2 px-2 font-medium">Status</th>
                          <th className="py-2 px-2 font-medium">Visibility</th>
                          <th className="py-2 px-2 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {stations.map(st => (
                          <tr key={st.id} className="border-b border-border/50 hover:bg-surface-container-low transition-colors">
                            <td className="py-4 px-2 font-medium">{st.station_id}</td>
                            <td className="py-4 px-2">{st.station_name}</td>
                            <td className="py-4 px-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.status === 'Online' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                <span className={`w-2 h-2 rounded-full ${st.status === 'Online' ? 'bg-success' : 'bg-warning'}`}></span> {st.status}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex gap-2">
                                <label className="flex items-center cursor-pointer">
                                  <input type="checkbox" checked={st.show_on_home} onChange={() => handleToggleVisibility(st.id, 'show_on_home', st.show_on_home)} className="mr-1" />
                                  <span className="text-xs text-secondary">Home</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                  <input type="checkbox" checked={st.show_on_realtime} onChange={() => handleToggleVisibility(st.id, 'show_on_realtime', st.show_on_realtime)} className="mr-1" />
                                  <span className="text-xs text-secondary">RT</span>
                                </label>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <button onClick={() => handleDeleteStation(st.id)} className="text-secondary hover:text-error transition-colors p-1"><span className="material-symbols-outlined text-sm">delete</span></button>
                            </td>
                          </tr>
                        ))}
                        {stations.length === 0 && <tr><td colSpan={5} className="py-4 text-center">Belum ada stasiun</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add New Station Form */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Quick Add AWS</h3>
                  <form className="space-y-4 flex-1" onSubmit={handleAddStation}>
                    <div>
                      <label className="block text-[14px] text-on-surface-variant mb-1">Station ID</label>
                      <input required value={newStation.id_sta} onChange={e => setNewStation({...newStation, id_sta: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. AWS-KJN-04" type="text"/>
                    </div>
                    <div>
                      <label className="block text-[14px] text-on-surface-variant mb-1">Nama Lokasi</label>
                      <input required value={newStation.name} onChange={e => setNewStation({...newStation, name: e.target.value, table: `aws_${e.target.value.toLowerCase().replace(/\s+/g, '_')}`})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. AWS Kepanjen" type="text"/>
                    </div>
                    <div>
                      <label className="block text-[14px] text-on-surface-variant mb-1">Nama Tabel DB (Auto)</label>
                      <input required value={newStation.table} onChange={e => setNewStation({...newStation, table: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" type="text"/>
                    </div>
                    <div>
                      <label className="block text-[14px] text-on-surface-variant mb-1">Initial Status</label>
                      <select value={newStation.status} onChange={e => setNewStation({...newStation, status: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none">
                        <option>Online</option>
                        <option>Offline</option>
                        <option>Maintenance</option>
                      </select>
                    </div>
                    <div className="pt-2 mt-auto">
                      <button type="submit" className="w-full bg-primary-container text-on-primary py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">Add Station</button>
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
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Buat Pengumuman</h3>
                  <form className="space-y-4 flex-1" onSubmit={handleAddAnnouncement}>
                    <div>
                      <label className="block text-[14px] mb-1">Judul</label>
                      <input required value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text"/>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Kategori</label>
                      <select value={newAnnouncement.category} onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="info">Informasi Umum</option>
                        <option value="peringatan_dini">Peringatan Dini</option>
                        <option value="kegiatan">Kegiatan BMKG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Prioritas</label>
                      <select value={newAnnouncement.priority} onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="normal">Normal</option>
                        <option value="tinggi">Tinggi (Merah)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Isi Konten</label>
                      <textarea required rows={4} value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm"/>
                    </div>
                    <div className="pt-2 mt-auto">
                      <button type="submit" className="w-full bg-primary-container text-on-primary py-2 rounded-lg font-medium hover:opacity-90">Publikasikan</button>
                    </div>
                  </form>
                </div>

                {/* Daftar Pengumuman */}
                <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Daftar Pengumuman</h3>
                  <div className="space-y-3">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-4 rounded-xl border border-border flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-bold uppercase text-primary tracking-wider">{ann.category}</span>
                          <h4 className="font-bold text-text-primary text-base mt-1">{ann.title}</h4>
                          <p className="text-xs text-text-secondary line-clamp-2 mt-1">{ann.content}</p>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-secondary hover:text-error transition-colors p-1 shrink-0">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    {announcements.length === 0 && <p className="text-sm text-text-secondary">Belum ada pengumuman.</p>}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'climate' && (
              <section className="space-y-8">
                {/* 1. Warming Stripes Management */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h3 className="text-[1.75rem] font-semibold text-on-surface">Kelola Data CSV Warming Stripes</h3>
                      <p className="text-sm text-secondary mt-1">
                        Unggah berkas CSV baru ke Supabase Storage. Sistem akan otomatis mendeteksi kolom tahun dan wilayah.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('stripes')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-surface-container-low text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-primary">restart_alt</span>
                        <span>Reset ke Data Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('stripes')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                        <span>Kosongkan Data</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputStripes")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3"
                    >
                      <input
                        type="file"
                        id="adminCsvInputStripes"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'stripes')}
                      />
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-base">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-xs text-text-secondary mt-1">Format .csv dengan Anomali Suhu</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Atau Tempelkan (Paste) Teks Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextStripes}
                        onChange={(e) => setCsvTextStripes(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,-0.338,-0.834&#10;..."
                        className="w-full border border-border rounded-xl p-3 text-xs font-mono bg-white focus:ring-2 focus:ring-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextStripes, 'stripes')}
                        className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-base">cloud_upload</span>
                        Proses &amp; Unggah Data CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
                    <h4 className="font-bold mb-4">Preview Warming Stripes</h4>
                    <WarmingStripesViewer parsedData={climatePreviewStripes} selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
                  </div>
                </div>

                {/* 2. Annual Temperatures Management */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h3 className="text-[1.75rem] font-semibold text-on-surface">Kelola Data CSV Suhu Tahunan</h3>
                      <p className="text-sm text-secondary mt-1">
                        Unggah berkas CSV berisi suhu absolut untuk ditampilkan sebagai grafik garis.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetDefaultCSV('annual')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-surface-container-low text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-primary">restart_alt</span>
                        <span>Reset ke Data Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCSV('annual')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                        <span>Kosongkan Data</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => document.getElementById("adminCsvInputAnnual")?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3"
                    >
                      <input
                        type="file"
                        id="adminCsvInputAnnual"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, 'annual')}
                      />
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-base">Klik untuk Memilih Berkas CSV</h4>
                        <p className="text-xs text-text-secondary mt-1">Format .csv dengan Suhu Absolut Rata-rata</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Atau Tempelkan (Paste) Teks Raw CSV:
                      </label>
                      <textarea
                        rows={5}
                        value={csvTextAnnual}
                        onChange={(e) => setCsvTextAnnual(e.target.value)}
                        placeholder="Tahun,KAB. MALANG,KOTA SURABAYA&#10;1991,24.41,27.22&#10;..."
                        className="w-full border border-border rounded-xl p-3 text-xs font-mono bg-white focus:ring-2 focus:ring-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => processAndUploadCSV(csvTextAnnual, 'annual')}
                        className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-base">cloud_upload</span>
                        Proses &amp; Unggah Data CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
                    <h4 className="font-bold mb-4">Preview Grafik Suhu</h4>
                    <TemperatureLineChart parsedData={climatePreviewAnnual} selectedRegion={selectedRegion} />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'org' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Anggota */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Input Data Anggota</h3>
                  <form className="space-y-4 flex-1" onSubmit={handleAddOrgMember}>
                    <div>
                      <label className="block text-[14px] mb-1">Posisi Jabatan (Role ID)</label>
                      <select required value={newOrgMember.role_id} onChange={e => setNewOrgMember({...newOrgMember, role_id: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="">-- Pilih Posisi --</option>
                        <option value="kepala">KEPALA UPT</option>
                        <option value="kasubag">KEPALA SUB BAGIAN TATA USAHA</option>
                        <option value="tim_1">KETUA TIM KERJA ANALISA...</option>
                        <option value="tim_2">KETUA TIM KERJA MANAJEMEN...</option>
                        <option value="tim_3">KETUA TIM KERJA OBSERVASI...</option>
                        <option value="tim_4">KETUA TIM KERJA PELAYANAN...</option>
                        <option value="tim_5">KETUA TIM KERJA INSTRUMENTASI...</option>
                        <option value="tim_6">KETUA TIM KERJA TATA USAHA</option>
                        <option value="fungsional_pmg">FUNGSIONAL PMG</option>
                        <option value="fungsional_non_pmg">FUNGSIONAL NON PMG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Nama Jabatan Ditampilkan</label>
                      <input required value={newOrgMember.role_title} onChange={e => setNewOrgMember({...newOrgMember, role_title: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text" placeholder="e.g. KEPALA UPT" />
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">Nama Pegawai</label>
                      <input required value={newOrgMember.name} onChange={e => setNewOrgMember({...newOrgMember, name: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text" placeholder="Nama beserta gelar" />
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1">NIP (Opsional)</label>
                      <input value={newOrgMember.nip} onChange={e => setNewOrgMember({...newOrgMember, nip: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="text" placeholder="1974..." />
                    </div>
                    <div className="pt-2 mt-auto">
                      <button type="submit" className="w-full bg-primary-container text-on-primary py-2 rounded-lg font-medium hover:opacity-90">Simpan Anggota</button>
                    </div>
                  </form>
                </div>

                {/* Daftar Anggota */}
                <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Daftar Anggota Saat Ini</h3>
                  <div className="space-y-3">
                    {orgMembers.map(m => (
                      <div key={m.id} className="p-4 rounded-xl border border-border flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-bold uppercase text-primary tracking-wider">{m.role_id}</span>
                          <h4 className="font-bold text-text-primary text-base mt-1">{m.role_title}</h4>
                          <p className="text-sm text-text-primary mt-1 font-semibold">{m.name}</p>
                          <p className="text-xs text-text-secondary mt-1">NIP: {m.nip || "-"}</p>
                        </div>
                        <button onClick={() => handleDeleteOrgMember(m.id)} className="text-secondary hover:text-error transition-colors p-1 shrink-0">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    {orgMembers.length === 0 && <p className="text-sm text-text-secondary">Belum ada data anggota struktur organisasi.</p>}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'tempmaps' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                {/* Form Upload/Edit */}
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col h-full">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">
                    {editTempMapId ? "Edit Peta Suhu" : "Upload Peta Suhu Baru"}
                  </h3>
                  <form onSubmit={editTempMapId ? handleEditTempMap : handleAddTempMap} className="flex flex-col gap-4 flex-1">
                    <div>
                      <label className="block text-[14px] mb-1 font-medium">Gambar Peta {editTempMapId && "(Opsional)"}</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        required={!editTempMapId}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setNewTempMap({...newTempMap, file});
                        }} 
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1 font-medium">Tahun</label>
                      <input 
                        required 
                        type="number" 
                        min="1900" 
                        max="2100"
                        value={newTempMap.year} 
                        onChange={e => setNewTempMap({...newTempMap, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] mb-1 font-medium">Kategori Kejadian</label>
                      <select 
                        required 
                        value={newTempMap.category} 
                        onChange={e => setNewTempMap({...newTempMap, category: e.target.value})} 
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="El Niño">El Niño</option>
                        <option value="La Niña">La Niña</option>
                      </select>
                    </div>
                    <div className="pt-2 mt-auto">
                      <button 
                        type="submit" 
                        disabled={isUploadingTempMap}
                        className={`w-full text-on-primary py-2 rounded-lg font-medium transition-opacity flex items-center justify-center gap-2 ${isUploadingTempMap ? 'bg-primary/70 cursor-wait' : 'bg-primary hover:opacity-90'}`}
                      >
                        {isUploadingTempMap ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <span>{editTempMapId ? "Simpan Perubahan" : "Simpan Peta"}</span>
                        )}
                      </button>
                      {editTempMapId && (
                        <button 
                          type="button" 
                          onClick={cancelEditTempMap}
                          disabled={isUploadingTempMap}
                          className="w-full text-text-secondary py-2 mt-2 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Daftar Peta */}
                <div className="lg:col-span-2 bg-surface rounded-[16px] border border-border shadow-sm p-6">
                  <h3 className="text-[1.75rem] font-semibold text-on-surface mb-4">Daftar Peta Suhu ({tempMaps.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tempMaps.map(m => (
                      <div key={m.id} className="rounded-xl border border-border overflow-hidden bg-white shadow-sm flex flex-col group relative">
                        <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden">
                          <img 
                            src={m.image_url} 
                            alt={`Peta Suhu ${m.year} - ${m.category}`} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                            <span className="bg-white/90 backdrop-blur-sm text-text-primary px-2 py-1 rounded text-xs font-bold shadow-sm">
                              {m.year}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-bold shadow-sm text-white backdrop-blur-sm ${m.category === 'El Niño' ? 'bg-error/90' : m.category === 'La Niña' ? 'bg-primary/90' : 'bg-emerald-600/90'}`}>
                              {m.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-white flex justify-between items-center border-t border-border">
                          <span className="text-xs text-text-secondary truncate pr-2">ID: {m.id}</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startEditTempMap(m)} 
                              className="text-primary hover:text-primary-dark bg-slate-50 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                              title="Edit Peta"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteTempMap(m.id, m.image_url)} 
                              className="text-secondary hover:text-error bg-slate-50 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                              title="Hapus Peta"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tempMaps.length === 0 && (
                      <div className="col-span-full py-8 text-center text-text-secondary bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                        Belum ada data peta suhu. Silakan upload melalui form di samping.
                      </div>
                    )}
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
