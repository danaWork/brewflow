import { NextResponse } from 'next/server';

export async function GET() {
  // Mock sales analytics data
  return NextResponse.json({
    success: true,
    data: {
      totalSales: 15420.50,
      todaySales: 1250.00,
      weekSales: 8500.00,
      monthSales: 15420.50,
      salesByDay: [
        { date: '2026-01-15', sales: 1200 },
        { date: '2026-01-16', sales: 1500 },
        { date: '2026-01-17', sales: 1800 },
        { date: '2026-01-18', sales: 1350 },
        { date: '2026-01-19', sales: 1600 },
        { date: '2026-01-20', sales: 1420 },
        { date: '2026-01-21', sales: 1250 },
      ],
    },
  });
}
