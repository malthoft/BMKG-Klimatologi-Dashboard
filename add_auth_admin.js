const fs = require('fs');

let code = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');

// Add imports
code = code.replace(
  'import { supabaseFetch } from "@/lib/supabase";',
  'import { supabaseFetch } from "@/lib/supabase";\nimport { useAuth } from "@/hooks/useAuth";\nimport { AdminUsersTab } from "@/components/admin/tabs/AdminUsersTab";'
);

// Update state defaults
code = code.replace(
  /useState<Record<string, boolean>>\(\{\n\s*beranda: true,\n\s*profil: true,\n\s*iklim: true,\n\s*publikasi: true\n\s*\}\)/,
  'useState<Record<string, boolean>>({\n    beranda: true,\n    profil: true,\n    iklim: true,\n    publikasi: true,\n    admin_control: true\n  })'
);

// Add auth check in AdminDashboardContent
code = code.replace(
  'const searchParams = useSearchParams();',
  'const searchParams = useSearchParams();\n  const { user, loading: authLoading, logout } = useAuth();'
);

// Add auth early return
code = code.replace(
  'return (\n    <div className="h-screen bg-background text-on-surface font-sans flex">',
  'if (authLoading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div><p className="text-slate-500 font-medium animate-pulse">Memverifikasi akses...</p></div>;\n  if (!user) return null;\n\n  return (\n    <div className="h-screen bg-background text-on-surface font-sans flex">'
);

// Update router map
code = code.replace(
  "case 'hth': return <HthTab />;",
  "case 'hth': return <HthTab />;\n      case 'admin_users': return <AdminUsersTab />;"
);

// Replace Profil Group with Role specific
code = code.replace(
  /\{\/\* Profil Group \*\/\}\s*<div>/,
  '{user?.role === "super_admin" && (\n          {/* Profil Group */}\n          <div>'
);

code = code.replace(
  /<span className="text-\[13px\]">\{tab\.label\}<\/span>\s*<\/div>\s*<\/a>\s*\)\)}\s*<\/div>\s*<\/div>/,
  '<span className="text-[13px]">{tab.label}</span>\n                  </div>\n                </a>\n              ))}\n            </div>\n          </div>\n          )}'
);

// Add Admin Control Group below Profil Group
code = code.replace(
  /\{\/\* Iklim Group \*\/\}/,
  `{user?.role === "super_admin" && (
          {/* Admin Control Group */}
          <div>
            <button onClick={() => setOpenNavGroups({...openNavGroups, admin_control: !openNavGroups.admin_control})} className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 hover:text-slate-600 transition-colors">
              <span>Sistem & Akses</span>
              <span className="material-symbols-outlined text-[16px]">{openNavGroups.admin_control ? "expand_less" : "expand_more"}</span>
            </button>
            <div className={\`space-y-1 pl-2 border-l-2 border-slate-100 ml-3 transition-all overflow-hidden \${openNavGroups.admin_control ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}\`}>
              <a 
                  onClick={() => setActiveTab("admin_users")}
                  className={\`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative \${activeTab === "admin_users" ? "bg-blue-50 text-blue-700 font-bold border border-blue-100/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent"}\`}
                >
                  {activeTab === "admin_users" && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-blue-600 rounded-r-full" />}
                  <div className="flex items-center gap-3">
                    <span className={\`material-symbols-outlined transition-transform duration-200 text-[18px] \${activeTab === "admin_users" ? "scale-110" : "group-hover:scale-110"}\`}>admin_panel_settings</span>
                    <span className="text-[13px]">Kelola Admin Users</span>
                  </div>
                </a>
            </div>
          </div>
          )}
          {/* Iklim Group */}`
);

// Update Desktop header user info
code = code.replace(
  /<p className="text-\[14px\] font-bold text-slate-800">Admin Utama<\/p>\s*<p className="text-\[12px\] text-slate-500">Stasiun Klimatologi Jatim<\/p>/,
  '<p className="text-[14px] font-bold text-slate-800">{user?.display_name || "Admin"}</p>\n                <p className="text-[12px] text-slate-500 uppercase font-semibold">{user?.role === "super_admin" ? "Super Admin" : "Admin"}</p>\n                <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 justify-end mt-1"><span className="material-symbols-outlined text-[14px]">logout</span> Keluar</button>'
);

// Update Mobile header user info
code = code.replace(
  /<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">\s*<span className="material-symbols-outlined text-xl text-slate-600">person<\/span>\s*<\/div>/,
  '<div onClick={logout} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 cursor-pointer">\n                <span className="material-symbols-outlined text-xl">logout</span>\n              </div>'
);

// Update Mobile Header title
code = code.replace(
  /\{ activeTab === 'sdm' && 'SDM \/ Profil Pegawai' \}/,
  "{ activeTab === 'sdm' && 'SDM / Profil Pegawai' }\n                { activeTab === 'admin_users' && 'Kelola Admin Sistem' }"
);

// Update Mobile Select Tab options
code = code.replace(
  /<optgroup label="Profil">\s*<option value="org">Struktur Organisasi<\/option>\s*<option value="sdm">SDM \/ Pegawai<\/option>\s*<\/optgroup>/,
  `{user?.role === "super_admin" && (
                <optgroup label="Profil">
                  <option value="org">Struktur Organisasi</option>
                  <option value="sdm">SDM / Pegawai</option>
                </optgroup>
                )}
                {user?.role === "super_admin" && (
                <optgroup label="Sistem">
                  <option value="admin_users">Kelola Admin Users</option>
                </optgroup>
                )}`
);

fs.writeFileSync('src/app/admin/page.tsx', code);
console.log('page.tsx auth applied securely');
