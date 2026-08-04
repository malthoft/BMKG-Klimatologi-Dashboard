-- ============================================================
-- SQL untuk Supabase: Tabel AWS Malang (STW1066) dari FTP Logger
-- Jalankan query ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Buat tabel aws_malang (struktur identik dengan tabel AWS lainnya)
CREATE TABLE IF NOT EXISTS aws_malang (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL DEFAULT 'FTP-Logger',
  sn text NOT NULL DEFAULT 'STW1066',
  os text NOT NULL DEFAULT '-',
  site varchar(25) DEFAULT 'AWS Malang',
  id_sta text NOT NULL DEFAULT 'STW1066',
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL DEFAULT 0,
  ws_max float NOT NULL DEFAULT 0,
  wd float NOT NULL DEFAULT 0,
  temp float NOT NULL DEFAULT 0,
  temp_max float NOT NULL DEFAULT 0,
  temp_min float NOT NULL DEFAULT 0,
  rh float NOT NULL DEFAULT 0,
  press float NOT NULL DEFAULT 0,
  rr float NOT NULL DEFAULT 0,
  sr float NOT NULL DEFAULT 0,
  sr_max float NOT NULL DEFAULT 0,
  log_temp float NOT NULL DEFAULT 0,
  batt float NOT NULL DEFAULT 0,
  lith float NOT NULL DEFAULT 0,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Daftarkan stasiun AWS Malang ke tabel stations
INSERT INTO stations (station_id, station_name, table_name, latitude, longitude, status, show_on_home, show_on_realtime)
VALUES ('STW1066', 'AWS Malang', 'aws_malang', -7.977, 112.634, 'Online', true, true);
