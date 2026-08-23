export async function fetchAndParseHTHCsv(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal mengambil data dari Google Sheets URL");
    
    const csvText = await res.text();
    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length < 2) return [];

    // Parse header to find column indices
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"/, '').replace(/"$/, ''));
    
    let idx_id = -1, idx_nama = -1, idx_lat = -1, idx_lon = -1;
    let idx_kab = -1, idx_pic = -1, idx_hth = -1, idx_ket = -1;

    headers.forEach((h, i) => {
      if (h === 'id' || h === 'kode' || h === 'id pos') idx_id = i;
      else if (h.includes('nama')) idx_nama = i;
      else if (h.includes('lat')) idx_lat = i;
      else if (h.includes('lon')) idx_lon = i;
      else if (h.includes('kab')) idx_kab = i;
      else if (h.includes('pic')) idx_pic = i;
      else if (h === 'hth' || h.includes('hari tanpa hujan')) idx_hth = i;
      else if (h.includes('ket') || h.includes('status')) idx_ket = i;
    });

    const results = [];

    // Simple CSV parser for lines (handles quotes)
    const parseLine = (line: string) => {
      const row = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      row.push(current);
      return row;
    };

    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i]);
      if (idx_id >= 0 && (!row[idx_id] || row[idx_id].trim() === "")) continue;

      const item: any = {
        id: idx_id >= 0 ? row[idx_id]?.trim() : "-",
        nama: idx_nama >= 0 ? row[idx_nama]?.trim() || "Pos Tanpa Nama" : "Pos Tanpa Nama",
        lat: idx_lat >= 0 ? parseFloat(row[idx_lat]?.replace(',', '.') || "0") : 0,
        lon: idx_lon >= 0 ? parseFloat(row[idx_lon]?.replace(',', '.') || "0") : 0,
        kab: idx_kab >= 0 ? row[idx_kab]?.trim() || "-" : "-",
        pic: idx_pic >= 0 ? row[idx_pic]?.trim().toUpperCase() || "-" : "-",
        hth: 0,
        ket: "Masih Ada Hujan"
      };

      if (idx_hth >= 0 && row[idx_hth] && row[idx_hth].trim() !== "") {
        const hthVal = parseInt(row[idx_hth].trim(), 10);
        if (!isNaN(hthVal)) {
          item.hth = hthVal;
          if (hthVal === 0) item.ket = "Masih Ada Hujan";
          else if (hthVal <= 5) item.ket = "Sangat Pendek";
          else if (hthVal <= 10) item.ket = "Pendek";
          else if (hthVal <= 20) item.ket = "Menengah";
          else if (hthVal <= 30) item.ket = "Panjang";
          else if (hthVal <= 60) item.ket = "Sangat Panjang";
          else item.ket = "Kekeringan Ekstrem";
        }
      }

      if (idx_ket >= 0 && row[idx_ket] && row[idx_ket].trim() !== "") {
        item.ket = row[idx_ket].trim();
      }

      results.push(item);
    }

    return results;
  } catch (error) {
    console.error("Error parsing HTH CSV:", error);
    throw error;
  }
}
