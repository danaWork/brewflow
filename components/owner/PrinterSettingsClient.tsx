'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Save, Printer, Activity } from 'lucide-react';
import { savePrinterConfigAction } from '@/app/actions/owner';
import { wifiPrint } from '@/lib/wifi-thermal-print';

export default function PrinterSettingsClient({
  initialHost,
  initialPort,
}: {
  initialHost: string | null;
  initialPort: number | null;
}) {
  const [host, setHost] = useState(initialHost ?? '');
  const [port, setPort] = useState(initialPort?.toString() ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const parsedPort = useMemo(() => {
    const trimmed = port.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  }, [port]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await savePrinterConfigAction(host, parsedPort);
      if (res.success) toast.success('Printer settings saved');
      else toast.error(res.error || 'Failed to save printer settings');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setIsTesting(true);
    try {
      const enc = new TextEncoder();
      const bytes = enc.encode(`\n*** TEST PRINT ***\n${new Date().toLocaleString()}\n\n\n`);
      const res = await wifiPrint(bytes);
      if (res.ok) toast.success('Test print sent');
      else toast.error('Could not send test print');
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Printer className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Printer</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Printer IP / Hostname</label>
          <input
            type="text"
            placeholder="192.168.1.50"
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is saved per shop (branch). Leave blank to disable printing.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
          <input
            type="number"
            placeholder="9100"
            min={1}
            max={65535}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Most ESC/POS network printers use port 9100.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg shadow-sm text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            <Activity className="w-4 h-4" />
            {isTesting ? 'Testing...' : 'Test print'}
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  );
}

