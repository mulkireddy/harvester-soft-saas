import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Trash2, Truck, IndianRupee, Palette, Check, Loader2,
    ChevronDown, ChevronUp, Edit2, X
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import { playClickHaptic, playSuccessHaptic } from '../lib/ui-utils';
import toast from 'react-hot-toast';

// Collapsible Section Component
const CollapsibleSection: React.FC<{
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}> = ({ title, subtitle, icon, iconBg, iconColor, defaultOpen = true, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <section style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-light)',
            overflow: 'hidden'
        }}>
            <button
                onClick={() => { playClickHaptic(); setIsOpen(!isOpen); }}
                style={{
                    width: '100%',
                    padding: '1.25rem',
                    borderBottom: isOpen ? '1px solid var(--border-light)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                }}
            >
                <div style={{
                    padding: '0.625rem',
                    background: iconBg,
                    borderRadius: 'var(--radius-md)',
                    color: iconColor
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        color: 'var(--text-main)'
                    }}>
                        {title}
                    </h2>
                    <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        marginTop: '0.125rem'
                    }}>
                        {subtitle}
                    </p>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </button>

            {isOpen && (
                <div className="animate-fade-in" style={{ padding: '1.25rem' }}>
                    {children}
                </div>
            )}
        </section>
    );
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => (
    <button
        onClick={() => {
            playClickHaptic();
            onChange(!checked);
        }}
        style={{
            width: '56px',
            height: '30px',
            borderRadius: 'var(--radius-full)',
            background: checked
                ? 'linear-gradient(135deg, var(--primary), #10B981)'
                : 'var(--bg-subtle)',
            border: checked ? 'none' : '2px solid var(--border-light)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: checked ? 'var(--shadow-sm)' : 'none'
        }}
    >
        <span style={{
            position: 'absolute',
            top: checked ? '3px' : '2px',
            left: checked ? '28px' : '2px',
            width: checked ? '24px' : '22px',
            height: checked ? '24px' : '22px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {checked && (
                <Check size={12} style={{ color: 'var(--primary)' }} />
            )}
        </span>
    </button>
);

// Edit Machine Modal
const EditMachineModal: React.FC<{
    machine: any;
    onClose: () => void;
    onSave: (id: string, name: string, reg: string) => void;
}> = ({ machine, onClose, onSave }) => {
    const [name, setName] = useState(machine.name);
    const [reg, setReg] = useState(machine.registration_number || '');

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div className="animate-scale-in" style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-main)' }}>
                        Edit Machine
                    </h3>
                    <button onClick={onClose} style={{
                        padding: '0.5rem',
                        background: 'var(--bg-subtle)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex'
                    }}>
                        <X size={18} style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Machine Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Registration Number
                        </label>
                        <input
                            type="text"
                            value={reg}
                            onChange={e => setReg(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onSave(machine.id, name, reg); onClose(); }}
                        disabled={!name.trim()}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Check size={16} />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};



