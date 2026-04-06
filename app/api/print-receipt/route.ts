import net from 'net';
import { db } from '@/lib/db';
import { branches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserSession } from '@/app/actions/auth';

export const runtime = 'nodejs';

type Body = {
  bytes?: string; // base64-encoded ESC/POS payload
};

async function getPrinterConfigForRequest() {
  const session = await getUserSession();
  if (!session || !session.branchId) {
    return { ok: false as const, status: 401 as const, error: 'Unauthorized' };
  }

  let host: string | null = null;
  let port: number | null = null;
  try {
    const [row] = await db
      .select({ host: branches.printerHost, port: branches.printerPort })
      .from(branches)
      .where(eq(branches.id, session.branchId))
      .limit(1);
    host = row?.host ?? null;
    port = row?.port ?? null;
  } catch {
    // fall back to env vars below
  }

  const envHost = process.env.PRINTER_HOST?.trim() || null;
  const envPortRaw = process.env.PRINTER_PORT?.trim();
  const envPort = envPortRaw ? Number(envPortRaw) : null;

  const resolvedHost = host || envHost;
  const resolvedPort = port ?? (envPort != null && Number.isFinite(envPort) ? envPort : 9100);

  if (!resolvedHost) {
    return { ok: false as const, status: 500 as const, error: 'No printer configured for this branch.' };
  }
  if (!Number.isFinite(resolvedPort) || resolvedPort <= 0 || resolvedPort > 65535) {
    return { ok: false as const, status: 500 as const, error: 'Invalid printer port configuration.' };
  }

  return { ok: true as const, host: resolvedHost, port: Math.trunc(resolvedPort) };
}

async function sendToPrinterTcp(payload: Buffer, host: string, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();

    const fail = (err: unknown) => {
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    socket.setTimeout(8000);
    socket.once('timeout', () => fail(new Error('Printer connection timed out.')));
    socket.once('error', fail);

    socket.connect(port, host, () => {
      socket.write(payload, (err) => {
        if (err) return fail(err);
        socket.end();
      });
    });

    socket.once('close', (hadError) => {
      if (hadError) return;
      resolve();
    });
  });
}

export async function POST(req: Request) {
  const cfg = await getPrinterConfigForRequest();
  if (!cfg.ok) return Response.json({ ok: false, error: cfg.error }, { status: cfg.status });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const b64 = typeof body.bytes === 'string' ? body.bytes.trim() : '';
  if (!b64) {
    return Response.json({ ok: false, error: 'Missing bytes.' }, { status: 400 });
  }

  let payload: Buffer;
  try {
    payload = Buffer.from(b64, 'base64');
  } catch {
    return Response.json({ ok: false, error: 'Invalid base64 bytes.' }, { status: 400 });
  }

  if (!payload.length) {
    return Response.json({ ok: false, error: 'Empty payload.' }, { status: 400 });
  }
  if (payload.length > 256_000) {
    return Response.json({ ok: false, error: 'Payload too large.' }, { status: 413 });
  }

  try {
    await sendToPrinterTcp(payload, cfg.host, cfg.port);
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: msg }, { status: 502 });
  }
}

