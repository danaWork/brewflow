import type { PrintResult } from '@/lib/bluetooth-thermal-print';

function toBase64(bytes: Uint8Array): string {
  // Browser-safe base64 encoding for Uint8Array
  let binary = '';
  const chunkSize = 0x8000; // prevent call stack limits
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function wifiPrint(receiptBytes: Uint8Array): Promise<PrintResult> {
  try {
    const res = await fetch('/api/print-receipt', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bytes: toBase64(receiptBytes) }),
    });

    if (res.ok) return { ok: true };

    // Try to surface a useful error string for UI to map/handle
    let reason = `http_${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (typeof data?.error === 'string' && data.error.trim()) reason = data.error.trim();
    } catch {
      // ignore
    }

    return { ok: false, reason };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: msg || 'request_failed' };
  }
}

