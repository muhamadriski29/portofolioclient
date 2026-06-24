// admin.js — Admin Panel: Full CRUD for Projects API
// Endpoints:
//   GET    http://localhost:8080/api/projects
//   POST   http://localhost:8080/api/projects
//   PUT    http://localhost:8080/api/projects/{id}
//   DELETE http://localhost:8080/api/projects/{id}

(function () {
    'use strict';

    // ─── Config ───────────────────────────────────────────────────────────────
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
        ? 'http://localhost:8080/api/projects' 
        : 'https://api.domainanda.com/api/projects';
    const AUTH_KEY = 'cms_admin_auth';

    // ─── State ────────────────────────────────────────────────────────────────
    let editingId = null;   // null = create mode, number = edit mode
    let projectCache = [];     // cached project list

    // ─── Auth Guard ───────────────────────────────────────────────────────────
    function checkAuth() {
        const auth = localStorage.getItem(AUTH_KEY);
        if (auth !== 'true') {
            window.location.href = './admin-login.html';
        }
    }

    // ─── DOM References ───────────────────────────────────────────────────────
    const form = document.getElementById('project-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitBtnText = document.getElementById('submit-btn-text');
    const submitIcon = document.getElementById('submit-icon');
    const messageBox = document.getElementById('admin-message');
    const statusBarText = document.getElementById('status-bar-text');
    const statusBarMethod = document.getElementById('status-bar-method');
    const tbody = document.getElementById('projects-tbody');
    const tableLoading = document.getElementById('table-loading');
    const tableEmpty = document.getElementById('table-empty');
    const tableStatus = document.getElementById('table-status');
    const projectCount = document.getElementById('project-count-badge');
    const formTitle = document.getElementById('form-title');
    const formIcon = document.getElementById('form-icon');
    const editBanner = document.getElementById('edit-banner');
    const editIdDisplay = document.getElementById('edit-id-display');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const adminUserDisplay = document.getElementById('admin-user-display');

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function updateStatusBar(text, method = null) {
        if (statusBarText) statusBarText.textContent = text;
        if (method && statusBarMethod) statusBarMethod.textContent = method;
    }

    function updateTableStatus(text) {
        if (tableStatus) tableStatus.textContent = text;
    }

    function showMessage(type, message) {
        const isSuccess = type === 'success';
        const color = isSuccess ? 'dark:shadow-brutal-cyan' : 'dark:shadow-brutal-pink';
        const titleText = isSuccess ? '✓ SUCCESS.LOG' : '⚠ ERROR.SYS';
        const titleColor = isSuccess
            ? 'dark:text-y2k-lime text-green-700'
            : 'dark:text-y2k-pink text-red-700';
        const icon = isSuccess ? '✔' : '✕';
        const opTitle = isSuccess ? 'OPERATION_SUCCESS' : 'OPERATION_FAILED';

        messageBox.className = `fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] max-w-[90vw] sm:max-w-md border-win95 bg-y2k-light dark:bg-black ${color} shadow-brutal dark:shadow-brutal-cyan transition-opacity duration-300`;
        messageBox.innerHTML = `
            <div class="win-titlebar px-2 py-1 flex justify-between items-center text-white font-pixel font-bold">
                <span>${titleText}</span>
                <button onclick="window.closeAdminMessage()" class="border-win95 bg-y2k-light dark:bg-black text-black dark:text-white px-1 text-xs active:border-win95-inset">X</button>
            </div>
            <div class="p-4 border-win95-inset m-1 bg-white dark:bg-y2k-dark flex items-start gap-3">
                <span class="font-pixel text-3xl ${titleColor} flex-shrink-0 leading-none mt-1">${icon}</span>
                <div class="w-full">
                    <p class="font-pixel text-xl sm:text-2xl ${titleColor} font-bold uppercase mb-1">${opTitle}</p>
                    <p class="font-medium dark:text-y2k-white text-xs sm:text-sm">${escapeHtml(message)}</p>
                    ${!isSuccess ? `
                    <div class="font-pixel text-xs sm:text-sm dark:text-y2k-cyan text-gray-500 mt-2 space-y-0.5">
                        <p>&gt; Endpoint: <span class="dark:text-y2k-white">${API_URL}</span></p>
                        <p>&gt; Pastikan server backend sedang berjalan di localhost:8080.</p>
                    </div>` : ''}
                </div>
            </div>
        `;
        messageBox.classList.remove('hidden');
        
        // Auto-close toast for success messages after 4 seconds
        if (window.adminToastTimeout) clearTimeout(window.adminToastTimeout);
        if (isSuccess) {
            window.adminToastTimeout = setTimeout(() => {
                window.closeAdminMessage();
            }, 4000);
        }
    }

    window.closeAdminMessage = function () {
        messageBox.classList.add('hidden');
        messageBox.innerHTML = '';
    };

    function setSubmitLoading(loading) {
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-60', 'cursor-not-allowed', 'translate-x-[4px]', 'translate-y-[4px]');
            submitBtn.classList.remove('shadow-brutal', 'dark:shadow-brutal-cyan');
            submitBtnText.textContent = '[ SENDING... ]';
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-60', 'cursor-not-allowed', 'translate-x-[4px]', 'translate-y-[4px]');
            submitBtn.classList.add('shadow-brutal', 'dark:shadow-brutal-cyan');
            submitBtnText.textContent = editingId !== null ? '[ UPDATE PROJECT ]' : '[ SUBMIT PROJECT ]';
        }
    }

    function validateFormData(data) {
        const errors = [];
        if (!data.title?.trim()) errors.push('Field TITLE tidak boleh kosong.');
        if (!data.slug?.trim()) errors.push('Field SLUG tidak boleh kosong.');
        else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug.trim()))
            errors.push('SLUG hanya boleh berisi huruf kecil, angka, dan tanda hubung.');
        if (!data.description?.trim()) errors.push('Field DESCRIPTION tidak boleh kosong.');
        return { isValid: errors.length === 0, errors };
    }

    // ─── Auto-generate slug from title ────────────────────────────────────────
    function initSlugAutoGenerator() {
        const titleInput = document.getElementById('field-title');
        const slugInput = document.getElementById('field-slug');
        if (!titleInput || !slugInput) return;

        let userEditedSlug = false;
        slugInput.addEventListener('input', () => { userEditedSlug = slugInput.value.length > 0; });
        titleInput.addEventListener('input', () => {
            if (userEditedSlug) return;
            slugInput.value = titleInput.value
                .toLowerCase().trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 60);
        });
    }

    // ─── Logout ───────────────────────────────────────────────────────────────
    function handleLogout() {
        if (!confirm('Yakin ingin logout dari Admin Panel?')) return;
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem('cms_admin_user');
        localStorage.removeItem('cms_admin_login_time');
        window.location.href = './admin-login.html';
    }

    // ─── ENTER EDIT MODE ──────────────────────────────────────────────────────
    function enterEditMode(project) {
        editingId = project.id;

        // Fill form
        document.getElementById('field-id').value = project.id;
        document.getElementById('field-title').value = project.title || '';
        document.getElementById('field-slug').value = project.slug || '';
        document.getElementById('field-description').value = project.description || '';
        document.getElementById('field-image-url').value = project.image_url || '';
        document.getElementById('field-portfolio-url').value = project.portfolio_url || '';
        document.getElementById('field-tech-stack').value = project.tech_stack || '';

        // Update UI
        formTitle.textContent = 'EDIT_PROJECT.FORM';
        if (formIcon) {
            formIcon.setAttribute('data-lucide', 'file-edit');
            lucide.createIcons();
        }
        editBanner.classList.remove('hidden');
        editIdDisplay.textContent = `#${project.id} — ${escapeHtml(project.title)}`;
        cancelEditBtn.classList.remove('hidden');
        submitBtnText.textContent = '[ UPDATE PROJECT ]';
        updateStatusBar('EDIT MODE — MODIFY & SUBMIT TO UPDATE', `PUT → /api/projects/${project.id}`);

        // Scroll to form
        document.getElementById('form-window').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('field-title').focus();
    }

    function exitEditMode() {
        editingId = null;
        form.reset();
        document.getElementById('field-id').value = '';

        formTitle.textContent = 'NEW_PROJECT.FORM';
        if (formIcon) {
            formIcon.setAttribute('data-lucide', 'file-plus');
            lucide.createIcons();
        }
        editBanner.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');
        submitBtnText.textContent = '[ SUBMIT PROJECT ]';
        updateStatusBar('READY', 'POST → /api/projects');
    }

    // ─── RENDER TABLE ─────────────────────────────────────────────────────────
    function renderTable(projects) {
        tableLoading.classList.add('hidden');

        if (!projects || projects.length === 0) {
            tbody.innerHTML = '';
            tableEmpty.classList.remove('hidden');
            if (projectCount) { projectCount.textContent = '0 RECORDS'; projectCount.classList.remove('hidden'); }
            updateTableStatus('NO RECORDS FOUND');
            return;
        }

        tableEmpty.classList.add('hidden');
        if (projectCount) {
            projectCount.textContent = `${projects.length} RECORD${projects.length > 1 ? 'S' : ''}`;
            projectCount.classList.remove('hidden');
        }
        updateTableStatus(`${projects.length} RECORDS LOADED — OK`);

        // Sort by id ascending
        projects.sort((a, b) => a.id - b.id);

        tbody.innerHTML = projects.map((p, index) => {
            const techTags = p.tech_stack
                ? p.tech_stack.split(',').map(t => `<span class="inline-block border border-current px-1 text-xs font-pixel dark:text-y2k-cyan text-y2k-blue mr-1 mb-0.5">${escapeHtml(t.trim())}</span>`).join('')
                : '<span class="dark:text-gray-600 text-gray-400 font-pixel text-sm">—</span>';

            return `
           <tr class="project-row border-b border-y2k-dark dark:border-gray-700" data-id="${p.id}">
                <td class="px-3 py-2 font-pixel text-base md:text-lg dark:text-y2k-yellow text-y2k-dark whitespace-nowrap">#${index + 1}</td>
                
                <td class="px-3 py-2 min-w-[120px] sm:min-w-[200px] whitespace-normal">
                    <div class="font-bold text-sm sm:text-base dark:text-y2k-white break-words whitespace-normal">${escapeHtml(p.title)}</div>
                    <div class="font-pixel text-xs sm:text-sm dark:text-gray-500 text-gray-400 break-words whitespace-normal mt-1">${escapeHtml(p.description || '').substring(0, 50)}${(p.description || '').length > 50 ? '...' : ''}</div>
                </td>
                
                <td class="px-3 py-2 whitespace-nowrap">
                    <code class="font-pixel text-xs sm:text-sm dark:text-y2k-lime text-y2k-dark">${escapeHtml(p.slug)}</code>
                </td>
                
                <td class="px-3 py-2 min-w-[100px] sm:min-w-[150px] max-w-xs whitespace-normal">
                    <div class="flex flex-wrap gap-1">${techTags}</div>
                </td>
                
                <td class="px-3 py-2 whitespace-nowrap text-center">
                    <div class="flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                            onclick="window.handleEditClick(${p.id})"
                            class="border-win95 bg-y2k-light dark:bg-black dark:text-y2k-cyan text-y2k-dark font-pixel text-xs sm:text-sm md:text-base px-2 sm:px-3 py-0.5 font-bold active:border-win95-inset hover:bg-y2k-blue hover:text-white dark:hover:bg-y2k-cyan dark:hover:text-black transition-colors"
                            aria-label="Edit proyek ${escapeHtml(p.title)}"
                        >[ EDIT ]</button>
                        <button
                            onclick="window.handleDeleteClick(${p.id}, '${escapeHtml(p.title).replace(/'/g, "\\'")}')"
                            class="border-win95 bg-y2k-light dark:bg-black dark:text-y2k-pink text-red-600 font-pixel text-xs sm:text-sm md:text-base px-2 sm:px-3 py-0.5 font-bold active:border-win95-inset hover:bg-red-600 hover:text-white dark:hover:bg-y2k-pink dark:hover:text-black transition-colors"
                            aria-label="Hapus proyek ${escapeHtml(p.title)}"
                        >[ DEL ]</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    // ─── API: FETCH ALL PROJECTS ──────────────────────────────────────────────
    async function fetchProjects() {
        tableLoading.classList.remove('hidden');
        tableEmpty.classList.add('hidden');
        tbody.innerHTML = '';
        updateTableStatus('FETCHING DATA FROM API...');

        try {
            const res = await fetch(API_URL, {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                mode: 'cors',
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

            const json = await res.json();
            // Support both { data: [...] } and [...] formats
            const projects = Array.isArray(json) ? json : (json.data || []);
            projectCache = projects;
            renderTable(projects);

        } catch (err) {
            tableLoading.classList.add('hidden');
            console.error('[ADMIN.EXE] Fetch projects error:', err);
            updateTableStatus(`ERROR — ${err.message}`);
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-8 text-center font-pixel text-xl dark:text-y2k-pink text-red-500">
                        &gt; KONEKSI KE SERVER GAGAL<br>
                        <span class="text-sm dark:text-gray-500 text-gray-400">&gt; ${escapeHtml(err.message)}</span>
                    </td>
                </tr>
            `;
        }
    }

    // ─── API: CREATE PROJECT ──────────────────────────────────────────────────
    async function createProject(data) {
        setSubmitLoading(true);
        updateStatusBar('SENDING POST REQUEST...');

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                mode: 'cors',
                body: JSON.stringify(data),
            });

            let json = null;
            try { json = await res.json(); } catch (_) { }

            if (res.status === 201 || res.ok) {
                const title = json?.data?.title || data.title;
                showMessage('success', `Project "${title}" berhasil ditambahkan!`);
                form.reset();
                updateStatusBar('WRITE SUCCESS — 201 CREATED', 'POST → /api/projects');
                await fetchProjects();
                document.getElementById('projects-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const msg = json?.message || json?.error || `Server error ${res.status}: ${res.statusText}`;
                showMessage('error', msg);
                updateStatusBar(`ERROR — ${res.status}`);
            }
        } catch (err) {
            console.error('[ADMIN.EXE] Create error:', err);
            const msg = err.name === 'TypeError'
                ? 'Tidak dapat terhubung ke server. Pastikan backend berjalan di localhost:8080.'
                : err.message;
            showMessage('error', msg);
            updateStatusBar('CONNECTION FAILED');
        } finally {
            setSubmitLoading(false);
        }
    }

    // ─── API: UPDATE PROJECT ──────────────────────────────────────────────────
    async function updateProject(id, data) {
        setSubmitLoading(true);
        updateStatusBar(`SENDING PUT REQUEST FOR ID #${id}...`);

        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                mode: 'cors',
                body: JSON.stringify(data),
            });

            let json = null;
            try { json = await res.json(); } catch (_) { }

            if (res.ok) {
                const title = json?.data?.title || data.title;
                showMessage('success', `Project "${title}" berhasil diperbarui! (ID: #${id})`);
                exitEditMode();
                updateStatusBar('UPDATE SUCCESS — 200 OK', 'POST → /api/projects');
                await fetchProjects();
                document.getElementById('projects-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const msg = json?.message || json?.error || `Server error ${res.status}: ${res.statusText}`;
                showMessage('error', msg);
                updateStatusBar(`ERROR — ${res.status}`);
            }
        } catch (err) {
            console.error('[ADMIN.EXE] Update error:', err);
            const msg = err.name === 'TypeError'
                ? 'Tidak dapat terhubung ke server. Pastikan backend berjalan di localhost:8080.'
                : err.message;
            showMessage('error', msg);
            updateStatusBar('CONNECTION FAILED');
        } finally {
            setSubmitLoading(false);
        }
    }

    // ─── API: DELETE PROJECT ──────────────────────────────────────────────────
    async function deleteProject(id, title) {
        updateTableStatus(`DELETING ID #${id}...`);

        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                mode: 'cors',
            });

            let json = null;
            try { json = await res.json(); } catch (_) { }

            if (res.ok || res.status === 204) {
                showMessage('success', `Project "${title}" (ID: #${id}) berhasil dihapus!`);
                // If currently editing this project, reset form
                if (editingId === id) exitEditMode();
                await fetchProjects();
            } else {
                const msg = json?.message || json?.error || `Server error ${res.status}: ${res.statusText}`;
                showMessage('error', msg);
                updateTableStatus(`DELETE FAILED — ${res.status}`);
            }
        } catch (err) {
            console.error('[ADMIN.EXE] Delete error:', err);
            const msg = err.name === 'TypeError'
                ? 'Tidak dapat terhubung ke server.'
                : err.message;
            showMessage('error', msg);
            updateTableStatus('CONNECTION FAILED');
        }
    }

    // ─── Global button handlers (used in table HTML) ──────────────────────────

    window.handleEditClick = function (id) {
        const project = projectCache.find(p => p.id == id || p.id === id);
        if (!project) {
            showMessage('error', `Proyek dengan ID #${id} tidak ditemukan dalam cache. Coba refresh.`);
            return;
        }
        enterEditMode(project);
    };

    window.handleDeleteClick = function (id, title) {
        if (!confirm(`⚠ KONFIRMASI HAPUS\n\nAnda akan menghapus:\n"${title}" (ID: #${id})\n\nTindakan ini TIDAK BISA dibatalkan!\nLanjutkan?`)) return;
        deleteProject(id, title);
    };

    // ─── FORM SUBMIT HANDLER ──────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        window.closeAdminMessage();

        const formData = new FormData(form);
        const data = {
            title: formData.get('title')?.trim() || '',
            slug: formData.get('slug')?.trim() || '',
            description: formData.get('description')?.trim() || '',
            image_url: formData.get('image_url')?.trim() || null,
            portfolio_url: formData.get('portfolio_url')?.trim() || null,
            tech_stack: formData.get('tech_stack')?.trim() || null,
        };

        // Remove empty optionals
        if (!data.image_url) delete data.image_url;
        if (!data.portfolio_url) delete data.portfolio_url;
        if (!data.tech_stack) delete data.tech_stack;

        // Validate
        const { isValid, errors } = validateFormData(data);
        if (!isValid) {
            showMessage('error', `Validasi gagal:\n• ${errors.join('\n• ')}`);
            return;
        }

        if (editingId !== null) {
            await updateProject(editingId, data);
        } else {
            await createProject(data);
        }
    }

    // ─── INITIALIZE ───────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Auth guard first
        checkAuth();

        // 2. Display logged-in user
        const user = localStorage.getItem('cms_admin_user');
        if (adminUserDisplay && user) {
            adminUserDisplay.textContent = `▶ Logged in as: ${user}`;
        }

        // 3. Wire up events
        form?.addEventListener('submit', handleSubmit);
        cancelEditBtn?.addEventListener('click', exitEditMode);
        logoutBtn?.addEventListener('click', handleLogout);
        refreshBtn?.addEventListener('click', fetchProjects);

        // 4. Auto-slug
        initSlugAutoGenerator();

        // 5. Load projects
        await fetchProjects();

        updateStatusBar('READY', 'POST → /api/projects');
    });

})();
