'use client';

import { TrendingUp } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';

interface RevenueChartProps {
    data: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }>;
}

const MOBILE_BREAKPOINT = 768;

export function RevenueChart({ data }: RevenueChartProps) {
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        date: string;
        revenue: number;
        cashRevenue: number;
        digitalRevenue: number;
        orders: number;
    } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

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
        // Mobile: taller aspect ratio so chart is readable on small screens; desktop: original
        const logicalWidth = isMobile ? 400 : 800;
        const logicalHeight = isMobile ? 320 : 300;
        const padding = isMobile
            ? { top: 32, right: 24, bottom: 48, left: 56 }
            : { top: 40, right: 40, bottom: 60, left: 80 };

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
    }, [data, isMobile]);

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

    useEffect(() => {
        const updateTooltipPosition = () => {
            if (tooltip && svgRef.current && tooltipRef.current) {
                const svgRect = svgRef.current.getBoundingClientRect();
                const tooltipRect = tooltipRef.current.getBoundingClientRect();
                const svgAspectRatio = svgRect.width / logicalWidth;
                
                const screenX = svgRect.left + tooltip.x * svgAspectRatio;
                const screenY = svgRect.top + tooltip.y * svgAspectRatio;
                
                const tooltipX = screenX;
                const tooltipY = screenY - 10;
                
                tooltipRef.current.style.left = `${tooltipX}px`;
                tooltipRef.current.style.top = `${tooltipY}px`;
            }
        };

        updateTooltipPosition();
        
        window.addEventListener('scroll', updateTooltipPosition, true);
        window.addEventListener('resize', updateTooltipPosition);
        
        return () => {
            window.removeEventListener('scroll', updateTooltipPosition, true);
            window.removeEventListener('resize', updateTooltipPosition);
        };
    }, [tooltip, logicalWidth, logicalHeight]);

    const handlePointMouseEnter = (point: typeof points[0], event: React.MouseEvent) => {
        if (svgRef.current) {
            const svgRect = svgRef.current.getBoundingClientRect();
            const svgAspectRatio = svgRect.width / logicalWidth;
            const screenX = svgRect.left + point.x * svgAspectRatio;
            const screenY = svgRect.top + point.y * svgAspectRatio;
            
            setTooltip({
                x: point.x,
                y: point.y,
                date: point.date,
                revenue: point.revenue,
                cashRevenue: point.cashRevenue,
                digitalRevenue: point.digitalRevenue,
                orders: point.orders
            });
        }
    };

    const handlePointMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative">
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

            <div className="w-full overflow-hidden min-h-[240px] md:min-h-0">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${logicalWidth} ${logicalHeight}`}
                    className="w-full h-auto min-h-[240px] md:min-h-0"
                    preserveAspectRatio="xMidYMid meet"
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
                                x={padding.left - (isMobile ? 6 : 10)}
                                y={line.y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                className={isMobile ? 'text-[10px] fill-gray-400' : 'text-[12px] fill-gray-400'}
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
                                r={isMobile ? 16 : 12}
                                fill="transparent"
                                className="cursor-pointer touch-none"
                                onMouseEnter={(e) => handlePointMouseEnter(point, e)}
                                onMouseLeave={handlePointMouseLeave}
                                onClick={() => isMobile && setTooltip(tooltip?.date === point.date ? null : { x: point.x, y: point.y, date: point.date, revenue: point.revenue, cashRevenue: point.cashRevenue, digitalRevenue: point.digitalRevenue, orders: point.orders })}
                            />
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={isMobile ? 5 : 4}
                                fill="white"
                                stroke="#D46215"
                                strokeWidth="2"
                                className="transition-all pointer-events-none"
                            />
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {points.filter((_, i) => {
                        const count = points.length;
                        if (isMobile) {
                            if (count <= 5) return true;
                            const step = Math.max(1, Math.floor(count / 5));
                            return i % step === 0 || i === count - 1;
                        }
                        if (count <= 7) return true;
                        if (count <= 15) return i % 2 === 0;
                        return i % 5 === 0;
                    }).map((point, i) => (
                        <text
                            key={i}
                            x={point.x}
                            y={logicalHeight - padding.bottom + (isMobile ? 18 : 25)}
                            textAnchor="middle"
                            className={isMobile ? 'text-[10px] fill-gray-400' : 'text-[12px] fill-gray-400'}
                        >
                            {formatDate(point.date)}
                        </text>
                    ))}
                </svg>
            </div>

            {tooltip && (
                <div
                    ref={tooltipRef}
                    className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[150px] animate-in fade-in zoom-in duration-150"
                    style={{
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <div className="flex flex-col gap-1.5">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {formatDate(tooltip.date)}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-[#D95D1E]">
                                {formatCurrency(tooltip.revenue)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5 border-b border-gray-100 pb-1">
                            {tooltip.orders} {tooltip.orders === 1 ? 'order' : 'orders'}
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1">
                            <span className="text-gray-500">Cash:</span>
                            <span className="font-semibold text-gray-700">{formatCurrency(tooltip.cashRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Digital:</span>
                            <span className="font-semibold text-gray-700">{formatCurrency(tooltip.digitalRevenue)}</span>
                        </div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-[-1px]">
                        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-200"></div>
                        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white absolute -top-[1px] left-1/2 transform -translate-x-1/2"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
