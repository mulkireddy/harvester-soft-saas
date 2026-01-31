import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
        // In production, we would log this to a service like Sentry or LogRocket
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-main)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: 'var(--error-light)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        color: 'var(--error)'
                    }}>
                        <AlertTriangle size={40} />
                    </div>

                    <h1 style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        color: 'var(--text-main)'
                    }}>
                        Something went wrong
                    </h1>

                    <p style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-secondary)',
                        marginBottom: '2rem',
                        maxWidth: '500px',
                        lineHeight: '1.6'
                    }}>
                        We encountered an unexpected error. Our team has been notified.
                        <br />
                        Please try reloading the page.
                    </p>

                    <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '2rem',
                        maxWidth: '100%',
                        overflow: 'auto',
                        textAlign: 'left',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'monospace',
                        border: '1px solid var(--border-light)'
                    }}>
                        <strong>Error:</strong> {this.state.error?.toString()}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={this.handleReload}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <RefreshCw size={18} />
                            Reload Page
                        </button>

                        <button
                            onClick={this.handleGoHome}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Home size={18} />
                            Go Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
