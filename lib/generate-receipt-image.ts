export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  options?: Record<string, unknown>;
  extras?: { name: string; price: number; quantity?: number }[];
}

export interface ReceiptData {
  storeName?: string;
  orderNumber: number;
  table?: string;
  paymentMethod: string;
  timestamp: Date;
  items: ReceiptItem[];
  discountAmount?: number | null;
  discountName?: string | null;
  total: number;
  cancellationReason?: string | null;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function generateReceiptDataUrl(data: ReceiptData): string {
  const {
    storeName = 'BrewFlow',
    orderNumber,
    table,
    paymentMethod,
    timestamp,
    items,
    discountAmount,
    discountName,
    total,
    cancellationReason,
  } = data;

  const SCALE = 2;
  const W = 360;
  const PAD = 20;
  const LINE = 26;
  const ITEM_MAX_W = W - PAD * 2 - 80;

  // ── First pass: measure height ──────────────────────────────────────────────
  const scratchCanvas = document.createElement('canvas');
  scratchCanvas.width = W * SCALE;
  scratchCanvas.height = 10;
  const scratchCtx = scratchCanvas.getContext('2d')!;
  scratchCtx.scale(SCALE, SCALE);
  scratchCtx.font = '13px system-ui, sans-serif';

  let estimatedH = PAD + 30 + 12 + 24 + 26 + 20 + 16; // header + order info + divider
  for (const item of items) {
    const nameLines = wrapText(scratchCtx, `${item.quantity}x ${item.name}`, ITEM_MAX_W);
    estimatedH += nameLines.length * LINE;

    if (item.options) {
      const optEntries = Object.entries(item.options).filter(
        ([k]) => k !== 'tag' && k !== 'bundleLabel' && k !== '__optionIds'
      );
      estimatedH += optEntries.length * 18;
    }
    if (item.extras?.length) {
      estimatedH += item.extras.length * 18;
    }
    estimatedH += 8;
  }
  estimatedH += 16; // divider after items
  if (discountAmount && discountAmount > 0) estimatedH += LINE * 2;
  estimatedH += 40 + 22 + 20 + PAD; // total + payment + footer + bottom padding
  if (cancellationReason) estimatedH += 14 + LINE * 2; // divider + label + reason

  // ── Real canvas ─────────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = estimatedH * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, estimatedH);

  let y = PAD;

  // ── Store name ──────────────────────────────────────────────────────────────
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.fillText(storeName, W / 2, y + 18);
  y += 30;

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('RECEIPT', W / 2, y + 11);
  y += 22;

  // ── Dashed divider ──────────────────────────────────────────────────────────
  ctx.strokeStyle = '#d1d5db';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 14;

  // ── Order info row ──────────────────────────────────────────────────────────
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#374151';
  ctx.textAlign = 'left';
  ctx.fillText(`Order #${String(orderNumber).padStart(4, '0')}`, PAD, y + 12);

  ctx.textAlign = 'right';
  const dateStr = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  ctx.fillText(dateStr, W - PAD, y + 12);
  y += LINE;

  if (table) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Table: ${table}`, PAD, y + 12);
    y += LINE;
  }

  // ── Solid divider ───────────────────────────────────────────────────────────
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 14;

  // ── Items ───────────────────────────────────────────────────────────────────
  for (const item of items) {
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#111827';

    const nameLabel = `${item.quantity}x ${item.name}`;
    const nameLines = wrapText(ctx, nameLabel, ITEM_MAX_W);

    // Price on first line
    ctx.textAlign = 'right';
    ctx.fillText(`₱${(item.price * item.quantity).toFixed(2)}`, W - PAD, y + 13);

    // Name (possibly multi-line)
    ctx.textAlign = 'left';
    for (let i = 0; i < nameLines.length; i++) {
      ctx.fillText(nameLines[i], PAD, y + 13 + i * LINE);
    }
    y += nameLines.length * LINE;

    // Options
    if (item.options) {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#6b7280';
      for (const [k, v] of Object.entries(item.options)) {
        if (k === 'tag' || k === 'bundleLabel' || k === '__optionIds') continue;
        ctx.fillText(`  ${k}: ${v}`, PAD + 8, y + 11);
        y += 18;
      }
    }

    // Extras
    if (item.extras?.length) {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#9333ea';
      for (const ex of item.extras) {
        const qty = ex.quantity && ex.quantity > 1 ? `${ex.quantity}x ` : '';
        ctx.fillText(`  + ${qty}${ex.name}`, PAD + 8, y + 11);
        ctx.textAlign = 'right';
        ctx.fillText(`₱${(ex.price * (ex.quantity || 1)).toFixed(2)}`, W - PAD, y + 11);
        ctx.textAlign = 'left';
        y += 18;
      }
    }

    y += 8;
  }

  // ── Dashed divider ──────────────────────────────────────────────────────────
  ctx.strokeStyle = '#d1d5db';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 14;

  // ── Discount ────────────────────────────────────────────────────────────────
  if (discountAmount && discountAmount > 0) {
    const subtotal = total + discountAmount;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'left'; ctx.fillText('Subtotal', PAD, y + 12);
    ctx.textAlign = 'right'; ctx.fillText(`₱${subtotal.toFixed(2)}`, W - PAD, y + 12);
    y += LINE;

    ctx.fillStyle = '#16a34a';
    ctx.textAlign = 'left'; ctx.fillText(`Discount (${discountName || 'Applied'})`, PAD, y + 12);
    ctx.textAlign = 'right'; ctx.fillText(`-₱${discountAmount.toFixed(2)}`, W - PAD, y + 12);
    y += LINE;
  }

  // ── Total ───────────────────────────────────────────────────────────────────
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillStyle = '#D95D1E';
  ctx.textAlign = 'left'; ctx.fillText('TOTAL', PAD, y + 20);
  ctx.textAlign = 'right'; ctx.fillText(`₱${total.toFixed(2)}`, W - PAD, y + 20);
  y += 38;

  // ── Payment ─────────────────────────────────────────────────────────────────
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'left'; ctx.fillText(`Payment: ${paymentMethod}`, PAD, y + 12);
  y += 22;

  // ── Cancellation reason ──────────────────────────────────────────────────────
  if (cancellationReason) {
    ctx.strokeStyle = '#fca5a5';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    ctx.setLineDash([]);
    y += 14;

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'left';
    ctx.fillText('ORDER CANCELLED', PAD, y + 11);
    y += LINE;

    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#374151';
    const reasonLines = wrapText(ctx, `Reason: ${cancellationReason}`, W - PAD * 2);
    for (const line of reasonLines) {
      ctx.fillText(line, PAD, y + 12);
      y += LINE;
    }
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'center';
  ctx.fillText('Thank you for your order!', W / 2, y + 12);

  return canvas.toDataURL('image/png');
}
