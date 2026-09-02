import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'ModalPortal' not in content:
        import_stmt = 'import { ModalPortal } from "@/components/ui/ModalPortal";\n'
        lines = content.split('\n')
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        lines.insert(last_import + 1, import_stmt.strip())
        content = '\n'.join(lines)
        
    if 'BeritaTab.tsx' in filepath:
        # 1. Detail Modal
        content = content.replace(
            '{selectedDetail && (\n        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">\n          <div className="absolute inset-0 bg-slate-900/60',
            '{selectedDetail && (\n        <ModalPortal>\n        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">\n          <div className="absolute inset-0 bg-slate-900/60'
        ).replace(
            '                  Edit Berita\n                </button>\n                <button onClick={() => setSelectedDetail(null)} className="px-5 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors text-sm">\n                  Tutup\n                </button>\n              </div>\n            </div>\n          </div>\n        </div>\n      )}',
            '                  Edit Berita\n                </button>\n                <button onClick={() => setSelectedDetail(null)} className="px-5 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors text-sm">\n                  Tutup\n                </button>\n              </div>\n            </div>\n          </div>\n        </div>\n        </ModalPortal>\n      )}'
        )

        # 2. Preview Modal
        content = content.replace(
            '{previewImage && (\n        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">\n          <div className="absolute inset-0 bg-slate-900/90',
            '{previewImage && (\n        <ModalPortal>\n        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">\n          <div className="absolute inset-0 bg-slate-900/90'
        ).replace(
            '              <button onClick={() => setPreviewImage(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-white hover:bg-slate-100 text-slate-800 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">\n                <span className="material-symbols-outlined">close</span>\n              </button>\n            </div>\n          </div>\n        </div>\n      )}',
            '              <button onClick={() => setPreviewImage(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-white hover:bg-slate-100 text-slate-800 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">\n                <span className="material-symbols-outlined">close</span>\n              </button>\n            </div>\n          </div>\n        </div>\n        </ModalPortal>\n      )}'
        )
        
    elif 'ObservationTab.tsx' in filepath:
        # 1. Manual Hourly Modal
        content = content.replace(
            '{isHourlyFormOpen && (\n        <div className="fixed inset-0 z-50 flex items-center justify-center p-4',
            '{isHourlyFormOpen && (\n        <ModalPortal>\n        <div className="fixed inset-0 z-50 flex items-center justify-center p-4'
        ).replace(
            '                  </button>\n                </div>\n              </form>\n            </div>\n          </div>\n        </div>\n      )}',
            '                  </button>\n                </div>\n              </form>\n            </div>\n          </div>\n        </div>\n        </ModalPortal>\n      )}'
        )

        # 2. Add Hourly Modal
        content = content.replace(
            '{isAddHourlyModalOpen && (\n                <div className="fixed inset-0 z-[100] bg-slate-900/40',
            '{isAddHourlyModalOpen && (\n                <ModalPortal>\n                <div className="fixed inset-0 z-[100] bg-slate-900/40'
        ).replace(
            '                        <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors">Tambahkan</button>\n                      </div>\n                    </form>\n                  </div>\n                </div>\n              )}',
            '                        <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors">Tambahkan</button>\n                      </div>\n                    </form>\n                  </div>\n                </div>\n                </ModalPortal>\n              )}'
        )
        
    with open(filepath, 'w') as f:
        f.write(content)

process_file('src/components/admin/tabs/BeritaTab.tsx')
process_file('src/components/admin/tabs/ObservationTab.tsx')
print("Done!")
