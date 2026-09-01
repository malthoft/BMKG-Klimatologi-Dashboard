import { useEffect } from "react";
import { useCrud } from "@/hooks/useCrud";
import { Station } from "@/types/admin";
import { supabaseUpdate } from "@/lib/supabase";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";

export function StationsTab() {
  const confirm = useConfirm();
  const { success, error } = useToast();
  const { items: stations, load, remove } = useCrud<Station>("stations");

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
      <section className="w-full">
        {/* Manage AWS Table Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">sensors</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Daftar Stasiun AWS</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kelola visibilitas stasiun pada beranda (slider) dan pemantauan realtime.</p>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
              {stations.length} stasiun
            </span>
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
      </section>
    </>
  );
}
