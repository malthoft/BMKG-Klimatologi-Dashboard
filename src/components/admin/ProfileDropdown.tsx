import { useState } from "react";
import { User } from "@/hooks/useAuth";

interface ProfileDropdownProps {
  user: User;
  onLogout: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

export function ProfileDropdown({ user, onLogout, onOpenSettings, onClose }: ProfileDropdownProps) {
  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-2xl py-2 z-50 overflow-hidden">
      {/* User Info Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <p className="text-[15px] font-bold text-slate-800 truncate">{user.display_name}</p>
        <p className="text-[12px] text-slate-500 font-medium truncate mt-0.5">@{user.username}</p>
        <div className="mt-2 inline-block">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="py-2">
        <button 
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="w-full text-left px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
          Pengaturan Akun
        </button>
      </div>

      <div className="border-t border-slate-100 py-2">
        <button 
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="w-full text-left px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Keluar
        </button>
      </div>
    </div>
  );
}
