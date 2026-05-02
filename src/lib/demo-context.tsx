import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ─── Types ───
export interface DemoProperty {
  id: string;
  nama_kos: string;
  alamat: string | null;
}

export interface DemoRoomType {
  id: string;
  property_id: string;
  nama: string;
  harga_per_bulan: number;
}

export interface DemoRoom {
  id: string;
  room_type_id: string;
  nomor: string;
  lantai: number;
  status: "kosong" | "terisi";
}

export interface DemoTenant {
  id: string;
  property_id: string;
  room_id: string | null;
  nama: string;
  no_hp: string | null;
  email?: string | null;
  jatuh_tempo_hari?: number | null;
  gender: "L" | "P";
  tanggal_masuk: string;
  tanggal_keluar: string | null;
  status: "aktif" | "keluar";
}

export interface DemoTransaction {
  id: string;
  tenant_id: string;
  property_id: string;
  periode_bulan: number;
  periode_tahun: number;
  total_tagihan: number;
  jumlah_dibayar: number;
  status: "belum_bayar" | "belum_lunas" | "lunas";
  metode_bayar: string | null;
  tanggal_bayar: string | null;
  catatan: string | null;
  nota_number: string | null;
  created_at: string;
  is_overdue?: boolean;
  overdue_days?: number;
}

export interface DemoExpense {
  id: string;
  property_id: string;
  judul: string;
  kategori: string;
  jumlah: number;
  tanggal: string;
  is_recurring: boolean;
}

export interface DemoDeposit {
  id: string;
  tenant_id: string;
  property_id: string;
  jumlah: number;
  jumlah_dikembalikan: number;
  status: "ditahan" | "dikembalikan";
  catatan_potongan: string | null;
  tanggal_kembali: string | null;
}

// ─── Seed Data ───
const PID = "prop-1";

const PROPERTY: DemoProperty = {
  id: PID,
  nama_kos: "Kos Lawyer",
  alamat: "Komplek Tarakanita",
};

const ROOM_TYPES: DemoRoomType[] = [
  { id: "rt-1", property_id: PID, nama: "Standar", harga_per_bulan: 1200000 },
  { id: "rt-2", property_id: PID, nama: "Deluxe", harga_per_bulan: 1800000 },
  { id: "rt-3", property_id: PID, nama: "Suite", harga_per_bulan: 2500000 },
];

const ROOMS: DemoRoom[] = [
  { id: "rm-1", room_type_id: "rt-1", nomor: "A1", lantai: 1, status: "terisi" },
  { id: "rm-2", room_type_id: "rt-1", nomor: "A2", lantai: 1, status: "terisi" },
  { id: "rm-3", room_type_id: "rt-1", nomor: "A3", lantai: 1, status: "kosong" },
  { id: "rm-4", room_type_id: "rt-1", nomor: "A4", lantai: 1, status: "terisi" },
  { id: "rm-5", room_type_id: "rt-1", nomor: "A5", lantai: 1, status: "kosong" },
  { id: "rm-6", room_type_id: "rt-2", nomor: "B1", lantai: 2, status: "terisi" },
  { id: "rm-7", room_type_id: "rt-2", nomor: "B2", lantai: 2, status: "terisi" },
  { id: "rm-8", room_type_id: "rt-2", nomor: "B3", lantai: 2, status: "kosong" },
  { id: "rm-9", room_type_id: "rt-2", nomor: "B4", lantai: 2, status: "terisi" },
  { id: "rm-10", room_type_id: "rt-3", nomor: "C1", lantai: 3, status: "terisi" },
  { id: "rm-11", room_type_id: "rt-3", nomor: "C2", lantai: 3, status: "terisi" },
  { id: "rm-12", room_type_id: "rt-3", nomor: "C3", lantai: 3, status: "kosong" },
];

