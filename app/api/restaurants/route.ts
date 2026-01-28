import { NextResponse } from 'next/server';

// Mock restaurants data
const restaurants = [
  {
    id: '1',
    name: 'Coffee Shop Downtown',
    address: '123 Main St',
    phone: '555-0100',
    status: 'active',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: restaurants,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newRestaurant = {
    id: Date.now().toString(),
    ...body,
    status: 'active',
  };
  
  return NextResponse.json({
    success: true,
    data: newRestaurant,
  });
}
