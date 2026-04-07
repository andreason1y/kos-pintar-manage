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
  fasilitas: string[];
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

// ─── Seed Data ───
const PROPERTY: DemoProperty = {
  id: "prop-1",
  nama_kos: "Kos Harmoni Residence",
  alamat: "Jl. Harmoni No. 45, Jakarta Pusat",
};

const ROOM_TYPES: DemoRoomType[] = [
  { id: "rt-1", property_id: "prop-1", nama: "Standar", harga_per_bulan: 1200000, fasilitas: ["WiFi", "Lemari", "Parkir Motor"] },
  { id: "rt-2", property_id: "prop-1", nama: "Deluxe", harga_per_bulan: 1800000, fasilitas: ["AC", "WiFi", "Kamar Mandi Dalam", "Lemari", "TV"] },
  { id: "rt-3", property_id: "prop-1", nama: "Suite", harga_per_bulan: 2500000, fasilitas: ["AC", "WiFi", "Kamar Mandi Dalam", "Lemari", "TV", "Air Panas", "Parkir Motor"] },
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
  { id: "tn-1", property_id: "prop-1", room_id: "rm-1", nama: "Budi Santoso", no_hp: "081234567890", gender: "L", tanggal_masuk: "2025-10-01", tanggal_keluar: "2026-10-01", status: "aktif" },
  { id: "tn-2", property_id: "prop-1", room_id: "rm-2", nama: "Siti Rahayu", no_hp: "082198765432", gender: "P", tanggal_masuk: "2025-11-15", tanggal_keluar: "2026-05-15", status: "aktif" },
  { id: "tn-3", property_id: "prop-1", room_id: "rm-4", nama: "Ahmad Fauzi", no_hp: "085312345678", gender: "L", tanggal_masuk: "2026-01-01", tanggal_keluar: "2026-07-01", status: "aktif" },
  { id: "tn-4", property_id: "prop-1", room_id: "rm-6", nama: "Dewi Lestari", no_hp: "087812345678", gender: "P", tanggal_masuk: "2025-09-01", tanggal_keluar: "2026-09-01", status: "aktif" },
  { id: "tn-5", property_id: "prop-1", room_id: "rm-7", nama: "Rizky Pratama", no_hp: "081387654321", gender: "L", tanggal_masuk: "2026-02-01", tanggal_keluar: "2026-08-01", status: "aktif" },
  { id: "tn-6", property_id: "prop-1", room_id: "rm-9", nama: "Nurul Hidayah", no_hp: "089912345678", gender: "P", tanggal_masuk: "2025-12-01", tanggal_keluar: "2026-06-01", status: "aktif" },
  { id: "tn-7", property_id: "prop-1", room_id: "rm-10", nama: "Fajar Ramadhan", no_hp: "081567890123", gender: "L", tanggal_masuk: "2026-01-15", tanggal_keluar: "2027-01-15", status: "aktif" },
  { id: "tn-8", property_id: "prop-1", room_id: "rm-11", nama: "Anisa Putri", no_hp: "082345678901", gender: "P", tanggal_masuk: "2025-08-01", tanggal_keluar: "2026-08-01", status: "aktif" },
  { id: "tn-9", property_id: "prop-1", room_id: null, nama: "Doni Saputra", no_hp: "081298765432", gender: "L", tanggal_masuk: "2025-03-01", tanggal_keluar: "2025-09-01", status: "keluar" },
];

const now = new Date();
const bulanIni = now.getMonth() + 1;
const tahunIni = now.getFullYear();
const bulanLalu = bulanIni === 1 ? 12 : bulanIni - 1;
const tahunLalu = bulanIni === 1 ? tahunIni - 1 : tahunIni;

