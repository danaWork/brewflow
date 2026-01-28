import { NextResponse } from 'next/server';

// Mock users data
const users = [
  {
    id: '1',
    email: 'customer@example.com',
    name: 'John Doe',
    role: 'customer',
  },
  {
    id: '2',
    email: 'owner@example.com',
    name: 'Jane Smith',
    role: 'owner',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: users,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newUser = {
    id: Date.now().toString(),
    ...body,
  };
  
  return NextResponse.json({
    success: true,
    data: newUser,
  });
}
