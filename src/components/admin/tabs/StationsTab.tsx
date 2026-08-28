import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { Station } from "@/types/admin";
import { supabaseUpdate } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { CustomSelect } from "@/components/ui/CustomSelect";

export function StationsTab() {
  const confirm = useConfirm();
  const { success, error } = useToast();
  const { user } = useAuth();
  const { items: stations, isLoading, load, add, remove } = useCrud<Station>("stations");
  const [newStation, setNewStation] = useState({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });

  useEffect(() => {
    load("order=created_at.desc");
  }, [load]);

  const handleUpdateDisplayName = async (id: number, val: string, oldVal?: string) => {
    if (val === oldVal) return;
    try {
      const res = await supabaseUpdate("stations", `id=eq.${id}`, { display_name: val });
      if (res) {
        success("Nama publik stasiun berhasil diperbarui!");
      } else {
        error("Gagal memperbarui nama stasiun.");
      }
    } catch (err) {
      error("Terjadi kesalahan saat menyimpan nama stasiun.");
    }
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await add({
      station_id: newStation.id_sta,
      station_name: newStation.name,
      table_name: newStation.table,
      status: newStation.status,
      lat: newStation.lat ? parseFloat(newStation.lat) : undefined,
      lon: newStation.lng ? parseFloat(newStation.lng) : undefined
    }, "Stasiun berhasil ditambahkan");
    
    if (success) {
      setNewStation({ id_sta: "", name: "", table: "", status: "Online", lat: "", lng: "" });
      load("order=created_at.desc");
    }
  };

  const handleToggleVisibility = async (id: number, field: string, currentValue: boolean) => {
    const payload = { [field]: !currentValue };
    const result = await supabaseUpdate("stations", `id=eq.${id}`, payload);
    if (result) {
      load("order=created_at.desc");
    }
  };

  const handleDeleteStation = async (id: number) => {
    if (await confirm("Yakin ingin menghapus stasiun ini?")) {
      remove(id, undefined, "Stasiun berhasil dihapus");
    }
  };


  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manage AWS Table Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">sensors</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Daftar Stasiun AWS</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[13px] uppercase tracking-wider">
                          <th className="py-3 px-4 font-semibold">Station</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold">Visibility</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {stations.map((st, i) => (
                          <tr id={`item-station-${st.id}`} key={st.id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors group ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/10'}`}>
                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-800 mb-1">{st.station_id}</div>
                              <div className="text-xs text-slate-500 mb-2">{st.station_name}</div>
                              <input 
                                type="text"
                                placeholder="Nama Publik..."
                                defaultValue={st.display_name || ""}
                                onBlur={(e) => handleUpdateDisplayName(st.id, e.target.value, st.display_name)}
                                className="w-full max-w-[200px] border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.status === 'Online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span> {st.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-4">
                                <label className="flex items-center cursor-pointer group/chk gap-2">
                                  <div className="relative">
                                    <input type="checkbox" checked={st.show_on_home} onChange={() => handleToggleVisibility(st.id, 'show_on_home', st.show_on_home)} className="peer sr-only" />
                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-500 group-hover/chk:text-slate-800 transition-colors">Slider</span>
                                </label>
                                <label className="flex items-center cursor-pointer group/chk gap-2">
                                  <div className="relative">
                                    <input type="checkbox" checked={st.show_on_realtime} onChange={() => handleToggleVisibility(st.id, 'show_on_realtime', st.show_on_realtime)} className="peer sr-only" />
                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-500 group-hover/chk:text-slate-800 transition-colors">Realtime</span>
                                </label>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button onClick={() => handleDeleteStation(st.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-100 ml-auto focus:opacity-100">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {stations.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada stasiun</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {user?.role === "super_admin" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-fit sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Quick Add AWS</h3>
                  </div>
                  <form className="space-y-4 flex-1" onSubmit={handleAddStation}>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Station ID</label>
                      <input required value={newStation.id_sta} onChange={e => setNewStation({...newStation, id_sta: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="e.g. AWS-KJN-04" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lokasi</label>
                      <input required value={newStation.name} onChange={e => setNewStation({...newStation, name: e.target.value, table: `aws_${e.target.value.toLowerCase().replace(/\s+/g, '_')}`})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="e.g. AWS Kepanjen" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Tabel DB (Auto)</label>
                      <input required value={newStation.table} onChange={e => setNewStation({...newStation, table: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-500 bg-slate-50" type="text"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Initial Status</label>
                      <CustomSelect
                        required
                        value={newStation.status}
                        onChange={(val) => setNewStation({...newStation, status: val})}
                        options={[
                          { value: "Online", label: "Online" },
                          { value: "Offline", label: "Offline" },
                          { value: "Maintenance", label: "Maintenance" }
                        ]}
                      />
                    </div>
                    <div className="pt-4 mt-auto">
                      <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Tambahkan Stasiun
                      </button>
                    </div>
                  </form>
                </div>
                )}
              </section>
    </>
  );
}
