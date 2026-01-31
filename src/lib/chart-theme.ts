/**
 * Chart Theme Configuration
 * 
 * Centralized chart colors and styling tokens for Recharts.
 * Uses CSS custom properties for dark mode support.
 */

// Chart color palette
export const chartColors = {
    // Revenue/Income - Primary green
    revenue: '#059669',
    revenueGradient: ['#10B981', '#059669'],

    // Profit - Success teal
    profit: '#14B8A6',
    profitGradient: ['#2DD4BF', '#14B8A6'],

    // Expenses/Loss - Error red
    expense: '#EF4444',
    expenseGradient: ['#EF4444', '#DC2626'],

    // Category colors for pie charts
    categories: {
        fuel: '#F59E0B',
        maintenance: '#8B5CF6',
        labor: '#EC4899',
        emi: '#6366F1',
        other: '#94A3B8'
    },

    // Secondary data colors
    secondary: '#3B82F6',
    tertiary: '#8B5CF6',
    quaternary: '#EC4899'
};

// Chart gradient definitions for Recharts
export const chartGradients = {
    incomeGradient: {
        id: 'incomeGradient',
        stops: [
            { offset: '0%', color: '#10B981', opacity: 1 },
            { offset: '100%', color: '#059669', opacity: 0.8 }
        ]
    },
    expenseGradient: {
        id: 'expenseGradient',
        stops: [
            { offset: '0%', color: '#EF4444', opacity: 1 },
            { offset: '100%', color: '#DC2626', opacity: 0.8 }
        ]
    },
    profitGradient: {
        id: 'profitGradient',
        stops: [
            { offset: '0%', color: '#2DD4BF', opacity: 1 },
            { offset: '100%', color: '#14B8A6', opacity: 0.8 }
        ]
    }
};

// Chart tooltip styling
export const tooltipStyle = {
    container: {
        background: 'var(--bg-card)',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        border: '1px solid var(--border-light)'
    },
    title: {
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: 'var(--text-main)',
        marginBottom: '0.5rem'
    },
    label: {
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)'
    },
    value: {
        fontWeight: 600,
        color: 'var(--text-main)'
    }
};

// Chart axis styling
export const axisStyle = {
    axisLine: false,
    tickLine: false,
    tick: {
        fill: 'var(--text-muted)',
        fontSize: 10,
        fontWeight: 500
    }
};

// Chart grid styling
export const gridStyle = {
    strokeDasharray: '3 3',
    vertical: false,
    stroke: 'var(--border-light)',
    strokeOpacity: 0.5
};

// Format currency for charts
export const formatCurrency = (value: number): string => {
    if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
        return `₹${(value / 1000).toFixed(0)}k`;
    }
    return `₹${value}`;
};

// Format full currency with Indian locale
export const formatFullCurrency = (value: number): string => {
    return `₹${value.toLocaleString('en-IN')}`;
};

// Expense category color map
export const expenseCategoryColors: Record<string, string> = {
    'Diesel / Fuel': chartColors.categories.fuel,
    'Fuel': chartColors.categories.fuel,
    'Maintenance': chartColors.categories.maintenance,
    'Spares': chartColors.categories.maintenance,
    'Salary': chartColors.categories.labor,
    'Labor': chartColors.categories.labor,
    'Machine EMI': chartColors.categories.emi,
    'EMI': chartColors.categories.emi,
    'Other': chartColors.categories.other,
    'Other Expenses': chartColors.categories.other
};

export default {
    colors: chartColors,
    gradients: chartGradients,
    tooltip: tooltipStyle,
    axis: axisStyle,
    grid: gridStyle,
    formatCurrency,
    formatFullCurrency,
    expenseCategoryColors
};