const TRANSACTIONS: DemoTransaction[] = [
  { id: "tx-1", tenant_id: "tn-1", property_id: "prop-1", periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1200000, jumlah_dibayar: 1200000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-05`, catatan: null, nota_number: `NOTA-${tahunIni}${String(bulanIni).padStart(2,"0")}-0001`, created_at: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01` },
  { id: "tx-2", tenant_id: "tn-2", property_id: "prop-1", periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1200000, jumlah_dibayar: 600000, status: "belum_lunas", metode_bayar: "tunai", tanggal_bayar: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-10`, catatan: "Bayar setengah dulu", nota_number: null, created_at: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01` },
  { id: "tx-3", tenant_id: "tn-3", property_id: "prop-1", periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1200000, jumlah_dibayar: 1200000, status: "lunas", metode_bayar: "qris", tanggal_bayar: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-03`, catatan: null, nota_number: `NOTA-${tahunIni}${String(bulanIni).padStart(2,"0")}-0002`, created_at: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01` },
  { id: "tx-4", tenant_id: "tn-4", property_id: "prop-1", periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1800000, jumlah_dibayar: 1800000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-02`, catatan: null, nota_number: `NOTA-${tahunIni}${String(bulanIni).padStart(2,"0")}-0003`, created_at: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01` },
  { id: "tx-5", tenant_id: "tn-5", property_id: "prop-1", periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1800000, jumlah_dibayar: 0, status: "belum_bayar", metode_bayar: null, tanggal_bayar: null, catatan: null, nota_number: null, created_at: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01` },
  { id: "tx-6", tenant_id: "tn-6", property_id: "prop-1", periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 1800000, jumlah_dibayar: 1800000, status: "lunas", metode_bayar: "tunai", tanggal_bayar: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01`, catatan: null, nota_number: `NOTA-${tahunIni}${String(bulanIni).padStart(2,"0")}-0004`, created_at: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01` },
  { id: "tx-7", tenant_id: "tn-7", property_id: "prop-1", periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 2500000, jumlah_dibayar: 2500000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-04`, catatan: null, nota_number: `NOTA-${tahunIni}${String(bulanIni).padStart(2,"0")}-0005`, created_at: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01` },
  { id: "tx-8", tenant_id: "tn-8", property_id: "prop-1", periode_bulan: bulanIni, periode_tahun: tahunIni, total_tagihan: 2500000, jumlah_dibayar: 0, status: "belum_bayar", metode_bayar: null, tanggal_bayar: null, catatan: null, nota_number: null, created_at: `${tahunIni}-${String(bulanIni).padStart(2,"0")}-01` },
  { id: "tx-9", tenant_id: "tn-1", property_id: "prop-1", periode_bulan: bulanLalu, periode_tahun: tahunLalu, total_tagihan: 1200000, jumlah_dibayar: 1200000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunLalu}-${String(bulanLalu).padStart(2,"0")}-05`, catatan: null, nota_number: "NOTA-001", created_at: `${tahunLalu}-${String(bulanLalu).padStart(2,"0")}-01` },
  { id: "tx-10", tenant_id: "tn-4", property_id: "prop-1", periode_bulan: bulanLalu, periode_tahun: tahunLalu, total_tagihan: 1800000, jumlah_dibayar: 1800000, status: "lunas", metode_bayar: "transfer", tanggal_bayar: `${tahunLalu}-${String(bulanLalu).padStart(2,"0")}-03`, catatan: null, nota_number: "NOTA-002", created_at: `${tahunLalu}-${String(bulanLalu).padStart(2,"0")}-01` },
  { id: "tx-11", tenant_id: "tn-7", property_id: "prop-1", periode_bulan: bulanLalu, periode_tahun: tahunLalu, total_tagihan: 2500000, jumlah_dibayar: 2500000, status: "lunas", metode_bayar: "qris", tanggal_bayar: `${tahunLalu}-${String(bulanLalu).padStart(2,"0")}-02`, catatan: null, nota_number: "NOTA-003", created_at: `${tahunLalu}-${String(bulanLalu).padStart(2,"0")}-01` },
];

