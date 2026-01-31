import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import FloatingInput from '../components/common/FloatingInput';
import toast from 'react-hot-toast';
import { playSuccessHaptic, playClickHaptic, playErrorHaptic } from '../lib/ui-utils';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);

    // Machine Details State
    const [machineName, setMachineName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [errors, setErrors] = useState<{ machineName?: string }>({});

    // Check if user already has machines (safety check)
    useEffect(() => {
        const checkExistingMachines = async () => {
            const { count } = await supabase
                .from('machines')
                .select('*', { count: 'exact', head: true });

            if (count && count > 0) {
                navigate('/');
            }
        };
        checkExistingMachines();
    }, [navigate]);

    const handleNextStep = () => {
        playClickHaptic();
        setStep(2);
    };

    const handleFinish = async () => {
        // Validate
        if (!machineName.trim()) {
            setErrors({ machineName: 'Machine Name is required' });
            playErrorHaptic();
            return;
        }

        setLoading(true);
        playClickHaptic();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
                .from('machines')
                .insert([
                    {
                        name: machineName,
                        registration_number: registrationNumber || null,
                        owner_id: user.id
                    }
                ]);

            if (error) throw error;

            playSuccessHaptic();
            toast.success('Setup Complete!');
            navigate('/');

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to finish setup');
            playErrorHaptic();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Accent */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '300px',
                height: '300px',
                background: 'var(--primary-light)',
                filter: 'blur(80px)',
                borderRadius: '50%',
                opacity: 0.5,
                zIndex: 0
            }} />

            <div style={{
                maxWidth: '400px',
                width: '100%',
                margin: '0 auto',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Step Content */}
                {step === 1 ? (
                    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <img
                                src="/empty-welcome.png"
                                alt="Welcome"
                                style={{ width: '240px', height: 'auto', marginBottom: '1.5rem' }}
                            />
                            <h1 style={{
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                color: 'var(--text-main)',
                                marginBottom: '0.75rem'
                            }}>
                                Welcome to HarvesterOS
                            </h1>
                            <p style={{
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6,
                                fontSize: '1rem'
                            }}>
                                Track your harvester work, expenses, and profits in one simple place. Let's get you set up specifically for your machine.
                            </p>
                        </div>

                        <button
                            onClick={handleNextStep}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                borderRadius: 'var(--radius-lg)'
                            }}
                        >
                            Get Started <ArrowRight size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="animate-slide-up">
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'var(--primary-light)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)',
                                marginBottom: '1rem'
                            }}>
                                <Truck size={24} />
                            </div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-main)',
                                marginBottom: '0.5rem'
                            }}>
                                Add Your Machine
                            </h2>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Enter details for your first harvester machine.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            <FloatingInput
                                label="Machine Name"
                                placeholder="e.g. John Deere 5310"
                                value={machineName}
                                onChange={(e) => {
                                    setMachineName(e.target.value);
                                    if (errors.machineName) setErrors({});
                                }}
                                error={errors.machineName}
                                icon={<Truck size={18} />}
                                required
                            />

                            <FloatingInput
                                label="Registration Number (Optional)"
                                placeholder="e.g. AP 39 AB 1234"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                style={{
                                    textTransform: 'uppercase'
                                }}
                            />
                        </div>

                        <button
                            onClick={handleFinish}
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                borderRadius: 'var(--radius-lg)',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Setting up...' : 'Finish Setup'}
                            {!loading && <Check size={20} />}
                        </button>
                    </div>
                )}

                {/* Step Indicators */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '2rem'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: step === 1 ? 'var(--primary)' : 'var(--border-medium)',
                        transition: 'all 0.3s ease'
                    }} />
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: step === 2 ? 'var(--primary)' : 'var(--border-medium)',
                        transition: 'all 0.3s ease'
                    }} />
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
