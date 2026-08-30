const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');

// The issue is:
// {user?.role === "super_admin" && (
// {/* Profil Group */}
// <div>

// And:
// {user?.role === "super_admin" && (
// {/* Admin Control Group */}
// <div>

// We can just remove the comments entirely using a simpler string replacement.
code = code.replace(/\{\/\* Profil Group \*\/\}/g, '');
code = code.replace(/\{\/\* Admin Control Group \*\/\}/g, '');

fs.writeFileSync('src/app/admin/page.tsx', code);
console.log('Fixed JSX comments');
