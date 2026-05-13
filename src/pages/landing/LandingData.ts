import { ClipboardList, Wallet, Home, FileText, BarChart3, Bell, UserPlus, Zap } from "lucide-react";

export const FEATURES = [
  { icon: ClipboardList, title: "Data Penyewa Terpusat", desc: "Semua data penyewa, kontrak, dan riwayat bayar dalam satu tempat." },
  { icon: Wallet, title: "Tagihan Otomatis", desc: "Tagihan di-generate tiap bulan. Tinggal 1 klik kirim ke WA penyewa." },
  { icon: Home, title: "Pantau Kamar Real-time", desc: "Status kosong/terisi langsung terlihat tanpa cek fisik ke lokasi." },
  { icon: FileText, title: "Nota PDF Instan", desc: "Generate nota pembayaran profesional, langsung kirim via WhatsApp." },
  { icon: BarChart3, title: "Laporan Keuangan", desc: "Pemasukan, pengeluaran, dan laba bersih dihitung otomatis tiap bulan." },
  { icon: Bell, title: "Notifikasi Jatuh Tempo", desc: "Dapat reminder saat tagihan jatuh tempo — langsung kirim WA 1 klik." },
];

export const HOW_IT_WORKS = [
  { step: 1, icon: UserPlus, title: "Daftar & buat profil kos", desc: "Isi nama kos, alamat, dan tipe kamar. Tidak perlu training — langsung paham." },
  { step: 2, icon: Home, title: "Tambah penyewa", desc: "Input data penyewa, kamar, dan tanggal masuk. Deposit otomatis tercatat." },
  { step: 3, icon: Zap, title: "Kelola tanpa ribet", desc: "Tagihan muncul otomatis tiap bulan. Notifikasi jatuh tempo. Kirim WA 1 klik." },
];

export const PAIN_POINTS = [
  { before: "Catat di buku tulis / Excel", after: "Dashboard digital real-time" },
  { before: "Lupa tagih penyewa", after: "Notifikasi + kirim WA 1 klik" },
  { before: "Hitung keuangan manual tiap bulan", after: "Laporan otomatis 1 klik" },
  { before: "Cek kamar harus ke lokasi", after: "Pantau dari HP kapan saja" },
  { before: "Nota tulis tangan", after: "Nota PDF profesional instan" },
];

export const COMPARISON: { feature: string; kp: string | boolean; sk: string | boolean }[] = [
  { feature: "Harga (s.d. 25 kamar)", kp: "Rp 17rb/bln", sk: "Rp 1.5jt-3jt/bln" },
  { feature: "Harga (s.d. 80 kamar)", kp: "Rp 33rb/bln", sk: "Rp 4.8jt-9.6jt/bln" },
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
  { q: "Apakah data kos saya aman?", a: "Ya. Data disimpan di server terenkripsi. Hanya Anda yang bisa mengakses data kos Anda." },
  { q: "Apa bedanya paket Mini, Starter, dan Pro?", a: "Perbedaannya hanya di jumlah kamar: Mini hingga 10 kamar, Starter hingga 25 kamar, Pro hingga 60 kamar. Semua fitur tersedia di setiap paket — tidak ada fitur yang dikunci." },
  { q: "Apakah WA dikirim otomatis ke penyewa?", a: "Bukan otomatis. Anda mendapat notifikasi jatuh tempo, lalu tinggal 1 klik untuk kirim pesan tagihan ke WA penyewa." },
  { q: "Apakah ada biaya per kamar?", a: "Tidak. Harga flat per tahun — mau 1 kamar atau maksimal paket, bayarnya tetap sama." },
  { q: "Bisa dicoba dulu sebelum bayar?", a: "Ya. Ada mode demo yang bisa langsung dicoba tanpa daftar." },
  { q: "Berapa lama setup awal?", a: "Kurang dari 5 menit. Daftar → buat properti → tambah kamar → langsung pakai." },
];

export const DEFAULT_TESTIMONIALS = [
  { quote: "Sekarang tinggal buka HP, semua data penyewa dan tagihan sudah rapi. Gak perlu lagi buka buku tulis.", name: "Pak Hendra S.", kos: "12 kamar, Bandung", stars: 5 },
  { quote: "Sebelum ini saya harus telpon satu-satu untuk nagih penyewa. Sekarang langsung kelihatan siapa yang belum bayar, tinggal klik kirim ke WA. Jauh lebih mudah.", name: "Bu Wulan T.", kos: "20 kamar, Semarang", stars: 5 },
  { quote: "Nota PDF langsung ke WA itu praktis banget. Penyewa merasa diurus profesional.", name: "Pak Doni A.", kos: "8 kamar, Surabaya", stars: 5 },
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
  hero_subtext: "Tagihan otomatis, reminder WA, nota PDF, dan laporan keuangan — semua dalam satu aplikasi.",
  footer_tagline: "Aplikasi manajemen kos-kosan untuk pemilik properti Indonesia. Kelola penyewa, tagihan, dan keuangan dalam satu tempat.",
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
