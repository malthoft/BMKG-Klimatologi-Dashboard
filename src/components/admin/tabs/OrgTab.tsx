import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";

interface OrgMemberData {
  id?: number;
  role_id: string;
  role_title: string;
  name: string;
  nip?: string;
  parent_role_id?: string;
  show_role_title?: boolean;
}

export function OrgTab() {
  const { items: orgMembers, load, add, remove } = useCrud<OrgMemberData>("org_members");
  
  const [newOrgMember, setNewOrgMember] = useState<OrgMemberData>({
    role_id: "",
    parent_role_id: "",
    role_title: "",
    name: "",
    nip: "",
    show_role_title: true
  });

  useEffect(() => {
    load();
  }, [load]);

  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...newOrgMember };
    if (!payload.parent_role_id) delete payload.parent_role_id;
    
    const success = await add(payload, "Anggota organisasi berhasil ditambahkan");
    if (success) {
      setNewOrgMember({
        role_id: "",
        parent_role_id: "",
        role_title: "",
        name: "",
        nip: "",
        show_role_title: true
      });
      load();
    }
  };

  const handleDeleteOrgMember = (id: number) => {
    if (confirm("Yakin ingin menghapus anggota ini?")) {
      remove(id, undefined, "Anggota organisasi berhasil dihapus");
    }
  };

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Anggota */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Input Data Anggota</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddOrgMember}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Posisi / Kategori Visual (Role ID)</label>
                      <select required value={newOrgMember.role_id} onChange={e => setNewOrgMember({...newOrgMember, role_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="">-- Pilih Posisi --</option>
                        <option value="kepala">KEPALA UPT (Biru Tua)</option>
                        <option value="kasubag">KEPALA SUB BAGIAN (Hijau)</option>
                        <option value="tim_1">KETUA TIM KERJA 1 (Oranye)</option>
                        <option value="tim_2">KETUA TIM KERJA 2 (Biru)</option>
                        <option value="tim_3">KETUA TIM KERJA 3 (Nila)</option>
                        <option value="tim_4">KETUA TIM KERJA 4 (Merah Muda)</option>
                        <option value="tim_5">KETUA TIM KERJA 5 (Ungu)</option>
                        <option value="tim_6">KETUA TIM KERJA 6 (Hijau)</option>
                        <option value="fungsional_pmg">FUNGSIONAL PMG (Oranye)</option>
                        <option value="fungsional_non_pmg">FUNGSIONAL NON PMG (Hijau)</option>
                        <option value="anggota">ANGGOTA / STAF BARU</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Di Bawah Siapa (Parent)</label>
                      <select value={newOrgMember.parent_role_id} onChange={e => setNewOrgMember({...newOrgMember, parent_role_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white cursor-pointer">
                        <option value="">-- Posisi Teratas (Tidak ada atasan) --</option>
                        {orgMembers.map((m: any) => (
                          <option key={m.id} value={m.role_id}>{m.name} ({m.role_title})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Jabatan Ditampilkan</label>
                      <input required value={newOrgMember.role_title} onChange={e => setNewOrgMember({...newOrgMember, role_title: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="e.g. KEPALA UPT, ANGGOTA" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Pegawai</label>
                      <input required value={newOrgMember.name} onChange={e => setNewOrgMember({...newOrgMember, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="Nama beserta gelar" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">NIP (Opsional)</label>
                      <input value={newOrgMember.nip} onChange={e => setNewOrgMember({...newOrgMember, nip: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" type="text" placeholder="1974..." />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        id="showTitle"
                        checked={newOrgMember.show_role_title}
                        onChange={(e) => setNewOrgMember({...newOrgMember, show_role_title: e.target.checked})}
                        className="w-5 h-5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <label htmlFor="showTitle" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                        Tampilkan Nama Jabatan di Profil
                      </label>
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Simpan Anggota
                      </button>
                    </div>
                  </form>
                </div>

                {/* Daftar Anggota */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Anggota Saat Ini</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgMembers.map((m: any) => (
                      <div id={`item-org-${m.id || m.role_id}`} key={m.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start gap-4 group">
                        <div className="flex-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {m.role_id.startsWith('anggota') ? 'ANGGOTA' : m.role_id}
                          </span>
                          {m.parent_role_id && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              ↓ {orgMembers.find((o: any) => o.role_id === m.parent_role_id)?.name || m.parent_role_id}
                            </span>
                          )}
                          <h4 className="font-bold text-slate-800 text-sm mt-3 leading-tight">
                            {m.role_title} 
                            {!m.show_role_title && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 rounded uppercase">Hidden</span>}
                          </h4>
                          <p className="text-base text-primary mt-1 font-bold">{m.name}</p>
                          <p className="text-xs text-slate-500 mt-1 font-mono">NIP: {m.nip || "-"}</p>
                        </div>
                        <button onClick={() => handleDeleteOrgMember(m.id!)} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    {orgMembers.length === 0 && (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
                        <p className="text-sm font-medium">Belum ada data anggota.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
    </>
  );
}
