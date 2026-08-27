import { useState } from "react";
import { User } from "@/hooks/useAuth";

interface AccountSettingsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: (newToken?: string) => void;
}

export function AccountSettingsModal({ user, isOpen, onClose, onUpdateSuccess }: AccountSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"username" | "password">("username");
  
  // Username Form
  const [newUsername, setNewUsername] = useState(user.username);
  const [currentPasswordForUsername, setCurrentPasswordForUsername] = useState("");
  
  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (newUsername === user.username) {
      setError("Username baru tidak boleh sama dengan yang lama.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "change_username",
          new_username: newUsername,
          current_password: currentPasswordForUsername
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah username");

      setSuccess("Username berhasil diubah!");
      setCurrentPasswordForUsername("");
      
      // Update local auth state with new token
      if (data.token) {
        onUpdateSuccess(data.token);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "change_password",
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah password");

      setSuccess("Password berhasil diubah!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">manage_accounts</span>
            Pengaturan Akun
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => { setActiveTab("username"); setError(""); setSuccess(""); }}
            className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === "username" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            Ganti Username
          </button>
          <button 
            onClick={() => { setActiveTab("password"); setError(""); setSuccess(""); }}
            className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === "password" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            Ganti Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
              <p>{success}</p>
            </div>
          )}

          {activeTab === "username" ? (
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Username Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">person</span>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ""))}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="Masukkan username baru"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 ml-1">*Tidak boleh menggunakan spasi</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Password Saat Ini (Konfirmasi)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
                  </div>
                  <input 
                    type="password" 
                    required
                    value={currentPasswordForUsername}
                    onChange={(e) => setCurrentPasswordForUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading || !newUsername || !currentPasswordForUsername}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]"
                >
                  {loading ? "Menyimpan..." : "Simpan Username"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Password Lama</label>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Password Baru</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Ulangi password baru"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]"
                >
                  {loading ? "Mengubah Password..." : "Ubah Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
