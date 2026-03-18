/**
 * Web Bluetooth API helpers for sending ESC/POS data to a Bluetooth thermal printer.
 * Requires user gesture to pair; supports reconnection via cached device id.
 */

const THERMAL_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
const THERMAL_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';

const GENERIC_PRINTER_SERVICES = [
  THERMAL_SERVICE_UUID,
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000fee7-0000-1000-8000-00805f9b34fb'
];

const STORAGE_KEY = 'brewflow-bluetooth-printer-id';

// Minimal Web Bluetooth shapes to avoid pulling in full typings
interface BluetoothWriteChar { writeValue(d: Uint8Array): Promise<void>; }
interface BluetoothService { getCharacteristic(u: string): Promise<BluetoothWriteChar>; }
interface BluetoothGattServer { getPrimaryService(u: string): Promise<BluetoothService>; disconnect(): void; }
interface BluetoothDeviceLike { id: string; gatt?: { connect(): Promise<BluetoothGattServer> }; }

// Web Bluetooth API (types simplified for environments without Web Bluetooth typings)
interface NavigatorBluetooth {
  bluetooth?: {
    getAvailability?: () => Promise<boolean>;
    requestDevice: (options: { acceptAllDevices: boolean; optionalServices: string[] }) => Promise<unknown>;
  };
}

export function isBluetoothSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'bluetooth' in (navigator as NavigatorBluetooth);
}

export type PrintResult = { ok: true } | { ok: false; reason: string };

/**
 * Get cached printer device id from localStorage (if any).
 */
function getCachedDeviceId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Cache printer device id for reconnection.
 */
function setCachedDeviceId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

/**
 * Connect to a Bluetooth thermal printer and send receipt bytes.
 * On first use or when cache is invalid, shows the browser's device picker (must be called from user gesture).
 * Returns result so caller can show toast.
 */
export async function connectAndPrint(receiptBytes: Uint8Array): Promise<PrintResult> {
  if (!isBluetoothSupported()) {
    return { ok: false, reason: 'unsupported' };
  }

  const nav = navigator as NavigatorBluetooth;
  if (nav.bluetooth?.getAvailability) {
    const available = await nav.bluetooth.getAvailability();
    if (!available) {
      return { ok: false, reason: 'unavailable' };
    }
  }

  try {
    const raw = await (navigator as NavigatorBluetooth).bluetooth!.requestDevice({
      acceptAllDevices: true,
      optionalServices: GENERIC_PRINTER_SERVICES,
    });
    const device = raw as BluetoothDeviceLike;

    if (!device) {
      return { ok: false, reason: 'cancelled' };
    }

    setCachedDeviceId(device.id);

    const server = await device.gatt?.connect();
    if (!server) {
      return { ok: false, reason: 'connect_failed' };
    }

    let service: BluetoothService | null = null;
    for (const uuid of GENERIC_PRINTER_SERVICES) {
      try {
        service = await server.getPrimaryService(uuid);
        if (service) break;
      } catch (err) {
        // Try the next one
      }
    }

    if (!service) {
      server.disconnect();
      return { ok: false, reason: 'service_not_found' };
    }

    const characteristic = await service.getCharacteristic(THERMAL_CHAR_UUID).catch(() => null);
    if (!characteristic) {
      server.disconnect();
      return { ok: false, reason: 'characteristic_not_found' };
    }

    const chunkSize = 512;
    for (let i = 0; i < receiptBytes.length; i += chunkSize) {
      const chunk = receiptBytes.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
    }

    server.disconnect();
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('cancel') || msg.includes('Cancelled') || msg.includes('User cancelled')) {
      return { ok: false, reason: 'cancelled' };
    }
    if (msg.includes('not found') || msg.includes('GATT')) {
      return { ok: false, reason: 'connect_failed' };
    }
    return { ok: false, reason: 'send_failed' };
  }
}
