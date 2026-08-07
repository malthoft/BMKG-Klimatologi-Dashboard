export interface RegionClimateData {
  baseline: number;
  type: string;
  desc: string;
  rate: number;
  anomalies: number[];
  maxAnomaly: number;
  maxYear: number;
  minAnomaly: number;
  minYear: number;
}

export interface ClimateParsedResult {
  years: number[];
  regionsData: Record<string, RegionClimateData>;
}

// Climate Central Official Warming Stripes Color Scale
export const CLIMATE_COLORSCALE: Array<[number, string]> = [
  [0.00, '#08306b'],
  [0.18, '#2b8cbe'],
  [0.36, '#7bccc4'],
  [0.50, '#f7f7f7'],
  [0.64, '#feb24c'],
  [0.82, '#f46d43'],
  [1.00, '#67000d']
];

// Hex helper functions for RGB interpolation
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getColorForAnomaly(val: number, zBound: number): string {
  if (zBound <= 0) zBound = 0.5;
  // Normalized position [0, 1]
  const rawT = (val - (-zBound)) / (2 * zBound);
  const t = Math.max(0, Math.min(1, rawT));

  // Find color segment in CLIMATE_COLORSCALE
  let lower = CLIMATE_COLORSCALE[0];
  let upper = CLIMATE_COLORSCALE[CLIMATE_COLORSCALE.length - 1];

  for (let i = 0; i < CLIMATE_COLORSCALE.length - 1; i++) {
    if (t >= CLIMATE_COLORSCALE[i][0] && t <= CLIMATE_COLORSCALE[i + 1][0]) {
      lower = CLIMATE_COLORSCALE[i];
      upper = CLIMATE_COLORSCALE[i + 1];
      break;
    }
  }

  const range = upper[0] - lower[0];
  const localT = range === 0 ? 0 : (t - lower[0]) / range;

  const cLower = hexToRgb(lower[1]);
  const cUpper = hexToRgb(upper[1]);

  const r = cLower.r + (cUpper.r - cLower.r) * localT;
  const g = cLower.g + (cUpper.g - cLower.g) * localT;
  const b = cLower.b + (cUpper.b - cLower.b) * localT;

  return rgbToHex(r, g, b);
}

export function parseCSVText(csvText: string): ClimateParsedResult {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error("Format CSV tidak dapat dibaca atau berkas kosong.");
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
  if (headers.length < 2) {
    throw new Error("CSV harus memiliki minimal 1 kolom waktu dan 1 kolom data.");
  }

  // Auto-detect time column
  let timeColIdx = headers.findIndex(h => /tanggal|tahun|date|year|waktu|time/i.test(h));
  if (timeColIdx === -1) {
    // Fallback: check first row for a 4-digit year number
    const firstRowValues = lines[1].split(',').map(v => v.trim());
    timeColIdx = firstRowValues.findIndex(v => {
      const num = parseInt(v, 10);
      return !isNaN(num) && num > 1800 && num < 2100;
    });
  }

  if (timeColIdx === -1) {
    timeColIdx = 0; // Default to first column if undetected
  }

  const timeColName = headers[timeColIdx];
  const regionNames = headers.filter((_, idx) => idx !== timeColIdx);

  if (regionNames.length === 0) {
    throw new Error("CSV harus memiliki minimal satu kolom nilai suhu/anomali.");
  }

  // Aggregate by Year
  const yearlyData: Record<number, Record<string, number[]>> = {};

  for (let i = 1; i < lines.length; i++) {
    const rowValues = lines[i].split(',').map(v => v.trim().replace(/^"/, '').replace(/"$/, ''));
    const rawTimeVal = rowValues[timeColIdx];
    if (rawTimeVal === undefined || rawTimeVal === '') continue;

    let year = NaN;
    const yearMatch = rawTimeVal.match(/(19|20)\d{2}/);
    if (yearMatch) {
      year = parseInt(yearMatch[0], 10);
    } else {
      year = parseInt(rawTimeVal, 10);
    }

    if (isNaN(year)) continue;

    if (!yearlyData[year]) {
      yearlyData[year] = {};
      regionNames.forEach(reg => { yearlyData[year][reg] = []; });
    }

    let colOffset = 0;
    for (let hIdx = 0; hIdx < headers.length; hIdx++) {
      if (hIdx === timeColIdx) continue;
      const regName = headers[hIdx];
      const valStr = rowValues[hIdx];
      const val = parseFloat(valStr);
      if (!isNaN(val)) {
        yearlyData[year][regName].push(val);
      }
    }
  }

  const sortedYears = Object.keys(yearlyData).map(Number).sort((a, b) => a - b);
  if (sortedYears.length < 2) {
    throw new Error("Data terlalu sedikit. Minimal harus mencakup 2 tahun berbeda.");
  }

  const regionsData: Record<string, RegionClimateData> = {};

  regionNames.forEach(region => {
    const annualMeans: Array<number | null> = [];
    sortedYears.forEach(year => {
      const temps = yearlyData[year][region];
      if (temps && temps.length > 0) {
        annualMeans.push(temps.reduce((a, b) => a + b, 0) / temps.length);
      } else {
        annualMeans.push(null);
      }
    });

    // Interpolate missing values
    const filledMeans: number[] = annualMeans.map(v => v ?? 0);
    for (let i = 0; i < annualMeans.length; i++) {
      if (annualMeans[i] === null) {
        const prev = annualMeans.slice(0, i).reverse().find(v => v !== null) ?? 27;
        const next = annualMeans.slice(i + 1).find(v => v !== null) ?? prev;
        filledMeans[i] = (prev + next) / 2;
      }
    }

    const overallAvg = filledMeans.reduce((a, b) => a + b, 0) / filledMeans.length;
    const isAnomalyData = Math.abs(overallAvg) < 5;
    const base = isAnomalyData ? 27.5 : parseFloat(overallAvg.toFixed(2));
    
    let anomalies = isAnomalyData 
      ? filledMeans 
      : filledMeans.map(v => v - base);

    anomalies = anomalies.map(v => parseFloat(v.toFixed(3)));

    // Linear regression for trend rate per decade
    const n = sortedYears.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += anomalies[i];
      sumXY += i * anomalies[i];
      sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const ratePerDecade = parseFloat((slope * 10).toFixed(3));

    const maxAnom = Math.max(...anomalies);
    const minAnom = Math.min(...anomalies);
    const maxIdx = anomalies.indexOf(maxAnom);
    const minIdx = anomalies.indexOf(minAnom);

    regionsData[region] = {
      baseline: base,
      type: "Data Anomali Suhu",
      desc: `${region} (${sortedYears[0]} - ${sortedYears[sortedYears.length - 1]})`,
      rate: ratePerDecade,
      anomalies: anomalies,
      maxAnomaly: maxAnom,
      maxYear: sortedYears[maxIdx],
      minAnomaly: minAnom,
      minYear: sortedYears[minIdx]
    };
  });

  return {
    years: sortedYears,
    regionsData
  };
}
