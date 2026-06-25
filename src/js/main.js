// main.js - Core functionality like Theme Toggle and Mobile Menu

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // 2. Theme Management (Dark/Light Mode)
    const htmlEl = document.documentElement;
    
    // Dark Mode Toggles
    const darkModeToggles = [
        document.getElementById('darkmode-toggle'),
        document.getElementById('mobile-darkmode-toggle')
    ];

    // Check local storage on load
    const savedTheme = localStorage.getItem('theme');
    // Default is light as per requirements (no auto device detection)
    if (savedTheme === 'dark') {
        htmlEl.classList.add('dark');
    } else {
        htmlEl.classList.remove('dark');
    }

    // Function to update the icon of the dark mode buttons
    const updateDarkModeIcon = () => {
        const isDark = htmlEl.classList.contains('dark');
        darkModeToggles.forEach(btn => {
            if (btn) {
                const iconName = isDark ? 'sun' : 'moon';
                if (btn.id === 'mobile-darkmode-toggle') {
                    const text = isDark ? ' LIGHT_MODE' : ' DARK_MODE';
                    btn.innerHTML = `<i data-lucide="${iconName}"></i>${text}`;
                } else {
                    btn.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
                }
            }
        });
        // Re-initialize new icons
        lucide.createIcons();
    };

    // Initial icon setup
    updateDarkModeIcon();

    // Toggle function
    const toggleTheme = () => {
        if (htmlEl.classList.contains('dark')) {
            htmlEl.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            htmlEl.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        updateDarkModeIcon();
    };

    // Add event listeners to the dark mode buttons
    darkModeToggles.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', toggleTheme);
        }
    });

    // 3. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu && closeMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });

        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        });
    }
});
