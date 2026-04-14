import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Room {
  id: string;
  nomor: number;
  lantai: number;
  room_type?: { nama: string };
}

interface PenyewaFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    nama: string;
    no_hp: string | null;
    email?: string | null;
    room_id: string | null;
    jatuh_tempo?: number;
    deposit?: number;
    tanggal_masuk?: string;
  };
  emptyRooms?: Room[];
  allRooms?: Room[];
  onSubmit: (data: {
    nama: string;
    no_hp: string | null;
    email: string | null;
    room_id: string;
    tanggal_masuk?: string;
    jatuh_tempo?: number;
    deposit: number;
  }) => void;
}

export default function PenyewaForm({
  mode,
  initialData,
  emptyRooms = [],
  allRooms = [],
  onSubmit,
}: PenyewaFormProps) {
  const [nama, setNama] = useState(initialData?.nama || "");
  const [noHp, setNoHp] = useState(initialData?.no_hp || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [roomId, setRoomId] = useState(initialData?.room_id || "");
  const [tanggalMasuk, setTanggalMasuk] = useState(
    initialData?.tanggal_masuk || new Date().toISOString().split("T")[0]
  );
  const [jatuhTempo, setJatuhTempo] = useState(String(initialData?.jatuh_tempo || ""));
  const [deposit, setDeposit] = useState(String(initialData?.deposit || ""));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomId) {
      alert("Kamar harus dipilih");
      return;
    }

    if (!jatuhTempo) {
      alert("Jatuh tempo harus dipilih");
      return;
    }

    const data = {
      nama,
      no_hp: noHp || null,
      email: email || null,
      room_id: roomId,
      jatuh_tempo: parseInt(jatuhTempo),
      deposit: parseInt(deposit) || 0,
      ...(mode === "create" && { tanggal_masuk: tanggalMasuk }),
    };

    onSubmit(data as any);
  };

  // For edit mode, use allRooms if provided, otherwise use emptyRooms
  const roomsToDisplay = mode === "edit" && allRooms.length > 0 ? allRooms : emptyRooms;

  return (
    <form onSubmit={handleSubmit} className="bottom-sheet-form">
      <div className="bottom-sheet-body">
        {/* Nama */}
        <div className="space-y-2">
          <Label>Nama</Label>
          <Input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            disabled={mode === "edit"}
            required
          />
        </div>

        {/* No. HP */}
        <div className="space-y-2">
          <Label>No. HP</Label>
          <Input
            value={noHp}
            onChange={(e) => setNoHp(e.target.value)}
            placeholder="08123456789"
          />
        </div>

        {/* Kamar */}
        <div className="space-y-2">
          <Label>Kamar</Label>
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kamar kosong" />
            </SelectTrigger>
            <SelectContent>
              {roomsToDisplay.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.room_type?.nama} - No. {r.nomor} (Lt. {r.lantai})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tanggal Masuk - only in create mode */}
        {mode === "create" && (
          <div className="space-y-2">
            <Label>Tanggal Masuk</Label>
            <Input
              type="date"
              value={tanggalMasuk}
              onChange={(e) => setTanggalMasuk(e.target.value)}
            />
          </div>
        )}

        {/* Jatuh Tempo Bayar */}
        <div className="space-y-2">
          <Label>
            Jatuh Tempo Bayar <span className="text-destructive">*</span>
          </Label>
          <Select value={jatuhTempo} onValueChange={setJatuhTempo}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tanggal..." />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Tanggal tagihan otomatis setiap bulannya
          </p>
        </div>

        {/* Deposit */}
        <div className="space-y-2">
          <Label>Deposit (Rp)</Label>
          <Input
            type="number"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="0 (opsional)"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label>Email (opsional)</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="penyewa@email.com"
          />
        </div>
      </div>

      <div className="bottom-sheet-footer">
        <Button type="submit" className="w-full">
          {mode === "create" ? "Tambah Penyewa" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
