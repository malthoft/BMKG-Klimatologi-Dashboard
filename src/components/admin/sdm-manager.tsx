import { useState, useEffect } from "react";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseUploadFile, supabaseGetPublicUrl } from "@/lib/supabase";
import { toast } from "sonner";
import { User, Image as ImageIcon, Trash2, Edit2, Save, Plus, X } from "lucide-react";
import Image from "next/image";

interface Employee {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  bagian: string;
  foto: string[];
  order_index: number;
}

export function SdmManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmp, setCurrentEmp] = useState<Partial<Employee>>({
    nama: "", nip: "", jabatan: "", bagian: "", foto: [], order_index: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseFetch("employees?order=order_index.asc,created_at.asc");
      if (data) setEmployees(data);
    } catch (e) {
      toast.error("Gagal memuat data pegawai");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let fotoUrls = [...(currentEmp.foto || [])];

      // Upload new files if any
      if (uploadFiles.length > 0) {
        toast.info(`Mengunggah ${uploadFiles.length} foto...`);
        for (const file of uploadFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = await supabaseUploadFile("employee-photos", fileName, file);
          if (filePath) {
            fotoUrls.push(filePath);
          }
        }
      }

      const payload = {
        nama: currentEmp.nama,
        nip: currentEmp.nip,
        jabatan: currentEmp.jabatan,
        bagian: currentEmp.bagian,
        order_index: currentEmp.order_index || 0,
        foto: fotoUrls
      };

      if (currentEmp.id) {
        await supabaseUpdate("employees", `id=eq.${currentEmp.id}`, payload);
        toast.success("Data pegawai berhasil diperbarui!");
      } else {
        await supabaseInsert("employees", [payload]);
        toast.success("Data pegawai berhasil ditambahkan!");
      }

      resetForm();
      loadEmployees();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data pegawai");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pegawai ini?")) return;
    try {
      await supabaseDelete("employees", `id=eq.${id}`);
      toast.success("Data pegawai dihapus");
      loadEmployees();
    } catch (e) {
      toast.error("Gagal menghapus data");
    }
  };

  const removePhoto = (index: number) => {
    if (!currentEmp.foto) return;
    const newFotos = [...currentEmp.foto];
    newFotos.splice(index, 1);
    setCurrentEmp({ ...currentEmp, foto: newFotos });
  };

  const resetForm = () => {
    setCurrentEmp({ nama: "", nip: "", jabatan: "", bagian: "", foto: [], order_index: 0 });
    setUploadFiles([]);
    setIsEditing(false);
  };

  const editEmployee = (emp: Employee) => {
    setCurrentEmp(emp);
    setUploadFiles([]);
    setIsEditing(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Daftar Pegawai</h3>
            <span className="bg-blue-100 text-primary text-xs font-bold px-3 py-1 rounded-full">
              {employees.length} Orang
            </span>
          </div>
          
          <div className="p-6 overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-10 text-slate-500">Memuat data...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-10 text-slate-500">Belum ada data pegawai</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="py-3 px-4 font-semibold">Pegawai</th>
                    <th className="py-3 px-4 font-semibold">NIP</th>
                    <th className="py-3 px-4 font-semibold">Jabatan / Bagian</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative shrink-0">
                            {emp.foto && emp.foto.length > 0 ? (
                              <Image src={emp.foto[0]} alt={emp.nama} fill className="object-cover" />
                            ) : (
                              <User className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-700">{emp.nama}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{emp.nip || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-slate-700">{emp.jabatan || "-"}</div>
                        <div className="text-xs text-slate-500">{emp.bagian || "-"}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => editEmployee(emp)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-fit sticky top-28">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">{isEditing ? "Edit Pegawai" : "Tambah Pegawai"}</h3>
          {isEditing && (
            <button onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 bg-white border border-slate-200 rounded">
              Batal
            </button>
          )}
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
            <input required value={currentEmp.nama} onChange={e => setCurrentEmp({...currentEmp, nama: e.target.value})} type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">NIP</label>
            <input value={currentEmp.nip} onChange={e => setCurrentEmp({...currentEmp, nip: e.target.value})} type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jabatan</label>
            <input value={currentEmp.jabatan} onChange={e => setCurrentEmp({...currentEmp, jabatan: e.target.value})} type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bagian / Unit</label>
            <input value={currentEmp.bagian} onChange={e => setCurrentEmp({...currentEmp, bagian: e.target.value})} type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Foto Profil</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={e => {
                if (e.target.files) {
                  setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }
              }} 
              className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl cursor-pointer"
            />
            {uploadFiles.length > 0 && <p className="text-xs text-blue-600 mt-2">{uploadFiles.length} file dipilih untuk diunggah.</p>}
            
            {currentEmp.foto && currentEmp.foto.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {currentEmp.foto.map((url, i) => (
                  <div key={i} className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden group">
                    <Image src={url} alt="Foto" fill className="object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 bg-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-4">
            <button type="submit" disabled={isSaving} className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-primary/20 flex justify-center items-center gap-2 disabled:opacity-50">
              {isSaving ? (
                <>Menyimpan...</>
              ) : (
                <>
                  {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isEditing ? "Simpan Perubahan" : "Tambah Pegawai"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