const TENANTS: DemoTenant[] = [
  { id: "tn-1", property_id: PID, room_id: "rm-1", nama: "Budi Santoso", no_hp: "081234567890", gender: "L", tanggal_masuk: "2025-10-01", tanggal_keluar: "2026-10-01", status: "aktif", jatuh_tempo_hari: 1 },
  { id: "tn-2", property_id: PID, room_id: "rm-2", nama: "Siti Rahayu", no_hp: "082198765432", gender: "P", tanggal_masuk: "2025-11-15", tanggal_keluar: "2026-05-15", status: "aktif", jatuh_tempo_hari: 15 },
  { id: "tn-3", property_id: PID, room_id: "rm-4", nama: "Ahmad Fauzi", no_hp: "085312345678", gender: "L", tanggal_masuk: "2026-01-01", tanggal_keluar: "2026-07-01", status: "aktif", jatuh_tempo_hari: 1 },
  { id: "tn-4", property_id: PID, room_id: "rm-6", nama: "Dewi Lestari", no_hp: "087812345678", gender: "P", tanggal_masuk: "2025-09-01", tanggal_keluar: "2026-09-01", status: "aktif", jatuh_tempo_hari: 1 },
  { id: "tn-5", property_id: PID, room_id: "rm-7", nama: "Rizky Pratama", no_hp: "081387654321", gender: "L", tanggal_masuk: "2026-02-01", tanggal_keluar: "2026-08-01", status: "aktif", jatuh_tempo_hari: 1 },
  { id: "tn-6", property_id: PID, room_id: "rm-9", nama: "Nurul Hidayah", no_hp: "089912345678", gender: "P", tanggal_masuk: "2025-12-01", tanggal_keluar: "2026-06-01", status: "aktif", jatuh_tempo_hari: 1 },
  { id: "tn-7", property_id: PID, room_id: "rm-10", nama: "Fajar Ramadhan", no_hp: "081567890123", gender: "L", tanggal_masuk: "2026-01-15", tanggal_keluar: "2027-01-15", status: "aktif", jatuh_tempo_hari: 15 },
  { id: "tn-8", property_id: PID, room_id: "rm-11", nama: "Anisa Putri", no_hp: "082345678901", gender: "P", tanggal_masuk: "2025-08-01", tanggal_keluar: "2026-08-01", status: "aktif", jatuh_tempo_hari: 1 },
  { id: "tn-9", property_id: PID, room_id: null, nama: "Doni Saputra", no_hp: "081298765432", gender: "L", tanggal_masuk: "2025-03-01", tanggal_keluar: "2025-09-01", status: "keluar", jatuh_tempo_hari: 1 },
];

const now = new Date();
const bulanIni = now.getMonth() + 1;
const tahunIni = now.getFullYear();
const bulanLalu = bulanIni === 1 ? 12 : bulanIni - 1;
const tahunLalu = bulanIni === 1 ? tahunIni - 1 : tahunIni;
const mm = String(bulanIni).padStart(2, "0");
const mmL = String(bulanLalu).padStart(2, "0");

