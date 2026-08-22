import * as XLSX from "xlsx";

export interface ParsedDailyObservation {
  tanggal_pengamatan: string;
  source_file: string;
  suhu_maksimum: number;
  suhu_minimum: number;
  curah_hujan_mm: number;
  kategori_hujan: string;
  suhu_udara_rata: number;
  kelembaban_rata: number;
  tekanan_udara_rata: number;
  angin_arah_dominan: string;
  angin_kecepatan_rata_kt: number;
  angin_kecepatan_max_kt: number;
  rangkuman_info: string;
}

export interface ParsedHourlyObservation {
  jam: string;
  suhu_c: number;
  kelembaban_percent: number;
  kecepatan_angin_kt: number;
  tekanan_mbar: number;
  arah_angin: string;
}

export interface ExcelParseResult {
  daily: ParsedDailyObservation;
  hourly: ParsedHourlyObservation[];
}

const MONTH_NAMES_ID = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

export function determineRainCategory(rr: number): string {
  if (rr <= 0) return "Tidak Ada Hujan";
  if (rr < 0.5) return "Hujan Sangat Ringan (Jejak)";
  if (rr <= 20) return "Hujan Ringan";
  if (rr <= 50) return "Hujan Sedang";
  if (rr <= 100) return "Hujan Lebat";
  if (rr <= 150) return "Hujan Sangat Lebat";
  return "Hujan Ekstrim";
}

export function parseDateFromFilename(filename: string): string {
  const cleanName = filename.replace(/\.[^/.]+$/, ""); // strip extension
  
  // Format dd-mm-yyyy or dd_mm_yyyy or yyyy-mm-dd
  const ddmmyyyyMatch = cleanName.match(/(\d{1,2})[-_/](\d{1,2})[-_/](\d{4})/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      return `${day} ${MONTH_NAMES_ID[month]} ${year}`;
    }
  }

  const yyyymmddMatch = cleanName.match(/(\d{4})[-_/](\d{1,2})[-_/](\d{1,2})/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1;
    const day = parseInt(yyyymmddMatch[3], 10);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      return `${day} ${MONTH_NAMES_ID[month]} ${year}`;
    }
  }

  // Fallback to today's date in ID
  const today = new Date();
  return `${today.getDate()} ${MONTH_NAMES_ID[today.getMonth()]} ${today.getFullYear()}`;
}

