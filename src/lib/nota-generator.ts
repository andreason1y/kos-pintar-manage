import html2pdf from "html2pdf.js";
import { formatRupiah, getMonthName } from "./helpers";

interface NotaData {
  propertyName: string;
  notaNumber: string;
  tenantName: string;
  roomNumber: string;
  periodeBulan: number;
  periodeTahun: number;
  totalTagihan: number;
  jumlahDibayar: number;
  metodeBayar: string;
  tanggalBayar: string;
}

function buildNotaHtml(data: NotaData): string {
  const sisa = data.totalTagihan - data.jumlahDibayar;
  const periode = `${getMonthName(data.periodeBulan)} ${data.periodeTahun}`;

  return `
    <div style="font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 28px; color: #1a1a1a;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0D9488;">${data.propertyName}</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Nota Pembayaran Sewa</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; color: #aaa;">Powered by</p>
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0D9488;">KosPintar</p>
        </div>
      </div>

      <div style="border-top: 2px solid #0D9488; margin-bottom: 20px;"></div>

      <table style="width: 100%; font-size: 13px; margin-bottom: 20px;">
        <tr><td style="color: #888; padding: 3px 0; width: 120px;">No. Nota</td><td style="font-weight: 600;">${data.notaNumber}</td></tr>
        <tr><td style="color: #888; padding: 3px 0;">Penyewa</td><td style="font-weight: 600;">${data.tenantName}</td></tr>
        <tr><td style="color: #888; padding: 3px 0;">Kamar</td><td style="font-weight: 600;">${data.roomNumber}</td></tr>
        <tr><td style="color: #888; padding: 3px 0;">Periode</td><td style="font-weight: 600;">${periode}</td></tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
        <thead>
          <tr style="background: #f0fdfa;">
            <th style="text-align: left; padding: 8px 12px; border-bottom: 1px solid #e0e0e0; color: #0D9488; font-weight: 600;">Deskripsi</th>
            <th style="text-align: right; padding: 8px 12px; border-bottom: 1px solid #e0e0e0; color: #0D9488; font-weight: 600;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">Sewa Kamar ${data.roomNumber} — ${periode}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">${formatRupiah(data.totalTagihan)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; padding: 4px 12px; font-size: 13px;">
          <span style="color: #888;">Subtotal</span><span>${formatRupiah(data.totalTagihan)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 12px; font-size: 13px;">
          <span style="color: #888;">Diskon</span><span>Rp0</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 12px; font-size: 14px; font-weight: 700; background: #f0fdfa; border-radius: 6px; margin-top: 4px;">
          <span>Total</span><span style="color: #0D9488;">${formatRupiah(data.totalTagihan)}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #d0d0d0; padding-top: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; padding: 3px 12px; font-size: 13px;">
          <span style="color: #888;">Dibayar</span><span style="font-weight: 600;">${formatRupiah(data.jumlahDibayar)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 12px; font-size: 13px;">
          <span style="color: #888;">Metode</span><span style="font-weight: 600; text-transform: uppercase;">${data.metodeBayar}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 12px; font-size: 13px;">
          <span style="color: #888;">Tanggal Bayar</span><span style="font-weight: 600;">${data.tanggalBayar}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 12px; font-size: 13px;">
          <span style="color: #888;">Sisa</span><span style="font-weight: 700; color: ${sisa === 0 ? '#0D9488' : '#ef4444'};">${formatRupiah(sisa)}</span>
        </div>
      </div>

      <div style="text-align: center; padding: 16px; background: #f0fdfa; border-radius: 8px; font-size: 13px; color: #555;">
        Terima kasih telah membayar tepat waktu 🙏
      </div>
    </div>
  `;
}

export function downloadNota(data: NotaData) {
  const html = buildNotaHtml(data);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  html2pdf()
    .set({
      margin: 0,
      filename: `${data.notaNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: [110, 200], orientation: "portrait" },
    })
    .from(container)
    .save()
    .then(() => {
      document.body.removeChild(container);
    });
}

export function getNotaWhatsAppLink(data: NotaData, phone: string): string {
  const sisa = data.totalTagihan - data.jumlahDibayar;
  const periode = `${getMonthName(data.periodeBulan)} ${data.periodeTahun}`;
  const text = `📄 *NOTA PEMBAYARAN*\n${data.notaNumber}\n\n🏠 ${data.propertyName}\n👤 ${data.tenantName}\n🚪 Kamar ${data.roomNumber}\n📅 Periode: ${periode}\n\n💰 Total: ${formatRupiah(data.totalTagihan)}\n✅ Dibayar: ${formatRupiah(data.jumlahDibayar)}\n📋 Sisa: ${formatRupiah(sisa)}\n💳 Metode: ${data.metodeBayar.toUpperCase()}\n📆 Tanggal: ${data.tanggalBayar}\n\nTerima kasih! 🙏`;
  const cleanPhone = phone.replace(/^0/, "62");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
