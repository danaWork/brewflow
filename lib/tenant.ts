/**
 * Parse request host to determine tenant context: admin vs shop subdomain.
 * Used by middleware and auth to scope login and routes.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'brewflow.com';
const RESERVED = new Set(['admin', 'www', 'app', 'api']);

export type TenantType = 'admin' | 'shop';

export interface TenantInfo {
  type: TenantType;
  subdomain?: string;
}

/**
 * Get tenant info from host string (e.g. from request.nextUrl.host).
 * - admin.brewflow.com or brewflow.com or www.brewflow.com → type: 'admin'
 * - shopA.brewflow.com → type: 'shop', subdomain: 'shopa'
 * - localhost / 127.0.0.1 → type: 'admin' (no subdomain routing in dev unless configured)
 */
export function getTenantFromHost(host: string): TenantInfo {
  if (!host) return { type: 'admin' };

  const hostLower = host.toLowerCase().split(':')[0]; // strip port

  if (hostLower === 'localhost' || hostLower === '127.0.0.1') {
    return { type: 'admin' };
  }

  // e.g. shopA.localhost or hq.localhost (development)
  if (hostLower.endsWith('.localhost')) {
    const sub = hostLower.replace('.localhost', '').split('.')[0] ?? '';
    if (sub && !RESERVED.has(sub)) {
      return { type: 'shop', subdomain: sub };
    }
    return { type: 'admin' };
  }

  const root = ROOT_DOMAIN.toLowerCase();
  if (!hostLower.endsWith(root)) {
    return { type: 'admin' };
  }

  const base = hostLower.slice(0, -root.length).replace(/\.$/, '');
  if (!base) {
    return { type: 'admin' };
  }

  const subdomain = base.split('.').pop() ?? '';
  if (RESERVED.has(subdomain)) {
    return { type: 'admin' };
  }

  return { type: 'shop', subdomain };
}

/**
 * Get the root domain for building shop URLs (e.g. in UI).
 */
export function getRootDomain(): string {
  return ROOT_DOMAIN;
}