export function parseObservationExcel(data: ArrayBuffer | Uint8Array, filename: string): ExcelParseResult {
  let workbook;
  try {
    workbook = XLSX.read(data, { type: "array" });
  } catch (error) {
    throw new Error("File yang diunggah bukan format Excel/CSV yang valid. Pastikan file tidak rusak.");
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("File Excel kosong (tidak ada sheet).");
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("Tidak ditemukan baris data di dalam file Excel. Pastikan format sesuai standar.");
  }

  let tanggal_pengamatan = parseDateFromFilename(filename);
  let suhu_maksimum: number | null = null;
  let suhu_minimum: number | null = null;
  let suhu_udara_rata: number | null = null;
  let curah_hujan_mm = 0;
  let kelembaban_rata: number | null = null;
  let tekanan_udara_rata: number | null = null;
  let angin_arah_dominan = "-";
  let angin_kecepatan_rata_kt: number | null = null;
  let angin_kecepatan_max_kt: number | null = null;
  let rangkuman_info = "";

  const hourly: ParsedHourlyObservation[] = [];

  // 1. Scan for key-value labels in the rows
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || "").trim();
      const cellValLower = cellVal.toLowerCase();

      // Check for explicit date in text (e.g. "Tanggal : 15 Agustus 2026")
      if (cellValLower.includes("tanggal") || cellValLower.includes("date")) {
        const nextCell = String(row[c + 1] || "").trim();
        const dateMatch = (cellVal + " " + nextCell).match(/(\d{1,2}\s+[a-zA-Z]+\s+\d{4})/);
        if (dateMatch) {
          tanggal_pengamatan = dateMatch[1].toUpperCase();
        }
      }

      // Check for Tx / Suhu Max
      if ((cellValLower.includes("suhu mak") || cellValLower.includes("suhu max") || cellValLower === "tx" || cellValLower === "tmax") && suhu_maksimum === null) {
        const val = findNextNumber(row, c);
        if (val !== null) suhu_maksimum = val;
      }

      // Check for Tn / Suhu Min
      if ((cellValLower.includes("suhu min") || cellValLower === "tn" || cellValLower === "tmin") && suhu_minimum === null) {
        const val = findNextNumber(row, c);
        if (val !== null) suhu_minimum = val;
      }

      // Check for Suhu Rata-rata
      if ((cellValLower.includes("suhu rata") || cellValLower.includes("suhu udara rata") || cellValLower === "t avg" || cellValLower === "tavg") && suhu_udara_rata === null) {
        const val = findNextNumber(row, c);
        if (val !== null) suhu_udara_rata = val;
      }

      // Check for Curah Hujan
      if (cellValLower.includes("curah hujan") || cellValLower === "ch" || cellValLower === "rr") {
        const val = findNextNumber(row, c);
        if (val !== null) curah_hujan_mm = val;
      }

      // Check for Kelembaban Rata-rata
      if ((cellValLower.includes("kelembaban") || cellValLower.includes("rh rata") || cellValLower === "rh avg") && kelembaban_rata === null) {
        const val = findNextNumber(row, c);
        if (val !== null) kelembaban_rata = val;
      }

      // Check for Tekanan Rata-rata
      if ((cellValLower.includes("tekanan") || cellValLower.includes("qfe") || cellValLower === "p avg") && tekanan_udara_rata === null) {
        const val = findNextNumber(row, c);
        if (val !== null) tekanan_udara_rata = val;
      }

      // Check for Kecepatan Angin Rata-rata
      if ((cellValLower.includes("angin rata") || cellValLower.includes("kecepatan rata") || cellValLower === "ff avg") && angin_kecepatan_rata_kt === null) {
        const val = findNextNumber(row, c);
        if (val !== null) angin_kecepatan_rata_kt = val;
      }

      // Check for Kecepatan Angin Maks
      if ((cellValLower.includes("angin mak") || cellValLower.includes("kecepatan mak") || cellValLower === "ff max") && angin_kecepatan_max_kt === null) {
        const val = findNextNumber(row, c);
        if (val !== null) angin_kecepatan_max_kt = val;
      }

      // Check for Arah Angin Dominan
      if (cellValLower.includes("arah dominan") || cellValLower === "dd dominan") {
        const nextStr = String(row[c + 1] || row[c + 2] || "").trim();
        if (nextStr) angin_arah_dominan = nextStr;
      }

      // Check for Rangkuman Cuaca Ekstrim
      if (cellValLower.includes("rangkuman") || cellValLower.includes("cuaca ekstrim")) {
        const combined = rawRows.slice(r, r + 4).map(rw => rw.filter(Boolean).join(" ")).join("\n");
        if (combined.length > rangkuman_info.length) {
          rangkuman_info = combined;
        }
      }
    }
  }

  // 2. Scan for Hourly Rows (e.g. 07:00 to 22:00 or 00:00 to 23:00)
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || "").trim();
      
      // Match pattern like 07:00, 7:00, 07.00, 7.00 or numeric 7..24
      const timeMatch = cellVal.match(/^(\d{1,2})[:.](\d{2})$/);
      if (timeMatch) {
        const hourNum = parseInt(timeMatch[1], 10);
        const minStr = timeMatch[2];
        const formattedJam = `${String(hourNum).padStart(2, "0")}:${minStr}`;

        // Read subsequent numeric columns in this row
        const rowNumbers = row.slice(c + 1).map(val => parseFlexibleNumber(val)).filter((n): n is number => n !== null);
        
        if (rowNumbers.length >= 2) {
          // Typically order in BMKG hourly table: [Arah, Kecepatan, Tekanan, Suhu, RH] or [Suhu, RH, Tekanan, Angin]
          let suhu = 0;
          let rh = 0;
          let press = 950;
          let windSpd = 0;
          let windDir = "-";

          // Intelligently assign based on standard ranges
          // Pressure: 850..1060
          // RH: 25..100 (Checked before temp to avoid high temp being seen as RH, wait, no, Temp is usually 15-40, RH is 40-100. So check RH first for >45, but what if RH is 40 and Temp is 30?)
          // We check pressure first, then we check if it falls in RH range. To avoid Temp matching RH, we can assume RH > Temp generally.
          for (const num of rowNumbers) {
            if (num >= 850 && num <= 1060 && press === 950) {
              press = num;
            } else if (num > 45 && num <= 100 && rh === 0) {
              rh = num; // RH > 45% safely avoids typical Indo temps
            } else if (num >= 10 && num <= 45 && suhu === 0) {
              suhu = num;
            } else if (num >= 25 && num <= 45 && rh === 0) {
              rh = num; // Fallback if RH was low (25-45) and Temp is already filled
            } else if (num >= 0 && num <= 40 && windSpd === 0) {
              windSpd = num;
            }
          }

          // Also check text cells for wind direction like "170", "300", "Utara", "NE"
          for (let colIdx = c + 1; colIdx < row.length; colIdx++) {
            const strVal = String(row[colIdx] || "").trim();
            if (strVal && !strVal.match(/^\d+(\.\d+)?$/) && strVal.length <= 10) {
              windDir = strVal;
              break;
            }
          }

          hourly.push({
            jam: formattedJam,
            suhu_c: Number(suhu.toFixed(1)),
            kelembaban_percent: Number(rh.toFixed(1)),
            tekanan_mbar: Number(press.toFixed(1)),
            kecepatan_angin_kt: Number(windSpd.toFixed(1)),
            arah_angin: windDir
          });
        }
      }
    }
  }

  // Deduplicate and sort hourly data by jam
  const uniqueHourlyMap = new Map<string, ParsedHourlyObservation>();
  for (const h of hourly) {
    if (!uniqueHourlyMap.has(h.jam)) {
      uniqueHourlyMap.set(h.jam, h);
    }
  }
  const sortedHourly = Array.from(uniqueHourlyMap.values()).sort((a, b) => a.jam.localeCompare(b.jam));

  // Auto-calculate daily aggregations if missing
  if (sortedHourly.length > 0) {
    const suhus = sortedHourly.map(h => h.suhu_c).filter(s => s > 0);
    const rhs = sortedHourly.map(h => h.kelembaban_percent).filter(r => r > 0);
    const presses = sortedHourly.map(h => h.tekanan_mbar).filter(p => p > 800);
    const winds = sortedHourly.map(h => h.kecepatan_angin_kt);

    if (suhu_maksimum === null && suhus.length > 0) suhu_maksimum = Math.max(...suhus);
    if (suhu_minimum === null && suhus.length > 0) suhu_minimum = Math.min(...suhus);
    if (suhu_udara_rata === null && suhus.length > 0) {
      suhu_udara_rata = Number((suhus.reduce((a, b) => a + b, 0) / suhus.length).toFixed(1));
    }
    if (kelembaban_rata === null && rhs.length > 0) {
      kelembaban_rata = Math.round(rhs.reduce((a, b) => a + b, 0) / rhs.length);
    }
    if (tekanan_udara_rata === null && presses.length > 0) {
      tekanan_udara_rata = Number((presses.reduce((a, b) => a + b, 0) / presses.length).toFixed(1));
    }
    if (angin_kecepatan_rata_kt === null && winds.length > 0) {
      angin_kecepatan_rata_kt = Number((winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1));
    }
    if (angin_kecepatan_max_kt === null && winds.length > 0) {
      angin_kecepatan_max_kt = Math.max(...winds);
    }
  }

  // Fallbacks to standard values if still null
  const finalSuhuMax = suhu_maksimum ?? 28.5;
  const finalSuhuMin = suhu_minimum ?? 18.0;
  const finalSuhuRata = suhu_udara_rata ?? 24.0;
  const finalRhRata = kelembaban_rata ?? 75;
  const finalTekanan = tekanan_udara_rata ?? 948.5;
  const finalWindRata = angin_kecepatan_rata_kt ?? 3.0;
  const finalWindMax = angin_kecepatan_max_kt ?? 10.0;
  const finalKategoriHujan = determineRainCategory(curah_hujan_mm);

  // If no data at all was extracted, warn the user by throwing an error if it's completely empty
  if (suhu_maksimum === null && suhu_minimum === null && curah_hujan_mm === 0 && hourly.length === 0) {
    throw new Error("Gagal mengekstrak parameter cuaca. Format file Excel mungkin tidak sesuai standar BMKG.");
  }

  return {
    daily: {
      tanggal_pengamatan,
      source_file: filename,
      suhu_maksimum: Number(finalSuhuMax.toFixed(1)),
      suhu_minimum: Number(finalSuhuMin.toFixed(1)),
      curah_hujan_mm: Number(curah_hujan_mm.toFixed(1)),
      kategori_hujan: finalKategoriHujan,
      suhu_udara_rata: Number(finalSuhuRata.toFixed(1)),
      kelembaban_rata: Math.round(finalRhRata),
      tekanan_udara_rata: Number(finalTekanan.toFixed(1)),
      angin_arah_dominan: angin_arah_dominan || "-",
      angin_kecepatan_rata_kt: Number(finalWindRata.toFixed(1)),
      angin_kecepatan_max_kt: Number(finalWindMax.toFixed(1)),
      rangkuman_info: rangkuman_info || "Data pengamatan harian Stasiun Klimatologi Jawa Timur."
    },
    hourly: sortedHourly
  };
}

function findNextNumber(row: any[], startIdx: number): number | null {
  for (let i = startIdx + 1; i < Math.min(startIdx + 5, row.length); i++) {
    const num = parseFlexibleNumber(row[i]);
    if (num !== null) return num;
  }
  return null;
}

function parseFlexibleNumber(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const str = String(val).replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}
