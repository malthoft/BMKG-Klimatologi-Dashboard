const fs = require('fs');

// BeritaTab
let bCode = fs.readFileSync('src/components/admin/tabs/BeritaTab.tsx', 'utf-8');

bCode = bCode.replace(
  'import { useCrud } from "@/hooks/useCrud";',
  'import { useCrud } from "@/hooks/useCrud";\nimport { useAuth } from "@/hooks/useAuth";'
);
bCode = bCode.replace(
  'export function BeritaTab() {\n  const { items',
  'export function BeritaTab() {\n  const { user } = useAuth();\n  const { items'
);

bCode = bCode.replace(
  'penulis: newBerita.penulis',
  'penulis: newBerita.penulis || user?.display_name || "Admin"'
);

bCode = bCode.replace(
  'const success = await update(editBerita.id, payload, "Berita berhasil diperbarui");',
  `if (user?.display_name) {
      let penulis = payload.penulis || editBerita.penulis;
      if (penulis && !penulis.includes("(Diperbarui oleh:")) {
        payload.penulis = \`\${penulis} (Diperbarui oleh: \${user.display_name})\`;
      } else if (penulis) {
        payload.penulis = penulis.replace(/\\(Diperbarui oleh: .*?\\)/, \`(Diperbarui oleh: \${user.display_name})\`);
      }
    }
    const success = await update(editBerita.id, payload, "Berita berhasil diperbarui");`
);

fs.writeFileSync('src/components/admin/tabs/BeritaTab.tsx', bCode);
console.log('BeritaTab updated');


// PengumumanTab
let pCode = fs.readFileSync('src/components/admin/tabs/PengumumanTab.tsx', 'utf-8');

pCode = pCode.replace(
  'import { useCrud } from "@/hooks/useCrud";',
  'import { useCrud } from "@/hooks/useCrud";\nimport { useAuth } from "@/hooks/useAuth";'
);
pCode = pCode.replace(
  'export function PengumumanTab() {\n  const { items',
  'export function PengumumanTab() {\n  const { user } = useAuth();\n  const { items'
);

pCode = pCode.replace(
  'const success = await update(editData.id, payload, "Pengumuman berhasil diperbarui");',
  `if (user?.display_name) {
      let deskripsi = payload.deskripsi || editData.deskripsi;
      if (deskripsi && !deskripsi.includes("(Diperbarui oleh:")) {
        payload.deskripsi = \`\${deskripsi}<br/><br/><i>(Diperbarui oleh: \${user.display_name})</i>\`;
      } else if (deskripsi) {
        payload.deskripsi = deskripsi.replace(/<br\\/><br\\/><i>\\(Diperbarui oleh: .*?\\)<\\/i>/, \`<br/><br/><i>(Diperbarui oleh: \${user.display_name})</i>\`);
      }
    }
    const success = await update(editData.id, payload, "Pengumuman berhasil diperbarui");`
);

fs.writeFileSync('src/components/admin/tabs/PengumumanTab.tsx', pCode);
console.log('PengumumanTab updated');
