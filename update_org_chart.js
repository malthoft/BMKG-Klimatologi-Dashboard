const fs = require('fs');
let code = fs.readFileSync('src/components/profile/org-chart-viewer.tsx', 'utf-8');

// 1. Update OrgBox
const oldOrgBox = `const OrgBox = ({ member, roleIdFallback }: { member?: OrgMember, roleIdFallback: string }) => {
  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[140px]">
        <div className="w-[3px] h-full min-h-[140px] bg-slate-300" />
      </div>
    );
  }`;

const newOrgBox = `const OrgBox = ({ member, roleIdFallback, hasChildren = false }: { member?: OrgMember, roleIdFallback: string, hasChildren?: boolean }) => {
  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[140px] relative">
        {hasChildren && <div className="absolute top-0 bottom-0 left-1/2 w-[3px] bg-slate-300 -translate-x-1/2" />}
      </div>
    );
  }`;

code = code.replace(oldOrgBox, newOrgBox);


// 2. Update VerticalStack
const oldVerticalStack = `// Komponen rekursif untuk me-render anak buah secara vertikal
const VerticalStack = ({ parentId, members, width = "100%" }: { parentId: string, members: OrgMember[], width?: string }) => {
  const children = members
    .filter(m => m.parent_role_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  if (children.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center relative z-10">
      {children.map(child => (
        <div key={child.id || child.role_id} className="w-full flex flex-col items-center">
          <div className="w-[3px] h-[30px] bg-slate-300 shrink-0" />
          <div style={{ width }} className="flex flex-col shrink-0 relative z-20">
            <OrgBox member={child} roleIdFallback={child.role_id} />
          </div>
          <VerticalStack parentId={child.role_id} members={members} width={width} />
        </div>
      ))}
    </div>
  );
};`;

const newVerticalStack = `// Komponen rekursif untuk me-render anak buah (side-spine tree layout)
const VerticalStack = ({ parentId, members }: { parentId: string, members: OrgMember[] }) => {
  const children = members
    .filter(m => m.parent_role_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  if (children.length === 0) return null;

  return (
    <div className="w-full relative z-10 pt-[20px]">
      {/* Line dropping from parent center */}
      <div className="absolute top-0 left-1/2 w-[3px] h-[20px] bg-slate-300 -translate-x-1/2" />
      
      {/* Horizontal connector from center to spine */}
      <div className="absolute top-[20px] left-[24px] right-[calc(50%-1px)] h-[3px] bg-slate-300" />
      
      <div className="flex flex-col w-full relative">
        {children.map((child, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === children.length - 1;
          const hasChildren = members.some(m => m.parent_role_id === child.role_id);
          
          return (
            <div key={child.id || child.role_id} className="w-full flex relative py-3">
              {/* Spine segment */}
              <div 
                 className="absolute left-[24px] w-[3px] bg-slate-300"
                 style={{
                    top: 0,
                    bottom: isLast ? '50%' : 0,
                    height: (isFirst && isLast) ? '50%' : undefined
                 }} 
              />
              
              {/* Horizontal connector to box */}
              <div className="absolute left-[24px] top-1/2 w-[20px] h-[3px] bg-slate-300 -translate-y-1/2" />
              
              <div className="flex-1 ml-[44px] mr-[16px] relative z-20">
                <OrgBox member={child} roleIdFallback={child.role_id} hasChildren={hasChildren} />
                <VerticalStack parentId={child.role_id} members={members} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};`;

code = code.replace(oldVerticalStack, newVerticalStack);


// 3. Update Row 3 (6 Teams) and Row 3.5
// We will replace the block from `{["tim_1", "tim_2"...` up to the end of Row 3.5

const row3old = `{["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId) => (
                <div key={roleId} className="w-[270px] flex flex-col items-center relative z-10">
                  <div className="w-[3px] h-[50px] bg-slate-300 shrink-0" />
                  <div className="w-full flex flex-col shrink-0">
                    <OrgBox member={getMember(roleId)} roleIdFallback={roleId} />
                  </div>
                  <VerticalStack parentId={roleId} members={members} width="90%" />
                  {/* Flexible line to stretch to bottom if column is shorter */}
                  <div className="w-[3px] flex-1 min-h-[1px] bg-slate-300" />
                </div>
              ))}`;

