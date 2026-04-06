import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { formatRupiah } from "@/lib/helpers";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const FASILITAS_OPTIONS = ["AC", "TV", "Lemari", "Kamar Mandi Dalam", "WiFi", "Air Panas", "Parkir Motor"];

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
}

export default function KamarPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddRooms, setShowAddRooms] = useState<string | null>(null);

  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [fasilitas, setFasilitas] = useState<string[]>([]);
  const [prefix, setPrefix] = useState("");
  const [startNum, setStartNum] = useState("1");
  const [count, setCount] = useState("5");
  const [lantai, setLantai] = useState("1");

  const fetchData = async () => {
    if (demo.isDemo) {
      const mapped: RoomType[] = demo.roomTypes.map(rt => ({
        ...rt,
        rooms: demo.rooms.filter(r => r.room_type_id === rt.id),
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
    const mapped: RoomType[] = (types || []).map((t: any) => ({
      ...t,
      rooms: rooms.filter((r: any) => r.room_type_id === t.id),
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
    else { toast.success("Tipe kamar ditambahkan!"); setShowAdd(false); setNama(""); setHarga(""); setFasilitas([]); fetchData(); }
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
                <button className="w-full p-4 flex items-center justify-between" onClick={() => setExpanded(isExpanded ? null : rt.id)}>
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
                          <div key={room.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                room.status === "terisi"
                                  ? "bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)]"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {room.nomor}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-foreground">Kamar {room.nomor}</span>
                                <p className="text-[10px] text-muted-foreground">Lantai {room.lantai}</p>
                              </div>
                            </div>
                            <Badge className={`text-[10px] border-0 ${
                              room.status === "terisi"
                                ? "bg-[hsl(142,71%,45%)] text-white"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {room.status === "terisi" ? "Terisi" : "Kosong"}
                            </Badge>
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
    </AppShell>
  );
}
