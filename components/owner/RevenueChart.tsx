'use client';

import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface RevenueChartProps {
    data: Array<{ date: string; revenue: number; orders: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
    // Format currency
    const formatCurrency = useMemo(() => {
        return (value: number) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        };
    }, []);

    // Format date
    const formatDate = useMemo(() => {
        return (dateStr: string) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
    }, []);

    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return null;
        }

        const maxRevenue = Math.max(...data.map(d => d.revenue), 1) * 1.1; // Add 10% headroom
        const logicalWidth = 800;
        const logicalHeight = 300;
        const padding = { top: 40, right: 40, bottom: 60, left: 80 };

        const innerWidth = logicalWidth - padding.left - padding.right;
        const innerHeight = logicalHeight - padding.top - padding.bottom;

        // Calculate points for the line
        const points = data.map((d, i) => {
            const x = data.length > 1 ? padding.left + (i / (data.length - 1)) * innerWidth : padding.left + innerWidth / 2;
            const y = padding.top + innerHeight - ((d.revenue / maxRevenue) * innerHeight);
            return { x, y, ...d };
        });

        // Create SVG path
        const linePath = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ');

        // Create area path (for gradient fill)
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${logicalHeight - padding.bottom} L ${points[0].x} ${logicalHeight - padding.bottom} Z`;

        // Calculate grid lines (5 horizontal lines)
        const gridLines = Array.from({ length: 5 }, (_, i) => {
            const value = (maxRevenue / 4) * (4 - i);
            const y = padding.top + (i / 4) * innerHeight;
            return { y, value };
        });

        return {
            points,
            linePath,
            areaPath,
            gridLines,
            logicalWidth,
            logicalHeight,
            padding
        };
    }, [data]);

    if (!chartData) {
        return (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-center text-gray-400">
                    <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No revenue data available</p>
                </div>
            </div>
        );
    }

    const { points, linePath, areaPath, gridLines, logicalWidth, logicalHeight, padding } = chartData;

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                        <TrendingUp className="text-[#D46215]" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Revenue Over Time</h3>
                        <p className="text-sm text-gray-500">Daily revenue breakdown</p>
                    </div>
                </div>
            </div>

            <div className="w-full overflow-hidden">
                <svg
                    viewBox={`0 0 ${logicalWidth} ${logicalHeight}`}
                    className="w-full h-auto"
                >
                    {/* Define gradient */}
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#D46215" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#D46215" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {gridLines.map((line, i) => (
                        <g key={i}>
                            <line
                                x1={padding.left}
                                y1={line.y}
                                x2={logicalWidth - padding.right}
                                y2={line.y}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                            />
                            <text
                                x={padding.left - 10}
                                y={line.y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                className="text-[12px] fill-gray-400"
                            >
                                {formatCurrency(line.value)}
                            </text>
                        </g>
                    ))}

                    {/* Area fill */}
                    <path
                        d={areaPath}
                        fill="url(#revenueGradient)"
                    />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#D46215"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {points.map((point, i) => (
                        <g key={i}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="white"
                                stroke="#D46215"
                                strokeWidth="2"
                                className="hover:r-6 transition-all cursor-pointer"
                            />
                            <title>
                                {`${formatDate(point.date)}: ${formatCurrency(point.revenue)} (${point.orders} orders)`}
                            </title>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {points.filter((_, i) => {
                        const count = points.length;
                        if (count <= 7) return true;
                        if (count <= 15) return i % 2 === 0;
                        return i % 5 === 0;
                    }).map((point, i) => (
                        <text
                            key={i}
                            x={point.x}
                            y={logicalHeight - padding.bottom + 25}
                            textAnchor="middle"
                            className="text-[12px] fill-gray-400"
                        >
                            {formatDate(point.date)}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
}
