import { useState, useCallback } from "react";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseDeleteFile, supabaseUploadFile } from "@/lib/supabase";
import { toast } from "sonner";

export function useCrud<T>(tableName: string, bucketName?: string) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async (query: string = "") => {
    setIsLoading(true);
    try {
      const data = await supabaseFetch(tableName, query);
      if (data) setItems(data);
    } catch (e) {
      toast.error(`Gagal memuat data ${tableName}`);
    } finally {
      setIsLoading(false);
    }
  }, [tableName]);

  const add = async (payload: Partial<T>, successMsg: string = "Data berhasil ditambahkan") => {
    const result = await supabaseInsert(tableName, payload);
    if (result) {
      toast.success(successMsg);
      return true;
    }
    toast.error("Gagal menambahkan data");
    return false;
  };

  const update = async (id: number | string, payload: Partial<T>, successMsg: string = "Data berhasil diperbarui") => {
    const result = await supabaseUpdate(tableName, `id=eq.${id}`, payload);
    if (result) {
      toast.success(successMsg);
      return true;
    }
    toast.error("Gagal memperbarui data");
    return false;
  };

  const remove = async (id: number | string, fileUrl?: string, successMsg: string = "Data berhasil dihapus") => {
    try {
      const success = await supabaseDelete(tableName, `id=eq.${id}`);
      if (success) {
        if (fileUrl && bucketName) {
          await supabaseDeleteFile(bucketName, fileUrl);
        }
        toast.success(successMsg);
        await load();
        return true;
      }
      toast.error("Gagal menghapus data");
      return false;
    } catch (e) {
      toast.error("Terjadi kesalahan saat menghapus data");
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

  return { items, isLoading, load, add, update, remove, uploadFile };
}
