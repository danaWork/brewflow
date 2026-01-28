import { NextResponse } from 'next/server';

export async function GET() {
  // Mock orders analytics data
  return NextResponse.json({
    success: true,
    data: {
      totalOrders: 342,
      todayOrders: 28,
      weekOrders: 156,
      monthOrders: 342,
      ordersByStatus: {
        pending: 12,
        preparing: 8,
        ready: 5,
        completed: 315,
        cancelled: 2,
      },
      averageOrderValue: 45.09,
      peakHours: [
        { hour: '8:00', orders: 15 },
        { hour: '12:00', orders: 32 },
        { hour: '18:00', orders: 28 },
      ],
    },
  });
}
