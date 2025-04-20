// Default values
const DEFAULTS = {
    nickname: 'Guest',
    theme: 'light',
    settings: {
        defaultModel: 'chatgpt-4o-latest',
        enableStreaming: true,
        enableWebSearch: false,
        enableCodeInterpreter: false
    }
};

// Theme CSS variables
const THEME_VARIABLES = {
    light: {
        '--bg': '#f9f9f9',
        '--sidebar-bg': '#ffffff',
        '--content-bg': '#ffffff',
        '--text-primary': '#1d1d1f',
        '--text-secondary': '#6e6e73',
        '--text-tertiary': '#8a8a8e',
        '--border-light': '#e5e5e5',
        '--border-medium': '#d1d1d6',
        '--input-bg': '#f2f2f7',
        '--hover-bg': 'rgba(0, 0, 0, 0.04)'
    },
    dark: {
        '--bg': '#1c1c1e',
        '--sidebar-bg': '#2c2c2e',
        '--content-bg': '#2c2c2e',
        '--text-primary': '#ffffff',
        '--text-secondary': '#98989d',
        '--text-tertiary': '#68686d',
        '--border-light': '#3a3a3c',
        '--border-medium': '#48484a',
        '--input-bg': '#1c1c1e',
        '--hover-bg': 'rgba(255, 255, 255, 0.04)'
    },
    offwhite: {
        '--bg': '#ffffff',
        '--sidebar-bg': '#f5f5f7',
        '--content-bg': '#ffffff',
        '--text-primary': '#1d1d1f',
        '--text-secondary': '#6e6e73',
        '--text-tertiary': '#8a8a8e',
        '--border-light': '#e5e5e5',
        '--border-medium': '#d1d1d6',
        '--input-bg': '#f9f9f9',
        '--hover-bg': 'rgba(0, 0, 0, 0.02)'
    }
};

// 1. Nickname Management
export function getNickname() {
    return localStorage.getItem('nickname') || DEFAULTS.nickname;
}

export function setNickname(name) {
    if (!name || typeof name !== 'string') {
        throw new Error('Invalid nickname');
    }
    localStorage.setItem('nickname', name.trim());
}

export function clearNickname() {
    localStorage.removeItem('nickname');
}

// 2. Theme Handling
export function getTheme() {
    return localStorage.getItem('theme') || DEFAULTS.theme;
}

export function setTheme(theme) {
    if (!THEME_VARIABLES[theme]) {
        throw new Error(`Invalid theme: ${theme}`);
    }
    localStorage.setItem('theme', theme);
    applyTheme();
}

export function applyTheme() {
    const theme = getTheme();
    const vars = THEME_VARIABLES[theme];

    // Remove existing theme classes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-offwhite');
    document.body.classList.add(`theme-${theme}`);

    // Apply CSS variables
    for (const [key, value] of Object.entries(vars)) {
        document.documentElement.style.setProperty(key, value);
    }
}

// 3. Settings Persistence
export function getSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem('settings') || '{}');
        return { ...DEFAULTS.settings, ...stored };
    } catch (e) {
        console.error('Error reading settings:', e);
        return { ...DEFAULTS.settings };
    }
}

export function updateSettings(partial) {
    const current = getSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem('settings', JSON.stringify(updated));
    return updated;
}

export function resetSettings() {
    localStorage.removeItem('settings');
    return { ...DEFAULTS.settings };
}

// 4. Usage Tracking
function initSession() {
    if (!localStorage.getItem('session_start')) {
        localStorage.setItem('session_start', Date.now().toString());
    }
}

function getUsageData() {
    try {
        return JSON.parse(localStorage.getItem('usage_stats') || '{}');
    } catch (e) {
        return {};
    }
}

function updateUsageData(data) {
    localStorage.setItem('usage_stats', JSON.stringify(data));
}

export function incrementMessageCount() {
    const data = getUsageData();
    data.totalMessages = (data.totalMessages || 0) + 1;
    updateUsageData(data);
}

export function incrementChatCount() {
    const data = getUsageData();
    data.totalChats = (data.totalChats || 0) + 1;
    data.lastActive = new Date().toISOString();
    updateUsageData(data);
}

export function getUsageStats() {
    initSession();
    const data = getUsageData();
    return {
        totalMessages: data.totalMessages || 0,
        totalChats: data.totalChats || 0,
        sessionStart: parseInt(localStorage.getItem('session_start') || Date.now()),
        lastActive: data.lastActive || new Date().toISOString()
    };
}

export function resetUsageStats() {
    localStorage.removeItem('usage_stats');
    localStorage.removeItem('session_start');
}

// Auto-apply theme when this module is loaded
// applyTheme(); // Removed: Handled by app.js now
