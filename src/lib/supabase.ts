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
    return await res.json();
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
