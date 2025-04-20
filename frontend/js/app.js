import {
    applyTheme,
    getSettings,
    getNickname,
    initSession
} from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Apply the theme immediately
    applyTheme();

    // 2. Initialize session tracking
    initSession();

    // 3. Load and display nickname if element exists
    const nicknameDisplay = document.querySelector('#nickname-display'); // Adjust selector if needed
    if (nicknameDisplay) {
        nicknameDisplay.textContent = getNickname();
    }

    // 4. Load settings (might be used by other global components later)
    const settings = getSettings();
    console.log('Loaded settings:', settings); // Optional: for debugging

    // 5. Setup global navigation button handlers
    const settingsBtn = document.querySelector('#settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // Example: Navigate to settings page or open modal
            console.log('Settings button clicked');
            // window.location.href = '/settings.html'; // Or show modal
        });
    }

    const profileBtn = document.querySelector('#profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            // Example: Navigate to profile page
            console.log('Profile button clicked');
            // window.location.href = '/profile.html';
        });
    }
    
    // Add other global button handlers here, checking for element existence
    // e.g., const helpBtn = document.querySelector('#helpBtn'); ...
});