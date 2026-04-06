import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { formatRupiah } from "@/lib/helpers";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, UserPlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const FASILITAS_OPTIONS = ["AC", "TV", "Lemari", "Kamar Mandi Dalam", "WiFi", "Air Panas", "Parkir Motor", "Kasur", "Meja & Kursi", "Dapur Bersama", "Mesin Cuci", "Kulkas", "CCTV", "Parkir Mobil", "Kamar Mandi Luar"];

interface RoomType {
  id: string;
  nama: string;
  harga_per_bulan: number;
  fasilitas: string[];
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
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddRooms, setShowAddRooms] = useState<string | null>(null);
  const [showAddTenant, setShowAddTenant] = useState<string | null>(null);
  const [showEditType, setShowEditType] = useState<RoomType | null>(null);
  const [showEditRoom, setShowEditRoom] = useState<Room | null>(null);

  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [fasilitas, setFasilitas] = useState<string[]>([]);
  const [customFasilitas, setCustomFasilitas] = useState("");
  const [prefix, setPrefix] = useState("");
  const [startNum, setStartNum] = useState("1");
  const [count, setCount] = useState("5");
  const [lantai, setLantai] = useState("1");

  // Edit room state
  const [editRoomNomor, setEditRoomNomor] = useState("");
  const [editRoomLantai, setEditRoomLantai] = useState("1");

  // Add tenant form
  const [tenantNama, setTenantNama] = useState("");
  const [tenantHp, setTenantHp] = useState("");
  const [tenantGender, setTenantGender] = useState("L");
  const [tenantTanggalMasuk, setTenantTanggalMasuk] = useState(new Date().toISOString().split("T")[0]);
  const [tenantDurasi, setTenantDurasi] = useState("1");
  const [tenantDeposit, setTenantDeposit] = useState("");

  const fetchData = async () => {
    if (demo.isDemo) {
      const mapped: RoomType[] = demo.roomTypes.map(rt => ({
        ...rt,
        rooms: demo.rooms.filter(r => r.room_type_id === rt.id).map(r => {
          const tenant = demo.tenants.find(t => t.room_id === r.id && t.status === "aktif");
          return { ...r, tenantName: tenant?.nama, tenantId: tenant?.id };
        }),
      }));
      setRoomTypes(mapped);
      setLoading(false);
      return;
    }
    if (!activeProperty) return;
    setLoading(true);
    const { data: types } = await supabase.from("room_types").select("*").eq("property_id", activeProperty.id).order("created_at") as any;
    const rtIds = (types || []).map((t: any) => t.id);
    let rooms: any[] = [];
    if (rtIds.length > 0) {
      const { data } = await supabase.from("rooms").select("*").in("room_type_id", rtIds).order("nomor") as any;
      rooms = data || [];
    }
    const occupiedRoomIds = rooms.filter((r: any) => r.status === "terisi").map((r: any) => r.id);
    let tenantsByRoom: Record<string, { nama: string; id: string }> = {};
    if (occupiedRoomIds.length > 0) {
      const { data: tenantData } = await supabase.from("tenants").select("id, nama, room_id").in("room_id", occupiedRoomIds).eq("status", "aktif") as any;
      (tenantData || []).forEach((t: any) => {
        if (t.room_id) tenantsByRoom[t.room_id] = { nama: t.nama, id: t.id };
      });
    }
    const mapped: RoomType[] = (types || []).map((t: any) => ({
      ...t,
      rooms: rooms.filter((r: any) => r.room_type_id === t.id).map((r: any) => ({
        ...r,
        tenantName: tenantsByRoom[r.id]?.nama,
        tenantId: tenantsByRoom[r.id]?.id,
      })),
    }));
    setRoomTypes(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeProperty, demo.isDemo]);

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); return; }
    if (!activeProperty) return;
    const { error } = await supabase.from("room_types").insert({ property_id: activeProperty.id, nama, harga_per_bulan: parseInt(harga) || 0, fasilitas } as any);
    if (error) toast.error(error.message);
    else { toast.success("Tipe kamar ditambahkan!"); setShowAdd(false); setNama(""); setHarga(""); setFasilitas([]); setCustomFasilitas(""); fetchData(); }
  };

  const handleEditType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); setShowEditType(null); return; }
    if (!showEditType) return;
    const { error } = await supabase.from("room_types").update({ nama, harga_per_bulan: parseInt(harga) || 0, fasilitas } as any).eq("id", showEditType.id);
    if (error) toast.error(error.message);
    else { toast.success("Tipe kamar diperbarui!"); setShowEditType(null); fetchData(); }
  };

  const handleDeleteType = async (id: string) => {
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); return; }
    const { error } = await supabase.from("room_types").delete().eq("id", id) as any;
    if (error) toast.error(error.message);
    else { toast.success("Tipe kamar dihapus"); fetchData(); }
  };

  const handleDeleteRoom = async (id: string) => {
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); return; }
    const { error } = await supabase.from("rooms").delete().eq("id", id) as any;
    if (error) toast.error(error.message);
    else { toast.success("Kamar dihapus"); fetchData(); }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); setShowEditRoom(null); return; }
    if (!showEditRoom) return;
    const { error } = await supabase.from("rooms").update({ nomor: editRoomNomor, lantai: parseInt(editRoomLantai) || 1 } as any).eq("id", showEditRoom.id);
    if (error) toast.error(error.message);
    else { toast.success("Kamar diperbarui!"); setShowEditRoom(null); fetchData(); }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); return; }
    if (!showAddRooms) return;
    const n = parseInt(count) || 0;
    const start = parseInt(startNum) || 1;
    const lt = parseInt(lantai) || 1;
    const roomsToInsert = Array.from({ length: n }, (_, i) => ({ room_type_id: showAddRooms, nomor: `${prefix}${start + i}`, lantai: lt, status: "kosong" as const }));
    const { error } = await supabase.from("rooms").insert(roomsToInsert as any);
    if (error) toast.error(error.message);
    else { toast.success(`${n} kamar ditambahkan!`); setShowAddRooms(null); fetchData(); }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); setShowAddTenant(null); return; }
    if (!activeProperty || !showAddTenant) return;
    const d = parseInt(tenantDurasi);
    const masuk = new Date(tenantTanggalMasuk);
    const keluar = new Date(masuk);
    keluar.setMonth(keluar.getMonth() + d);
    const { data: tenant, error } = await supabase.from("tenants").insert({
      property_id: activeProperty.id, room_id: showAddTenant, nama: tenantNama,
      no_hp: tenantHp || null, gender: tenantGender,
      tanggal_masuk: tenantTanggalMasuk, tanggal_keluar: keluar.toISOString().split("T")[0],
    } as any).select().single() as any;
    if (error) { toast.error(error.message); return; }
    await supabase.from("rooms").update({ status: "terisi" } as any).eq("id", showAddTenant);
    let hargaSewa = 0;
    for (const rt of roomTypes) {
      const room = rt.rooms.find(r => r.id === showAddTenant);
      if (room) { hargaSewa = rt.harga_per_bulan; break; }
    }
    await supabase.from("transactions").insert({
      tenant_id: tenant.id, property_id: activeProperty.id,
      periode_bulan: masuk.getMonth() + 1, periode_tahun: masuk.getFullYear(),
      total_tagihan: hargaSewa,
    } as any);
    // Create deposit if specified
    const depositAmount = parseInt(tenantDeposit) || 0;
    if (depositAmount > 0) {
      await supabase.from("deposits").insert({
        tenant_id: tenant.id, property_id: activeProperty.id, jumlah: depositAmount,
      } as any);
    }
    toast.success("Penyewa berhasil ditambahkan!");
    setShowAddTenant(null); setTenantNama(""); setTenantHp(""); setTenantGender("L"); setTenantDurasi("1"); setTenantDeposit("");
    fetchData();
  };

  const handleRoomTap = (room: Room) => {
    if (room.status === "terisi" && room.tenantId) {
      navigate(`/penyewa?id=${room.tenantId}`);
    } else if (room.status === "kosong") {
      setShowAddTenant(room.id);
    }
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
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rt.fasilitas?.map(f => <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-sm font-medium text-foreground">{terisi}/{rt.rooms.length}</span>
                        <p className="text-[10px] text-muted-foreground">terisi</p>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
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
                      <DropdownMenuItem onClick={() => {
                        setShowEditType(rt);
                        setNama(rt.nama);
                        setHarga(String(rt.harga_per_bulan));
                        setFasilitas(rt.fasilitas || []);
                      }}>
                        <Pencil size={14} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteType(rt.id)}>
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
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                        {rt.rooms.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Belum ada kamar</p>
                        ) : rt.rooms.map((room) => (
                          <div key={room.id} className="flex items-center gap-2">
                            <button
                              onClick={() => handleRoomTap(room)}
                              className="flex-1 flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                            >
                              <div className="flex items-center gap-3">
                                {room.status === "terisi" && room.tenantName ? (
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold"
                                    style={{
                                      background: getAvatarColor(room.tenantName).bg,
                                      color: getAvatarColor(room.tenantName).fg,
                                    }}
                                  >
                                    {getInitials(room.tenantName)}
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
                                    {room.nomor}
                                  </div>
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
                                  <span className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                                    <UserPlus size={12} /> Isi
                                  </span>
                                )}
                                <Badge className={`text-[10px] border-0 ${
                                  room.status === "terisi"
                                    ? "bg-[hsl(142,71%,45%)] text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}>
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
                                <DropdownMenuItem onClick={() => {
                                  setShowEditRoom(room);
                                  setEditRoomNomor(room.nomor);
                                  setEditRoomLantai(String(room.lantai));
                                }}>
                                  <Pencil size={14} className="mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteRoom(room.id)}>
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
        <form onSubmit={handleAddType} className="space-y-4">
          <div className="space-y-2"><Label>Nama Tipe</Label><Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Standar" required /></div>
          <div className="space-y-2"><Label>Harga per Bulan (Rp)</Label><Input type="number" value={harga} onChange={e => setHarga(e.target.value)} placeholder="500000" required /></div>
          <div className="space-y-2">
            <Label>Fasilitas</Label>
            <div className="flex flex-wrap gap-2">
              {FASILITAS_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => setFasilitas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${fasilitas.includes(f) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}
                >{f}</button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Simpan</Button>
        </form>
      </BottomSheet>

      {/* Edit room type */}
      <BottomSheet open={!!showEditType} onClose={() => setShowEditType(null)} title="Edit Tipe Kamar">
        <form onSubmit={handleEditType} className="space-y-4">
          <div className="space-y-2"><Label>Nama Tipe</Label><Input value={nama} onChange={e => setNama(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Harga per Bulan (Rp)</Label><Input type="number" value={harga} onChange={e => setHarga(e.target.value)} required /></div>
          <div className="space-y-2">
            <Label>Fasilitas</Label>
            <div className="flex flex-wrap gap-2">
              {FASILITAS_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => setFasilitas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${fasilitas.includes(f) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}
                >{f}</button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Simpan Perubahan</Button>
        </form>
      </BottomSheet>

      {/* Edit room */}
      <BottomSheet open={!!showEditRoom} onClose={() => setShowEditRoom(null)} title="Edit Kamar">
        <form onSubmit={handleEditRoom} className="space-y-4">
          <div className="space-y-2"><Label>Nomor Kamar</Label><Input value={editRoomNomor} onChange={e => setEditRoomNomor(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Lantai</Label><Input type="number" value={editRoomLantai} onChange={e => setEditRoomLantai(e.target.value)} required /></div>
          <Button type="submit" className="w-full">Simpan Perubahan</Button>
        </form>
      </BottomSheet>

      {/* Add rooms bulk */}
      <BottomSheet open={!!showAddRooms} onClose={() => setShowAddRooms(null)} title="Tambah Kamar">
        <form onSubmit={handleBulkAdd} className="space-y-4">
          <div className="space-y-2"><Label>Prefix Nomor</Label><Input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="A" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Mulai</Label><Input type="number" value={startNum} onChange={e => setStartNum(e.target.value)} /></div>
            <div className="space-y-2"><Label>Jumlah</Label><Input type="number" value={count} onChange={e => setCount(e.target.value)} /></div>
            <div className="space-y-2"><Label>Lantai</Label><Input type="number" value={lantai} onChange={e => setLantai(e.target.value)} /></div>
          </div>
          <Button type="submit" className="w-full">Tambah</Button>
        </form>
      </BottomSheet>

      {/* Add tenant */}
      <BottomSheet open={!!showAddTenant} onClose={() => setShowAddTenant(null)} title="Tambah Penyewa">
        <form onSubmit={handleAddTenant} className="space-y-4">
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
          <Button type="submit" className="w-full">Simpan Penyewa</Button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
