'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Copy, Check, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { syncTables, getTables, deleteTable, TableData } from '@/app/actions/tables';
import { getSessionAction } from '@/app/actions/auth';

function ConfirmModal({
  isOpen,
  title,
  message,
  warning,
  confirmText,
  isDestructive,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmText: string;
  isDestructive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-100' : 'bg-amber-100'}`}>
            <AlertTriangle size={20} className={isDestructive ? 'text-red-600' : 'text-amber-600'} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>

        <p className="text-gray-600 mb-2">{message}</p>

        {warning && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{warning}</p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 font-bold rounded-xl transition ${isDestructive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#D95D1E] text-white hover:bg-[#c4541b]'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QRCodesPage() {
  const [branchId, setBranchId] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    warning?: string;
    confirmText: string;
    isDestructive: boolean;
    onConfirm: () => void;
  } | null>(null);

  const qrRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const getBaseUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  }, []);

  useEffect(() => {
    async function init() {
      const session = await getSessionAction();
      if (session?.user?.branchId) {
        setBranchId(session.user.branchId);
        loadExistingTables(session.user.branchId);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadExistingTables = async (bId: string) => {
    setLoading(true);
    const result = await getTables(bId);
    if (result.success && result.tables.length > 0) {
      setTableCount(result.tables.length);
      setInputValue(String(result.tables.length));
      setTables(result.tables);
    } else {
      setTableCount(10);
      setInputValue('10');
      const syncResult = await syncTables(bId, 10);
      if (syncResult.success) {
        setTables(syncResult.tables);
      }
    }
    setLoading(false);
  };

  const handleInputBlur = () => {
    if (!branchId) return;
    const newCount = parseInt(inputValue, 10);
    if (isNaN(newCount) || newCount < 1 || newCount > 50) {
      setInputValue(String(tableCount || tables.length));
      return;
    }

    if (newCount !== tables.length) {
      const currentCount = tables.length;
      const isDecreasing = newCount < currentCount;

      setModalConfig({
        isOpen: true,
        title: isDecreasing ? 'Reduce Tables?' : 'Add Tables?',
        message: `You are changing from ${currentCount} to ${newCount} tables.`,
        warning: isDecreasing
          ? `Warning: Tables will be removed starting from the highest number. Any active orders may be affected.`
          : undefined,
        confirmText: isDecreasing ? 'Remove Tables' : 'Add Tables',
        isDestructive: isDecreasing,
        onConfirm: () => handleChangeTableCount(newCount, currentCount),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const handleChangeTableCount = async (newCount: number, currentCount: number) => {
    if (!branchId) return;
    setModalConfig(null);
    setSyncing(true);

    if (newCount > currentCount) {
      const result = await syncTables(branchId, newCount);
      if (result.success) {
        setTables(result.tables);
        setTableCount(result.tables.length);
        setInputValue(String(result.tables.length));
      }
    } else {
      const tablesToRemove = [...tables].sort((a, b) => {
        const aN = parseInt(a.qrIdentifier.replace('table-', ''), 10);
        const bN = parseInt(b.qrIdentifier.replace('table-', ''), 10);
        return bN - aN;
      }).slice(0, currentCount - newCount);

      for (const table of tablesToRemove) {
        await deleteTable(table.id);
      }

      const result = await getTables(branchId);
      if (result.success) {
        setTables(result.tables);
        setTableCount(result.tables.length);
        setInputValue(String(result.tables.length));
      }
    }

    setSyncing(false);
  };

  const handleDeleteTable = (table: TableData) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Table?',
      message: `Are you sure you want to delete ${table.tableNumber}?`,
      warning: 'Warning: Any active orders from this table may be affected. This action cannot be undone.',
      confirmText: 'Delete Table',
      isDestructive: true,
      onConfirm: async () => {
        setModalConfig(null);
        setSyncing(true);

        const result = await deleteTable(table.id);
        if (result.success && branchId) {
          const tablesResult = await getTables(branchId);
          if (tablesResult.success) {
            setTables(tablesResult.tables);
            setTableCount(tablesResult.tables.length);
            setInputValue(String(tablesResult.tables.length));
          }
        }

        setSyncing(false);
      },
    });
  };

  const cancelModal = () => {
    setModalConfig(null);
    setInputValue(String(tables.length));
  };

  const getMenuUrl = (qrIdentifier: string) => {
    return `${getBaseUrl()}/customer/table/${qrIdentifier}`;
  };

  const downloadQRCode = async (table: TableData) => {
    const qrElement = qrRefs.current[table.id];
    if (!qrElement) return;

    const svg = qrElement.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const padding = 40;
      const labelHeight = 60;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2 + labelHeight;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(table.tableNumber, canvas.width / 2, canvas.height - 20);

      const link = document.createElement('a');
      link.download = `${table.tableNumber.replace(' ', '-')}-QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const downloadAllQRCodes = async () => {
    setDownloadingAll(true);
    for (const table of tables) {
      await downloadQRCode(table);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setDownloadingAll(false);
  };

  const copyLink = async (table: TableData) => {
    const url = getMenuUrl(table.qrIdentifier);
    await navigator.clipboard.writeText(url);
    setCopiedId(table.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <Loader2 size={32} className="text-[#D95D1E] animate-spin" />
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!branchId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-gray-500 text-center">No branch associated with this account. Please contact support.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <QrCode size={20} className="text-gray-600" />
          <h1 className="text-xl font-bold text-gray-900">QR Codes</h1>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Table QR Codes</h2>
        <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-base">
          Generate QR codes for up to 50 tables. Each code links directly to your menu.
        </p>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6 md:mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Tables
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <input
              type="number"
              min={1}
              max={50}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D95D1E] focus:border-transparent"
            />
            <span className="text-gray-500 text-sm">(1-50 tables)</span>
            {syncing && <Loader2 size={16} className="text-[#D95D1E] animate-spin" />}
          </div>

          <button
            onClick={downloadAllQRCodes}
            disabled={downloadingAll || tables.length === 0}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#D95D1E] text-white font-bold rounded-xl hover:bg-[#c4541b] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingAll ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download All {tables.length} QR Codes
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center group relative"
            >
              <button
                onClick={() => handleDeleteTable(table)}
                className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                title="Delete table"
              >
                <Trash2 size={16} />
              </button>

              <div
                ref={(el) => { qrRefs.current[table.id] = el; }}
                className="bg-white p-3 rounded-lg"
              >
                <QRCodeSVG
                  value={getMenuUrl(table.qrIdentifier)}
                  size={140}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="mt-3 font-semibold text-gray-900">{table.tableNumber}</p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => downloadQRCode(table)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="Download QR Code"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => copyLink(table)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="Copy Link"
                >
                  {copiedId === table.id ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <QrCode size={48} className="mx-auto mb-4 opacity-50" />
            <p>No tables generated yet.</p>
          </div>
        )}
      </div>

      {modalConfig && (
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          warning={modalConfig.warning}
          confirmText={modalConfig.confirmText}
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onCancel={cancelModal}
        />
      )}
    </div>
  );
}
