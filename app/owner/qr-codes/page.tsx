import { QrCode } from 'lucide-react';

export default function QRCodesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="bg-gray-100 p-6 rounded-full inline-block mb-6">
          <QrCode size={48} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Codes</h1>
        <p className="text-gray-500 max-w-md">
          Generate and manage QR codes for your tables. Coming soon!
        </p>
      </div>
    </div>
  );
}
