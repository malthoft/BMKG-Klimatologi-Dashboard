const fs = require('fs');

let code = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');

// Add imports
code = code.replace(
  'import { AdminUsersTab } from "@/components/admin/tabs/AdminUsersTab";',
  'import { AdminUsersTab } from "@/components/admin/tabs/AdminUsersTab";\nimport { ProfileDropdown } from "@/components/admin/ProfileDropdown";\nimport { AccountSettingsModal } from "@/components/admin/AccountSettingsModal";'
);

// Add state for profile dropdown and modal
code = code.replace(
  '// --- Search State ---',
  '// --- Profile State ---\n  const [isProfileOpen, setIsProfileOpen] = useState(false);\n  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);\n\n  // --- Search State ---'
);

// Desktop Header - replace static profile with dropdown wrapper
const desktopProfileOld = `<div className="text-right">
                <p className="text-[14px] font-bold text-slate-800">{user?.display_name || "Admin"}</p>
                <p className="text-[12px] text-slate-500 uppercase font-semibold">{user?.role === "super_admin" ? "Super Admin" : "Admin"}</p>
                <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 justify-end mt-1"><span className="material-symbols-outlined text-[14px]">logout</span> Keluar</button>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                <span className="material-symbols-outlined text-[22px] text-slate-600">person</span>
              </div>`;

const desktopProfileNew = `<div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition-colors text-left"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">{user?.display_name || "Admin"}</p>
                    <p className="text-[11px] text-slate-500 uppercase font-bold mt-0.5">{user?.role === "super_admin" ? "Super Admin" : "Admin"}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">person</span>
                  </div>
                </button>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-2 z-50">
                      <ProfileDropdown 
                        user={user!}
                        onLogout={logout}
                        onOpenSettings={() => setIsAccountModalOpen(true)}
                        onClose={() => setIsProfileOpen(false)}
                      />
                    </div>
                  </>
                )}
              </div>`;
code = code.replace(desktopProfileOld, desktopProfileNew);

// Mobile Header - replace logout icon with dropdown
const mobileProfileOld = `<div className="md:hidden flex items-center gap-2">
              <div onClick={logout} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 cursor-pointer">
                <span className="material-symbols-outlined text-xl">logout</span>
              </div>
            </div>`;

const mobileProfileNew = `<div className="md:hidden flex items-center gap-2 relative">
              <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 cursor-pointer">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 z-50">
                    <ProfileDropdown 
                      user={user!}
                      onLogout={logout}
                      onOpenSettings={() => setIsAccountModalOpen(true)}
                      onClose={() => setIsProfileOpen(false)}
                    />
                  </div>
                </>
              )}
            </div>`;
code = code.replace(mobileProfileOld, mobileProfileNew);

// Add the modal at the bottom before closing main div
code = code.replace(
  '</main>\n    </div>',
  `</main>\n      <AccountSettingsModal\n        user={user!}\n        isOpen={isAccountModalOpen}\n        onClose={() => setIsAccountModalOpen(false)}\n        onUpdateSuccess={(newToken) => {\n          setIsAccountModalOpen(false);\n          if (newToken) {\n             // Use refreshUser if available, else window reload or update token manually\n             // We updated useAuth to return refreshUser\n             const event = new CustomEvent('refreshAuth', { detail: newToken });\n             window.dispatchEvent(event);\n             // Or we just reload since it's simpler to reset all states\n             window.location.reload();\n          }\n        }}\n      />\n    </div>`
);

// We need to use `refreshUser` if possible. But since `user` might be updated, reloading is the most robust way to ensure everything gets the new username cleanly.
// Wait, I updated `useAuth` to export `refreshUser`. Let's use it!
code = code.replace(
  'const { user, loading: authLoading, logout } = useAuth();',
  'const { user, loading: authLoading, logout, refreshUser } = useAuth();'
);
code = code.replace(
  '             const event = new CustomEvent(\'refreshAuth\', { detail: newToken });\n             window.dispatchEvent(event);\n             // Or we just reload since it's simpler to reset all states\n             window.location.reload();',
  '             refreshUser(newToken);'
);

fs.writeFileSync('src/app/admin/page.tsx', code);
console.log('admin page updated');
