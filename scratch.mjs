import fs from 'fs';

async function test() {
  const SUPABASE_URL = "https://jdrqulgbprcfwokhpjqw.supabase.co/rest/v1";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcnF1bGdicHJjZndva2hwanF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDIyMTcsImV4cCI6MjEwMDg3ODIxN30.mU3G1wfid4SuCVRlfV34RdwFl4YExr4lK-8B8OY3yWg";
  
  const res = await fetch(`${SUPABASE_URL}/pengumuman?limit=1`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  console.log("Pengumuman:", await res.json());

  const res2 = await fetch(`${SUPABASE_URL}/berita_kegiatan?limit=1`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  console.log("Berita:", await res2.json());
}
test();
