/**
 * SCRIPT UPLOAD / RESTORE STORAGE KE PROYEK SUPABASE BARU
 * =======================================================
 * Cara Penggunaan untuk Pihak BMKG:
 * 1. Buka file ini
 * 2. Ganti TARGET_SUPABASE_URL dan TARGET_SERVICE_ROLE_KEY dengan kredensial project baru
 * 3. Jalankan: node upload_storage_assets.mjs
 */

import fs from 'fs';
import path from 'path';

// Ganti dengan URL dan Service Role Key project Supabase yang baru
const TARGET_SUPABASE_URL = process.env.SUPABASE_URL || 'https://<PROJECT-ID>.supabase.co';
const TARGET_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY || 'MASUKKAN_SERVICE_ROLE_KEY_BARU_DISINI';

const baseDir = path.join(process.cwd(), 'storage_assets');

async function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function uploadFile(bucket, storagePath, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const url = `${TARGET_SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TARGET_SERVICE_ROLE_KEY}`,
      'apikey': TARGET_SERVICE_ROLE_KEY,
      'x-upsert': 'true'
    },
    body: fileBuffer
  });

  return res.ok;
}

async function main() {
  console.log(`Membaca file dari folder: ${baseDir}...`);
  if (!fs.existsSync(baseDir)) {
    console.error('Folder storage_assets tidak ditemukan!');
    return;
  }

  const buckets = fs.readdirSync(baseDir);
  let totalFiles = 0;
  let success = 0;

  for (const bucket of buckets) {
    const bucketDir = path.join(baseDir, bucket);
    if (!fs.statSync(bucketDir).isDirectory()) continue;

    const files = await getAllFiles(bucketDir);
    totalFiles += files.length;

    for (const file of files) {
      const relPath = path.relative(bucketDir, file).replace(/\\/g, '/');
      const ok = await uploadFile(bucket, relPath, file);
      if (ok) {
        success++;
        console.log(`[${success}] Berhasil upload: ${bucket}/${relPath}`);
      } else {
        console.warn(`Gagal upload: ${bucket}/${relPath}`);
      }
    }
  }

  console.log(`\nSelesai! Berhasil mengunggah ${success} dari ${totalFiles} file.`);
}

main().catch(console.error);
