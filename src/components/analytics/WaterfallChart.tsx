
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

interface WaterfallChartProps {
    data: any[];
}

const WaterfallChart: React.FC<WaterfallChartProps> = ({ data }) => {
    // Custom tooltip to explain the waterfall logic
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div style={{ background: '#fff', border: '1px solid #ddd', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{item.name}</p>
                    <p style={{ margin: 0, color: item.fill, fontWeight: 700 }}>
                        {item.originalValue < 0 ? '-' : (item.name === 'Total Revenue' || item.name === 'Net Profit' ? '' : '+')}
                        ₹ {Math.abs(item.originalValue).toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} interval={0} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <ReferenceLine y={0} stroke="#E5E7EB" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default WaterfallChart;
