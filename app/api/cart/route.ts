import { NextResponse } from 'next/server';

// Mock cart data (in a real app, this would be session-based)
let cart = {
  items: [
    { menuItemId: '1', name: 'Espresso', quantity: 2, price: 3.50 },
  ],
  total: 7.00,
};

export async function GET() {
  return NextResponse.json({
    success: true,
    data: cart,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Add item to cart
  cart.items.push(body);
  cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return NextResponse.json({
    success: true,
    data: cart,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  
  // Update cart
  cart = body;
  
  return NextResponse.json({
    success: true,
    data: cart,
  });
}
