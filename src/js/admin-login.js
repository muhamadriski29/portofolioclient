// admin-login.js — Y2K CMS Login Handler
// Credentials: username=admin, password=lupasandi123!

(function () {
    'use strict';

    // ─── Config ───────────────────────────────────────────────────────────────
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'lupasandi123!';
    const AUTH_KEY       = 'cms_admin_auth';
    const REDIRECT_URL   = './admin.html';

    // ─── DOM References ───────────────────────────────────────────────────────
    const loginForm    = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginBtn     = document.getElementById('login-btn');
    const loginBtnText = document.getElementById('login-btn-text');
    const messageBox   = document.getElementById('login-message');
    const statusBar    = document.getElementById('login-status');
    const togglePwdBtn = document.getElementById('toggle-password');
    const eyeIcon      = document.getElementById('eye-icon');

    // ─── On Load: if already logged in, redirect immediately ─────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const auth = localStorage.getItem(AUTH_KEY);
        if (auth === 'true') {
            window.location.href = REDIRECT_URL;
            return;
        }

        // Focus username field
        usernameInput?.focus();

        // Toggle password visibility
        togglePwdBtn?.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            // Update icon
            if (eyeIcon) {
                eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
                lucide.createIcons();
            }
        });

        // Form submit
        loginForm?.addEventListener('submit', handleLogin);

        // Clear error on input
        usernameInput?.addEventListener('input', clearMessage);
        passwordInput?.addEventListener('input', clearMessage);

        updateStatus('AWAITING INPUT...');
    });

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function showError(msg) {
        messageBox.textContent = '⚠ ' + msg;
        messageBox.classList.remove('hidden');
        // Shake the window
        const win = document.getElementById('login-window');
        win.classList.add('shake');
        setTimeout(() => win.classList.remove('shake'), 400);
    }

    function clearMessage() {
        messageBox.classList.add('hidden');
        messageBox.textContent = '';
    }

    function updateStatus(text) {
        if (statusBar) statusBar.textContent = text;
    }

    function setLoading(loading) {
        if (loading) {
            loginBtn.disabled = true;
            loginBtn.classList.add('opacity-60', 'cursor-not-allowed');
            loginBtnText.textContent = '[ AUTHENTICATING... ]';
            updateStatus('VERIFYING CREDENTIALS...');
        } else {
            loginBtn.disabled = false;
            loginBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            loginBtnText.textContent = '[ LOGIN.EXE ]';
            updateStatus('AWAITING INPUT...');
        }
    }

    // ─── Login Handler ────────────────────────────────────────────────────────

    async function handleLogin(e) {
        e.preventDefault();
        clearMessage();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Basic validation
        if (!username || !password) {
            showError('USERNAME dan PASSWORD tidak boleh kosong!');
            return;
        }

        setLoading(true);

        // Simulate brief processing delay for UX (feels more real)
        await new Promise(resolve => setTimeout(resolve, 600));

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // ✅ Credentials match
            updateStatus('ACCESS GRANTED — REDIRECTING...');
            loginBtnText.textContent = '[ ACCESS GRANTED ✔ ]';

            // Store auth in localStorage
            localStorage.setItem(AUTH_KEY, 'true');
            localStorage.setItem('cms_admin_user', username);
            localStorage.setItem('cms_admin_login_time', new Date().toISOString());

            // Redirect after short delay
            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.href = REDIRECT_URL;

        } else {
            // ❌ Wrong credentials
            setLoading(false);
            updateStatus('ACCESS DENIED — 401 UNAUTHORIZED');
            showError('Username atau password salah! Akses ditolak.');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

})();
