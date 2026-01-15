import React, { useRef, useState } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReceiptModalProps {
    job: any;
    onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ job, onClose }) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    const generateImage = async () => {
        if (!receiptRef.current) return null;
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2, // High resolution
                backgroundColor: '#ffffff',
                logging: false,
            });
            return canvas;
        } catch (error) {
            console.error("Receipt generation failed", error);
            return null;
        }
    };

    const handleDownload = async () => {
        setLoading(true);
        const canvas = await generateImage();
        if (canvas) {
            const link = document.createElement('a');
            link.download = `Receipt_${job.farmers?.name}_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        setLoading(false);
    };

    const handleShare = async () => {
        setLoading(true);
        const canvas = await generateImage();
        if (canvas) {
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], "receipt.png", { type: "image/png" });

                if (navigator.share) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Payment Receipt',
                            text: `Receipt for ${job.farmers?.name}`,
                        });
                    } catch (err) {
                        console.error("Share failed", err);
                    }
                } else {
                    alert("Web Share API not supported on this browser. Downloading instead.");
                    handleDownload();
                }
                setLoading(false);
            }, 'image/png');
        } else {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                {/* Actions Header */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'white', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
                        <X size={24} color="#374151" />
                    </button>
                </div>

                {/* RECEIPT PREVIEW AREA - Pass ref here */}
                <div ref={receiptRef} style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '0', // Receipts look better square-ish or slightly rounded
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'Courier New, Courier, monospace', // Monospace for receipt feel
                    color: '#1f2937'
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px dashed #e5e7eb', paddingBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            HARVESTER SERVICES
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Official Payment Receipt</p>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0 0' }}>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    </div>

                    {/* Customer Info */}
                    <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#6b7280' }}>Billed To:</span>
                            <span style={{ fontWeight: 700 }}>{job.farmers?.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#6b7280' }}>Mobile:</span>
                            <span>{job.farmers?.mobile || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6b7280' }}>Village:</span>
                            <span>{job.farmers?.place || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                <th style={{ padding: '8px 0', fontWeight: 600 }}>Description</th>
                                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '12px 0 4px 0' }}>
                                    <div style={{ fontWeight: 600 }}>{job.crop} Harvesting</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {job.quantity} {job.billing_mode === 'acre' ? 'Acres' : 'Hours'} x ₹{job.rate}
                                        {job.machines?.name && ` (${job.machines.name})`}
                                    </div>
                                </td>
                                <td style={{ padding: '12px 0 4px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 600 }}>
                                    {job.total_amount.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '1rem', fontWeight: 700 }}>
                            <span>Total Amount</span>
                            <span>₹ {job.total_amount.toLocaleString()}</span>
                        </div>

                        {job.paid_amount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#166534' }}>
                                <span>Paid / Advance</span>
                                <span>- ₹ {job.paid_amount.toLocaleString()}</span>
                            </div>
                        )}

                        <div style={{
                            display: 'flex', justifyContent: 'space-between', marginTop: '1rem',
                            padding: '0.75rem', background: '#f3f4f6', borderRadius: '8px',
                            fontWeight: 800, fontSize: '1.1rem'
                        }}>
                            <span>Amount Due</span>
                            <span style={{ color: job.total_amount - (job.paid_amount || 0) > 0 ? '#dc2626' : '#166534' }}>
                                ₹ {(job.total_amount - (job.paid_amount || 0)).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                        <p>Thank you for your business!</p>
                        <p style={{ marginTop: '4px' }}>Generated by Harvester Manager</p>
                    </div>
                </div>

                {/* Primary Actions */}
                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        onClick={handleDownload}
                        className="btn"
                        style={{
                            background: 'white', color: '#374151', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                        Save Image
                    </button>
                    <button
                        onClick={handleShare}
                        className="btn btn-primary"
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                        Share Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
