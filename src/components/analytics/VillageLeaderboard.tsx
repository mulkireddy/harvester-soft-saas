import React from 'react';
import { Trophy } from 'lucide-react';

interface VillageLeaderboardProps {
    jobs: any[];
}

const VillageLeaderboard: React.FC<VillageLeaderboardProps> = ({ jobs }) => {
    // 1. Group Data
    const villageStats: Record<string, { amount: number, acres: number, hours: number }> = {};

    jobs.forEach(job => {
        const place = job.farmers?.place || 'Unspecified';
        if (!villageStats[place]) {
            villageStats[place] = { amount: 0, acres: 0, hours: 0 };
        }
        villageStats[place].amount += (job.total_amount || 0);
        if (job.billing_mode === 'acre') {
            villageStats[place].acres += Number(job.quantity || 0);
        } else if (job.billing_mode === 'hour') {
            villageStats[place].hours += Number(job.quantity || 0);
        }
    });

    // 2. Convert to Array & Sort
    const leaderboard = Object.entries(villageStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5

    return (
        <div className="card" style={{ padding: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.5rem', background: '#FFF7ED', borderRadius: '8px', color: '#EA580C' }}>
                    <Trophy size={18} />
                </div>
                <h3 style={{ fontSize: '1.1rem' }}>Top Revenue Villages</h3>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {leaderboard.map((item, index) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: index < leaderboard.length - 1 ? '1px dashed var(--border-light)' : 'none' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: index === 0 ? '#FEF3C7' : index === 1 ? '#F3F4F6' : index === 2 ? '#FFEDD5' : 'transparent',
                                color: index === 0 ? '#D97706' : index === 1 ? '#4B5563' : index === 2 ? '#9A3412' : 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem'
                            }}>
                                {index + 1}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                                    {item.acres > 0 && <span>{item.acres.toFixed(1)} Acres</span>}
                                    {item.acres > 0 && item.hours > 0 && <span>•</span>}
                                    {item.hours > 0 && <span>{item.hours.toFixed(1)} Hrs</span>}
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>
                            ₹ {item.amount.toLocaleString()}
                        </div>
                    </div>
                ))}
                {leaderboard.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem' }}>No records yet. Add jobs to see ranking.</div>}
            </div>
        </div>
    );
};

export default VillageLeaderboard;
