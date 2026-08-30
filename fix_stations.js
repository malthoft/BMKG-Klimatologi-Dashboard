const fs = require('fs');
let code = fs.readFileSync('src/components/admin/tabs/StationsTab.tsx', 'utf-8');

// Replace table header
code = code.replace(
  /<tr className="border-b border-slate-100 bg-slate-50\/50 text-slate-500 text-\[13px\] uppercase tracking-wider">[\s\S]*?<\/tr>/,
  `<tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[13px] uppercase tracking-wider">
                          <th className="py-3 px-4 font-semibold">Station</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold">Visibility</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>`
);

// Replace table body row
code = code.replace(
  /<td className="py-4 px-6 font-semibold text-slate-700">\{st\.station_id\}<\/td>\s*<td className="py-4 px-6 text-slate-600">[\s\S]*?<\/td>/,
  `<td className="py-4 px-4">
                              <div className="font-bold text-slate-800 mb-1">{st.station_id}</div>
                              <div className="text-xs text-slate-500 mb-2">{st.station_name}</div>
                              <input 
                                type="text"
                                placeholder="Nama Publik..."
                                defaultValue={st.display_name || ""}
                                onBlur={(e) => supabaseUpdate("stations", \`id=eq.\${st.id}\`, { display_name: e.target.value })}
                                className="w-full max-w-[200px] border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                              />
                            </td>`
);

// Replace px-6 with px-4 globally for other cells
code = code.replace(/px-6/g, 'px-4');

// Make actions always visible by removing opacity-0 and group-hover:opacity-100
code = code.replace(/opacity-0 group-hover:opacity-100/g, 'opacity-100');
code = code.replace(/opacity-0 /g, '');
code = code.replace(/group-hover:opacity-100 /g, '');


fs.writeFileSync('src/components/admin/tabs/StationsTab.tsx', code);
console.log('StationsTab responsive layout fixed');
