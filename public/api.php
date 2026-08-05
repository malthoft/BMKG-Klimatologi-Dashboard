<?php
/**
 * OPEN DATA API PROXY UNTUK CPANEL
 * File ini menjembatani website/project lain agar bisa membaca raw data JSON
 * dari Supabase Anda secara aman tanpa mengekspos API Key.
 *
 * Cara penggunaan:
 * https://domain-anda.com/api.php?station=aws_unida_gontor&limit=10
 */

// 1. Izinkan akses dari domain manapun (CORS) agar bisa dipakai project lain
header('Access-Control-Allow-Origin: *');

// 2. Ambil parameter dari URL
$station = isset($_GET['station']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $_GET['station']) : '';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 1;

if (empty($station)) {
    header('Content-Type: text/html; charset=utf-8');
    
    // Daftar Stasiun AWS yang tersedia
    $availableStations = [
        "aws_batu", "aws_bondowoso", "aws_bromo", "aws_kandat", 
        "aws_kanigoro", "aws_karangan", "aws_kediri", "aws_lamongan", 
        "aws_mayang", "aws_panarukan", "aws_paron", "aws_sampang", 
        "aws_situbondo", "aws_smpk_jombang", "aws_smpk_mojokerto", 
        "aws_smpk_nganjuk", "aws_smpk_sebayi", "aws_stageof_karangkates", 
        "aws_stageof_pasuruan", "aws_stageof_sawahan", "aws_tanggul", 
        "aws_tiris", "aws_unida_gontor"
    ];

    echo "<!DOCTYPE html><html lang='id'><head><meta charset='UTF-8'>";
    echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    echo "<title>Dokumentasi API Terbuka - Kondisi Cuaca</title>";
    echo "<style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; background: #f9fafb; }
            h1 { color: #2563eb; margin-bottom: 0.5rem; }
            .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            code { background: #e5e7eb; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; color: #d97706; }
            .station-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
            a.station-link { display: block; padding: 1rem; background: #eff6ff; color: #1d4ed8; text-decoration: none; border-radius: 6px; border: 1px solid #bfdbfe; transition: all 0.2s; font-weight: 500; font-size: 0.9rem;}
            a.station-link:hover { background: #3b82f6; color: white; border-color: #3b82f6; transform: translateY(-2px); }
          </style>";
    echo "</head><body><div class='card'>";
    echo "<h1>📡 API Data Terbuka (BMKG Clone)</h1>";
    echo "<p>Selamat datang di layanan <strong>Open Data API</strong>. Anda dapat mengambil data mentah cuaca (JSON) dari berbagai stasiun AWS yang kami miliki untuk digunakan pada proyek penelitian atau aplikasi Anda.</p>";
    echo "<h3>Cara Penggunaan:</h3>";
    echo "<p>Tambahkan parameter <code>?station=nama_aws</code> pada URL. Anda juga bisa menambahkan batas data dengan <code>&limit=10</code> (maksimal 1000).</p>";
    echo "<p><strong>Contoh:</strong> <code>api.php?station=aws_unida_gontor&limit=1</code></p>";
    echo "<hr style='border:0; border-top:1px solid #e5e7eb; margin: 2rem 0;'>";
    echo "<h3>📍 Daftar Stasiun Tersedia (Klik untuk melihat raw data):</h3>";
    echo "<div class='station-grid'>";
    foreach ($availableStations as $sta) {
        $nameDisplay = ucwords(str_replace(['aws_', '_'], ['', ' '], $sta));
        echo "<a href='?station={$sta}&limit=1' class='station-link' target='_blank'>AWS {$nameDisplay}</a>";
    }
    echo "</div></div></body></html>";
    exit;
}

// Jika station ada, pastikan formatnya adalah JSON untuk balasan API
header('Content-Type: application/json; charset=utf-8');

// Batasi limit maksimal agar server tidak terbebani
if ($limit > 1000) $limit = 1000;
if ($limit < 1) $limit = 1;

// 3. Konfigurasi Supabase Anda (Aman di sisi server PHP)
$supabaseUrl = 'https://jdrqulgbprcfwokhpjqw.supabase.co/rest/v1/';
$supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcnF1bGdicHJjZndva2hwanF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDIyMTcsImV4cCI6MjEwMDg3ODIxN30.mU3G1wfid4SuCVRlfV34RdwFl4YExr4lK-8B8OY3yWg';

// 4. Bangun URL Query (Urutkan dari data paling baru)
$url = $supabaseUrl . $station . '?order=timestamp.desc&limit=' . $limit;

// 5. Eksekusi CURL ke Supabase
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
// Menonaktifkan verifikasi SSL kadang diperlukan di CPanel yang konfigurasi SSL-nya ketat
// curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $supabaseAnonKey,
    'Authorization: Bearer ' . $supabaseAnonKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Gagal terhubung ke database.", 
        "details" => curl_error($ch)
    ]);
} else if ($httpCode >= 400) {
    http_response_code(404);
    echo json_encode([
        "status" => "error", 
        "message" => "Stasiun '$station' tidak ditemukan atau parameter tidak valid."
    ]);
} else {
    // 6. Cetak RAW JSON langsung ke browser!
    echo $response;
}

curl_close($ch);
?>
