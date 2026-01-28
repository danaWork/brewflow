import { NextResponse } from 'next/server';

// Mock tables data
const tables = [
  { id: '1', number: 1, capacity: 4, status: 'available', qrCode: 'qr-table-1' },
  { id: '2', number: 2, capacity: 2, status: 'occupied', qrCode: 'qr-table-2' },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: tables,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newTable = {
    id: Date.now().toString(),
    ...body,
    qrCode: `qr-table-${Date.now()}`,
  };
  
  return NextResponse.json({
    success: true,
    data: newTable,
  });
}
