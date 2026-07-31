import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface ChallanItemForPdf {
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
}

interface ChallanForPdf {
  challanNumber: string;
  status: string;
  createdAt: Date;
  totalQuantity: number;
  customer: { name: string; businessName: string | null; mobile: string; address: string | null; gstNumber: string | null };
  createdBy: { name: string };
  items: ChallanItemForPdf[];
}

/**
 * Streams a PDF invoice/challan directly to the HTTP response.
 * Bonus feature: "Export invoice as PDF".
 */
export function streamChallanPdf(res: Response, challan: ChallanForPdf) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${challan.challanNumber}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text('Sales Challan / Invoice', { align: 'center' });
  doc.moveDown();

  doc.fontSize(11);
  doc.text(`Challan No: ${challan.challanNumber}`);
  doc.text(`Date: ${challan.createdAt.toDateString()}`);
  doc.text(`Status: ${challan.status}`);
  doc.text(`Created By: ${challan.createdBy.name}`);
  doc.moveDown();

  doc.fontSize(13).text('Bill To', { underline: true });
  doc.fontSize(11);
  doc.text(`${challan.customer.name}${challan.customer.businessName ? ' (' + challan.customer.businessName + ')' : ''}`);
  doc.text(`Mobile: ${challan.customer.mobile}`);
  if (challan.customer.address) doc.text(`Address: ${challan.customer.address}`);
  if (challan.customer.gstNumber) doc.text(`GST: ${challan.customer.gstNumber}`);
  doc.moveDown();

  doc.fontSize(13).text('Items', { underline: true });
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colX = { name: 50, sku: 220, price: 340, qty: 420, total: 480 };
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Product', colX.name, tableTop);
  doc.text('SKU', colX.sku, tableTop);
  doc.text('Price', colX.price, tableTop);
  doc.text('Qty', colX.qty, tableTop);
  doc.text('Total', colX.total, tableTop);
  doc.moveDown(0.5);
  doc.font('Helvetica');

  let grandTotal = 0;
  let y = doc.y;
  challan.items.forEach((item) => {
    const lineTotal = Number(item.unitPriceSnapshot) * item.quantity;
    grandTotal += lineTotal;
    doc.text(item.productNameSnapshot, colX.name, y, { width: 160 });
    doc.text(item.productSkuSnapshot, colX.sku, y, { width: 110 });
    doc.text(Number(item.unitPriceSnapshot).toFixed(2), colX.price, y);
    doc.text(String(item.quantity), colX.qty, y);
    doc.text(lineTotal.toFixed(2), colX.total, y);
    y = doc.y + 8;
    doc.y = y;
  });

  doc.moveDown();
  doc.font('Helvetica-Bold').text(`Total Quantity: ${challan.totalQuantity}`, { align: 'right' });
  doc.text(`Grand Total: Rs. ${grandTotal.toFixed(2)}`, { align: 'right' });

  doc.moveDown(2);
  doc.font('Helvetica').fontSize(9).text('This is a system-generated document from the ERP + CRM Operations Portal.', { align: 'center' });

  doc.end();
}
