/**
 * Derive a URL-safe subdomain from a display name.
 * Lowercase, spaces → hyphens, strip non-alphanumeric except hyphen.
 * e.g. "No r limits" → "no-r-limits"
 */
export function slugify(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
}

/** Reserved subdomains that cannot be used for shops */
export const RESERVED_SUBDOMAINS = ['admin', 'www', 'app', 'api'] as const;

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase() as (typeof RESERVED_SUBDOMAINS)[number]);
}

/** Validate subdomain format: lowercase, alphanumeric + hyphen only */
const SUBDOMAIN_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSubdomainFormat(subdomain: string): boolean {
  if (!subdomain || subdomain.length < 2 || subdomain.length > 63) return false;
  return SUBDOMAIN_REGEX.test(subdomain);
}
