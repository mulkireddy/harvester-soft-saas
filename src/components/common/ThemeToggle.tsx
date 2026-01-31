import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { playClickHaptic } from '../../lib/ui-utils';

type Theme = 'light' | 'dark' | 'system';

/**
 * Theme Toggle Component
 * 
 * Usage:
 * ```tsx
 * <ThemeToggle />
 * ```
 */
const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
    const [theme, setTheme] = useState<Theme>('system');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check saved preference
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved) {
            setTheme(saved);
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(prefersDark);
            root.removeAttribute('data-theme');
        } else {
            setIsDark(theme === 'dark');
            root.setAttribute('data-theme', theme);
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                setIsDark(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    const toggleTheme = () => {
        playClickHaptic();
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            return 'light';
        });
    };

    if (compact) {
        return (
            <button
                onClick={toggleTheme}
                className="icon-btn-enhanced"
                aria-label={`Current theme: ${theme}. Click to change.`}
                style={{
                    width: '44px',
                    height: '44px',
                    background: 'var(--bg-subtle)',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all var(--transition-fast)'
                }}
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)'
        }}>
            <button
                onClick={() => { playClickHaptic(); setTheme('light'); }}
                className={theme === 'light' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                aria-pressed={theme === 'light'}
            >
                <Sun size={16} />
                Light
            </button>
            <button
                onClick={() => { playClickHaptic(); setTheme('dark'); }}
                className={theme === 'dark' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                aria-pressed={theme === 'dark'}
            >
                <Moon size={16} />
                Dark
            </button>
            <button
                onClick={() => { playClickHaptic(); setTheme('system'); }}
                className={theme === 'system' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                aria-pressed={theme === 'system'}
            >
                Auto
            </button>
        </div>
    );
};

export default ThemeToggle;
