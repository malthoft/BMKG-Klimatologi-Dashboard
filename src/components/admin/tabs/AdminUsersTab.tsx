import { useState, useEffect } from "react";
import { supabaseFetch, supabaseInsert, supabaseDelete } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { CustomSelect } from "@/components/ui/CustomSelect";

export function AdminUsersTab() {
  const confirm = useConfirm();
  const { success: toastSuccess, error: toastError } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const data = await supabaseFetch("admin_users", "order=created_at.desc");
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (!username || !password || !displayName) {
      setError("Harap isi semua kolom.");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, role, display_name: displayName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah user.");
      
      setSuccess("User berhasil ditambahkan!");
      setUsername("");
      setPassword("");
      setDisplayName("");
      setRole("admin");
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (await confirm("Anda yakin ingin menghapus user ini?")) {
      await supabaseDelete("admin_users", `id=eq.${id}`);
      loadUsers();
    }
  };

  const handleResetPassword = async (targetUserId: number, targetUsername: string) => {
    if (await confirm(`Anda yakin ingin mereset password untuk user "${targetUsername}" menjadi "123456"?`)) {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ target_user_id: targetUserId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mereset password.");
        toastSuccess(data.message || `Password user ${targetUsername} berhasil direset.`);
      } catch (err: any) {
        toastError(err.message);
      }
    }
  };

  const isSuperUser = user?.role === "super_admin" || user?.role === "developer";

  const canManageUser = (targetRole: string, targetUsername: string) => {
    if (user?.username === targetUsername) return false;
    if (targetRole === 'developer') return false;
    if (user?.role === 'developer') return true;
    if (user?.role === 'super_admin' && targetRole === 'admin') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Admin & Sistem</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola akun dan role admin yang dapat mengakses dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-bold text-slate-700">Daftar Admin</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[13px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Username</th>
                  <th className="py-3 px-4 font-semibold">Nama Tampil</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Dibuat</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-6">Memuat...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6">Belum ada user.</td></tr>
                ) : (
                  [...users]
                    .filter(u => user?.role === 'developer' ? true : u.role !== 'developer')
                    .sort((a, b) => {
                      if (user?.username === a.username) return -1;
                      if (user?.username === b.username) return 1;
                      return 0;
                    }).map(u => (
                    <tr key={u.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${user?.username === u.username ? 'border-l-[3px] border-l-indigo-500 bg-indigo-50/30' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-slate-700">{u.username}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          {u.display_name}
                          {user?.username === u.username && (
                            <span className="text-[11px] text-slate-400 italic">(Sesi Anda)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${u.role === 'developer' ? 'bg-emerald-100 text-emerald-700' : u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role === 'developer' ? 'Developer' : u.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManageUser(u.role, u.username) && (
                            <button onClick={() => handleResetPassword(u.id, u.username)} className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition p-1.5 flex items-center justify-center" title="Reset Password ke 123456">
                              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                            </button>
                          )}
                          {canManageUser(u.role, u.username) && (
                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition p-1.5 flex items-center justify-center" title="Hapus">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-fit sticky top-28">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">person_add</span> Tambah Admin Baru
          </h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            {success && <div className="text-xs text-green-600 bg-green-50 p-2 rounded">{success}</div>}
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Username (Login ID)</label>
              <input required value={username} onChange={e => setUsername(e.target.value)} type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="johndoe"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
              <input required value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="••••••••"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nama Tampil</label>
              <input required value={displayName} onChange={e => setDisplayName(e.target.value)} type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="John Doe"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Role / Hak Akses</label>
              <CustomSelect
                value={role}
                onChange={(val) => setRole(val)}
                options={[
                  { value: "admin", label: "Admin (Konten)" },
                  { value: "super_admin", label: "Super Admin (Konten + Sistem)" }
                ]}
              />
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm mt-2 transition disabled:opacity-50">
              {isSubmitting ? 'Memproses...' : 'Simpan User'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