const row3new = `{["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId) => {
                const hasLeader = !!getMember(roleId);
                const hasChildren = members.some(m => m.parent_role_id === roleId);
                const showTeam = hasLeader || hasChildren;
                return (
                  <div key={roleId} className="w-[270px] flex flex-col items-center relative z-10">
                    {showTeam && <div className="w-[3px] h-[50px] bg-slate-300 shrink-0" />}
                    {!showTeam && <div className="w-[3px] h-[50px] shrink-0 opacity-0" />}
                    
                    <div className="w-full flex flex-col shrink-0">
                      <OrgBox member={getMember(roleId)} roleIdFallback={roleId} hasChildren={hasChildren} />
                    </div>
                    <VerticalStack parentId={roleId} members={members} />
                    
                    {/* Flexible line to stretch to bottom if column is shorter */}
                    {showTeam && <div className="w-[3px] flex-1 min-h-[1px] bg-slate-300" />}
                  </div>
                );
              })}`;

code = code.replace(row3old, row3new);

const row35old = `{["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId, idx) => (
                <div key={roleId} className="w-[270px] flex flex-col items-center">
                  <div className="w-[3px] h-[60px] bg-slate-300" style={{ height: idx < 5 ? 60 : 110 }} />
                </div>
              ))}`;

const row35new = `{["tim_1", "tim_2", "tim_3", "tim_4", "tim_5", "tim_6"].map((roleId, idx) => {
                const showTeam = !!getMember(roleId) || members.some(m => m.parent_role_id === roleId);
                return (
                  <div key={roleId} className="w-[270px] flex flex-col items-center">
                    {showTeam && <div className="w-[3px] h-[60px] bg-slate-300" style={{ height: idx < 5 ? 60 : 110 }} />}
                  </div>
                );
              })}`;

code = code.replace(row35old, row35new);


// We need to fix the width prop in other VerticalStack calls
code = code.replace(/<VerticalStack parentId="kepala" members={members} \/>/g, '<VerticalStack parentId="kepala" members={members} />');
code = code.replace(/<VerticalStack parentId="kasubag" members={members} width="90%" \/>/g, '<VerticalStack parentId="kasubag" members={members} />');
code = code.replace(/<VerticalStack parentId="fungsional_pmg" members={members} width="90%" \/>/g, '<VerticalStack parentId="fungsional_pmg" members={members} />');
code = code.replace(/<VerticalStack parentId="fungsional_non_pmg" members={members} width="90%" \/>/g, '<VerticalStack parentId="fungsional_non_pmg" members={members} />');

// also we must pass hasChildren to all top level boxes manually
const oldKepala = `<OrgBox member={getMember("kepala")} roleIdFallback="kepala" />`;
const newKepala = `<OrgBox member={getMember("kepala")} roleIdFallback="kepala" hasChildren={members.some(m => m.parent_role_id === "kepala")} />`;
code = code.replace(oldKepala, newKepala);

const oldKasubag = `<OrgBox member={getMember("kasubag")} roleIdFallback="kasubag" />`;
const newKasubag = `<OrgBox member={getMember("kasubag")} roleIdFallback="kasubag" hasChildren={members.some(m => m.parent_role_id === "kasubag")} />`;
code = code.replace(oldKasubag, newKasubag);

const oldPmg = `<OrgBox member={getMember("fungsional_pmg")} roleIdFallback="fungsional_pmg" />`;
const newPmg = `<OrgBox member={getMember("fungsional_pmg")} roleIdFallback="fungsional_pmg" hasChildren={members.some(m => m.parent_role_id === "fungsional_pmg")} />`;
code = code.replace(oldPmg, newPmg);

const oldNonPmg = `<OrgBox member={getMember("fungsional_non_pmg")} roleIdFallback="fungsional_non_pmg" />`;
const newNonPmg = `<OrgBox member={getMember("fungsional_non_pmg")} roleIdFallback="fungsional_non_pmg" hasChildren={members.some(m => m.parent_role_id === "fungsional_non_pmg")} />`;
code = code.replace(oldNonPmg, newNonPmg);

fs.writeFileSync('src/components/profile/org-chart-viewer.tsx', code);
console.log('Org Chart updated successfully');
