import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import chartTheme from '../../../lib/chart-theme';

interface RevenueChartProps {
    data: {
        name: string;
        income: number;
        expense: number;
    }[];
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={chartTheme.tooltip.container}>
                <div style={chartTheme.tooltip.title}>
                    {label}
                </div>
                {payload.map((entry: any, index: number) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: 'var(--text-xs)',
                            marginBottom: '0.25rem'
                        }}
                    >
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: entry.color
                        }} />
                        <span style={chartTheme.tooltip.label}>{entry.name}:</span>
                        <span style={chartTheme.tooltip.value}>
                            {chartTheme.formatFullCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Custom Legend Component
const CustomLegend = ({ payload }: any) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            marginTop: '0.5rem'
        }}>
            {payload.map((entry: any, index: number) => (
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
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: entry.color
                    }} />
                    <span>{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    // Detect if mobile (simplified check based on data length)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Simplify labels for mobile - only show every Nth item
    const getTickFormatter = (value: string, index: number) => {
        if (data.length <= 7) return value;
        if (data.length <= 12 && index % 2 === 0) return value;
        if (data.length > 12 && index % 5 === 0) return value;
        return '';
    };

    return (
        <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 0,
                    }}
                    barGap={2}
                    barCategoryGap="20%"
                >
                    <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            {chartTheme.gradients.incomeGradient.stops.map((stop, i) => (
                                <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                            ))}
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                            {chartTheme.gradients.expenseGradient.stops.map((stop, i) => (
                                <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                            ))}
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray={chartTheme.grid.strokeDasharray}
                        vertical={chartTheme.grid.vertical}
                        stroke={chartTheme.grid.stroke}
                        strokeOpacity={chartTheme.grid.strokeOpacity}
                    />
                    <XAxis
                        dataKey="name"
                        {...chartTheme.axis}
                        dy={8}
                        tickFormatter={getTickFormatter}
                        interval={0}
                    />
                    <YAxis
                        {...chartTheme.axis}
                        tickFormatter={chartTheme.formatCurrency}
                        width={50}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'var(--bg-subtle)', radius: 4, opacity: 0.5 }}
                    />
                    <Legend content={<CustomLegend />} />
                    <Bar
                        dataKey="income"
                        name="Income"
                        fill="url(#incomeGradient)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={isMobile ? 20 : 35}
                    />
                    <Bar
                        dataKey="expense"
                        name="Expenses"
                        fill="url(#expenseGradient)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={isMobile ? 20 : 35}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
