import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useConfirm } from "@/components/ui/confirm-provider";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
  const confirm = useConfirm();
  const { items: orgMembers, load, add, remove } = useCrud<OrgMemberData>("organization_structure");
  
  const [newOrgMember, setNewOrgMember] = useState<OrgMemberData>({
    role_id: "",
    parent_role_id: "",
    role_title: "",
    name: "",
    nip: "",
    show_role_title: true
  });

  useEffect(() => {
    load("order=created_at.desc");
  }, [load]);

  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...newOrgMember };
    if (!payload.parent_role_id) delete payload.parent_role_id;
    
    const isSuccess = await add(payload, "Anggota organisasi berhasil ditambahkan");
    if (isSuccess) {
      setNewOrgMember({
        role_id: "",
        parent_role_id: "",
        role_title: "",
        name: "",
        nip: "",
        show_role_title: true
      });
      load("order=created_at.desc");
    }
  };

  const handleDeleteOrgMember = async (id: number) => {
    if (await confirm("Yakin ingin menghapus anggota ini?")) {
      remove(id, undefined, "Anggota organisasi berhasil dihapus");
    }
  };

  const getParentOptions = () => {
    if (newOrgMember.role_id === "kepala") {
      return [{ value: "", label: "-- Posisi Teratas (Tanpa Atasan) --" }];
    }
    
    const baseOptions = [
      { value: "", label: "-- Posisi Teratas (Tanpa Atasan) --" },
      { value: "kepala", label: "KEPALA UPT" },
      { value: "kasubag", label: "KEPALA SUB BAGIAN" },
      { value: "tim_1", label: "KETUA TIM TU" },
      { value: "tim_2", label: "KETUA TIM DATA" },
      { value: "tim_3", label: "KETUA TIM ANALISA DAN INFORMASI" },
      { value: "tim_4", label: "KETUA TIM TEKNISI JARINGAN & KOMUNIKASI" },
      { value: "tim_5", label: "KETUA TIM OBSERVASI" },
      { value: "fungsional_pmg", label: "FUNGSIONAL PMG" },
      { value: "fungsional_non_pmg", label: "FUNGSIONAL NON PMG" }
    ];

    if (newOrgMember.role_id.startsWith("tim_")) {
      return baseOptions.filter(opt => opt.value === "" || opt.value === "kepala" || opt.value === "kasubag");
    }

    return baseOptions;
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
                  <form className="space-y-4 flex-1 flex flex-col" onSubmit={handleAddOrgMember}>
                    {/* Grup 1: Posisi & Hierarki */}
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-indigo-500">account_tree</span> 
                        Hierarki Organisasi
                      </h4>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Posisi / Kategori Warna</label>
                        <CustomSelect
                          required
                          value={newOrgMember.role_id}
                          onChange={(val) => {
                             let newParent = newOrgMember.parent_role_id;
                             if (val === "kepala") newParent = "";
                             else if (val.startsWith("tim_") && newParent && !["kepala", "kasubag"].includes(newParent)) newParent = "";
                             setNewOrgMember({...newOrgMember, role_id: val, parent_role_id: newParent});
                          }}
                          options={[
                            { value: "", label: "-- Pilih Posisi --" },
                            { value: "kepala", label: "KEPALA UPT (Biru Tua)" },
                            { value: "kasubag", label: "KEPALA SUB BAGIAN (Hijau)" },
                            { value: "tim_1", label: "KETUA TIM TU (Oranye)" },
                            { value: "tim_2", label: "KETUA TIM DATA (Biru)" },
                            { value: "tim_3", label: "KETUA TIM ANALISA DAN INFORMASI (Nila)" },
                            { value: "tim_4", label: "KETUA TIM TEKNISI JARINGAN & KOMUNIKASI (Merah Muda)" },
                            { value: "tim_5", label: "KETUA TIM OBSERVASI (Ungu)" },
                            { value: "fungsional_pmg", label: "FUNGSIONAL PMG (Oranye)" },
                            { value: "fungsional_non_pmg", label: "FUNGSIONAL NON PMG (Hijau)" },
                            { value: "anggota", label: "ANGGOTA / STAF BARU" }
                          ]}
                        />
                      </div>
                      
                      <div className="relative z-[90]">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Atasan Langsung (Parent)</label>
                        <CustomSelect
                          value={newOrgMember.parent_role_id || ""}
                          onChange={(val) => setNewOrgMember({...newOrgMember, parent_role_id: val})}
                          options={getParentOptions()}
                        />
                      </div>
                    </div>

                    {/* Grup 2: Identitas Pegawai */}
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-teal-500">badge</span> 
                        Identitas Pegawai
                      </h4>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap & Gelar</label>
                        <input required value={newOrgMember.name} onChange={e => setNewOrgMember({...newOrgMember, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 bg-white" type="text" placeholder="Cth: Dr. Budi Santoso, M.Si" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Jabatan (Ditampilkan)</label>
                        <input required value={newOrgMember.role_title} onChange={e => setNewOrgMember({...newOrgMember, role_title: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 bg-white" type="text" placeholder="Cth: KEPALA STASIUN KLIMATOLOGI" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Induk Pegawai (NIP)</label>
                        <input value={newOrgMember.nip} onChange={e => setNewOrgMember({...newOrgMember, nip: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-mono bg-white" type="text" placeholder="Opsional..." />
                      </div>
                    </div>

                    {/* Pengaturan Tambahan */}
                    <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/30 transition-colors cursor-pointer group">
                      <input 
                        type="checkbox" 
                        id="showTitle"
                        checked={newOrgMember.show_role_title}
                        onChange={(e) => setNewOrgMember({...newOrgMember, show_role_title: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <label htmlFor="showTitle" className="text-sm font-bold text-slate-700 cursor-pointer select-none group-hover:text-primary transition-colors flex-1">
                        Tampilkan Nama Jabatan di Diagram
                      </label>
                    </div>

                    <div className="pt-2 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25 py-3.5 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
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
                    {(() => {
                      const hierarchyRank: Record<string, number> = {
                        "kepala": 1,
                        "kasubag": 2,
                        "tim_1": 3,
                        "tim_2": 3,
                        "tim_3": 3,
                        "tim_4": 3,
                        "tim_5": 3,
                        "tim_6": 3,
                        "fungsional_pmg": 4,
                        "fungsional_non_pmg": 4,
                        "anggota": 5
                      };
                      
                      const sortedMembers = [...orgMembers].sort((a, b) => {
                        const rankA = hierarchyRank[a.role_id] || (a.role_id.startsWith("anggota") ? 5 : 99);
                        const rankB = hierarchyRank[b.role_id] || (b.role_id.startsWith("anggota") ? 5 : 99);
                        return rankA - rankB;
                      });
                      
                      return sortedMembers.map((m: any) => (
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
                    ));
                    })()}
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
