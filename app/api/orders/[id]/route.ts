import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({
    success: true,
    data: {
      id,
      customerId: '1',
      items: [{ menuItemId: '1', quantity: 2, name: 'Espresso', price: 3.50 }],
      status: 'pending',
      total: 7.00,
      createdAt: new Date().toISOString(),
    },
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  const { id } = await context.params;
  
  return NextResponse.json({
    success: true,
    data: {
      id,
      ...body,
    },
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({
    success: true,
    message: `Order ${id} deleted`,
  });
}