const m = String(bulanIni).padStart(2, "0");
const EXPENSES: DemoExpense[] = [
  { id: "exp-1", property_id: "prop-1", judul: "Bayar Listrik", kategori: "Listrik", jumlah: 850000, tanggal: `${tahunIni}-${m}-08`, is_recurring: true },
  { id: "exp-2", property_id: "prop-1", judul: "Bayar Air PDAM", kategori: "Air/PDAM", jumlah: 350000, tanggal: `${tahunIni}-${m}-10`, is_recurring: true },
  { id: "exp-3", property_id: "prop-1", judul: "Internet Bulanan", kategori: "Internet/WiFi", jumlah: 500000, tanggal: `${tahunIni}-${m}-05`, is_recurring: true },
  { id: "exp-4", property_id: "prop-1", judul: "Gaji Kebersihan", kategori: "Kebersihan", jumlah: 600000, tanggal: `${tahunIni}-${m}-01`, is_recurring: true },
  { id: "exp-5", property_id: "prop-1", judul: "Perbaikan Pipa Kamar B3", kategori: "Perbaikan/Renovasi", jumlah: 250000, tanggal: `${tahunIni}-${m}-12`, is_recurring: false },
  { id: "exp-6", property_id: "prop-1", judul: "Keamanan Bulanan", kategori: "Keamanan", jumlah: 300000, tanggal: `${tahunIni}-${m}-01`, is_recurring: true },
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
  // Mutations
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
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  setIsDemo: () => {},
  property: PROPERTY,
  roomTypes: ROOM_TYPES,
  rooms: ROOMS,
  tenants: TENANTS,
  transactions: TRANSACTIONS,
  expenses: EXPENSES,
  addTenant: () => "",
  updateTenant: () => {},
  deleteTenant: () => {},
  addRoom: () => {},
  updateRoom: () => {},
  deleteRoom: () => {},
  addRoomType: () => {},
  updateRoomType: () => {},
  deleteRoomType: () => {},
  addTransaction: () => {},
  updateTransaction: () => {},
  deleteTransaction: () => {},
  addExpense: () => "",
  updateExpense: () => {},
  deleteExpense: () => {},
});

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemoState] = useState(() => {
    return sessionStorage.getItem("kospintar_demo") === "true";
  });

  const setIsDemo = useCallback((v: boolean) => {
    setIsDemoState(v);
    if (v) {
      sessionStorage.setItem("kospintar_demo", "true");
    } else {
      sessionStorage.removeItem("kospintar_demo");
    }
  }, []);
  const [tenants, setTenants] = useState<DemoTenant[]>(TENANTS);
  const [rooms, setRooms] = useState<DemoRoom[]>(ROOMS);
  const [roomTypes, setRoomTypes] = useState<DemoRoomType[]>(ROOM_TYPES);
  const [transactions, setTransactions] = useState<DemoTransaction[]>(TRANSACTIONS);
  const [expenses, setExpenses] = useState<DemoExpense[]>(EXPENSES);

  // Tenant mutations
  const addTenant = useCallback((t: Omit<DemoTenant, "id">) => {
    const id = genId("tn");
    setTenants(prev => [{ ...t, id }, ...prev]);
    return id;
  }, []);
  const updateTenant = useCallback((id: string, updates: Partial<DemoTenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);
  const deleteTenant = useCallback((id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
  }, []);

  // Room mutations
  const addRoom = useCallback((r: Omit<DemoRoom, "id">) => {
    setRooms(prev => [...prev, { ...r, id: genId("rm") }]);
  }, []);
  const updateRoom = useCallback((id: string, updates: Partial<DemoRoom>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);
  const deleteRoom = useCallback((id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  }, []);

  // Room type mutations
  const addRoomType = useCallback((rt: Omit<DemoRoomType, "id">) => {
    setRoomTypes(prev => [...prev, { ...rt, id: genId("rt") }]);
  }, []);
  const updateRoomType = useCallback((id: string, updates: Partial<DemoRoomType>) => {
    setRoomTypes(prev => prev.map(rt => rt.id === id ? { ...rt, ...updates } : rt));
  }, []);
  const deleteRoomType = useCallback((id: string) => {
    setRoomTypes(prev => prev.filter(rt => rt.id !== id));
  }, []);

  // Transaction mutations
  const addTransaction = useCallback((tx: Omit<DemoTransaction, "id">) => {
    setTransactions(prev => [{ ...tx, id: genId("tx") }, ...prev]);
  }, []);
  const updateTransaction = useCallback((id: string, updates: Partial<DemoTransaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  }, []);
  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  // Expense mutations
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

  return (
    <DemoContext.Provider value={{
      isDemo,
      setIsDemo,
      property: PROPERTY,
      roomTypes,
      rooms,
      tenants,
      transactions,
      expenses,
      addTenant, updateTenant, deleteTenant,
      addRoom, updateRoom, deleteRoom,
      addRoomType, updateRoomType, deleteRoomType,
      addTransaction, updateTransaction, deleteTransaction,
      addExpense, updateExpense, deleteExpense,
    }}>
      {children}
    </DemoContext.Provider>
  );
}
