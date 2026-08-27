import { useState, useEffect } from "react";
import { supabaseFetch, supabaseUpdate, supabaseInsert, supabaseDelete } from "@/lib/supabase";
import { parseObservationExcel, ParsedDailyObservation, ParsedHourlyObservation } from "@/lib/excel-parser";
import { toast } from "sonner";
import { Info, Map, TableProperties, UploadCloud } from "lucide-react";

export function ObservationTab() {
  const [activeObservationDate, setActiveObservationDate] = useState("-");
  const [activeObservationSync, setActiveObservationSync] = useState("-");
  
  const [observationDaily, setObservationDaily] = useState<Partial<ParsedDailyObservation>>({
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
    rangkuman_info: ""
  });
  
  const [observationHourly, setObservationHourly] = useState<ParsedHourlyObservation[]>([]);
  
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  
  const [isAddHourlyModalOpen, setIsAddHourlyModalOpen] = useState(false);
  const [newHourlyRow, setNewHourlyRow] = useState<ParsedHourlyObservation>({
    jam: "00:00",
    suhu_c: 25.0,
    kelembaban_percent: 75,
    tekanan_mbar: 1000.0,
    kecepatan_angin_kt: 0,
    arah_angin: "-",
  });

  useEffect(() => {
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
        setObservationHourly(sorted as ParsedHourlyObservation[]);
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar! Maksimal 10 MB.");
      evt.target.value = "";
      return;
    }

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
    if (!confirm("Apakah Anda yakin ingin menimpa data pengamatan harian sebelumnya? Tindakan ini akan mengganti data yang sedang aktif di website.")) {
      return;
    }

    setIsSavingObservation(true);
    (async () => {
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
          await supabaseDelete("hourly_observations", "id=gt.0");
        }

        toast.success("Data pengamatan harian berhasil diperbarui dan aktif di website!");
        setActiveObservationDate(observationDaily.tanggal_pengamatan || "-");
        setActiveObservationSync(nowIso);
        loadObservationData();
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan data pengamatan.");
      } finally {
        setIsSavingObservation(false);
      }
    })();
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
    const jamRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!jamRegex.test(newHourlyRow.jam)) {
      toast.error("Format jam tidak valid! Gunakan format HH:MM.");
      return;
    }
    const normalizedJam = newHourlyRow.jam.padStart(5, '0');
    const rowToSave = { ...newHourlyRow, jam: normalizedJam };
    const isDuplicate = observationHourly.some(row => row.jam === normalizedJam);
    if (isDuplicate) {
      toast.error(`Data untuk jam ${normalizedJam} sudah ada!`);
      return;
    }

    setObservationHourly((prev) => {
      const newArray = [...prev, rowToSave];
      return newArray.sort((a, b) => a.jam.localeCompare(b.jam));
    });
    toast.success(`Data observasi untuk jam ${normalizedJam} berhasil ditambahkan!`);
    setIsAddHourlyModalOpen(false);
  };

  const handleRemoveHourlyRow = (index: number) => {
    setObservationHourly((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="flex flex-col gap-6">
                <div className="bg-surface rounded-[16px] border border-border shadow-sm p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">cloud_sync</span>
                      Integrasi Data Pengamatan Harian
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
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
                          type="date"
                          value={observationDaily.tanggal_pengamatan || ""}
                          onChange={(e) => setObservationDaily({ ...observationDaily, tanggal_pengamatan: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Suhu Maks / Min (°C)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number" step="0.1"
                            value={observationDaily.suhu_maksimum ?? ""}
                            onChange={(e) => setObservationDaily({ ...observationDaily, suhu_maksimum: parseFloat(e.target.value) || 0 })}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Maks"
                            required
                          />
                          <input
                            type="number" step="0.1"
                            value={observationDaily.suhu_minimum ?? ""}
                            onChange={(e) => setObservationDaily({ ...observationDaily, suhu_minimum: parseFloat(e.target.value) || 0 })}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Min"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Curah Hujan (mm)
                        </label>
                        <input
                          type="number" step="0.1"
                          value={observationDaily.curah_hujan_mm ?? ""}
                          onChange={(e) => setObservationDaily({ ...observationDaily, curah_hujan_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Kategori Hujan
                        </label>
                        <input
                          type="text"
                          value={observationDaily.kategori_hujan || ""}
                          onChange={(e) => setObservationDaily({ ...observationDaily, kategori_hujan: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Rata-rata Suhu / Kelembaban
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number" step="0.1"
                            value={observationDaily.suhu_udara_rata ?? ""}
                            onChange={(e) => setObservationDaily({ ...observationDaily, suhu_udara_rata: parseFloat(e.target.value) || 0 })}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Suhu °C"
                          />
                          <input
                            type="number" step="0.1"
                            value={observationDaily.kelembaban_rata ?? ""}
                            onChange={(e) => setObservationDaily({ ...observationDaily, kelembaban_rata: parseFloat(e.target.value) || 0 })}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                            placeholder="RH %"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Angin (Arah / Rata-rata / Max)
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={observationDaily.angin_arah_dominan || ""}
                            onChange={(e) => setObservationDaily({ ...observationDaily, angin_arah_dominan: e.target.value })}
                            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Arah"
                          />
                          <input
                            type="number" step="0.1"
                            value={observationDaily.angin_kecepatan_rata_kt ?? ""}
                            onChange={(e) => setObservationDaily({ ...observationDaily, angin_kecepatan_rata_kt: parseFloat(e.target.value) || 0 })}
                            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Rata"
                          />
                          <input
                            type="number" step="0.1"
                            value={observationDaily.angin_kecepatan_max_kt ?? ""}
                            onChange={(e) => setObservationDaily({ ...observationDaily, angin_kecepatan_max_kt: parseFloat(e.target.value) || 0 })}
                            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Max"
                          />
                        </div>
                      </div>
                      <div className="col-span-full">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Rangkuman Cuaca (Opsional)
                        </label>
                        <textarea
                          rows={2}
                          value={observationDaily.rangkuman_info || ""}
                          onChange={(e) => setObservationDaily({ ...observationDaily, rangkuman_info: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-primary outline-none resize-none"
                          placeholder="Tuliskan rangkuman informasi cuaca hari ini jika ada..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabel Data Per Jam */}
                  <div className="bg-surface rounded-[16px] border border-border shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">schedule</span>
                          Data Pengamatan Per Jam
                        </h4>
                        <p className="text-xs text-text-secondary mt-1">Data yang diekstrak: {observationHourly.length} baris</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddHourlyModal}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-sm transition-all flex items-center gap-2 border border-indigo-200"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tambah Data Jam
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                          <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                            <th className="py-3 px-4 font-bold text-center w-20">Jam</th>
                            <th className="py-3 px-4 font-bold text-center">Suhu (°C)</th>
                            <th className="py-3 px-4 font-bold text-center">RH (%)</th>
                            <th className="py-3 px-4 font-bold text-center">QFE (mbar)</th>
                            <th className="py-3 px-4 font-bold text-center">Kecepatan Angin (kt)</th>
                            <th className="py-3 px-4 font-bold text-center">Arah Angin</th>
                            <th className="py-3 px-4 font-bold text-center w-16">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {observationHourly.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                              <td className="py-2 px-4 text-center">
                                <input
                                  type="text"
                                  value={row.jam}
                                  onChange={(e) => handleHourlyRowChange(idx, "jam", e.target.value)}
                                  className="w-16 text-center text-sm font-bold bg-white border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-primary outline-none"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <input
                                  type="number" step="0.1"
                                  value={row.suhu_c}
                                  onChange={(e) => handleHourlyRowChange(idx, "suhu_c", parseFloat(e.target.value) || 0)}
                                  className="w-full text-center text-sm bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <input
                                  type="number" step="0.1"
                                  value={row.kelembaban_percent}
                                  onChange={(e) => handleHourlyRowChange(idx, "kelembaban_percent", parseFloat(e.target.value) || 0)}
                                  className="w-full text-center text-sm bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <input
                                  type="number" step="0.1"
                                  value={row.tekanan_mbar}
                                  onChange={(e) => handleHourlyRowChange(idx, "tekanan_mbar", parseFloat(e.target.value) || 0)}
                                  className="w-full text-center text-sm bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <input
                                  type="number" step="0.1"
                                  value={row.kecepatan_angin_kt}
                                  onChange={(e) => handleHourlyRowChange(idx, "kecepatan_angin_kt", parseFloat(e.target.value) || 0)}
                                  className="w-full text-center text-sm bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <input
                                  type="text"
                                  value={row.arah_angin}
                                  onChange={(e) => handleHourlyRowChange(idx, "arah_angin", e.target.value)}
                                  className="w-full text-center text-sm bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none uppercase"
                                />
                              </td>
                              <td className="py-2 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveHourlyRow(idx)}
                                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                  title="Hapus Baris"
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {observationHourly.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-400">
                                Belum ada data per jam. Silakan unggah Excel atau tambah manual.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">warning</span>
                      Pastikan parameter sudah sesuai sebelum menyimpan ke database.
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingObservation || !observationDaily.tanggal_pengamatan}
                      className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-blue-700 text-white rounded-full font-bold shadow-md shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSavingObservation ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                          <span>Menyimpan ke Database...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">save</span>
                          <span>Simpan & Aktifkan Pengamatan Harian</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Modal Tambah Data Jam (Opsional jika ingin diluar flow admin) */}
              {isAddHourlyModalOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-up overflow-hidden">
                    <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex justify-between items-center">
                      <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                        <span className="material-symbols-outlined">add_circle</span>
                        Tambah Data Jam
                      </h3>
                      <button onClick={() => setIsAddHourlyModalOpen(false)} className="text-indigo-400 hover:text-indigo-600 bg-white rounded-full p-1 hover:bg-indigo-200 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                    <form onSubmit={handleConfirmAddHourlyRow} className="p-5 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Waktu / Jam</label>
                        <input required type="time" value={newHourlyRow.jam} onChange={e => setNewHourlyRow({...newHourlyRow, jam: e.target.value})} className="w-full text-lg font-mono tracking-widest text-center py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Suhu (°C)</label>
                          <input required type="number" step="0.1" value={newHourlyRow.suhu_c} onChange={e => setNewHourlyRow({...newHourlyRow, suhu_c: parseFloat(e.target.value) || 0})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Kelembaban (%)</label>
                          <input required type="number" step="0.1" value={newHourlyRow.kelembaban_percent} onChange={e => setNewHourlyRow({...newHourlyRow, kelembaban_percent: parseFloat(e.target.value) || 0})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">QFE (mbar)</label>
                          <input required type="number" step="0.1" value={newHourlyRow.tekanan_mbar} onChange={e => setNewHourlyRow({...newHourlyRow, tekanan_mbar: parseFloat(e.target.value) || 0})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Arah Angin</label>
                          <input required type="text" value={newHourlyRow.arah_angin} onChange={e => setNewHourlyRow({...newHourlyRow, arah_angin: e.target.value})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none uppercase" />
                        </div>
                      </div>
                      <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsAddHourlyModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors">Tambahkan</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
    </>
  );
}
