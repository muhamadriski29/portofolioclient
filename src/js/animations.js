// animations.js - Intersection Observer for scroll animations

document.addEventListener('DOMContentLoaded', () => {
    // Set up Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add an animation class when element comes into view
                // For this project, we'll use a simple CSS transform/opacity reveal
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) translateX(0)';
                // Optional: stop observing once animated
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply initial styles and observe elements
    // We'll target article elements (cards) and prose sections
    const animateElements = document.querySelectorAll('article, .prose');
    
    animateElements.forEach((el, index) => {
        // Initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`;
        
        observer.observe(el);
    });

    // Custom fade-in-up animation for the hero section
    const heroElements = document.querySelectorAll('.animate-fade-in-up');
    heroElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        
        // Trigger reflow
        void el.offsetWidth;
        
        el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });
});
