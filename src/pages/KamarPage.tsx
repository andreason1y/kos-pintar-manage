import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { usePlan } from "@/lib/plan-context";
import { formatRupiah, addMonths } from "@/lib/helpers";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import { useRoomTypesAndRooms, useTenants, useInvalidate } from "@/hooks/use-queries";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, UserPlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RoomType {
  id: string;
  nama: string;
  harga_per_bulan: number;
  rooms: Room[];
}

interface Room {
  id: string;
  nomor: string;
  lantai: number;
  status: string;
  tenantName?: string;
  tenantId?: string;
}

export default function KamarPage() {
  const navigate = useNavigate();
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const { plan, limits, triggerUpgrade } = usePlan();
  const invalidate = useInvalidate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddRooms, setShowAddRooms] = useState<string | null>(null);
  const [showAddTenant, setShowAddTenant] = useState<string | null>(null);
  const [showEditType, setShowEditType] = useState<RoomType | null>(null);
  const [showEditRoom, setShowEditRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "room_type" | "room"; id: string; name: string } | null>(null);

  // Open add modal via URL param from dashboard quick action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add") {
      setShowAdd(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [prefix, setPrefix] = useState("");
  const [startNum, setStartNum] = useState("1");
  const [count, setCount] = useState("5");
  const [lantai, setLantai] = useState("1");
  const [editRoomNomor, setEditRoomNomor] = useState("");
  const [editRoomLantai, setEditRoomLantai] = useState("1");
  const [tenantNama, setTenantNama] = useState("");
  const [tenantHp, setTenantHp] = useState("");
  const [tenantGender, setTenantGender] = useState("L");
  const [tenantTanggalMasuk, setTenantTanggalMasuk] = useState(new Date().toISOString().split("T")[0]);
  const [tenantDurasi, setTenantDurasi] = useState("1");
  const [tenantDeposit, setTenantDeposit] = useState("");
  const [tenantJatuhTempo, setTenantJatuhTempo] = useState("1");

  const { data: roomData, isLoading: roomsLoading } = useRoomTypesAndRooms();
  const { data: tenantData, isLoading: tenantsLoading } = useTenants();
  const loading = !demo.isDemo && (roomsLoading || tenantsLoading);

  const roomTypes = useMemo(() => {
    if (demo.isDemo) {
      return demo.roomTypes.map(rt => ({
        ...rt,
        rooms: demo.rooms.filter(r => r.room_type_id === rt.id).map(r => {
          const tenant = demo.tenants.find(t => t.room_id === r.id && t.status === "aktif");
          return { ...r, tenantName: tenant?.nama, tenantId: tenant?.id };
        }),
      })) as RoomType[];
    }
    if (!roomData || !tenantData) return [] as RoomType[];
    const tenantsByRoom: Record<string, { nama: string; id: string }> = {};
    tenantData.filter(t => t.status === "aktif" && t.room_id).forEach(t => {
      tenantsByRoom[t.room_id!] = { nama: t.nama, id: t.id };
    });
    return roomData.roomTypes.map(t => ({
      ...t,
      rooms: roomData.rooms.filter(r => r.room_type_id === t.id).map(r => ({
        ...r, tenantName: tenantsByRoom[r.id]?.nama, tenantId: tenantsByRoom[r.id]?.id,
      })),
    })) as RoomType[];
  }, [demo.isDemo, roomData, tenantData, demo.roomTypes, demo.rooms, demo.tenants]);

  const refetchAll = () => { invalidate.all(); };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) {
      demo.addRoomType({ property_id: "prop-1", nama, harga_per_bulan: parseInt(harga) || 0 });
      toast.success("Tipe kamar ditambahkan!"); setShowAdd(false); setNama(""); setHarga("");
      return;
    }
    if (!activeProperty) return;
    const { error } = await supabase.from("room_types").insert({ property_id: activeProperty.id, nama, harga_per_bulan: parseInt(harga) || 0 });
    if (error) toast.error(error.message);
    else { toast.success("Tipe kamar ditambahkan!"); setShowAdd(false); setNama(""); setHarga(""); refetchAll(); }
  };

  const handleEditType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditType) return;
    if (demo.isDemo) {
      demo.updateRoomType(showEditType.id, { nama, harga_per_bulan: parseInt(harga) || 0 });
      toast.success("Tipe kamar diperbarui!"); setShowEditType(null);
      return;
    }
    const { error } = await supabase.from("room_types").update({ nama, harga_per_bulan: parseInt(harga) || 0 }).eq("id", showEditType.id);
    if (error) toast.error(error.message);
    else { toast.success("Tipe kamar diperbarui!"); setShowEditType(null); refetchAll(); }
  };

  const handleDeleteType = async (id: string) => {
    // Guard: check if any room in this type has active tenants
    const rt = roomTypes.find(r => r.id === id);
    if (rt && rt.rooms.some(r => r.tenantName)) {
      toast.error("Tipe kamar masih memiliki penyewa aktif. Keluarkan penyewa terlebih dahulu.");
      return;
    }
    if (demo.isDemo) {
      demo.deleteRoomType(id);
      toast.success("Tipe kamar dihapus");
      return;
    }
    const { error } = await supabase.from("room_types").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Tipe kamar dihapus"); refetchAll(); }
  };

  const handleDeleteRoom = async (id: string) => {
    // Guard: check if room has active tenant
    const room = roomTypes.flatMap(rt => rt.rooms).find(r => r.id === id);
    if (room && room.tenantName) {
      toast.error("Kamar ini masih ditempati penyewa. Keluarkan penyewa terlebih dahulu.");
      return;
    }
    if (demo.isDemo) {
      demo.deleteRoom(id);
      toast.success("Kamar dihapus");
      return;
    }
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Kamar dihapus"); refetchAll(); }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditRoom) return;
    if (demo.isDemo) {
      demo.updateRoom(showEditRoom.id, { nomor: editRoomNomor, lantai: parseInt(editRoomLantai) || 1 });
      toast.success("Kamar diperbarui!"); setShowEditRoom(null);
      return;
    }
    const { error } = await supabase.from("rooms").update({ nomor: editRoomNomor, lantai: parseInt(editRoomLantai) || 1 }).eq("id", showEditRoom.id);
    if (error) toast.error(error.message);
    else { toast.success("Kamar diperbarui!"); setShowEditRoom(null); refetchAll(); }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddRooms) return;
    const n = parseInt(count) || 0;
    const start = parseInt(startNum) || 1;
    const lt = parseInt(lantai) || 1;
    const currentRoomCount = roomTypes.reduce((sum, rt) => sum + rt.rooms.length, 0);
    if (currentRoomCount + n > limits.maxRooms) {
      if (plan === "bisnis" || plan === "demo") {
        triggerUpgrade(`Batas ${limits.maxRooms} kamar tercapai. Hubungi kami untuk solusi enterprise.`, "Hubungi Kami →", "https://wa.me/62818477620");
      } else {
        triggerUpgrade(`Batas ${limits.maxRooms} kamar tercapai. Upgrade ke paket Bisnis untuk kelola lebih banyak kamar.`);
      }
      return;
    }
    if (demo.isDemo) {
      for (let i = 0; i < n; i++) {
        demo.addRoom({ room_type_id: showAddRooms, nomor: `${prefix}${start + i}`, lantai: lt, status: "kosong" });
      }
      toast.success(`${n} kamar ditambahkan!`); setShowAddRooms(null);
      return;
    }
    const roomsToInsert = Array.from({ length: n }, (_, i) => ({ room_type_id: showAddRooms, nomor: `${prefix}${start + i}`, lantai: lt, status: "kosong" as const }));
    const { error } = await supabase.from("rooms").insert(roomsToInsert);
    if (error) {
      // Gracefully handle plan limit trigger error from DB
      if (error.message?.toLowerCase().includes("batas kamar")) {
        const planLabel = plan === "starter" ? "Starter (10 kamar)" : plan === "pro" ? "Pro (25 kamar)" : "Bisnis (60 kamar)";
        triggerUpgrade(`Batas kamar plan ${planLabel} telah tercapai. Upgrade untuk menambah lebih banyak kamar.`);
      } else {
        toast.error(error.message);
      }
    } else { toast.success(`${n} kamar ditambahkan!`); setShowAddRooms(null); refetchAll(); }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddTenant) return;
    const d = parseInt(tenantDurasi);
    const masuk = new Date(tenantTanggalMasuk);
    const keluar = addMonths(masuk, d);
    const keluarStr = keluar.toISOString().split("T")[0];

    const resetTenantForm = () => {
      setTenantNama(""); setTenantHp(""); setTenantGender("L");
      setTenantDurasi("1"); setTenantDeposit(""); setTenantJatuhTempo("1");
    };

    if (demo.isDemo) {
      demo.demoAddTenantAtomic({
        roomId: showAddTenant, nama: tenantNama, noHp: tenantHp || null,
        email: null,
        gender: tenantGender as "L" | "P", tanggalMasuk: tenantTanggalMasuk,
        tanggalKeluar: keluarStr, depositAmount: parseInt(tenantDeposit) || 0,
        jatuhTempoHari: parseInt(tenantJatuhTempo) || 1,
      });
      toast.success("Penyewa berhasil ditambahkan!");
      setShowAddTenant(null); resetTenantForm();
      return;
    }

    if (!activeProperty) return;
    const { error } = await supabase.rpc("add_tenant", {
      p_property_id: activeProperty.id,
      p_room_id: showAddTenant,
      p_nama: tenantNama,
      p_no_hp: tenantHp || null,
      p_email: null,
      p_gender: tenantGender,
      p_tanggal_masuk: tenantTanggalMasuk,
      p_tanggal_keluar: keluarStr,
      p_deposit_amount: parseInt(tenantDeposit) || 0,
      p_jatuh_tempo: parseInt(tenantJatuhTempo) || 1,
    });
    if (error) {
      // Handle plan limit trigger error gracefully
      if (error.message?.includes("Batas kamar") || error.message?.includes("batas kamar")) {
        toast.error(error.message);
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Penyewa berhasil ditambahkan!");
    setShowAddTenant(null); resetTenantForm();
    refetchAll();
  };

  const handleRoomTap = (room: Room) => {
    if (room.status === "terisi" && room.tenantId) navigate(`/penyewa?id=${room.tenantId}`);
    else if (room.status === "kosong") setShowAddTenant(room.id);
  };

  return (
    <AppShell>
      <PageHeader title="Kamar" subtitle="Kelola tipe & unit kamar" action={
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={16} className="mr-1" /> Tipe</Button>
      } />
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : roomTypes.length === 0 ? (
          <EmptyState title="Belum ada tipe kamar" description="Mulai dengan menambahkan tipe kamar pertama" action={
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={16} className="mr-1" /> Tambah Tipe Kamar</Button>
          } />
        ) : (
          roomTypes.map((rt) => {
            const terisi = rt.rooms.filter(r => r.status === "terisi").length;
            const isExpanded = expanded === rt.id;
            return (
              <motion.div key={rt.id} layout className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="flex items-center">
                  <button className="flex-1 p-4 flex items-center justify-between" onClick={() => setExpanded(isExpanded ? null : rt.id)}>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{rt.nama}</p>
                      <p className="text-sm text-muted-foreground">{formatRupiah(rt.harga_per_bulan)}/bln</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-sm font-medium text-foreground">{terisi}/{rt.rooms.length}</span>
                        <p className="text-[10px] text-muted-foreground">terisi</p>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
                        <ChevronDown size={18} className="text-muted-foreground" />
                      </motion.div>
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 mr-2 rounded-full flex items-center justify-center hover:bg-muted">
                        <MoreVertical size={16} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setShowEditType(rt); setNama(rt.nama); setHarga(String(rt.harga_per_bulan)); }}>
                        <Pencil size={14} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ type: "room_type", id: rt.id, name: rt.nama })}>
                        <Trash2 size={14} className="mr-2" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                        {rt.rooms.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Belum ada kamar</p>
                        ) : rt.rooms.map((room) => (
                          <div key={room.id} className="flex items-center gap-2">
                            <button onClick={() => handleRoomTap(room)}
                              className="flex-1 flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted">
                              <div className="flex items-center gap-3">
                                {room.status === "terisi" && room.tenantName ? (
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold"
                                    style={{ background: getAvatarColor(room.tenantName).bg, color: getAvatarColor(room.tenantName).fg }}>
                                    {getInitials(room.tenantName)}
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">{room.nomor}</div>
                                )}
                                <div>
                                  <span className="text-sm font-medium text-foreground">Kamar {room.nomor}</span>
                                  {room.status === "terisi" && room.tenantName ? (
                                    <p className="text-[11px] text-muted-foreground">{room.tenantName}</p>
                                  ) : (
                                    <p className="text-[10px] text-muted-foreground">Lantai {room.lantai}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {room.status === "kosong" && (
                                  <span className="text-[10px] font-medium text-primary flex items-center gap-0.5"><UserPlus size={12} /> Isi</span>
                                )}
                                <Badge className={`text-[10px] border-0 ${room.status === "terisi" ? "bg-[hsl(142,71%,45%)] text-white" : "bg-muted text-muted-foreground"}`}>
                                  {room.status === "terisi" ? "Terisi" : "Kosong"}
                                </Badge>
                              </div>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted shrink-0">
                                  <MoreVertical size={14} className="text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setShowEditRoom(room); setEditRoomNomor(room.nomor); setEditRoomLantai(String(room.lantai)); }}>
                                  <Pencil size={14} className="mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ type: "room", id: room.id, name: `Kamar ${room.nomor}` })}>
                                  <Trash2 size={14} className="mr-2" /> Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowAddRooms(rt.id)}>
                          <Plus size={14} className="mr-1" /> Tambah Kamar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add room type */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Tipe Kamar">
        <form onSubmit={handleAddType} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Nama Tipe</Label><Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Standar" required /></div>
            <div className="space-y-2"><Label>Harga per Bulan (Rp)</Label><Input type="number" value={harga} onChange={e => setHarga(e.target.value)} placeholder="500000" required /></div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full">Simpan Tipe</Button>
          </div>
        </form>
      </BottomSheet>

      {/* Edit room type */}
      <BottomSheet open={!!showEditType} onClose={() => setShowEditType(null)} title="Edit Tipe Kamar">
        <form onSubmit={handleEditType} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Nama Tipe</Label><Input value={nama} onChange={e => setNama(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Harga per Bulan (Rp)</Label><Input type="number" value={harga} onChange={e => setHarga(e.target.value)} required /></div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full">Simpan Tipe</Button>
          </div>
        </form>
      </BottomSheet>

      {/* Edit room */}
      <BottomSheet open={!!showEditRoom} onClose={() => setShowEditRoom(null)} title="Edit Kamar">
        <form onSubmit={handleEditRoom} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Nomor Kamar</Label><Input value={editRoomNomor} onChange={e => setEditRoomNomor(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Lantai</Label><Input type="number" value={editRoomLantai} onChange={e => setEditRoomLantai(e.target.value)} required /></div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full">Simpan Kamar</Button>
          </div>
        </form>
      </BottomSheet>

      {/* Add rooms bulk */}
      <BottomSheet open={!!showAddRooms} onClose={() => setShowAddRooms(null)} title="Tambah Kamar">
        <form onSubmit={handleBulkAdd} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Prefix Nomor</Label><Input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="A" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Mulai</Label><Input type="number" value={startNum} onChange={e => setStartNum(e.target.value)} /></div>
              <div className="space-y-2"><Label>Jumlah</Label><Input type="number" value={count} onChange={e => setCount(e.target.value)} /></div>
              <div className="space-y-2"><Label>Lantai</Label><Input type="number" value={lantai} onChange={e => setLantai(e.target.value)} /></div>
            </div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full">Simpan Kamar</Button>
          </div>
        </form>
      </BottomSheet>

      {/* Add tenant */}
      <BottomSheet open={!!showAddTenant} onClose={() => setShowAddTenant(null)} title="Tambah Penyewa">
        <form onSubmit={handleAddTenant} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Kamar yang dipilih</p>
            <p className="text-sm font-semibold text-foreground">
              {showAddTenant && roomTypes.flatMap(rt => rt.rooms).find(r => r.id === showAddTenant)?.nomor}
            </p>
          </div>
          <div className="space-y-2"><Label>Nama</Label><Input value={tenantNama} onChange={e => setTenantNama(e.target.value)} required /></div>
          <div className="space-y-2"><Label>No. HP</Label><Input value={tenantHp} onChange={e => setTenantHp(e.target.value)} placeholder="08123456789" /></div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <div className="flex gap-2">
              {[{ v: "L", l: "Laki-laki" }, { v: "P", l: "Perempuan" }].map(g => (
                <button key={g.v} type="button" onClick={() => setTenantGender(g.v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${tenantGender === g.v ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}
                >{g.l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Tanggal Masuk</Label><Input type="date" value={tenantTanggalMasuk} onChange={e => setTenantTanggalMasuk(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Durasi</Label>
              <div className="flex gap-1">
                {[1, 3, 6, 12].map(d => (
                  <button key={d} type="button" onClick={() => setTenantDurasi(String(d))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${tenantDurasi === String(d) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}
                  >{d}bl</button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Jatuh Tempo Bayar <span className="text-destructive">*</span></Label>
            <Select value={tenantJatuhTempo} onValueChange={setTenantJatuhTempo}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tanggal..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Tanggal tagihan otomatis setiap bulannya</p>
          </div>
          <div className="space-y-2">
            <Label>Deposit (Rp)</Label>
            <Input type="number" value={tenantDeposit} onChange={e => setTenantDeposit(e.target.value)} placeholder="0 (opsional)" />
          </div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full">Tambah Penyewa</Button>
          </div>
        </form>
      </BottomSheet>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.type === "room_type") handleDeleteType(deleteTarget.id);
          else if (deleteTarget?.type === "room") handleDeleteRoom(deleteTarget.id);
          setDeleteTarget(null);
        }}
        itemName={deleteTarget?.name || ""}
      />
    </AppShell>
  );
}