const TRANSACTIONS: DemoTransaction[] = [
  { id: "tx-1", tenant_id: "tn-1", property_id: PID, periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1200000, jumlah_dibayar: 1200000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunIni}-${mm}-05`, catatan: null, nota_number: `NOTA-${tahunIni}${mm}-0001`, created_at: `${tahunIni}-${mm}-01`, is_overdue: false, overdue_days: 0 },
  { id: "tx-2", tenant_id: "tn-2", property_id: PID, periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1200000, jumlah_dibayar: 600000, status: "belum_lunas", metode_bayar: "tunai", tanggal_bayar: `${tahunIni}-${mm}-10`, catatan: "Bayar setengah dulu", nota_number: null, created_at: `${tahunIni}-${mm}-01`, is_overdue: false, overdue_days: 0 },
  { id: "tx-3", tenant_id: "tn-3", property_id: PID, periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1200000, jumlah_dibayar: 1200000, status: "lunas", metode_bayar: "qris", tanggal_bayar: `${tahunIni}-${mm}-03`, catatan: null, nota_number: `NOTA-${tahunIni}${mm}-0002`, created_at: `${tahunIni}-${mm}-01`, is_overdue: false, overdue_days: 0 },
  { id: "tx-4", tenant_id: "tn-4", property_id: PID, periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1800000, jumlah_dibayar: 1800000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunIni}-${mm}-02`, catatan: null, nota_number: `NOTA-${tahunIni}${mm}-0003`, created_at: `${tahunIni}-${mm}-01`, is_overdue: false, overdue_days: 0 },
  { id: "tx-5", tenant_id: "tn-5", property_id: PID, periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1800000, jumlah_dibayar: 0, status: "belum_bayar", metode_bayar: null, tanggal_bayar: null, catatan: null, nota_number: null, created_at: `${tahunIni}-${mm}-01`, is_overdue: true, overdue_days: 12 },
  { id: "tx-6", tenant_id: "tn-6", property_id: PID, periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1800000, jumlah_dibayar: 1800000, status: "lunas", metode_bayar: "tunai", tanggal_bayar: `${tahunIni}-${mm}-01`, catatan: null, nota_number: `NOTA-${tahunIni}${mm}-0004`, created_at: `${tahunIni}-${mm}-01`, is_overdue: false, overdue_days: 0 },
  { id: "tx-7", tenant_id: "tn-7", property_id: PID, periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 2500000, jumlah_dibayar: 2500000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunIni}-${mm}-04`, catatan: null, nota_number: `NOTA-${tahunIni}${mm}-0005`, created_at: `${tahunIni}-${mm}-01`, is_overdue: false, overdue_days: 0 },
  { id: "tx-8", tenant_id: "tn-8", property_id: PID, periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 2500000, jumlah_dibayar: 0, status: "belum_bayar", metode_bayar: null, tanggal_bayar: null, catatan: null, nota_number: null, created_at: `${tahunIni}-${mm}-01`, is_overdue: true, overdue_days: 12 },
  { id: "tx-9", tenant_id: "tn-1", property_id: PID, periode_bulan: bulanLalu, periode_tahun: tahunLalu, total_tagihan: 1200000, jumlah_dibayar: 1200000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunLalu}-${mmL}-05`, catatan: null, nota_number: "NOTA-001", created_at: `${tahunLalu}-${mmL}-01`, is_overdue: false, overdue_days: 0 },
  { id: "tx-10", tenant_id: "tn-4", property_id: PID, periode_bulan: bulanLalu, periode_tahun: tahunLalu, total_tagihan: 1800000, jumlah_dibayar: 1800000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunLalu}-${mmL}-03`, catatan: null, nota_number: "NOTA-002", created_at: `${tahunLalu}-${mmL}-01`, is_overdue: false, overdue_days: 0 },
  { id: "tx-11", tenant_id: "tn-7", property_id: PID, periode_bulan: bulanLalu, periode_tahun: tahunLalu, total_tagihan: 2500000, jumlah_dibayar: 2500000, status: "lunas", metode_bayar: "qris", tanggal_bayar: `${tahunLalu}-${mmL}-02`, catatan: null, nota_number: "NOTA-003", created_at: `${tahunLalu}-${mmL}-01`, is_overdue: false, overdue_days: 0 },
];

const EXPENSES: DemoExpense[] = [
  { id: "exp-1", property_id: PID, judul: "Bayar Listrik", kategori: "Listrik", jumlah: 850000, tanggal: `${tahunIni}-${mm}-08`, is_recurring: true },
  { id: "exp-2", property_id: PID, judul: "Bayar Air PDAM", kategori: "Air/PDAM", jumlah: 350000, tanggal: `${tahunIni}-${mm}-10`, is_recurring: true },
  { id: "exp-3", property_id: PID, judul: "Internet Bulanan", kategori: "Internet/WiFi", jumlah: 500000, tanggal: `${tahunIni}-${mm}-05`, is_recurring: true },
  { id: "exp-4", property_id: PID, judul: "Gaji Kebersihan", kategori: "Kebersihan", jumlah: 600000, tanggal: `${tahunIni}-${mm}-01`, is_recurring: true },
  { id: "exp-5", property_id: PID, judul: "Perbaikan Pipa Kamar B3", kategori: "Perbaikan/Renovasi", jumlah: 250000, tanggal: `${tahunIni}-${mm}-12`, is_recurring: false },
  { id: "exp-6", property_id: PID, judul: "Keamanan Bulanan", kategori: "Keamanan", jumlah: 300000, tanggal: `${tahunIni}-${mm}-01`, is_recurring: true },
];

const DEPOSITS: DemoDeposit[] = [
  { id: "dep-1", tenant_id: "tn-1", property_id: PID, jumlah: 1200000, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null },
  { id: "dep-2", tenant_id: "tn-2", property_id: PID, jumlah: 1200000, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null },
  { id: "dep-3", tenant_id: "tn-3", property_id: PID, jumlah: 1200000, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null },
  { id: "dep-4", tenant_id: "tn-4", property_id: PID, jumlah: 1800000, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null },
  { id: "dep-5", tenant_id: "tn-5", property_id: PID, jumlah: 1800000, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null },
  { id: "dep-6", tenant_id: "tn-6", property_id: PID, jumlah: 1800000, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null },
  { id: "dep-7", tenant_id: "tn-7", property_id: PID, jumlah: 2500000, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null },
  { id: "dep-8", tenant_id: "tn-8", property_id: PID, jumlah: 2500000, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null },
  { id: "dep-9", tenant_id: "tn-9", property_id: PID, jumlah: 1200000, jumlah_dikembalikan: 1200000, status: "dikembalikan", catatan_potongan: null, tanggal_kembali: "2025-09-01" },
];

let _demoIdCounter = 100;
const genId = (prefix: string) => `${prefix}-${++_demoIdCounter}`;

// ─── Context ───
interface DemoContextType {
  isDemo: boolean;
  setIsDemo: (v: boolean) => void;
  property: DemoProperty;
  roomTypes: DemoRoomType[];
  rooms: DemoRoom[];
  tenants: DemoTenant[];
  transactions: DemoTransaction[];
  expenses: DemoExpense[];
  deposits: DemoDeposit[];
  addTenant: (t: Omit<DemoTenant, "id">) => string;
  updateTenant: (id: string, updates: Partial<DemoTenant>) => void;
  deleteTenant: (id: string) => void;
  addRoom: (r: Omit<DemoRoom, "id">) => void;
  updateRoom: (id: string, updates: Partial<DemoRoom>) => void;
  deleteRoom: (id: string) => void;
  addRoomType: (rt: Omit<DemoRoomType, "id">) => void;
  updateRoomType: (id: string, updates: Partial<DemoRoomType>) => void;
  deleteRoomType: (id: string) => void;
  addTransaction: (tx: Omit<DemoTransaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<DemoTransaction>) => void;
  deleteTransaction: (id: string) => void;
  addExpense: (e: Omit<DemoExpense, "id">) => string;
  updateExpense: (id: string, updates: Partial<DemoExpense>) => void;
  deleteExpense: (id: string) => void;
  addDeposit: (d: Omit<DemoDeposit, "id">) => string;
  updateDeposit: (id: string, updates: Partial<DemoDeposit>) => void;
  deleteDeposit: (id: string) => void;
  // Atomic helpers (mirror RPCs)
  demoAddTenantAtomic: (params: {
    roomId: string;
    nama: string;
    noHp: string | null;
    email?: string | null;
    jatuhTempoHari?: number;
    gender: "L" | "P";
    tanggalMasuk: string;
    tanggalKeluar: string;
    depositAmount: number;
  }) => string;
  demoEndContractAtomic: (params: {
    tenantId: string;
    depositAction: "full" | "partial" | "forfeit" | "none";
    returnAmount: number;
    deductionNote: string;
  }) => void;
  demoDeleteTenantAtomic: (tenantId: string) => void;
}

const DemoContext = createContext<DemoContextType>({} as DemoContextType);

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemoState] = useState(() => {
    return sessionStorage.getItem("kospintar_demo") === "true";
  });

  const setIsDemo = useCallback((v: boolean) => {
    setIsDemoState(v);
    if (v) sessionStorage.setItem("kospintar_demo", "true");
    else sessionStorage.removeItem("kospintar_demo");
  }, []);

  const [tenants, setTenants] = useState<DemoTenant[]>(TENANTS);
  const [rooms, setRooms] = useState<DemoRoom[]>(ROOMS);
  const [roomTypes, setRoomTypes] = useState<DemoRoomType[]>(ROOM_TYPES);
  const [transactions, setTransactions] = useState<DemoTransaction[]>(TRANSACTIONS);
  const [expenses, setExpenses] = useState<DemoExpense[]>(EXPENSES);
  const [deposits, setDeposits] = useState<DemoDeposit[]>(DEPOSITS);

  // --- Basic CRUD ---
  const addTenant = useCallback((t: Omit<DemoTenant, "id">) => {
    const id = genId("tn");
    setTenants(prev => [{ ...t, id }, ...prev]);
    return id;
  }, []);
  const updateTenant = useCallback((id: string, updates: Partial<DemoTenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);
  const deleteTenant = useCallback((id: string) => {
    // Clean up associated deposits and transactions when deleting a tenant
    setDeposits(prev => prev.filter(d => d.tenant_id !== id));
    setTransactions(prev => prev.filter(tx => tx.tenant_id !== id));
    setTenants(prev => prev.filter(t => t.id !== id));
  }, []);

  const addRoom = useCallback((r: Omit<DemoRoom, "id">) => {
    setRooms(prev => [...prev, { ...r, id: genId("rm") }]);
  }, []);
  const updateRoom = useCallback((id: string, updates: Partial<DemoRoom>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);
  const deleteRoom = useCallback((id: string) => {
    // When deleting a room, also clean up all tenants and their associated data
    const room = rooms.find(r => r.id === id);
    if (room) {
      // Find all tenants in this room
      const tenantsInRoom = tenants.filter(t => t.room_id === id);

      // Delete all their data (deposits, transactions, reminders)
      const tenantIds = tenantsInRoom.map(t => t.id);
      setDeposits(prev => prev.filter(d => !tenantIds.includes(d.tenant_id)));
      setTransactions(prev => prev.filter(tx => !tenantIds.includes(tx.tenant_id)));
      setTenants(prev => prev.filter(t => t.room_id !== id));
    }

    // Delete the room
    setRooms(prev => prev.filter(r => r.id !== id));
  }, [rooms, tenants]);

  const addRoomType = useCallback((rt: Omit<DemoRoomType, "id">) => {
    setRoomTypes(prev => [...prev, { ...rt, id: genId("rt") }]);
  }, []);
  const updateRoomType = useCallback((id: string, updates: Partial<DemoRoomType>) => {
    setRoomTypes(prev => prev.map(rt => rt.id === id ? { ...rt, ...updates } : rt));
  }, []);
  const deleteRoomType = useCallback((id: string) => {
    // When deleting a room type, cascade delete rooms of that type and their tenants' data
    const roomsOfType = rooms.filter(r => r.room_type_id === id);
    const roomIds = roomsOfType.map(r => r.id);

    // Find all tenants in these rooms
    const tenantsInRooms = tenants.filter(t => t.room_id && roomIds.includes(t.room_id));
    const tenantIds = tenantsInRooms.map(t => t.id);

    // Delete cascade
    setDeposits(prev => prev.filter(d => !tenantIds.includes(d.tenant_id)));
    setTransactions(prev => prev.filter(tx => !tenantIds.includes(tx.tenant_id)));
    setTenants(prev => prev.filter(t => !tenantIds.includes(t.id)));
    setRooms(prev => prev.filter(r => r.room_type_id !== id));
    setRoomTypes(prev => prev.filter(rt => rt.id !== id));
  }, [rooms, tenants]);

  const addTransaction = useCallback((tx: Omit<DemoTransaction, "id">) => {
    setTransactions(prev => [{ ...tx, id: genId("tx") }, ...prev]);
  }, []);
  const updateTransaction = useCallback((id: string, updates: Partial<DemoTransaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  }, []);
  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const addExpense = useCallback((e: Omit<DemoExpense, "id">) => {
    const id = genId("exp");
    setExpenses(prev => [{ ...e, id }, ...prev]);
    return id;
  }, []);
  const updateExpense = useCallback((id: string, updates: Partial<DemoExpense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const addDeposit = useCallback((d: Omit<DemoDeposit, "id">) => {
    const id = genId("dep");
    setDeposits(prev => [...prev, { ...d, id }]);
    return id;
  }, []);
  const updateDeposit = useCallback((id: string, updates: Partial<DemoDeposit>) => {
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);
  const deleteDeposit = useCallback((id: string) => {
    setDeposits(prev => prev.filter(d => d.id !== id));
  }, []);

  // --- Atomic helpers (mirrors DB RPCs) ---
  const demoAddTenantAtomic = useCallback((params: {
    roomId: string;
    nama: string;
    noHp: string | null;
    email?: string | null;
    jatuhTempoHari?: number;
    gender: "L" | "P";
    tanggalMasuk: string;
    tanggalKeluar: string;
    depositAmount: number;
  }) => {
    const tenantId = genId("tn");
    const masuk = new Date(params.tanggalMasuk);

    // Find room price
    const room = rooms.find(r => r.id === params.roomId);
    const rt = room ? roomTypes.find(t => t.id === room.room_type_id) : null;
    const harga = rt?.harga_per_bulan || 0;

    // Insert tenant
    setTenants(prev => [{ id: tenantId, property_id: PID, room_id: params.roomId, nama: params.nama, no_hp: params.noHp, email: params.email ?? null, jatuh_tempo_hari: params.jatuhTempoHari ?? 1, gender: params.gender, tanggal_masuk: params.tanggalMasuk, tanggal_keluar: params.tanggalKeluar, status: "aktif" }, ...prev]);

    // Update room
    setRooms(prev => prev.map(r => r.id === params.roomId ? { ...r, status: "terisi" as const } : r));

    // Create transaction
    setTransactions(prev => [{ id: genId("tx"), tenant_id: tenantId, property_id: PID, periode_bulan: masuk.getMonth() + 1, periode_tahun: masuk.getFullYear(), total_tagihan: harga, jumlah_dibayar: 0, status: "belum_bayar", metode_bayar: null, tanggal_bayar: null, catatan: null, nota_number: null, created_at: new Date().toISOString() }, ...prev]);

    // Create deposit
    if (params.depositAmount > 0) {
      setDeposits(prev => [...prev, { id: genId("dep"), tenant_id: tenantId, property_id: PID, jumlah: params.depositAmount, jumlah_dikembalikan: 0, status: "ditahan", catatan_potongan: null, tanggal_kembali: null }]);
    }

    return tenantId;
  }, [rooms, roomTypes]);

  const demoEndContractAtomic = useCallback((params: {
    tenantId: string;
    depositAction: "full" | "partial" | "forfeit" | "none";
    returnAmount: number;
    deductionNote: string;
  }) => {
    const today = new Date().toISOString().split("T")[0];
    const tenant = tenants.find(t => t.id === params.tenantId);
    if (!tenant) return;

    // Update tenant
    setTenants(prev => prev.map(t => t.id === params.tenantId ? { ...t, status: "keluar" as const, tanggal_keluar: today, room_id: null } : t));

    // Free room
    if (tenant.room_id) {
      setRooms(prev => prev.map(r => r.id === tenant.room_id ? { ...r, status: "kosong" as const } : r));
    }

    // Handle deposit
    const deposit = deposits.find(d => d.tenant_id === params.tenantId && d.status === "ditahan");
    if (deposit && params.depositAction !== "none") {
      if (params.depositAction === "full") {
        setDeposits(prev => prev.map(d => d.id === deposit.id ? { ...d, status: "dikembalikan" as const, jumlah_dikembalikan: deposit.jumlah, tanggal_kembali: today } : d));
        setExpenses(prev => [{ id: genId("exp"), property_id: PID, judul: `Pengembalian deposit - ${tenant.nama}`, kategori: "Pengembalian Deposit", jumlah: deposit.jumlah, tanggal: today, is_recurring: false }, ...prev]);
      } else if (params.depositAction === "partial") {
        setDeposits(prev => prev.map(d => d.id === deposit.id ? { ...d, status: "dikembalikan" as const, jumlah_dikembalikan: params.returnAmount, catatan_potongan: params.deductionNote || null, tanggal_kembali: today } : d));
        if (params.returnAmount > 0) {
          setExpenses(prev => [{ id: genId("exp"), property_id: PID, judul: `Pengembalian deposit - ${tenant.nama}`, kategori: "Pengembalian Deposit", jumlah: params.returnAmount, tanggal: today, is_recurring: false }, ...prev]);
        }
      } else if (params.depositAction === "forfeit") {
        setDeposits(prev => prev.map(d => d.id === deposit.id ? { ...d, status: "dikembalikan" as const, jumlah_dikembalikan: 0, catatan_potongan: `Deposit hangus - ${params.deductionNote || "tidak ada alasan"}`, tanggal_kembali: today } : d));
      }
    }
  }, [tenants, deposits]);

  const demoDeleteTenantAtomic = useCallback((tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);

    // Free room
    if (tenant?.room_id) {
      setRooms(prev => prev.map(r => r.id === tenant.room_id ? { ...r, status: "kosong" as const } : r));
    }

    // Delete related
    setDeposits(prev => prev.filter(d => d.tenant_id !== tenantId));
    setTransactions(prev => prev.filter(tx => tx.tenant_id !== tenantId));
    setTenants(prev => prev.filter(t => t.id !== tenantId));
  }, [tenants]);

  return (
    <DemoContext.Provider value={{
      isDemo, setIsDemo,
      property: PROPERTY,
      roomTypes, rooms, tenants, transactions, expenses, deposits,
      addTenant, updateTenant, deleteTenant,
      addRoom, updateRoom, deleteRoom,
      addRoomType, updateRoomType, deleteRoomType,
      addTransaction, updateTransaction, deleteTransaction,
      addExpense, updateExpense, deleteExpense,
      addDeposit, updateDeposit, deleteDeposit,
      demoAddTenantAtomic, demoEndContractAtomic, demoDeleteTenantAtomic,
    }}>
      {children}
    </DemoContext.Provider>
  );
}
