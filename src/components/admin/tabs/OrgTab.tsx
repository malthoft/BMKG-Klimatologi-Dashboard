"use client";

import { useState, useEffect, useMemo } from "react";
import { useCrud } from "@/hooks/useCrud";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { OrgMember, OrgPosition } from "@/types/admin";
import { 
  fetchOrgPositions, 
  saveOrgPosition, 
  updateOrgPosition, 
  deleteOrgPosition, 
  COLOR_PRESETS 
} from "@/lib/org-positions";
import { supabaseUpdate } from "@/lib/supabase";

export function OrgTab() {
  const confirm = useConfirm();
  const { success, error } = useToast();
  const { items: orgMembers, isError, load, add, update, remove } = useCrud<OrgMember>("organization_structure");

  // Positions state
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);

  // Modal Kelola Posisi
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [newPosName, setNewPosName] = useState("");
  const [newPosColor, setNewPosColor] = useState("#0284c7");
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editPosName, setEditPosName] = useState("");
  const [editPosColor, setEditPosColor] = useState("");

  // Form Tambah Anggota
  const [newOrgMember, setNewOrgMember] = useState<OrgMember>({
    role_id: "",
    parent_role_id: "",
    role_title: "",
    name: "",
    nip: "",
    show_role_title: true,
    is_visible: true,
    sort_order: 0
  });
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  // Modal Edit Anggota
  const [editingMember, setEditingMember] = useState<OrgMember | null>(null);
  const [editSelectedChildren, setEditSelectedChildren] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");

  // Load members and positions on mount
  useEffect(() => {
    load("order=created_at.desc");
    loadPositionsList();
  }, [load]);

  const loadPositionsList = async () => {
    setIsLoadingPositions(true);
    try {
      const pos = await fetchOrgPositions();
      setPositions(pos);
    } catch (err) {
      console.error("Gagal memuat posisi:", err);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  // Helper maps
  const positionMap = useMemo(() => {
    const map = new Map<string, OrgPosition>();
    positions.forEach(p => map.set(p.position_id, p));
    return map;
  }, [positions]);

  // Find children of a role
  const getRoleChildren = (roleId: string) => {
    return orgMembers.filter(m => m.parent_role_id === roleId);
  };

  // ==========================================
  // POSISI (CRUD POSISI)
  // ==========================================
  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosName.trim()) return;

    // Generate unique slug
    const slugBase = newPosName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    
    let slug = slugBase || "posisi";
    if (positions.some(p => p.position_id === slug)) {
      slug = `${slug}_${Date.now().toString().slice(-4)}`;
    }

    const newPos: OrgPosition = {
      position_id: slug,
      position_name: newPosName.trim().toUpperCase(),
      color: newPosColor,
      hierarchy_level: 5,
      is_visible: true,
      sort_order: positions.length + 1
    };

    await saveOrgPosition(newPos);
    await loadPositionsList();
    setNewPosName("");
    setNewPosColor("#0284c7");
    success(`Posisi "${newPos.position_name}" berhasil ditambahkan!`);
  };

  const handleUpdatePosition = async (posId: string) => {
    if (!editPosName.trim()) return;
    await updateOrgPosition(posId, {
      position_name: editPosName.trim().toUpperCase(),
      color: editPosColor
    });
    await loadPositionsList();
    setEditingPosId(null);
    success("Posisi berhasil diperbarui!");
  };

  const handleTogglePositionVisibility = async (pos: OrgPosition) => {
    const newStatus = pos.is_visible === false ? true : false;
    await updateOrgPosition(pos.position_id, { is_visible: newStatus });
    await loadPositionsList();
    success(newStatus ? `Posisi "${pos.position_name}" ditampilkan di publik` : `Posisi "${pos.position_name}" disembunyikan dari publik`);
  };

  const handleDeletePosition = async (posId: string, posName: string) => {
    // Check if used by any member
    const isUsed = orgMembers.some(m => m.role_id === posId);
    if (isUsed) {
      error(`Posisi "${posName}" tidak dapat dihapus karena masih digunakan oleh anggota!`);
      return;
    }

    if (await confirm(`Yakin ingin menghapus posisi "${posName}"?`)) {
      await deleteOrgPosition(posId);
      await loadPositionsList();
      success(`Posisi "${posName}" berhasil dihapus.`);
    }
  };

  // ==========================================
  // ANGGOTA: TAMBAH (CREATE)
  // ==========================================
  const handleRoleChangeForNew = (val: string) => {
    const pos = positionMap.get(val);
    const autoTitle = pos ? pos.position_name : "";
    let autoParent = newOrgMember.parent_role_id;
    if (val === "kepala") {
      autoParent = "";
    } else if (!autoParent) {
      autoParent = "kepala";
    }

    setNewOrgMember({
      ...newOrgMember,
      role_id: val,
      role_title: newOrgMember.role_title ? newOrgMember.role_title : autoTitle,
      parent_role_id: autoParent
    });
  };

  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgMember.role_id) {
      error("Silakan pilih posisi jabatan!");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<OrgMember> = {
        role_id: newOrgMember.role_id,
        parent_role_id: newOrgMember.role_id === "kepala" ? null : (newOrgMember.parent_role_id || null),
        role_title: newOrgMember.role_title.trim(),
        name: newOrgMember.name.trim(),
        nip: newOrgMember.nip?.trim() || "",
        show_role_title: newOrgMember.show_role_title !== false,
        is_visible: newOrgMember.is_visible !== false,
        sort_order: Number(newOrgMember.sort_order) || 0
      };

      const isSuccess = await add(payload, "Anggota organisasi berhasil ditambahkan");
      if (isSuccess) {
        if (selectedChildren.length > 0) {
          for (const childRoleId of selectedChildren) {
            try {
              await supabaseUpdate("organization_structure", `role_id=eq.${childRoleId}`, {
                parent_role_id: newOrgMember.role_id
              });
            } catch (err) {
              console.warn(`Gagal memperbarui parent untuk child ${childRoleId}:`, err);
            }
          }
        }

        setNewOrgMember({
          role_id: "",
          parent_role_id: "",
          role_title: "",
          name: "",
          nip: "",
          show_role_title: true,
          is_visible: true,
          sort_order: 0
        });
        setSelectedChildren([]);
        await load("order=created_at.desc");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // ANGGOTA: EDIT (UPDATE)
  // ==========================================
  const handleOpenEdit = (member: OrgMember) => {
    setEditingMember({ ...member });
    const currentChildren = orgMembers
      .filter(m => m.parent_role_id === member.role_id && m.id !== member.id)
      .map(m => m.role_id);
    setEditSelectedChildren(Array.from(new Set(currentChildren)));
    setIsEditModalOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.id) return;

    setIsSaving(true);
    try {
      const payload: Partial<OrgMember> = {
        role_id: editingMember.role_id,
        parent_role_id: editingMember.role_id === "kepala" ? null : (editingMember.parent_role_id || null),
        role_title: editingMember.role_title.trim(),
        name: editingMember.name.trim(),
        nip: editingMember.nip?.trim() || "",
        show_role_title: editingMember.show_role_title !== false,
        is_visible: editingMember.is_visible !== false,
        sort_order: Number(editingMember.sort_order) || 0
      };

      const isOk = await update(editingMember.id, payload, "Data anggota berhasil diperbarui");
      if (isOk) {
        const prevChildren = orgMembers
          .filter(m => m.parent_role_id === editingMember.role_id && m.id !== editingMember.id)
          .map(m => m.role_id);
        
        for (const prevChild of prevChildren) {
          if (!editSelectedChildren.includes(prevChild)) {
            try {
              await supabaseUpdate("organization_structure", `role_id=eq.${prevChild}`, {
                parent_role_id: editingMember.parent_role_id || null
              });
            } catch (_) {}
          }
        }

        for (const newChild of editSelectedChildren) {
          try {
            await supabaseUpdate("organization_structure", `role_id=eq.${newChild}`, {
              parent_role_id: editingMember.role_id
            });
          } catch (_) {}
        }

        setIsEditModalOpen(false);
        setEditingMember(null);
        await load("order=created_at.desc");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle visibility
  const handleToggleVisibility = async (member: OrgMember) => {
    if (!member.id) return;
    const newStatus = member.is_visible === false ? true : false;
    const ok = await update(member.id, { is_visible: newStatus }, newStatus ? `"${member.name}" ditampilkan di bagan publik` : `"${member.name}" disembunyikan dari bagan publik`);
    if (ok) {
      await load("order=created_at.desc");
    }
  };

  // ==========================================
  // ANGGOTA: HAPUS (DELETE)
  // ==========================================
  const handleDeleteOrgMember = async (member: OrgMember) => {
    if (!member.id) return;

    const subordinates = orgMembers.filter(m => m.parent_role_id === member.role_id && m.id !== member.id);
    let confirmMsg = `Yakin ingin menghapus "${member.name}" (${member.role_title})?`;
    if (subordinates.length > 0) {
      confirmMsg += `\n\nPerhatian: Anggota ini memiliki ${subordinates.length} child. Garis hierarki child akan dialihkan otomatis ke parent (${member.parent_role_id || 'Tingkat Utama'}).`;
    }

    if (await confirm(confirmMsg)) {
      if (subordinates.length > 0) {
        for (const sub of subordinates) {
          try {
            await supabaseUpdate("organization_structure", `id=eq.${sub.id}`, {
              parent_role_id: member.parent_role_id || null
            });
          } catch (_) {}
        }
      }

      await remove(member.id, undefined, "Anggota organisasi berhasil dihapus");
      await load("order=created_at.desc");
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return orgMembers.filter(m => {
      const matchSearch = 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.nip && m.nip.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = filterRole === "all" || m.role_id === filterRole;

      const matchVisibility = 
        filterVisibility === "all" ||
        (filterVisibility === "visible" && m.is_visible !== false) ||
        (filterVisibility === "hidden" && m.is_visible === false);

      return matchSearch && matchRole && matchVisibility;
    }).sort((a, b) => {
      const rankA = positionMap.get(a.role_id)?.hierarchy_level || 99;
      const rankB = positionMap.get(b.role_id)?.hierarchy_level || 99;
      if (rankA !== rankB) return rankA - rankB;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [orgMembers, searchQuery, filterRole, filterVisibility, positionMap]);

  return (
    <div className="space-y-6">
      {/* Missing Table Alert Banner if organization_structure is not in DB */}
      {isError && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-amber-900 shadow-md flex items-start gap-3.5">
          <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">warning</span>
          <div className="flex-1 text-xs md:text-sm">
            <h4 className="font-extrabold text-amber-900 mb-1">Tabel Database Belum Dibuat / Terhapus di Supabase</h4>
            <p className="text-amber-800 leading-relaxed mb-2">
              Tabel <code className="bg-amber-200/80 px-1.5 py-0.5 rounded font-mono font-bold">organization_structure</code> belum ada di database Supabase. File SQL untuk membuatnya kembali sudah disiapkan.
            </p>
            <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs font-mono text-slate-700">
              Buka <strong>Supabase Dashboard &gt; SQL Editor</strong> lalu jalankan file: <span className="font-bold text-blue-600">setup_organization_structure.sql</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-blue-200 mb-2">
            <span className="material-symbols-outlined text-[15px]">account_tree</span>
            Hierarki Dinamis & Kontrol Visibilitas
          </div>
          <h2 className="text-xl md:text-2xl font-black">Manajemen Struktur Organisasi</h2>
          <p className="text-sm text-blue-100/80 mt-1 max-w-2xl">
            Kelola data pegawai, posisi jabatan, serta atur <strong>visibilitas (tampilkan atau sembunyikan)</strong> setiap jabatan atau pegawai di diagram publik.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPosModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-slate-800 font-bold text-sm shadow-lg hover:bg-blue-50 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-indigo-600 text-[20px]">tune</span>
            Kelola Posisi & Visibilitas ({positions.length})
          </button>
        </div>
      </div>

      {/* Main Grid: Form Input + Member List */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================== */}
        {/* FORM INPUT ANGGOTA BARU (5 Cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sticky top-28">
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">person_add</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Input Anggota Baru</h3>
                <p className="text-xs text-slate-400">Tambahkan pegawai ke bagan organisasi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPosModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Posisi Baru
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleAddOrgMember}>
            {/* Grup 1: Posisi Jabatan & Hierarki */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Posisi / Jabatan <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">{positions.length} Pilihan</span>
              </div>
              
              <CustomSelect
                required
                value={newOrgMember.role_id}
                onChange={handleRoleChangeForNew}
                options={[
                  { value: "", label: "-- Pilih Posisi Jabatan --" },
                  ...positions.map(p => ({
                    value: p.position_id,
                    label: `${p.position_name} ${p.is_visible === false ? "(Tersembunyi)" : ""}`
                  }))
                ]}
              />

              {/* Parent */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">arrow_upward</span>
                  Parent
                </label>
                <CustomSelect
                  value={newOrgMember.parent_role_id || ""}
                  onChange={(val) => setNewOrgMember({ ...newOrgMember, parent_role_id: val })}
                  options={[
                    { value: "", label: "-- Tingkat Utama (Tanpa Parent) --" },
                    ...positions
                      .filter(p => p.position_id !== newOrgMember.role_id)
                      .map(p => ({
                        value: p.position_id,
                        label: `↑ Parent: ${p.position_name}`
                      }))
                  ]}
                />
              </div>

              {/* Child (Opsional) */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">arrow_downward</span>
                    Child (Opsional)
                  </span>
                  {selectedChildren.length > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                      {selectedChildren.length} Terpilih
                    </span>
                  )}
                </label>
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                  Pilih posisi yang berada di bawah posisi ini. Garis hierarki akan dibuat otomatis.
                </p>

                <div className="max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 space-y-1 scrollbar-thin">
                  {positions
                    .filter(p => p.position_id !== newOrgMember.role_id && p.position_id !== newOrgMember.parent_role_id)
                    .map(p => {
                      const isChecked = selectedChildren.includes(p.position_id);
                      return (
                        <label
                          key={p.position_id}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            isChecked ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChildren([...selectedChildren, p.position_id]);
                              } else {
                                setSelectedChildren(selectedChildren.filter(id => id !== p.position_id));
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                          />
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#475569' }} />
                          <span className="truncate">{p.position_name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Grup 2: Identitas Pegawai */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl space-y-3.5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={newOrgMember.name}
                  onChange={e => setNewOrgMember({ ...newOrgMember, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 bg-white"
                  type="text"
                  placeholder="Cth: John Doe"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Jabatan (Ditampilkan di Bagan) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={newOrgMember.role_title}
                  onChange={e => setNewOrgMember({ ...newOrgMember, role_title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 bg-white font-semibold"
                  type="text"
                  placeholder="Cth: Ketua Tim Kerja Tata Usaha"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    NIP (Opsional)
                  </label>
                  <input
                    value={newOrgMember.nip || ""}
                    onChange={e => setNewOrgMember({ ...newOrgMember, nip: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-mono bg-white"
                    type="text"
                    placeholder="1980xxxx..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Urutan (Sort)
                  </label>
                  <input
                    value={newOrgMember.sort_order || 0}
                    onChange={e => setNewOrgMember({ ...newOrgMember, sort_order: Number(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 bg-white"
                    type="number"
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Checkbox Pengaturan Visibilitas & Judul */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/80 shadow-sm cursor-pointer hover:border-emerald-400 transition-colors">
                <input
                  type="checkbox"
                  id="isVisibleNew"
                  checked={newOrgMember.is_visible !== false}
                  onChange={(e) => setNewOrgMember({ ...newOrgMember, is_visible: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isVisibleNew" className="text-xs font-bold text-emerald-900 cursor-pointer select-none flex-1 flex items-center justify-between">
                  <span>Tampilkan di Bagan Publik</span>
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">visibility</span>
                </label>
              </div>

              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  id="showTitleNew"
                  checked={newOrgMember.show_role_title}
                  onChange={(e) => setNewOrgMember({ ...newOrgMember, show_role_title: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                />
                <label htmlFor="showTitleNew" className="text-xs font-bold text-slate-700 cursor-pointer select-none flex-1">
                  Tampilkan Label Jabatan di Kotak Diagram
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25 py-3 rounded-2xl font-bold hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              {isSaving ? "Menyimpan..." : "Simpan Anggota"}
            </button>
          </form>
        </div>

        {/* ============================================================== */}
        {/* DAFTAR ANGGOTA (7 Cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Daftar Anggota Saat Ini</h3>
                <p className="text-xs text-slate-400">Total {orgMembers.length} anggota terdaftar dalam struktur</p>
              </div>
            </div>

            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs">
              {filteredMembers.length} Ditampilkan
            </span>
          </div>

          {/* Filter & Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
            <div className="relative sm:col-span-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama, jabatan..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <CustomSelect
                value={filterRole}
                onChange={val => setFilterRole(val)}
                options={[
                  { value: "all", label: "Semua Posisi" },
                  ...positions.map(p => ({
                    value: p.position_id,
                    label: p.position_name
                  }))
                ]}
              />
            </div>
            <div>
              <CustomSelect
                value={filterVisibility}
                onChange={val => setFilterVisibility(val)}
                options={[
                  { value: "all", label: "Semua Visibilitas" },
                  { value: "visible", label: "👁️ Tampil di Publik" },
                  { value: "hidden", label: "🔒 Disembunyikan" }
                ]}
              />
            </div>
          </div>

          {/* List of Member Cards */}
          <div className="space-y-3">
            {filteredMembers.map(member => {
              const pos = positionMap.get(member.role_id);
              const parentPos = member.parent_role_id ? positionMap.get(member.parent_role_id) : null;
              const children = getRoleChildren(member.role_id);
              const color = pos?.color || "#475569";
              const isMemberVisible = member.is_visible !== false;

              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-2xl border bg-white transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group relative overflow-hidden ${
                    isMemberVisible 
                      ? 'border-slate-200/80 hover:border-primary/40 hover:shadow-md' 
                      : 'border-amber-200/90 bg-amber-50/20 opacity-85'
                  }`}
                >
                  {/* Left accent color bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: color }} />

                  <div className="pl-2 flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: color }}
                      >
                        {pos?.position_name || member.role_id}
                      </span>

                      {/* Quick Visibility Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(member)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                          isMemberVisible
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        }`}
                        title={isMemberVisible ? "Klik untuk sembunyikan dari bagan publik" : "Klik untuk tampilkan di bagan publik"}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isMemberVisible ? "visibility" : "visibility_off"}
                        </span>
                        {isMemberVisible ? "Publik: Tampil" : "Publik: Hidden"}
                      </button>

                      {member.parent_role_id ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
                          {parentPos?.position_name || member.parent_role_id}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          Tingkat Utama
                        </span>
                      )}

                      {children.length > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                          {children.length} Child
                        </span>
                      )}

                      {!member.show_role_title && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          Label Sembunyi
                        </span>
                      )}
                    </div>

                    {/* Role Title */}
                    <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                      {member.role_title}
                    </h4>

                    {/* Person Name & NIP */}
                    <p className="text-sm font-bold text-primary mt-0.5 truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      NIP: {member.nip || "-"} {member.sort_order ? `• Urutan: ${member.sort_order}` : ""}
                    </p>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(member)}
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                      title="Edit Anggota"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrgMember(member)}
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                      title="Hapus Anggota"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">group_off</span>
                <p className="text-sm font-semibold">Tidak ada data anggota yang cocok.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* MODAL EDIT ANGGOTA */}
      {/* ============================================================== */}
      {isEditModalOpen && editingMember && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Edit Data Anggota</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateMember} className="space-y-4">
                {/* Posisi */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Posisi Jabatan <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    required
                    value={editingMember.role_id}
                    onChange={(val) => {
                      const pos = positionMap.get(val);
                      setEditingMember({
                        ...editingMember,
                        role_id: val,
                        role_title: editingMember.role_title || (pos ? pos.position_name : "")
                      });
                    }}
                    options={positions.map(p => ({
                      value: p.position_id,
                      label: p.position_name
                    }))}
                  />
                </div>

                {/* Parent */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-blue-600">arrow_upward</span>
                    Parent
                  </label>
                  <CustomSelect
                    value={editingMember.parent_role_id || ""}
                    onChange={(val) => setEditingMember({ ...editingMember, parent_role_id: val })}
                    options={[
                      { value: "", label: "-- Tingkat Utama (Tanpa Parent) --" },
                      ...positions
                        .filter(p => p.position_id !== editingMember.role_id)
                        .map(p => ({
                          value: p.position_id,
                          label: `↑ Parent: ${p.position_name}`
                        }))
                    ]}
                  />
                </div>

                {/* Child */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-emerald-600">arrow_downward</span>
                      Child (Opsional)
                    </span>
                    {editSelectedChildren.length > 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        {editSelectedChildren.length} Terpilih
                      </span>
                    )}
                  </label>

                  <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1 scrollbar-thin">
                    {positions
                      .filter(p => p.position_id !== editingMember.role_id && p.position_id !== editingMember.parent_role_id)
                      .map(p => {
                        const isChecked = editSelectedChildren.includes(p.position_id);
                        return (
                          <label
                            key={p.position_id}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                              isChecked ? 'bg-emerald-100/70 text-emerald-900 font-bold' : 'hover:bg-slate-200/50 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditSelectedChildren([...editSelectedChildren, p.position_id]);
                                } else {
                                  setEditSelectedChildren(editSelectedChildren.filter(id => id !== p.position_id));
                                }
                              }}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                            />
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#475569' }} />
                            <span className="truncate">{p.position_name}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={editingMember.name}
                    onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                    type="text"
                  />
                </div>

                {/* Nama Jabatan */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Nama Jabatan Ditampilkan <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={editingMember.role_title}
                    onChange={e => setEditingMember({ ...editingMember, role_title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white font-semibold"
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                      NIP
                    </label>
                    <input
                      value={editingMember.nip || ""}
                      onChange={e => setEditingMember({ ...editingMember, nip: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono bg-white"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                      Urutan (Sort)
                    </label>
                    <input
                      value={editingMember.sort_order || 0}
                      onChange={e => setEditingMember({ ...editingMember, sort_order: Number(e.target.value) || 0 })}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                      type="number"
                      min={0}
                    />
                  </div>
                </div>

                {/* Visibilitas & Label Controls */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/80 cursor-pointer hover:border-emerald-400 transition-colors">
                    <input
                      type="checkbox"
                      id="isVisibleEdit"
                      checked={editingMember.is_visible !== false}
                      onChange={(e) => setEditingMember({ ...editingMember, is_visible: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="isVisibleEdit" className="text-xs font-bold text-emerald-900 cursor-pointer select-none flex-1 flex items-center justify-between">
                      <span>Tampilkan di Bagan Publik (Visibilitas Publik)</span>
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">visibility</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      id="showTitleEdit"
                      checked={editingMember.show_role_title}
                      onChange={(e) => setEditingMember({ ...editingMember, show_role_title: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <label htmlFor="showTitleEdit" className="text-xs font-bold text-slate-700 cursor-pointer select-none flex-1">
                      Tampilkan Nama Jabatan di Kotak Diagram
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ============================================================== */}
      {/* MODAL KELOLA POSISI JABATAN (CUSTOM POSITIONS CRUD) */}
      {/* ============================================================== */}
      {isPosModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Kelola Posisi & Visibilitas Jabatan</h3>
                    <p className="text-xs text-slate-400">Tambah, edit, atau atur visibilitas publik per kategori jabatan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPosModalOpen(false)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Form Tambah Posisi Baru */}
              <form onSubmit={handleAddPosition} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-indigo-600">add_circle</span>
                  Tambah Posisi Baru
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Posisi</label>
                    <input
                      required
                      value={newPosName}
                      onChange={e => setNewPosName(e.target.value)}
                      placeholder="Cth: KOORDINATOR PELAYANAN"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Warna Tema</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newPosColor}
                        onChange={e => setNewPosColor(e.target.value)}
                        className="w-9 h-8 p-0.5 rounded-xl border border-slate-200 cursor-pointer bg-white"
                      />
                      <span className="text-[11px] font-mono text-slate-600">{newPosColor}</span>
                    </div>
                  </div>
                </div>

                {/* Color Presets */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1.5">Pilihan Warna Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setNewPosColor(preset.hex)}
                        title={preset.label}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          newPosColor === preset.hex ? 'border-slate-800 scale-110 shadow-sm' : 'border-white hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Tambahkan Posisi
                </button>
              </form>

              {/* Daftar Posisi Saat Ini */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Daftar Posisi Terdaftar ({positions.length})
                </h4>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {positions.map(p => {
                    const isEditing = editingPosId === p.position_id;
                    const countUsers = orgMembers.filter(m => m.role_id === p.position_id).length;
                    const isPosVisible = p.is_visible !== false;

                    return (
                      <div
                        key={p.position_id}
                        className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 text-xs"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="color"
                              value={editPosColor}
                              onChange={e => setEditPosColor(e.target.value)}
                              className="w-8 h-8 rounded-lg p-0.5 border border-slate-200 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editPosName}
                              onChange={e => setEditPosName(e.target.value)}
                              className="flex-1 border border-slate-200 rounded-lg px-2 py-1 font-bold uppercase text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdatePosition(p.position_id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPosId(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: p.color || '#475569' }} />
                              <div className="truncate">
                                <span className="font-extrabold text-slate-800">{p.position_name}</span>
                                <span className="ml-2 text-[10px] text-slate-400 font-mono">({p.position_id})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Visibility Toggle for Position Category */}
                              <button
                                type="button"
                                onClick={() => handleTogglePositionVisibility(p)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                                  isPosVisible
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                }`}
                                title={isPosVisible ? "Klik untuk sembunyikan seluruh posisi ini dari publik" : "Klik untuk tampilkan posisi ini di publik"}
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  {isPosVisible ? "visibility" : "visibility_off"}
                                </span>
                                {isPosVisible ? "Tampil" : "Hidden"}
                              </button>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                countUsers > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {countUsers} Pegawai
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPosId(p.position_id);
                                  setEditPosName(p.position_name);
                                  setEditPosColor(p.color || "#0284c7");
                                }}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors"
                                title="Edit Posisi"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePosition(p.position_id, p.position_name)}
                                disabled={countUsers > 0}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                  countUsers > 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                                title={countUsers > 0 ? "Tidak bisa dihapus karena masih ada pegawai" : "Hapus Posisi"}
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPosModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
