
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Trash2, Truck } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const [machines, setMachines] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // New Machine State
    const [newMachineName, setNewMachineName] = useState('');
    const [newMachineReg, setNewMachineReg] = useState('');

    useEffect(() => {
        fetchMachines();
    }, []);

    const fetchMachines = async () => {
        const { data, error } = await supabase
            .from('machines')
            .select('*')
            .order('created_at', { ascending: true });

        if (data) setMachines(data);
        if (error) console.error('Error fetching machines:', error);
    };

    const handleAddMachine = async () => {
        if (!newMachineName.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('machines')
                .insert([{ name: newMachineName, registration_number: newMachineReg }]);

            if (error) throw error;

            setNewMachineName('');
            setNewMachineReg('');
            fetchMachines(); // Refresh list
        } catch (error) {
            console.error('Error adding machine:', error);
            alert('Failed to add machine');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMachine = async (id: string) => {
        if (!confirm('Are you sure? This will NOT delete jobs associated with this machine, but might affect filtering.')) return;

        try {
            const { error } = await supabase
                .from('machines')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchMachines();
        } catch (error) {
            console.error('Error deleting machine:', error);
            alert('Cannot delete machine. It likely has jobs linked to it.');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your business preferences and assets.</p>
            </header>

            {/* Machine Management Section */}
            <section className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#EFF6FF', borderRadius: '12px', color: 'var(--primary)' }}>
                        <Truck size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Harvester Machines</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Add or remove machines available for work.</p>
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* List */}
                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        {machines.map((m) => (
                            <div key={m.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-light)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.name}</div>
                                    {m.registration_number && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            {m.registration_number}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteMachine(m.id)}
                                    style={{ padding: '0.5rem', color: '#EF4444', borderRadius: '8px', transition: 'background 0.2s' }}
                                    className="btn-icon"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) auto', gap: '1rem', alignItems: 'end' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Machine Name</label>
                            <input
                                className="input"
                                placeholder="e.g. Kubota Red"
                                value={newMachineName}
                                onChange={e => setNewMachineName(e.target.value)}
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Reg. Number (Optional)</label>
                            <input
                                className="input"
                                placeholder="MH-12-..."
                                value={newMachineReg}
                                onChange={e => setNewMachineReg(e.target.value)}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleAddMachine}
                            disabled={loading || !newMachineName}
                            style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Plus size={18} /> Add
                        </button>
                    </div>
                </div>
            </section>

            {/* Default Rates (Placeholder for next feature) */}
            <section className="card" style={{ opacity: 0.7 }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Default Rates (Coming Soon)</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Set default prices per acre/hour to auto-fill new records.</p>
                </div>
            </section>
        </div>
    );
};

export default SettingsPage;
