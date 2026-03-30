/**
 * Thermal receipt content and ESC/POS encoding for Bluetooth printers.
 * Receipt width: 48 characters (80mm paper).
 */

const WIDTH = 48;
const SEP = '-'.repeat(WIDTH);

export interface ReceiptOrderItem {
  name: string;
  price: number;
  quantity: number;
  options?: Record<string, unknown>;
  extras?: { name: string; price: number; quantity: number }[];
}

export interface ReceiptOrder {
  orderNumber: number;
  items: ReceiptOrderItem[];
  total: number;
  table: string;
  paymentMethod: string;
  timestamp: Date;
  discountAmount?: number;
  discountName?: string | null;
  note?: string;
  cancellationReason?: string | null;
}

export interface BuildReceiptOptions {
  storeName?: string;
}

function padCenter(text: string, width: number): string {
  const len = text.length;
  if (len >= width) return text.slice(0, width);
  const pad = Math.floor((width - len) / 2);
  return ' '.repeat(pad) + text + ' '.repeat(width - len - pad);
}

function padRight(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + ' '.repeat(width - text.length);
}

/**
 * Build receipt as plain text (for debugging or alternative use).
 */
export function buildReceiptText(
  order: ReceiptOrder,
  options?: BuildReceiptOptions
): string {
  const storeName =
    options?.storeName ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_RECEIPT_STORE_NAME) ||
    'BrewFlow';
  const lines: string[] = [];
  lines.push(padCenter(storeName.toUpperCase(), WIDTH));
  lines.push(SEP);
  lines.push(padCenter(`Order #${String(order.orderNumber).padStart(4, '0')}`, WIDTH));
  const date = order.timestamp;
  const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  lines.push(padCenter(`${dateStr}  ${timeStr}`, WIDTH));
  lines.push(padCenter(`Table: ${order.table}`, WIDTH));
  lines.push(SEP);

  for (const item of order.items) {
    const nameLine = item.name.length > WIDTH ? item.name.slice(0, WIDTH - 1) : item.name;
    lines.push(nameLine);
    const qty = item.quantity;
    const unit = item.price.toFixed(2);
    const lineTotal = (item.price * item.quantity).toFixed(2);
    const detail = `  ${qty} x ${unit} = ${lineTotal}`;
    lines.push(padRight(detail, WIDTH));
    const discountLabel = (item.options as any)?.itemDiscount?.label;
    if (typeof discountLabel === 'string' && discountLabel.trim()) {
      lines.push(padRight(`  Discount: ${discountLabel.trim()}`, WIDTH));
    }
    if (item.extras?.length) {
      for (const ex of item.extras) {
        const exName = `  + ${ex.name}`.slice(0, WIDTH);
        lines.push(exName);
        const exDetail = `    ${ex.quantity} x ${ex.price.toFixed(2)} = ${(ex.price * ex.quantity).toFixed(2)}`;
        lines.push(padRight(exDetail, WIDTH));
      }
    }
  }

  lines.push(SEP);
  if (order.discountAmount && order.discountAmount > 0) {
    const subtotalLine = `Subtotal PHP ${(order.total + order.discountAmount).toFixed(2)}`;
    lines.push(padRight(subtotalLine, WIDTH));
    const discountName = order.discountName || 'Discount';
    const discountLine = `${discountName} -PHP ${order.discountAmount.toFixed(2)}`;
    lines.push(padRight(discountLine, WIDTH));
    lines.push(SEP);
  }

  const totalLine = `TOTAL    PHP ${order.total.toFixed(2)}`;
  lines.push(padRight(totalLine, WIDTH));
  lines.push(`Payment: ${order.paymentMethod}`);
  if (order.note) {
    lines.push(SEP);
    lines.push(`Note: ${order.note}`);
  }
  if (order.cancellationReason) {
    lines.push(SEP);
    lines.push('** ORDER CANCELLED **');
    lines.push(`Reason: ${order.cancellationReason}`);
  }
  lines.push(SEP);
  lines.push(padCenter('Thank you!', WIDTH));
  lines.push(SEP);
  return lines.join('\n');
}

// ESC/POS commands (decimal)
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function escInit(): number[] {
  return [ESC, 0x40]; // ESC @ - Initialize
}

function escAlign(align: 0 | 1 | 2): number[] {
  return [ESC, 0x61, align]; // ESC a n - 0 left, 1 center, 2 right
}

function escDoubleHeight(on: boolean): number[] {
  return [GS, 0x21, on ? 0x10 : 0]; // GS ! n - double height bit
}

function lineFeed(n: number = 1): number[] {
  return Array(n).fill(LF);
}

function textToBytes(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c <= 0xff) bytes.push(c);
    else bytes.push(0x3f); // '?' for non-ASCII
  }
  return bytes;
}

function cut(): number[] {
  return [GS, 0x56, 0]; // GS V 0 - partial cut (some printers use 1 for full)
}

/**
 * Convert receipt text to ESC/POS byte array for thermal printer.
 */
export function buildEscPosBytes(receiptText: string): Uint8Array {
  const lines = receiptText.split('\n');
  const out: number[] = [];

  out.push(...escInit());
  out.push(...escAlign(1));
  out.push(...escDoubleHeight(true));
  out.push(...textToBytes(lines[0]));
  out.push(...lineFeed(1));
  out.push(...escDoubleHeight(false));
  out.push(...lineFeed(1));

  out.push(...escAlign(0));
  for (let i = 1; i < lines.length; i++) {
    out.push(...textToBytes(lines[i]));
    out.push(...lineFeed(1));
  }

  out.push(...lineFeed(3));
  out.push(...cut());

  return new Uint8Array(out);
}

/**
 * Build receipt and return ESC/POS bytes ready to send to printer.
 */
export function buildReceiptEscPos(
  order: ReceiptOrder,
  options?: BuildReceiptOptions
): Uint8Array {
  const text = buildReceiptText(order, options);
  return buildEscPosBytes(text);
}

/**
 * Order item shape from POS/OrderContext (name, price, quantity, optional extras).
 */
export interface PosOrderItem {
  name: string;
  price: number;
  quantity: number;
  options?: Record<string, unknown>;
  extras?: { name: string; price: number; quantity?: number }[];
}

/**
 * Order shape from POS/OrderContext for receipt printing.
 */
export interface PosOrderForReceipt {
  orderNumber: number;
  items: PosOrderItem[];
  total: number;
  table: string;
  paymentMethod: string;
  timestamp: Date;
  discountAmount?: number;
  discountName?: string | null;
  note?: string;
  cancellationReason?: string | null;
}

/**
 * Convert POS/context order to ReceiptOrder and return ESC/POS bytes.
 */
export function buildReceiptEscPosFromOrder(
  order: PosOrderForReceipt,
  options?: BuildReceiptOptions
): Uint8Array {
  const receiptOrder: ReceiptOrder = {
    orderNumber: order.orderNumber,
    total: order.total,
    table: order.table,
    paymentMethod: order.paymentMethod,
    timestamp: order.timestamp instanceof Date ? order.timestamp : new Date(order.timestamp),
    discountAmount: order.discountAmount,
    discountName: order.discountName,
    note: order.note,
    cancellationReason: order.cancellationReason,
    items: order.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      options: item.options,
      extras: item.extras?.map((ex) => ({
        name: ex.name,
        price: ex.price,
        quantity: ex.quantity ?? 1,
      })),
    })),
  };
  return buildReceiptEscPos(receiptOrder, options);
}
