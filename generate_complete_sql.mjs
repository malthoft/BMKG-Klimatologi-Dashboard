import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

async function generateExport() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  let sql = `-- ==============================================================================
-- BMKG STASIUN KLIMATOLOGI KELAS I JAWA TIMUR
-- FULL DATABASE RESTORE & SETUP SCRIPT
-- ==============================================================================
-- Script ini berisi:
-- 1. Ekstensi Database (uuid-ossp, pgcrypto, pg_cron)
-- 2. Storage Buckets & Storage RLS Policies
-- 3. Stored Functions & Triggers
-- 4. Struktur Tabel Lengkap (DDL, Primary Keys, Constraints, Indexes)
-- 5. Row Level Security (RLS) Policies
-- 6. Cron Jobs (Pembersihan & Agregasi Otomatis Data AWS)
-- 7. Data Master & Seed Data Seluruh Fitur Website
-- ==============================================================================

`;

  // 1. Extensions
  sql += `-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "pg_cron";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron tidak dapat diaktifkan atau memerlukan akses superuser di project ini: %', SQLERRM;
END $$;

`;

  // 2. Storage Buckets
  sql += `-- ==============================================================================
-- 2. STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('temperature-maps', 'temperature-maps', true, null, null),
  ('climate-data', 'climate-data', true, null, null),
  ('rainfall-data', 'rainfall-data', true, null, null),
  ('employee-photos', 'employee-photos', true, null, null),
  ('berita-kegiatan-files', 'berita-kegiatan-files', true, null, null),
  ('pengumuman-files', 'pengumuman-files', true, null, null),
  ('pelayanan-publik-files', 'pelayanan-publik-files', true, null, null),
  ('e-buletin-files', 'e-buletin-files', true, null, null)
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public;

`;

  // 3. Storage Policies
  sql += `-- ==============================================================================
-- 3. STORAGE RLS POLICIES
-- ==============================================================================
DO $$
BEGIN
  -- Izinkan public read ke semua storage bucket di atas
  DROP POLICY IF EXISTS "Public Access All Buckets" ON storage.objects;
  CREATE POLICY "Public Access All Buckets" ON storage.objects FOR SELECT USING (true);

  -- Izinkan anon/authenticated upload & update & delete
  DROP POLICY IF EXISTS "Anon Insert All Buckets" ON storage.objects;
  CREATE POLICY "Anon Insert All Buckets" ON storage.objects FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Anon Update All Buckets" ON storage.objects;
  CREATE POLICY "Anon Update All Buckets" ON storage.objects FOR UPDATE USING (true);

  DROP POLICY IF EXISTS "Anon Delete All Buckets" ON storage.objects;
  CREATE POLICY "Anon Delete All Buckets" ON storage.objects FOR DELETE USING (true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Storage policy error: %', SQLERRM;
END $$;

`;

  // 4. Custom Functions
  sql += `-- ==============================================================================
-- 4. CUSTOM DATABASE FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_surveys_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_old_aws_data()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'aws_%'
    LOOP
        EXECUTE format('DELETE FROM %I WHERE timestamp < NOW() - INTERVAL ''3 days''', t_name);
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_aws_table(p_table_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF p_table_name !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Nama tabel tidak valid: %', p_table_name;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = p_table_name AND table_schema = 'public') THEN
    RETURN 'TABLE_EXISTS';
  END IF;

  EXECUTE format('
    CREATE TABLE %I (
      rec SERIAL PRIMARY KEY,
      model text NOT NULL DEFAULT ''-'',
      sn text NOT NULL DEFAULT ''-'',
      os text NOT NULL DEFAULT ''-'',
      site varchar(25) DEFAULT NULL,
      id_sta text NOT NULL DEFAULT ''-'',
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
    )', p_table_name);

  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
  EXECUTE format('CREATE POLICY "Allow public read" ON %I FOR SELECT USING (true)', p_table_name);
  EXECUTE format('CREATE POLICY "Allow service insert" ON %I FOR INSERT WITH CHECK (true)', p_table_name);
  EXECUTE format('CREATE POLICY "Allow anon read" ON %I FOR SELECT TO anon USING (true)', p_table_name);
  EXECUTE format('CREATE POLICY "Allow anon insert" ON %I FOR INSERT TO anon WITH CHECK (true)', p_table_name);

  RETURN 'TABLE_CREATED';
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_station_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  sta_status TEXT;
BEGIN
  SELECT status INTO sta_status FROM public.stations WHERE table_name = TG_TABLE_NAME LIMIT 1;
  IF sta_status != 'Online' THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$function$;

`;

  // 5. Get all tables & DDL
  sql += `-- ==============================================================================
-- 5. TABLES DDL & SCHEMAS
-- ==============================================================================
`;

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('test_123', 'test_check')
    ORDER BY 
      CASE 
        WHEN table_name = 'stations' THEN 1
        WHEN table_name = 'org_positions' THEN 2
        WHEN table_name LIKE 'aws_%' THEN 10
        ELSE 5
      END,
      table_name;
  `);

  const tableNames = tablesRes.rows.map(r => r.table_name);

  for (const tableName of tableNames) {
    // Get columns
    const colsRes = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);

    // Primary keys
    const pkRes = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_schema = 'public' 
        AND tc.table_name = $1;
    `, [tableName]);
    const pkCols = pkRes.rows.map(r => `"${r.column_name}"`);

    sql += `\n-- Table: public."${tableName}"\n`;
    sql += `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n`;

    const colDefs = colsRes.rows.map(col => {
      let typeStr = col.udt_name;
      if (col.data_type === 'character varying') {
        typeStr = col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR';
      } else if (col.data_type === 'character') {
        typeStr = col.character_maximum_length ? `CHAR(${col.character_maximum_length})` : 'CHAR';
      } else if (col.data_type === 'numeric') {
        typeStr = col.numeric_precision ? `NUMERIC(${col.numeric_precision},${col.numeric_scale || 0})` : 'NUMERIC';
      } else if (col.udt_name === 'timestamp' || col.data_type === 'timestamp without time zone') {
        typeStr = 'TIMESTAMP WITHOUT TIME ZONE';
      } else if (col.udt_name === 'timestamptz' || col.data_type === 'timestamp with time zone') {
        typeStr = 'TIMESTAMP WITH TIME ZONE';
      } else if (col.udt_name === 'jsonb') {
        typeStr = 'JSONB';
      } else if (col.udt_name === 'json') {
        typeStr = 'JSON';
      } else if (col.udt_name === 'text') {
        typeStr = 'TEXT';
      } else if (col.udt_name === 'bool' || col.data_type === 'boolean') {
        typeStr = 'BOOLEAN';
      } else if (col.udt_name === 'int4') {
        typeStr = col.column_default && col.column_default.includes('nextval') ? 'SERIAL' : 'INTEGER';
      } else if (col.udt_name === 'int8') {
        typeStr = col.column_default && col.column_default.includes('nextval') ? 'BIGSERIAL' : 'BIGINT';
      } else if (col.udt_name === 'float8') {
        typeStr = 'DOUBLE PRECISION';
      } else if (col.udt_name === 'float4') {
        typeStr = 'REAL';
      }

      let line = `  "${col.column_name}" ${typeStr}`;
      if (col.column_default && !typeStr.includes('SERIAL')) {
        line += ` DEFAULT ${col.column_default}`;
      }
      if (col.is_nullable === 'NO') {
        line += ' NOT NULL';
      }
      return line;
    });

    if (pkCols.length > 0) {
      colDefs.push(`  CONSTRAINT "${tableName}_pkey" PRIMARY KEY (${pkCols.join(', ')})`);
    }

    sql += colDefs.join(',\n') + '\n);\n';

    // RLS
    sql += `ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;\n`;
    sql += `DROP POLICY IF EXISTS "Public Read ${tableName}" ON public."${tableName}";\n`;
    sql += `CREATE POLICY "Public Read ${tableName}" ON public."${tableName}" FOR SELECT USING (true);\n`;
    sql += `DROP POLICY IF EXISTS "Allow All Insert ${tableName}" ON public."${tableName}";\n`;
    sql += `CREATE POLICY "Allow All Insert ${tableName}" ON public."${tableName}" FOR INSERT WITH CHECK (true);\n`;
    sql += `DROP POLICY IF EXISTS "Allow All Update ${tableName}" ON public."${tableName}";\n`;
    sql += `CREATE POLICY "Allow All Update ${tableName}" ON public."${tableName}" FOR UPDATE USING (true);\n`;
    sql += `DROP POLICY IF EXISTS "Allow All Delete ${tableName}" ON public."${tableName}";\n`;
    sql += `CREATE POLICY "Allow All Delete ${tableName}" ON public."${tableName}" FOR DELETE USING (true);\n`;
  }

  // 6. Triggers
  sql += `\n-- ==============================================================================
-- 6. TRIGGERS
-- ==============================================================================
DROP TRIGGER IF EXISTS update_surveys_modtime ON public.surveys;
CREATE TRIGGER update_surveys_modtime 
BEFORE UPDATE ON public.surveys 
FOR EACH ROW EXECUTE FUNCTION public.update_surveys_updated_at();

`;

  for (const t of tableNames) {
    if (t.startsWith('aws_')) {
      const trgName = `trg_check_status_${t}`;
      sql += `DROP TRIGGER IF EXISTS "${trgName}" ON public."${t}";\n`;
      sql += `CREATE TRIGGER "${trgName}" BEFORE INSERT ON public."${t}" FOR EACH ROW EXECUTE FUNCTION public.check_station_status();\n`;
    }
  }

  // 7. Cron Jobs Setup
  sql += `\n-- ==============================================================================
-- 7. SCHEDULED CRON JOBS (pg_cron)
-- ==============================================================================
DO $$
BEGIN
  -- Hapus job lama jika ada
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('aws_batu_cleanup_3days', 'aws_batu_daily_agg', 'aws_cleanup_all');
  
  -- Job pembersihan seluruh tabel AWS tiap jam 00:00 (Hanya simpan 3 hari data terbaru)
  PERFORM cron.schedule('aws_cleanup_all', '0 0 * * *', 'SELECT public.delete_old_aws_data();');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping cron schedule setup (pg_cron unavailable): %', SQLERRM;
END $$;

`;

  // 8. Data Export (DML)
  sql += `\n-- ==============================================================================
-- 8. DATA INSERTIONS (SEED DATA)
-- ==============================================================================
`;

  for (const tableName of tableNames) {
    // Limit AWS data to 50 latest rows to keep file fast and neat, but full for all other tables
    const isAws = tableName.startsWith('aws_');
    const query = isAws 
      ? `SELECT * FROM public."${tableName}" ORDER BY timestamp DESC LIMIT 50;`
      : `SELECT * FROM public."${tableName}";`;

    const dataRes = await client.query(query);
    if (dataRes.rows.length === 0) continue;

    sql += `\n-- Data: ${tableName} (${dataRes.rows.length} rows)\n`;
    const cols = Object.keys(dataRes.rows[0]);
    const colList = cols.map(c => `"${c}"`).join(', ');

    for (const row of dataRes.rows) {
      const valList = cols.map(c => {
        const val = row[c];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (val instanceof Date) return `'${val.toISOString()}'`;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        // String escaping
        return `'${String(val).replace(/'/g, "''")}'`;
      }).join(', ');

      sql += `INSERT INTO public."${tableName}" (${colList}) VALUES (${valList}) ON CONFLICT DO NOTHING;\n`;
    }
  }

  // 9. Update Sequences
  sql += `\n-- ==============================================================================
-- 9. RESTART SEQUENCES
-- ==============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_name, column_name, column_default 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_default LIKE 'nextval(%'
    LOOP
        EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE(MAX(%I), 1) + 1, false) FROM %I', 
            r.table_name, r.column_name, r.column_name, r.table_name);
    END LOOP;
END $$;
`;

  await client.end();

  fs.writeFileSync('bmkg_database_complete.sql', sql, 'utf8');
  console.log(`Export finished! Saved to bmkg_database_complete.sql (${Buffer.byteLength(sql, 'utf8')} bytes)`);
}

generateExport().catch(console.error);
