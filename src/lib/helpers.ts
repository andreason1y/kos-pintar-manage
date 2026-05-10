export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRupiahCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} Miliar`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} Jt`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
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


/**
 * Safely add months to a date, clamping to the last day of the target month
 * to avoid overflow (e.g., Jan 31 + 1 month = Feb 28, not Mar 3).
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // If the day overflowed (e.g., 31 Jan + 1 month → 3 Mar instead of 28 Feb),
  // set to last day of the intended target month
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0); // sets to last day of previous month
  }
  return result;
}
