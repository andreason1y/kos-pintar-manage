import { useState, useMemo } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { getInitials, getAvatarColor } from "@/lib/avatar-colors";
import { formatRupiah } from "@/lib/helpers";
import { useRoomTypesAndRooms, useTenants, useTransactions, useInvalidate } from "@/hooks/use-queries";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import BottomSheet from "@/components/BottomSheet";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MessageCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Tenant {
  id: string;
  nama: string;
  no_hp: string | null;
  gender: string;
  tanggal_masuk: string;
  tanggal_keluar: string | null;
  status: string;
  room_id: string | null;
  roomLabel?: string;
  latestTxStatus?: string;
  sisaHari?: number;
}

const tabsList = ["Semua", "Aktif", "Jatuh Tempo", "Keluar"];

export default function PenyewaPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const invalidate = useInvalidate();
  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<Tenant | null>(null);

  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [gender, setGender] = useState("L");
  const [roomId, setRoomId] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState(new Date().toISOString().split("T")[0]);
  const [durasi, setDurasi] = useState("1");
  const [deposit, setDeposit] = useState("");
  const [showEndContract, setShowEndContract] = useState<Tenant | null>(null);
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [returnAmount, setReturnAmount] = useState("");
  const [deductionNote, setDeductionNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const now = new Date();
  const bulanIni = now.getMonth() + 1;
  const tahunIni = now.getFullYear();

  // React Query
  const { data: roomData, isLoading: roomsLoading } = useRoomTypesAndRooms();
  const { data: tenantData, isLoading: tenantsLoading } = useTenants();
  const { data: txData, isLoading: txLoading } = useTransactions();

  const loading = !demo.isDemo && (roomsLoading || tenantsLoading || txLoading);

  const { tenants, emptyRooms } = useMemo(() => {
    if (demo.isDemo) {
      const mapped: Tenant[] = demo.tenants.map(t => {
        const room = demo.rooms.find(r => r.id === t.room_id);
        const rt = room ? demo.roomTypes.find(rr => rr.id === room.room_type_id) : null;
        const tx = demo.transactions.find(tx => tx.tenant_id === t.id && tx.periode_bulan === bulanIni && tx.periode_tahun === tahunIni);
        const sisaHari = t.tanggal_keluar ? Math.ceil((new Date(t.tanggal_keluar).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
        return { ...t, tanggal_masuk: t.tanggal_masuk, tanggal_keluar: t.tanggal_keluar || null, roomLabel: room && rt ? `${rt.nama} - No. ${room.nomor}` : "-", latestTxStatus: tx?.status, sisaHari };
      });
      const empty = demo.rooms.filter(r => r.status === "kosong").map(r => {
        const rt = demo.roomTypes.find(rr => rr.id === r.room_type_id);
        return { ...r, room_type: rt };
      });
      return { tenants: mapped, emptyRooms: empty };
    }

    if (!roomData || !tenantData || !txData) return { tenants: [] as Tenant[], emptyRooms: [] as any[] };

    const { roomTypes, rooms } = roomData;
    const transactions = txData.filter((tx: any) => tx.periode_bulan === bulanIni && tx.periode_tahun === tahunIni);

    const mapped: Tenant[] = tenantData.map((t: any) => {
      const room = rooms.find((r: any) => r.id === t.room_id);
      const rt = room ? roomTypes.find((rr: any) => rr.id === room.room_type_id) : null;
      const tx = transactions.find((tx: any) => tx.tenant_id === t.id);
      const sisaHari = t.tanggal_keluar ? Math.ceil((new Date(t.tanggal_keluar).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
      return { ...t, roomLabel: room && rt ? `${rt.nama} - No. ${room.nomor}` : "-", latestTxStatus: tx?.status, sisaHari };
    });
    const empty = rooms.filter((r: any) => r.status === "kosong").map((r: any) => ({
      ...r, room_type: roomTypes.find((rt: any) => rt.id === r.room_type_id)
    }));
    return { tenants: mapped, emptyRooms: empty };
  }, [demo.isDemo, roomData, tenantData, txData]);

  const filtered = useMemo(() => {
    let list = tenants;
    if (activeTab === "Aktif") list = list.filter(t => t.status === "aktif");
    else if (activeTab === "Keluar") list = list.filter(t => t.status === "keluar");
    else if (activeTab === "Jatuh Tempo") list = list.filter(t => t.sisaHari !== undefined && t.sisaHari <= 30 && t.sisaHari >= 0 && t.status === "aktif");
    if (search) list = list.filter(t => t.nama.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [tenants, activeTab, search]);

  const refetch = () => { invalidate.tenants(); invalidate.rooms(); invalidate.transactions(); invalidate.deposits(); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    const d = parseInt(durasi);
    const masuk = new Date(tanggalMasuk);
    const keluar = new Date(masuk);
    keluar.setMonth(keluar.getMonth() + d);

    if (demo.isDemo) {
      const selectedRoom = emptyRooms.find((r: any) => r.id === roomId);
      const harga = selectedRoom?.room_type?.harga_per_bulan || 0;
      const tenantId = demo.addTenant({ property_id: "prop-1", room_id: roomId, nama, no_hp: noHp || null, gender: gender as "L" | "P", tanggal_masuk: tanggalMasuk, tanggal_keluar: keluar.toISOString().split("T")[0], status: "aktif" });
      demo.updateRoom(roomId, { status: "terisi" });
      demo.addTransaction({ tenant_id: tenantId, property_id: "prop-1", periode_bulan: masuk.getMonth() + 1, periode_tahun: masuk.getFullYear(), total_tagihan: harga, jumlah_dibayar: 0, status: "belum_bayar", metode_bayar: null, tanggal_bayar: null, catatan: null, nota_number: null, created_at: new Date().toISOString() });
      toast.success("Penyewa berhasil ditambahkan!");
      setShowAdd(false); setNama(""); setNoHp(""); setRoomId(""); setGender("L"); setDurasi("1"); setDeposit("");
      return;
    }
    if (!activeProperty) return;
    const { data: tenant, error } = await supabase.from("tenants").insert({ property_id: activeProperty.id, room_id: roomId, nama, no_hp: noHp || null, gender, tanggal_masuk: tanggalMasuk, tanggal_keluar: keluar.toISOString().split("T")[0] } as any).select().single() as any;
    if (error) { toast.error(error.message); return; }
    await supabase.from("rooms").update({ status: "terisi" } as any).eq("id", roomId);
    const selectedRoom = emptyRooms.find((r: any) => r.id === roomId);
    const harga = selectedRoom?.room_type?.harga_per_bulan || 0;
    await supabase.from("transactions").insert({ tenant_id: tenant.id, property_id: activeProperty.id, periode_bulan: masuk.getMonth() + 1, periode_tahun: masuk.getFullYear(), total_tagihan: harga } as any);
    const depositAmt = parseInt(deposit) || 0;
    if (depositAmt > 0) {
      await supabase.from("deposits").insert({ tenant_id: tenant.id, property_id: activeProperty.id, jumlah: depositAmt } as any);
    }
    toast.success("Penyewa berhasil ditambahkan!");
    setShowAdd(false); setNama(""); setNoHp(""); setRoomId(""); setGender("L"); setDurasi("1"); setDeposit("");
    refetch();
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    if (demo.isDemo) {
      demo.updateTenant(showEdit.id, { nama, no_hp: noHp || null, gender: gender as "L" | "P" });
      toast.success("Data penyewa diperbarui!");
      setShowEdit(null);
      return;
    }
    const { error } = await supabase.from("tenants").update({ nama, no_hp: noHp || null, gender } as any).eq("id", showEdit.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Data penyewa diperbarui!");
    setShowEdit(null);
    refetch();
  };

  const handleDeleteTenant = async (id: string) => {
    if (demo.isDemo) {
      const tenant = tenants.find(t => t.id === id);
      if (tenant?.room_id) demo.updateRoom(tenant.room_id, { status: "kosong" });
      demo.deleteTenant(id);
      toast.success("Penyewa dihapus");
      return;
    }
    const tenant = tenants.find(t => t.id === id);
    if (tenant?.room_id) {
      await supabase.from("rooms").update({ status: "kosong" } as any).eq("id", tenant.room_id);
    }
    const { error } = await supabase.from("tenants").delete().eq("id", id) as any;
    if (error) { toast.error(error.message); return; }
    toast.success("Penyewa dihapus");
    refetch();
  };

  const handleEndContract = async (tenant: Tenant) => {
    if (demo.isDemo) {
      demo.updateTenant(tenant.id, { status: "keluar", tanggal_keluar: new Date().toISOString().split("T")[0] });
      if (tenant.room_id) demo.updateRoom(tenant.room_id, { status: "kosong" });
      toast.success("Kontrak berakhir, penyewa dikeluarkan");
      return;
    }
    setShowEndContract(tenant);
    setDeductionNote("");
    const { data } = await supabase.from("deposits").select("*").eq("tenant_id", tenant.id).eq("status", "ditahan").single() as any;
    if (data) {
      setDepositInfo(data);
      setReturnAmount(String(data.jumlah));
    } else {
      setDepositInfo(null);
      setReturnAmount("0");
    }
  };

  const handleConfirmEndContract = async () => {
    if (!showEndContract) return;
    await supabase.from("tenants").update({ status: "keluar", tanggal_keluar: new Date().toISOString().split("T")[0] } as any).eq("id", showEndContract.id);
    if (showEndContract.room_id) {
      await supabase.from("rooms").update({ status: "kosong" } as any).eq("id", showEndContract.room_id);
    }
    if (depositInfo) {
      await supabase.from("deposits").update({
        status: "dikembalikan",
        jumlah_dikembalikan: parseInt(returnAmount) || 0,
        catatan_potongan: deductionNote || null,
        tanggal_kembali: new Date().toISOString().split("T")[0],
      } as any).eq("id", depositInfo.id);
    }
    toast.success("Kontrak berakhir, penyewa dikeluarkan");
    setShowEndContract(null); setDepositInfo(null);
    refetch();
  };

  return (
    <AppShell>
      <PageHeader title="Penyewa" subtitle={`${tenants.filter(t => t.status === "aktif").length} penyewa aktif`} action={
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={16} className="mr-1" /> Tambah</Button>
      } />
      <div className="px-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari penyewa..." className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {tabsList.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >{tab}</button>
          ))}
        </div>
        {loading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Tidak ada penyewa" description="Tambahkan penyewa pertama Anda" />
        ) : (
          filtered.map((t, i) => {
            const initials = getInitials(t.nama);
            const avatarColor = getAvatarColor(t.nama);
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.15 }}
                className="bg-card rounded-xl border border-border p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: avatarColor.bg, color: avatarColor.fg }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{t.nama}</p>
                        <p className="text-sm text-muted-foreground">{t.roomLabel}</p>
                        {t.sisaHari !== undefined && t.status === "aktif" && (
                          <p className={`text-xs mt-1 ${t.sisaHari <= 30 ? "text-[hsl(38,92%,50%)]" : "text-muted-foreground"}`}>
                            {t.sisaHari > 0 ? `${t.sisaHari} hari lagi` : "Kontrak habis"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <StatusBadge status={t.latestTxStatus} />
                        {t.no_hp && (
                          <a href={`https://wa.me/${t.no_hp.replace(/^0/, "62")}`} target="_blank" rel="noreferrer"
                            className="w-8 h-8 rounded-full bg-[hsl(142,71%,45%)]/10 flex items-center justify-center">
                            <MessageCircle size={16} className="text-[hsl(142,71%,45%)]" />
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
                              <MoreVertical size={16} className="text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setShowEdit(t);
                              setNama(t.nama);
                              setNoHp(t.no_hp || "");
                              setGender(t.gender);
                            }}>
                              <Pencil size={14} className="mr-2" /> Edit
                            </DropdownMenuItem>
                            {t.status === "aktif" && (
                              <DropdownMenuItem onClick={() => handleEndContract(t)}>
                                <Trash2 size={14} className="mr-2" /> Akhiri Sewa
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: t.id, name: t.nama })}>
                              <Trash2 size={14} className="mr-2" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add tenant */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Penyewa">
        <form onSubmit={handleAdd} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Nama</Label><Input value={nama} onChange={e => setNama(e.target.value)} required /></div>
            <div className="space-y-2"><Label>No. HP</Label><Input value={noHp} onChange={e => setNoHp(e.target.value)} placeholder="08123456789" /></div>
            <div className="space-y-2"><Label>Gender</Label>
            <Select value={gender} onValueChange={setGender}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Kamar</Label>
            <Select value={roomId} onValueChange={setRoomId}><SelectTrigger><SelectValue placeholder="Pilih kamar kosong" /></SelectTrigger><SelectContent>
              {emptyRooms.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.room_type?.nama} - No. {r.nomor} (Lt. {r.lantai})</SelectItem>)}
            </SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Tanggal Masuk</Label><Input type="date" value={tanggalMasuk} onChange={e => setTanggalMasuk(e.target.value)} /></div>
            <div className="space-y-2"><Label>Durasi (bulan)</Label>
              <Select value={durasi} onValueChange={setDurasi}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {[1, 3, 6, 12].map(d => <SelectItem key={d} value={String(d)}>{d} bulan</SelectItem>)}
              </SelectContent></Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Deposit (Rp)</Label><Input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="0 (opsional)" /></div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full">Tambah Penyewa</Button>
          </div>
        </form>
      </BottomSheet>

      {/* Edit tenant */}
      <BottomSheet open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Penyewa">
        {showEdit && (
          <form onSubmit={handleEditTenant} className="bottom-sheet-form">
            <div className="bottom-sheet-body">
              <div className="space-y-2"><Label>Nama</Label><Input value={nama} onChange={e => setNama(e.target.value)} required /></div>
              <div className="space-y-2"><Label>No. HP</Label><Input value={noHp} onChange={e => setNoHp(e.target.value)} placeholder="08123456789" /></div>
              <div className="space-y-2"><Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select>
            </div>
            </div>
            <div className="bottom-sheet-footer">
              <Button type="submit" className="w-full">Simpan Perubahan</Button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* End contract */}
      <BottomSheet open={!!showEndContract} onClose={() => setShowEndContract(null)} title="Akhiri Sewa">
        {showEndContract && (
          <div className="bottom-sheet-form">
            <div className="bottom-sheet-body">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">{showEndContract.nama}</p>
                <p className="text-xs text-muted-foreground">{showEndContract.roomLabel}</p>
              </div>
              {depositInfo && (
                <>
                  <div className="space-y-2">
                    <Label>Deposit Ditahan: {formatRupiah(depositInfo.jumlah)}</Label>
                    <Label>Jumlah Dikembalikan (Rp)</Label>
                    <Input type="number" value={returnAmount} onChange={e => setReturnAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan Potongan</Label>
                    <Input value={deductionNote} onChange={e => setDeductionNote(e.target.value)} placeholder="Contoh: kerusakan AC" />
                  </div>
                </>
              )}
            </div>
            <div className="bottom-sheet-footer">
              <Button onClick={handleConfirmEndContract} className="w-full" variant="destructive">Konfirmasi Akhiri Sewa</Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDeleteTenant(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.name || ""}
      />
    </AppShell>
  );
}
