import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Custom Toast Hook
 * 
 * Usage:
 * ```tsx
 * const toast = useToast();
 * toast.success('Saved!', 'Your changes have been saved.');
 * toast.error('Error', 'Something went wrong.');
 * ```
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const iconMap: Record<ToastType, React.ReactNode> = {
    success: <Check size={20} />,
    error: <X size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onDismiss]);

    const handleDismiss = () => {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
    };

    return (
        <div
            className={`custom-toast ${toast.type} ${exiting ? 'exiting' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-icon" aria-hidden="true">
                {iconMap[toast.type]}
            </div>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button
                className="toast-dismiss"
                onClick={handleDismiss}
                aria-label="Dismiss notification"
            >
                <X size={16} />
            </button>
        </div>
    );
};

/**
 * Toast Provider Component
 * 
 * Usage:
 * ```tsx
 * // In App.tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
    const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
    const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
    const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
