import { ClipboardList, Wallet, Home, FileText, BarChart3, Bell } from "lucide-react";

export const FEATURES = [
  { icon: ClipboardList, title: "Data Penyewa Terpusat", desc: "Semua data penyewa, kontrak, dan riwayat bayar dalam satu tempat." },
  { icon: Wallet, title: "Tagihan Otomatis", desc: "Tagihan di-generate tiap bulan. Tinggal 1 klik kirim ke WA penyewa." },
  { icon: Home, title: "Pantau Kamar Real-time", desc: "Status kosong/terisi langsung terlihat tanpa cek fisik ke lokasi." },
  { icon: FileText, title: "Nota PDF Instan", desc: "Generate nota pembayaran profesional, langsung kirim via WhatsApp." },
  { icon: BarChart3, title: "Laporan Keuangan", desc: "Pemasukan, pengeluaran, dan laba bersih dihitung otomatis tiap bulan." },
  { icon: Bell, title: "Notifikasi Jatuh Tempo", desc: "Dapat reminder saat tagihan jatuh tempo — langsung kirim WA 1 klik." },
];

export const PAIN_POINTS = [
  { before: "Catat di buku tulis / Excel", after: "Dashboard digital real-time" },
  { before: "Lupa tagih penyewa", after: "Notifikasi + kirim WA 1 klik" },
  { before: "Hitung keuangan manual tiap bulan", after: "Laporan otomatis 1 klik" },
  { before: "Cek kamar harus ke lokasi", after: "Pantau dari HP kapan saja" },
  { before: "Nota tulis tangan", after: "Nota PDF profesional instan" },
];

export const COMPARISON: { feature: string; kp: string | boolean; sk: string | boolean }[] = [
  { feature: "Harga Starter (10 kamar)", kp: "Rp 12rb/bln", sk: "Rp 600k-1.2jt/bln" },
  { feature: "Harga Pro (25 kamar)", kp: "Rp 21rb/bln", sk: "Rp 1.5jt-3jt/bln" },
  { feature: "Harga Bisnis (60 kamar)", kp: "Rp 42rb/bln", sk: "Rp 3.6jt-7.2jt/bln" },
  { feature: "Manajemen penyewa", kp: true, sk: true },
  { feature: "Nota PDF", kp: true, sk: true },
  { feature: "Kirim tagihan WA 1 klik", kp: true, sk: true },
  { feature: "Notifikasi jatuh tempo ke owner", kp: true, sk: false },
  { feature: "Laporan keuangan + export PDF", kp: true, sk: false },
  { feature: "Harga flat bukan per kamar", kp: true, sk: false },
  { feature: "Tanpa biaya tersembunyi", kp: true, sk: false },
  { feature: "Tidak terikat marketplace", kp: true, sk: false },
];

export const DEFAULT_FAQS = [
  { q: "Apakah data saya aman?", a: "Ya. Data disimpan di server terenkripsi dengan standar enterprise. Hanya Anda yang bisa mengakses data kos Anda." },
  { q: "Apa beda paket Starter, Pro, dan Bisnis?", a: "Perbedaannya di jumlah kamar: Starter (10 kamar, Rp 12rb/bln), Pro (25 kamar, Rp 21rb/bln), Bisnis (60 kamar, Rp 42rb/bln). Semua fitur tersedia di semua paket." },
  { q: "Apakah ada biaya tambahan per kamar?", a: "Tidak. Harga flat — mau 1 kamar atau maksimal paket, bayarnya sama." },
  { q: "Bagaimana cara perpanjang langganan?", a: "Notifikasi dikirim sebelum masa aktif habis. Perpanjang langsung dari dalam aplikasi." },
  { q: "Apakah bisa dicoba dulu?", a: "Ya. Tersedia mode demo tanpa daftar — langsung coba semua fitur." },
  { q: "Berapa lama proses setup?", a: "Kurang dari 5 menit. Daftar, buat properti, tambah kamar — langsung pakai." },
];

export const DEFAULT_TESTIMONIALS = [
  { quote: "Dulu saya pakai buku tulis. Sekarang tinggal buka HP, semua data penyewa dan tagihan sudah rapi. Hemat waktu banget.", name: "Pak Hendra S.", kos: "12 kamar, Bandung", stars: 5 },
  { quote: "Penyewa saya jadi lebih disiplin bayar karena dapat reminder WA otomatis. Saya tidak perlu nagih manual lagi.", name: "Bu Ratna W.", kos: "18 kamar, Yogyakarta", stars: 5 },
  { quote: "Nota PDF langsung ke WA itu game changer. Penyewa merasa diurus secara profesional, saya juga terlihat lebih kredibel.", name: "Pak Doni A.", kos: "8 kamar, Surabaya", stars: 5 },
];

export const SCREENSHOTS = [
  { label: "Dashboard", src: "/screenshots/beranda.png" },
  { label: "Kamar", src: "/screenshots/kamar.png" },
  { label: "Penyewa", src: "/screenshots/penyewa.png" },
  { label: "Keuangan", src: "/screenshots/keuangan.png" },
  { label: "Tagihan", src: "/screenshots/pembayaran.png" },
];

export const TEXT_DEFAULTS: Record<string, string> = {
  earlybird_label: "Early Bird — Hemat 50%",
  starter_sublabel: "",
  pro_sublabel: "",
  bisnis_sublabel: "",
  starter_earlybird_badge: "Early Bird",
  pro_earlybird_badge: "Early Bird",
  bisnis_earlybird_badge: "Early Bird",
  announcement_banner_text: "Early Bird Terbatas — Hemat 50% untuk {slots} pendaftar",
  pricing_footer_text: "Harga early bird untuk {total} pendaftar pertama. Dibayar per tahun.",
  hero_headline: "Kelola kos-kosan tanpa ribet.",
  hero_subheadline: "Tagihan otomatis. Kirim WA 1 klik. Laporan keuangan. Semua dalam satu aplikasi.",
  hero_subtext: "Dibangun khusus untuk pemilik kos Indonesia yang ingin berhenti dari buku tulis dan spreadsheet.",
  footer_tagline: "Software manajemen kos-kosan untuk pemilik properti Indonesia.",
  contact_wa: "62818477620",
  contact_email: "hello@kospintar.id",
  app_version: "2.0.0",
};

export const DEFAULTS = {
  mandiri_price_normal: 299000,
  mandiri_price_earlybird: 149000,
  juragan_price_normal: 499000,
  juragan_price_earlybird: 249000,
  earlybird_active: 1,
  earlybird_slots_total: 100,
  early_bird_slots_taken: 0,
  announcement_banner_active: 1,
  maintenance_mode: 0,
};