const SettingsPage: React.FC = () => {
    const [machines, setMachines] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingMachine, setEditingMachine] = useState<any>(null);
    // Removed showPinModal and userProfile state

    // New Machine State
    const [newMachineName, setNewMachineName] = useState('');
    const [newMachineReg, setNewMachineReg] = useState('');

    // Default Rates State
    const [defaultAcreRate, setDefaultAcreRate] = useState('');
    const [defaultHourRate, setDefaultHourRate] = useState('');

    // Appearance State
    const [highContrast, setHighContrast] = useState(false);

    // Initialize state
    useEffect(() => {
        const acre = localStorage.getItem('default_acre_rate');
        const hour = localStorage.getItem('default_hour_rate');
        if (acre) setDefaultAcreRate(acre);
        if (hour) setDefaultHourRate(hour);

        const savedContrast = localStorage.getItem('high_contrast') === 'true';
        setHighContrast(savedContrast);

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

    const handleSaveRates = () => {
        playClickHaptic();
        localStorage.setItem('default_acre_rate', defaultAcreRate);
        localStorage.setItem('default_hour_rate', defaultHourRate);
        playSuccessHaptic();
        toast.success('Default rates saved!');
    };

    const handleAddMachine = async () => {
        if (!newMachineName.trim()) return;
        setLoading(true);
        playClickHaptic();
        try {
            const { error } = await supabase
                .from('machines')
                .insert([{ name: newMachineName, registration_number: newMachineReg }]);

            if (error) throw error;

            setNewMachineName('');
            setNewMachineReg('');
            fetchMachines();
            playSuccessHaptic();
            toast.success('Machine added!');
        } catch (error) {
            console.error('Error adding machine:', error);
            toast.error('Failed to add machine');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMachine = async (id: string, name: string, reg: string) => {
        playClickHaptic();
        try {
            const { error } = await supabase
                .from('machines')
                .update({ name, registration_number: reg })
                .eq('id', id);

            if (error) throw error;
            fetchMachines();
            playSuccessHaptic();
            toast.success('Machine updated!');
        } catch (error) {
            console.error('Error updating machine:', error);
            toast.error('Failed to update machine');
        }
    };

    const handleDeleteMachine = async (id: string) => {
        if (!confirm('Are you sure? This will NOT delete jobs associated with this machine.')) return;
        playClickHaptic();

        try {
            const { error } = await supabase
                .from('machines')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchMachines();
            playSuccessHaptic();
            toast.success('Machine removed');
        } catch (error) {
            console.error('Error deleting machine:', error);
            toast.error('Cannot delete machine. It likely has jobs linked to it.');
        }
    };



    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: '0.375rem',
                    letterSpacing: '-0.02em'
                }}>
                    Settings
                </h1>
                <p style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-muted)'
                }}>
                    Manage your account & preferences
                </p>
            </header>

            {/* Appearance Section */}

            {/* Appearance Section */}
            <CollapsibleSection
                title="Appearance"
                subtitle="Customize app look & feel"
                icon={<Palette size={22} />}
                iconBg="var(--primary-light)"
                iconColor="var(--primary)"
                defaultOpen={true}
            >
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {/* Theme Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)'
                    }}>
                        <div>
                            <div style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                color: 'var(--text-main)',
                                marginBottom: '0.25rem'
                            }}>
                                Theme
                            </div>
                            <div style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)'
                            }}>
                                Light, Dark or System
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>

                    {/* High Contrast Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)'
                    }}>
                        <div>
                            <div style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                color: 'var(--text-main)',
                                marginBottom: '0.25rem'
                            }}>
                                High Contrast Mode
                            </div>
                            <div style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)'
                            }}>
                                Better visibility in bright sunlight
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={highContrast}
                            onChange={setHighContrast}
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* Machine Management Section */}
            <CollapsibleSection
                title="Harvester Machines"
                subtitle="Manage your machines"
                icon={<Truck size={22} />}
                iconBg="var(--secondary-light)"
                iconColor="var(--secondary)"
                defaultOpen={false}
            >
                {/* Machines List */}
                {machines.length > 0 && (
                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {machines.map((m) => (
                            <div key={m.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.875rem 1rem',
                                background: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-light)'
                            }}>
                                <div>
                                    <div style={{
                                        fontWeight: 600,
                                        color: 'var(--text-main)',
                                        fontSize: 'var(--text-sm)'
                                    }}>
                                        {m.name}
                                    </div>
                                    {m.registration_number && (
                                        <div style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--text-muted)',
                                            marginTop: '0.125rem'
                                        }}>
                                            {m.registration_number}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => { playClickHaptic(); setEditingMachine(m); }}
                                        style={{
                                            padding: '0.5rem',
                                            background: 'var(--info-light)',
                                            color: 'var(--info)',
                                            borderRadius: 'var(--radius-md)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex'
                                        }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMachine(m.id)}
                                        style={{
                                            padding: '0.5rem',
                                            background: 'var(--error-light)',
                                            color: 'var(--error)',
                                            borderRadius: 'var(--radius-md)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Machine */}
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Machine Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Kubota Red"
                            value={newMachineName}
                            onChange={e => setNewMachineName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.875rem',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Reg. Number (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="MH-12-..."
                            value={newMachineReg}
                            onChange={e => setNewMachineReg(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.875rem',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                    <button
                        onClick={handleAddMachine}
                        disabled={loading || !newMachineName}
                        style={{
                            padding: '0.75rem 1rem',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            background: !newMachineName ? 'var(--bg-subtle)' : 'var(--primary)',
                            color: !newMachineName ? 'var(--text-muted)' : 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: !newMachineName ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all var(--transition-fast)'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        Add Machine
                    </button>
                </div>
            </CollapsibleSection>

            {/* Default Rates Section */}
            <CollapsibleSection
                title="Default Rates"
                subtitle="Set default prices for new records"
                icon={<IndianRupee size={22} />}
                iconBg="var(--primary-light)"
                iconColor="var(--primary)"
                defaultOpen={false}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Rate per Acre (₹)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 2000"
                            value={defaultAcreRate}
                            onChange={(e) => setDefaultAcreRate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.875rem',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Rate per Hour (₹)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 2500"
                            value={defaultHourRate}
                            onChange={(e) => setDefaultHourRate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.875rem',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                </div>
                <button
                    onClick={handleSaveRates}
                    style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all var(--transition-fast)'
                    }}
                >
                    <Check size={16} />
                    Save Rates
                </button>
            </CollapsibleSection>



            {/* Modals */}
            {editingMachine && (
                <EditMachineModal
                    machine={editingMachine}
                    onClose={() => setEditingMachine(null)}
                    onSave={handleEditMachine}
                />
            )}

        </div>
    );
};

export default SettingsPage;
