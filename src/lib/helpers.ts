export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getMonthName(month: number): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return months[month - 1] || "";
}

export function generateNotaNumber(month: number, year: number): string {
  const m = String(month).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `NOTA-${year}${m}-${seq}`;
}

export function waTagihanLink(nama: string, kamar: string, bulan: string, tanggal: string, jumlah: number, hp?: string): string {
  const text = `Halo ${nama}, tagihan sewa bulan ${bulan}:\n\n🏠 Unit: ${kamar}\n📅 Periode: ${tanggal}\n💰 Tagihan: ${formatRupiah(jumlah)}\n\nMohon segera dilunasi. Terima kasih! 🙏`;
  const phone = hp ? hp.replace(/^0/, "62") : "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
