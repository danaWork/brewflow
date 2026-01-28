import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Mock registration logic
  return NextResponse.json({
    success: true,
    user: {
      id: Date.now().toString(),
      email: body.email,
      name: body.name,
      role: 'customer',
    },
    token: 'mock-jwt-token',
  });
}
