import { useState, useCallback } from "react";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseDeleteFile, supabaseUploadFile } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/hooks/useAuth";

export function useCrud<T>(tableName: string, bucketName?: string) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const { success, error, info } = useToast();
  const { user } = useAuth();

  const load = useCallback(async (query: string = "") => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await supabaseFetch(tableName, query);
      if (data) {
        setItems(data);
      } else {
        setIsError(true);
      }
    } catch (e) {
      setIsError(true);
      error(`Gagal memuat data ${tableName}`);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, error]);

  const add = async (payload: Partial<T>, successMsg: string = "Data berhasil ditambahkan") => {
    const result = await supabaseInsert(tableName, payload);
    if (result) {
      success(successMsg);
      return true;
    }
    error("Gagal menambahkan data");
    return false;
  };

  const update = async (id: number | string, payload: Partial<T>, successMsg: string = "Data berhasil diperbarui") => {
    const result = await supabaseUpdate(tableName, `id=eq.${id}`, payload);
    if (result) {
      success(successMsg);
      return true;
    }
    error("Gagal memperbarui data");
    return false;
  };

  const remove = async (id: number | string, fileUrl?: string, successMsg: string = "Data berhasil dihapus") => {
    try {
      const successData = await supabaseDelete(tableName, `id=eq.${id}`);
      if (successData) {
        if (fileUrl && bucketName) {
          await supabaseDeleteFile(bucketName, fileUrl);
        }
        if (successMsg) {
          success(successMsg);
        }
        await load();
        return true;
      }
      error("Gagal menghapus data");
      return false;
    } catch (e) {
      error("Terjadi kesalahan saat menghapus data");
      return false;
    }
  };

  const uploadFile = async (file: File, prefix: string = "") => {
    if (!bucketName) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = await supabaseUploadFile(bucketName, fileName, file);
    return filePath;
  };

  return { items, isLoading, isError, load, add, update, remove, uploadFile };
}
