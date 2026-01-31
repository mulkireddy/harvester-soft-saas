import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpensePieChartProps {
    data: {
        name: string;
        value: number;
        color: string;
    }[];
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{
                background: 'var(--bg-card)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-light)',
                minWidth: '120px'
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
                        borderRadius: '50%',
                        background: data.color
                    }} />
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-main)'
                    }}>
                        {data.name}
                    </span>
                </div>
                <div style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    color: 'var(--text-main)'
                }}>
                    ₹{data.value?.toLocaleString('en-IN')}
                </div>
            </div>
        );
    }
    return null;
};

// Custom Legend for mobile
const CustomLegend = ({ payload }: any) => {
    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem 1rem',
            marginTop: '0.5rem',
            maxWidth: '280px',
            margin: '0.5rem auto 0'
        }}>
            {payload?.map((entry: any, index: number) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)'
                    }}
                >
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: entry.color,
                        flexShrink: 0
                    }} />
                    <span style={{ whiteSpace: 'nowrap' }}>{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ data }) => {
    // If no data, show empty state
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div style={{
                height: '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '0.5rem'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                </div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No expenses</span>
                <span style={{ fontSize: 'var(--text-xs)' }}>Add expenses to see breakdown</span>
            </div>
        );
    }

    // Calculate total for percentage display
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <defs>
                        {data.map((entry, index) => (
                            <linearGradient key={index} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                            </linearGradient>
                        ))}
                    </defs>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        outerRadius={85}
                        innerRadius={45}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                        stroke="none"
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={`url(#pieGradient-${index})`}
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />

                    {/* Center label showing total */}
                    <text
                        x="50%"
                        y="42%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: 'var(--text-xs)', fill: 'var(--text-muted)' }}
                    >
                        Total
                    </text>
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: '14px', fontWeight: 700, fill: 'var(--text-main)' }}
                    >
                        ₹{(total / 1000).toFixed(0)}k
                    </text>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpensePieChart;
