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
      name: 'Coffee Shop Downtown',
      address: '123 Main St',
      phone: '555-0100',
      status: 'active',
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
    message: `Restaurant ${id} deleted`,
  });
}

