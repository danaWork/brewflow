import { NextResponse } from 'next/server';

// Mock menu data
const menuItems = [
  { id: '1', name: 'Espresso', price: 3.50, category: 'Coffee', available: true },
  { id: '2', name: 'Cappuccino', price: 4.50, category: 'Coffee', available: true },
  { id: '3', name: 'Croissant', price: 3.00, category: 'Pastry', available: true },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: menuItems,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newItem = {
    id: Date.now().toString(),
    ...body,
  };
  
  return NextResponse.json({
    success: true,
    data: newItem,
  });
}
