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
      name: 'Menu Item',
      price: 5.00,
      category: 'Coffee',
      available: true,
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
    message: `Menu item ${id} deleted`,
  });
}

