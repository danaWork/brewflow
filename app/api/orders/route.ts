import { NextResponse } from 'next/server';

// Mock orders data
const orders = [
  {
    id: '1',
    customerId: '1',
    items: [{ menuItemId: '1', quantity: 2 }],
    status: 'pending',
    total: 7.00,
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: orders,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newOrder = {
    id: Date.now().toString(),
    ...body,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  return NextResponse.json({
    success: true,
    data: newOrder,
  });
}
