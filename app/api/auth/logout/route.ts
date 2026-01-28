import { NextResponse } from 'next/server';

export async function POST() {
  // Mock logout logic
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}
