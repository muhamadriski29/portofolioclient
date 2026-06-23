// main.js - Core functionality like Theme Toggle and Mobile Menu

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // 2. Theme Management (Dark/Light Mode)
    const htmlEl = document.documentElement;
    const themeToggles = [
        document.getElementById('theme-toggle'),
        document.getElementById('mobile-theme-toggle')
    ];

    // Check local storage or system preference on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        htmlEl.classList.remove('dark');
    } else {
        // Default is dark as per requirements
        htmlEl.classList.add('dark');
    }

    // Toggle function
    const toggleTheme = () => {
        if (htmlEl.classList.contains('dark')) {
            htmlEl.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            htmlEl.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    };

    // Add event listeners to all theme toggle buttons
    themeToggles.forEach(btn => {
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
