-- 1. Buat Tabel stations
CREATE TABLE IF NOT EXISTS public.stations (
  id SERIAL PRIMARY KEY,
  station_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  latitude FLOAT DEFAULT 0,
  longitude FLOAT DEFAULT 0,
  status TEXT DEFAULT 'Online',
  show_on_home BOOLEAN DEFAULT true,
  show_on_realtime BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Masukkan data 23 stasiun AWS yang sudah ada di database Anda
INSERT INTO public.stations (station_id, station_name, table_name) VALUES
('AWS-BATU', 'AWS Batu', 'aws_batu'),
('AWS-BONDOWOSO', 'AWS Bondowoso', 'aws_bondowoso'),
('AWS-BROMO', 'AWS Bromo', 'aws_bromo'),
('AWS-KANDAT', 'AWS Kandat', 'aws_kandat'),
('AWS-KANIGORO', 'AWS Kanigoro', 'aws_kanigoro'),
('AWS-KARANGAN', 'AWS Karangan', 'aws_karangan'),
('AWS-KEDIRI', 'AWS Kediri', 'aws_kediri'),
('AWS-LAMONGAN', 'AWS Lamongan', 'aws_lamongan'),
('AWS-MAYANG', 'AWS Mayang', 'aws_mayang'),
('AWS-PANARUKAN', 'AWS Panarukan', 'aws_panarukan'),
('AWS-PARON', 'AWS Paron', 'aws_paron'),
('AWS-SAMPANG', 'AWS Sampang', 'aws_sampang'),
('AWS-SITUBONDO', 'AWS Situbondo', 'aws_situbondo'),
('AWS-SMPK-JOMBANG', 'AWS SMPK Jombang', 'aws_smpk_jombang'),
('AWS-SMPK-MOJOKERTO', 'AWS SMPK Mojokerto', 'aws_smpk_mojokerto'),
('AWS-SMPK-NGANJUK', 'AWS SMPK Nganjuk', 'aws_smpk_nganjuk'),
('AWS-SMPK-SEBAYI', 'AWS SMPK Sebayi', 'aws_smpk_sebayi'),
('AWS-STAGEOF-KARANGKATES', 'AWS Stageof Karangkates', 'aws_stageof_karangkates'),
('AWS-STAGEOF-PASURUAN', 'AWS Stageof Pasuruan', 'aws_stageof_pasuruan'),
('AWS-STAGEOF-SAWAHAN', 'AWS Stageof Sawahan', 'aws_stageof_sawahan'),
('AWS-TANGGUL', 'AWS Tanggul', 'aws_tanggul'),
('AWS-TIRIS', 'AWS Tiris', 'aws_tiris'),
('AWS-UNIDA-GONTOR', 'AWS Unida Gontor', 'aws_unida_gontor');

-- 3. Buat Tabel announcements (Untuk Pengumuman)
CREATE TABLE IF NOT EXISTS public.announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  image_url TEXT,
  instagram_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Buat Function (RPC) untuk membuat tabel AWS baru secara otomatis via Admin Panel
CREATE OR REPLACE FUNCTION public.create_aws_table(tbl_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      rec SERIAL PRIMARY KEY,
      model text NOT NULL,
      sn text NOT NULL,
      os text NOT NULL,
      site varchar(25),
      id_sta text NOT NULL,
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
  ', tbl_name);
END;
$function$;
