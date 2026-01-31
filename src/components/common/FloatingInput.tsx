import React, { useId } from 'react';
import { Check, AlertCircle, AlertTriangle } from 'lucide-react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    success?: string;
    warning?: string;
    icon?: React.ReactNode;
    maxLength?: number;
    showCharCount?: boolean;
}

/**
 * FloatingInput Component - Premium floating label input with validation
 * 
 * Usage:
 * ```tsx
 * <FloatingInput
 *   label="Phone Number"
 *   type="tel"
 *   value={phone}
 *   onChange={(e) => setPhone(e.target.value)}
 *   error={phoneError}
 *   icon={<Phone size={18} />}
 * />
 * ```
 */
const FloatingInput: React.FC<FloatingInputProps> = ({
    label,
    error,
    success,
    warning,
    icon,
    maxLength,
    showCharCount = false,
    value,
    className = '',
    ...props
}) => {
    const id = useId();
    const hasValue = value !== undefined && value !== '';

    // Determine state
    const state = error ? 'error' : success ? 'success' : warning ? 'warning' : '';
    const feedbackMessage = error || success || warning;

    return (
        <div className={`floating-input-group ${state} ${icon ? 'with-icon' : ''} ${className}`}>
            {/* Icon */}
            {icon && (
                <span className="floating-input-icon" aria-hidden="true">
                    {icon}
                </span>
            )}

            {/* Input */}
            <input
                id={id}
                className={`floating-input ${hasValue ? 'has-value' : ''}`}
                value={value}
                maxLength={maxLength}
                placeholder=" "
                aria-invalid={!!error}
                aria-describedby={feedbackMessage ? `${id}-feedback` : undefined}
                {...props}
            />

            {/* Floating Label */}
            <label
                htmlFor={id}
                className={`floating-label ${props.required ? 'input-required' : ''}`}
            >
                {label}
            </label>

            {/* Feedback Message */}
            {feedbackMessage && (
                <div
                    id={`${id}-feedback`}
                    className={`form-feedback visible ${state}`}
                    role={error ? 'alert' : 'status'}
                >
                    {error && <AlertCircle size={14} aria-hidden="true" />}
                    {success && <Check size={14} aria-hidden="true" />}
                    {warning && <AlertTriangle size={14} aria-hidden="true" />}
                    {feedbackMessage}
                </div>
            )}

            {/* Character Counter */}
            {showCharCount && maxLength && (
                <div className={`char-counter ${typeof value === 'string' && value.length > maxLength * 0.9
                    ? value.length >= maxLength ? 'error' : 'warning'
                    : ''
                    }`}>
                    {typeof value === 'string' ? value.length : 0}/{maxLength}
                </div>
            )}
        </div>
    );
};

export default FloatingInput;
