const fs = require('fs');

let code = fs.readFileSync('src/components/admin/tabs/StationsTab.tsx', 'utf-8');

// Add import for useAuth
code = code.replace(
  'import { supabaseUpdate } from "@/lib/supabase";',
  'import { supabaseUpdate } from "@/lib/supabase";\nimport { useAuth } from "@/hooks/useAuth";'
);

// Use hook inside StationsTab
code = code.replace(
  'export function StationsTab() {\n  const { items',
  'export function StationsTab() {\n  const { user } = useAuth();\n  const { items'
);

// Hide delete button if not super_admin
code = code.replace(
  /<button onClick=\{\(\) => handleDeleteStation\(st\.id\)\} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all ml-auto focus:opacity-100">\s*<span className="material-symbols-outlined text-\[18px\]">delete<\/span>\s*<\/button>/g,
  '{user?.role === "super_admin" && (<button onClick={() => handleDeleteStation(st.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all ml-auto focus:opacity-100">\n                                <span className="material-symbols-outlined text-[18px]">delete</span>\n                              </button>)}'
);

// Hide Add form if not super admin
code = code.replace(
  /\{\/\* Add New Station Form \*\/\}\s*<div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">/,
  '{user?.role === "super_admin" && (\n                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col h-fit sticky top-28">'
);

// Close the wrapper
code = code.replace(
  /<\/form>\s*<\/div>\s*<\/section>/,
  '</form>\n                </div>\n                )}\n              </section>'
);

fs.writeFileSync('src/components/admin/tabs/StationsTab.tsx', code);
console.log('StationsTab restricted');
