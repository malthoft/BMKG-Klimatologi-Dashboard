export const SUPABASE_URL = "https://jdrqulgbprcfwokhpjqw.supabase.co/rest/v1";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcnF1bGdicHJjZndva2hwanF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDIyMTcsImV4cCI6MjEwMDg3ODIxN30.mU3G1wfid4SuCVRlfV34RdwFl4YExr4lK-8B8OY3yWg";

export const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

export async function supabaseFetch(tableName: string, query: string = "") {
  try {
    // Redirect AWS Realtime Data queries to custom API (althof.site/api.php)
    if (tableName.startsWith("aws_")) {
      const limitMatch = query.match(/limit=(\d+)/);
      const limit = limitMatch ? limitMatch[1] : "144";
      const apiUrl = `https://althof.site/api.php?station=${tableName}&limit=${limit}`;
      
      try {
        const apiRes = await fetch(apiUrl, { cache: "no-store" });
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (Array.isArray(data)) {
            return data;
          }
        }
      } catch (apiErr) {
        console.warn(`Custom API fetch failed for ${tableName}, falling back to Supabase direct:`, apiErr);
      }
    }

    const res = await fetch(`${SUPABASE_URL}/${tableName}${query ? `?${query}` : ''}`, {
      method: "GET",
      headers: supabaseHeaders,
      cache: "no-store", // Prevent caching for realtime data
    });
    if (!res.ok) {
      const errorText = await res.text();
      if (errorText.includes("PGRST205") || res.status === 404) {
        console.warn(`Table ${tableName} not found (PGRST205)`);
        return null;
      }
      throw new Error(errorText);
    }
    const data = await res.json();
    if (tableName === "stations" && Array.isArray(data)) {
      return data.filter((st: any) => st.table_name !== "aws_tanggul");
    }
    return data;
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    return null;
  }
}

export async function supabaseInsert(tableName: string, data: any) {
  try {
    const res = await fetch(`${SUPABASE_URL}/${tableName}`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      if (errorText.includes("PGRST205") || res.status === 404 || res.status === 400) {
        console.warn(`Error inserting to ${tableName} (PGRST205/40x): ${errorText}`);
        return null;
      }
      throw new Error(errorText);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error inserting to ${tableName}:`, error);
    return null;
  }
}

export async function supabaseUpdate(tableName: string, idFilter: string, data: any) {
  try {
    const res = await fetch(`${SUPABASE_URL}/${tableName}?${idFilter}`, {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      if (errorText.includes("PGRST205") || res.status === 404 || res.status === 400) {
        console.warn(`Error updating ${tableName} (PGRST205/40x): ${errorText}`);
        return null;
      }
      throw new Error(errorText);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error);
    return null;
  }
}

export async function supabaseDelete(tableName: string, idFilter: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/${tableName}?${idFilter}`, {
      method: "DELETE",
      headers: supabaseHeaders,
    });
    if (!res.ok) {
      const errorText = await res.text();
      if (errorText.includes("PGRST205") || res.status === 404 || res.status === 400) {
        console.warn(`Error deleting from ${tableName} (PGRST205/40x): ${errorText}`);
        return false;
      }
      throw new Error(errorText);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    return false;
  }
}

export async function supabaseRpc(functionName: string, params: any = {}) {
  try {
    const res = await fetch(`https://jdrqulgbprcfwokhpjqw.supabase.co/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errorText = await res.text();
      if (errorText.includes("PGRST205") || res.status === 404 || res.status === 400) {
        console.warn(`Error executing RPC ${functionName} (PGRST205/40x): ${errorText}`);
        return null;
      }
      throw new Error(errorText);
    }
    
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error(`Error executing RPC ${functionName}:`, error);
    return null;
  }
}

// Storage API
const SUPABASE_PROJECT_URL = SUPABASE_URL.replace("/rest/v1", "");

export async function supabaseUploadFile(bucket: string, filePath: string, file: File) {
  try {
    const doUpload = async () => fetch(`${SUPABASE_PROJECT_URL}/storage/v1/object/${bucket}/${filePath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        "x-upsert": "true",
      },
      body: file,
    });

    let res = await doUpload();

    if (!res.ok) {
      let errorText = await res.text();
      // If it's an RLS error, it might be due to x-upsert triggering an UPDATE that is blocked.
      // We workaround this by deleting the old file first and re-uploading as a new INSERT.
      // Note: Supabase sometimes returns HTTP 400 with a JSON containing statusCode: 403 for this.
      if (errorText.includes("row-level security policy")) {
        await supabaseDeleteFile(bucket, filePath);
        res = await doUpload();
        if (!res.ok) {
          errorText = await res.text();
          throw new Error(errorText);
        }
      } else {
        throw new Error(errorText);
      }
    }
    // Return the public URL
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${filePath}`;
  } catch (error) {
    console.error(`Error uploading to bucket ${bucket}:`, error);
    return null;
  }
}

export async function supabaseDeleteFile(bucket: string, filePath: string) {
  try {
    const res = await fetch(`${SUPABASE_PROJECT_URL}/storage/v1/object/${bucket}/${filePath}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      // Ignore 404 if the file is already deleted
      if (res.status === 404 || errorText.includes("NoSuchKey")) {
        return true; 
      }
      throw new Error(errorText);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting from bucket ${bucket}:`, error);
    return false;
  }
}

export function supabaseGetPublicUrl(bucket: string, filePath: string) {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}
