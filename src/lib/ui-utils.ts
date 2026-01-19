
// UI Utilities for Haptics and other interactions

export const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export const playSuccessHaptic = () => vibrate([50]);
export const playErrorHaptic = () => vibrate([50, 50, 50]);
export const playClickHaptic = () => vibrate(10);
