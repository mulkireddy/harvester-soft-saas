import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

interface WaterfallChartProps {
    data: any[];
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        const isPositive = item.originalValue >= 0;

        return (
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                minWidth: '140px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.375rem'
                }}>
                    <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        background: item.fill
                    }} />
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-main)'
                    }}>
                        {item.name}
                    </span>
                </div>
                <div style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    color: isPositive ? 'var(--success)' : 'var(--error)'
                }}>
                    {!isPositive && '-'}₹{Math.abs(item.originalValue).toLocaleString('en-IN')}
                </div>
                <div style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem'
                }}>
                    {item.name === 'Revenue' ? 'Total Income' :
                        item.name === 'Profit' ? (isPositive ? 'Net Profit' : 'Net Loss') :
                            'Expense Category'}
                </div>
            </div>
        );
    }
    return null;
};

const WaterfallChart: React.FC<WaterfallChartProps> = ({ data }) => {
    // Check if on mobile for simplified labels
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Shorten labels for mobile
    const shortenLabel = (name: string) => {
        if (!isMobile) return name;
        const shortNames: Record<string, string> = {
            'Revenue': 'Rev',
            'Total Revenue': 'Rev',
            'Diesel / Fuel': 'Fuel',
            'Spares': 'Spare',
            'Salary': 'Sal',
            'Machine EMI': 'EMI',
            'Net Profit': 'Profit',
            'Profit': 'Profit'
        };
        return shortNames[name] || name.slice(0, 4);
    };

    if (!data || data.length === 0) {
        return (
            <div style={{
                height: '320px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '0.5rem'
            }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No data available</span>
            </div>
        );
    }

    return (
        <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                    barCategoryGap="15%"
                >
                    <defs>
                        {data.map((entry, index) => (
                            <linearGradient key={index} id={`waterfallGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                                <stop offset="100%" stopColor={entry.fill} stopOpacity={0.7} />
                            </linearGradient>
                        ))}
                    </defs>
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fontSize: isMobile ? 9 : 11,
                            fill: 'var(--text-muted)',
                            fontWeight: 500
                        }}
                        interval={0}
                        tickFormatter={shortenLabel}
                        dy={5}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fontSize: 10,
                            fill: 'var(--text-muted)',
                            fontWeight: 500
                        }}
                        tickFormatter={(value) =>
                            Math.abs(value) >= 1000
                                ? `₹${(value / 1000).toFixed(0)}k`
                                : `₹${value}`
                        }
                        width={50}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }} />
                    <ReferenceLine y={0} stroke="var(--border-light)" strokeDasharray="3 3" />
                    <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={isMobile ? 40 : 60}
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={`url(#waterfallGradient-${index})`}
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WaterfallChart;
