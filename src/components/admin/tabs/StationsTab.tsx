import { useEffect, useState } from "react";
import { useCrud } from "@/hooks/useCrud";
import { Station } from "@/types/admin";
import { supabaseUpdate } from "@/lib/supabase";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/hooks/useAuth";

export function StationsTab() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const { success, error, info } = useToast();
  const { items: stations, load, remove, add } = useCrud<Station>("stations");

  const [isSyncing, setIsSyncing] = useState(false);
  const [newStation, setNewStation] = useState({
    station_id: "",
    station_name: "",
    display_name: "",
    table_name: "",
  });
  const [addSourceType, setAddSourceType] = useState('mqtt'); // 'mqtt' | 'ftp'
  const [addSourceValue, setAddSourceValue] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(stations.length / ITEMS_PER_PAGE);
  const paginatedStations = stations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    load("order=created_at.desc");
  }, [load]);

  const syncN8n = async () => {
    setIsSyncing(true);
    info("Menyinkronkan data dengan n8n...");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/n8n/sync", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("Sinkronisasi n8n berhasil!");
    } catch (err: any) {
      error(`Gagal sinkronisasi n8n: ${err.message}`);
    } finally {
      setIsSyncing(false);
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
    if (await confirm("Yakin ingin menghapus stasiun ini? Data tidak dapat dikembalikan.")) {
      const ok = await remove(id, undefined, "Stasiun berhasil dihapus");
      if (ok) await syncN8n();
    }
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTopic = addSourceType === 'ftp' ? `FTP:${addSourceValue}` : addSourceValue;
    const ok = await add({
      ...newStation,
      mqtt_topic: finalTopic,
      status: "Offline",
      show_on_home: true,
      show_on_realtime: true
    }, "Stasiun baru berhasil ditambahkan!");
    
    if (ok) {
      setNewStation({ station_id: "", station_name: "", display_name: "", table_name: "" });
      setAddSourceValue("");
      load("order=created_at.desc");
      await syncN8n();
    }
  };

  const openEditModal = (st: any) => {
    let sType = 'mqtt';
    let sValue = st.mqtt_topic || '';
    if (sValue.startsWith('FTP:')) {
      sType = 'ftp';
      sValue = sValue.replace('FTP:', '');
    } else if (sValue.startsWith('http')) {
      sType = 'ftp';
    }
    setEditFormData({
      ...st,
      source_type: sType,
      source_value: sValue
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    
    const finalTopic = editFormData.source_type === 'ftp' ? `FTP:${editFormData.source_value}` : editFormData.source_value;
    const payload = {
      station_id: editFormData.station_id,
      station_name: editFormData.station_name,
      display_name: editFormData.display_name,
      table_name: editFormData.table_name,
      mqtt_topic: finalTopic
    };

    const res = await supabaseUpdate("stations", `id=eq.${editFormData.id}`, payload);
    if (res) {
      success("Data stasiun berhasil diperbarui!");
      setEditModalOpen(false);
      load("order=created_at.desc");
      await syncN8n();
    } else {
      error("Gagal memperbarui data stasiun.");
    }
  };

  return (
    <>
      <section className="w-full flex flex-col gap-6">
        {user?.role === "super_admin" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Tambah Stasiun AWS Baru</h3>
            </div>
            
            <form onSubmit={handleAddStation} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Station ID</label>
                <input required type="text" placeholder="Misal: 35705" value={newStation.station_id} onChange={e => setNewStation({...newStation, station_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Station Name</label>
                <input required type="text" placeholder="Misal: AWS Malang" value={newStation.station_name} onChange={e => setNewStation({...newStation, station_name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Display Name (Publik)</label>
                <input type="text" placeholder="Misal: AWS Kota Malang" value={newStation.display_name} onChange={e => setNewStation({...newStation, display_name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Table Name (Database)</label>
                <input required type="text" placeholder="Misal: aws_malang" value={newStation.table_name} onChange={e => setNewStation({...newStation, table_name: e.target.value.toLowerCase()})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sumber Data (n8n / FTP)</label>
                <select value={addSourceType} onChange={e => setAddSourceType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white">
                  <option value="mqtt">MQTT (n8n)</option>
                  <option value="ftp">FTP Server</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{addSourceType === 'ftp' ? 'FTP Link' : 'MQTT Topic'}</label>
                <input required type="text" placeholder={addSourceType === 'ftp' ? "http://..." : "device/.../cj"} value={addSourceValue} onChange={e => setAddSourceValue(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="col-span-full mt-2">
                <button disabled={isSyncing} type="submit" className="w-fit bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">{isSyncing ? 'sync' : 'add'}</span>
                  {isSyncing ? 'Menyinkronkan...' : 'Tambah Stasiun'}
                </button>
              </div>
            </form>
          </div>
        )}

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
            <div className="flex items-center gap-3">
              {user?.role === "super_admin" && (
                <button onClick={syncN8n} disabled={isSyncing} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                  <span className={`material-symbols-outlined text-[14px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
                  Sync n8n
                </button>
              )}
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                {stations.length} stasiun
              </span>
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
                {paginatedStations.map((st: any, i) => (
                  <tr id={`item-station-${st.id}`} key={st.id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors group ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/10'}`}>
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-800 mb-1">{st.station_id}</div>
                      <div className="text-xs text-slate-500 mb-2">{st.station_name}</div>
                      {st.display_name ? (
                        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded border border-emerald-100">{st.display_name}</div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">Tanpa Nama Publik</div>
                      )}
                    </td>

                    <td className="py-4 px-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.status === 'Online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span> {st.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 align-top">
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
                    <td className="py-4 px-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        {user?.role === "super_admin" && (
                          <button onClick={() => openEditModal(st)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-100 focus:opacity-100">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                        <button onClick={() => handleDeleteStation(st.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {stations.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada stasiun</td></tr>}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, stations.length)} dari {stations.length} stasiun
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className="px-4 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 transition-all"
                >
                  Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  className="px-4 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editModalOpen && editFormData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Edit Stasiun AWS</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Station ID</label>
                  <input required type="text" value={editFormData.station_id} onChange={e => setEditFormData({...editFormData, station_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Station Name</label>
                  <input required type="text" value={editFormData.station_name} onChange={e => setEditFormData({...editFormData, station_name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Display Name</label>
                  <input type="text" value={editFormData.display_name || ''} onChange={e => setEditFormData({...editFormData, display_name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Table Name (Supabase)</label>
                  <input required type="text" value={editFormData.table_name || ''} onChange={e => setEditFormData({...editFormData, table_name: e.target.value.toLowerCase()})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-300" />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sumber Data (n8n)</label>
                  <div className="flex gap-6 mb-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                      <input type="radio" name="source_type" value="mqtt" checked={editFormData.source_type === 'mqtt'} onChange={() => setEditFormData({...editFormData, source_type: 'mqtt'})} className="accent-blue-600 w-4 h-4" />
                      MQTT
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                      <input type="radio" name="source_type" value="ftp" checked={editFormData.source_type === 'ftp'} onChange={() => setEditFormData({...editFormData, source_type: 'ftp'})} className="accent-blue-600 w-4 h-4" />
                      FTP
                    </label>
                  </div>
                  <input required type="text" placeholder={editFormData.source_type === 'ftp' ? 'http://...' : 'device/xxx/cj'} value={editFormData.source_value || ''} onChange={e => setEditFormData({...editFormData, source_value: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-300" />
                </div>
                <div className="mt-4 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Batal</button>
                  <button type="submit" disabled={isSyncing} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                    {isSyncing ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
