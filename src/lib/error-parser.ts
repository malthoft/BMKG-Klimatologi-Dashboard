export function parseDbError(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes("violates check constraint")) {
    if (msg.includes("temperature_maps_category_check")) {
      return "Kategori peta suhu tidak diizinkan oleh database. Harap update constraint database untuk mengizinkan kategori baru (El Nino/La Nina).";
    }
    return "Data yang dimasukkan tidak sesuai dengan aturan database.";
  }
  
  if (msg.includes("violates unique constraint")) {
    return "Data sudah ada (Duplikat). Silakan gunakan data lain.";
  }
  
  if (msg.includes("row-level security policy")) {
    return "Anda tidak memiliki hak akses (izin) untuk melakukan tindakan ini.";
  }
  
  if (msg.includes("foreign key constraint")) {
    return "Gagal menyimpan karena referensi data tidak ditemukan (Data terkait tidak ada).";
  }
  
  if (msg.includes("failed to fetch") || msg.includes("network error")) {
    return "Koneksi terputus. Pastikan koneksi internet Anda stabil.";
  }
  
  if (msg.includes("duplicate key")) {
    return "Data dengan ID atau kombinasi unik tersebut sudah terdaftar.";
  }
  
  if (msg.includes("not null constraint")) {
    return "Ada kolom wajib yang masih kosong. Harap lengkapi semua data wajib.";
  }
  
  if (msg.includes("jwt") || msg.includes("token")) {
    return "Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.";
  }

  // Fallback for technical errors, truncate if too long
  if (message.length > 80) {
    return "Terjadi kesalahan: " + message.substring(0, 80) + "...";
  }
  
  return message;
}
