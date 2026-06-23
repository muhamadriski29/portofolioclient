// projects.js - Fetch & render projects from REST API
// Endpoint: http://localhost:8080/api/projects

const API_URL = 'http://localhost:8080/api/projects';

// Y2K color accent cycling for card variety
const ACCENT_COLORS = [
    { shadow: 'shadow-brutal-cyan',  border: 'border-y2k-lime', overlay: 'bg-y2k-pink',  title: 'text-y2k-pink', btn: 'bg-y2k-lime',  btnHover: 'hover:bg-y2k-cyan' },
    { shadow: 'shadow-brutal-pink',  border: 'border-y2k-pink', overlay: 'bg-y2k-cyan',  title: 'text-y2k-cyan', btn: 'bg-y2k-pink',  btnHover: 'hover:bg-y2k-cyan' },
    { shadow: 'shadow-brutal-lime',  border: 'border-y2k-cyan', overlay: 'bg-y2k-lime',  title: 'text-y2k-lime', btn: 'bg-y2k-cyan',  btnHover: 'hover:bg-y2k-lime' },
];

// Badge color palette for tech stack tags
const BADGE_STYLES = [
    'bg-y2k-blue dark:bg-y2k-cyan text-white dark:text-black',
    'bg-black dark:bg-y2k-lime text-white dark:text-black',
    'bg-y2k-dark dark:bg-y2k-pink text-white dark:text-black',
    'bg-y2k-blue dark:bg-y2k-yellow text-white dark:text-black',
    'bg-black dark:bg-white text-white dark:text-black',
];

/**
 * Generates the Win95-style card HTML for a single project.
 * @param {Object} project - Project data from API
 * @param {number} index - Index for color cycling
 * @returns {string} HTML string
 */
function createProjectCard(project, index) {
    const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

    // Generate tech stack badges
    const techStackHtml = parseTechStack(project.tech_stack)
        .map((tech, i) => {
            const badgeClass = BADGE_STYLES[i % BADGE_STYLES.length];
            return `<span class="${badgeClass} px-2 py-0.5 text-sm uppercase tracking-wider">${escapeHtml(tech)}</span>`;
        })
        .join('');

    // Generate titlebar name from project title
    const titlebarName = project.title
        ? project.title.toUpperCase().replace(/\s+/g, '_').substring(0, 20) + '.EXE'
        : 'UNKNOWN.EXE';

    // Image section: show actual image or fallback icon
    const imageSection = project.image_url
        ? `<img src="${escapeHtml(project.image_url)}" 
                alt="${escapeHtml(project.title)}" 
                class="w-full h-full object-cover"
                onerror="this.parentElement.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' class=\\'text-gray-400 dark:text-y2k-lime\\'><rect width=\\'18\\' height=\\'18\\' x=\\'3\\' y=\\'3\\' rx=\\'2\\'/><circle cx=\\'9\\' cy=\\'9\\' r=\\'2\\'/><path d=\\'m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\\'/></svg>'"
           >`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400 dark:text-y2k-lime"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;

    return `
        <article class="project-card border-win95 bg-y2k-light dark:bg-black shadow-brutal dark:${accent.shadow} hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 flex flex-col h-full group"
                 style="opacity: 0; transform: translateY(20px);">
            <!-- Win95 Title Bar -->
            <div class="win-titlebar px-2 py-1 flex justify-between items-center text-white font-pixel font-bold">
                <span>${escapeHtml(titlebarName)}</span>
                <div class="flex gap-1">
                    <button class="border-win95 bg-y2k-light dark:bg-black text-black dark:text-white px-1 text-xs active:border-win95-inset" aria-label="Minimize">_</button>
                    <button class="border-win95 bg-y2k-light dark:bg-black text-black dark:text-white px-1 text-xs active:border-win95-inset" aria-label="Maximize">□</button>
                    <button class="border-win95 bg-y2k-light dark:bg-black text-black dark:text-white px-1 text-xs active:border-win95-inset" aria-label="Close">X</button>
                </div>
            </div>

            <!-- Card Content -->
            <div class="p-2 border-win95-inset m-1 bg-white dark:bg-y2k-dark flex-grow flex flex-col">
                <!-- Image Area -->
                <div class="h-40 bg-gray-200 dark:bg-black border-2 border-dashed border-y2k-dark dark:${accent.border} mb-4 flex items-center justify-center relative overflow-hidden">
                    <div class="absolute inset-0 ${accent.overlay} opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    ${imageSection}
                </div>

                <!-- Tech Stack Badges -->
                ${techStackHtml ? `<div class="flex flex-wrap gap-2 mb-3 font-pixel">${techStackHtml}</div>` : ''}

                <!-- Title -->
                <h2 class="text-2xl font-bold uppercase mb-2 dark:${accent.title}">
                    ${escapeHtml(project.title || 'Untitled Project')}
                </h2>

                <!-- Description -->
                <p class="font-medium mb-4 flex-grow text-sm dark:text-y2k-white leading-relaxed">
                    ${escapeHtml(project.description || 'No description available.')}
                </p>

                <!-- Action Button -->
                <a href="${project.project_url || project.demo_url || '#'}" 
                   target="_blank" rel="noopener noreferrer"
                   class="font-pixel text-xl text-center border-win95 bg-y2k-light dark:${accent.btn} dark:text-black text-y2k-dark py-1 font-bold hover:bg-y2k-blue hover:text-white dark:${accent.btnHover} transition-colors active:border-win95-inset block">
                    [ RUN PROGRAM ]
                </a>
            </div>
        </article>
    `;
}

/**
 * Renders the BSOD-style error message inside the container.
 * @param {string} message - Error message to display
 */
function renderError(message) {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full border-win95 bg-y2k-light dark:bg-black">
            <div class="win-titlebar px-2 py-1 flex justify-between items-center text-white font-pixel font-bold">
                <span>⚠ ERROR.SYS</span>
                <div class="flex gap-1">
                    <button class="border-win95 bg-y2k-light dark:bg-black text-black dark:text-white px-1 text-xs">X</button>
                </div>
            </div>
            <div class="p-6 border-win95-inset m-1 bg-white dark:bg-y2k-dark">
                <div class="flex items-start gap-4">
                    <div class="text-4xl flex-shrink-0 select-none">
                        <span class="dark:text-y2k-pink text-red-600">✕</span>
                    </div>
                    <div class="flex-grow">
                        <h3 class="font-pixel text-2xl font-bold mb-2 dark:text-y2k-pink text-red-600 uppercase">
                            CONNECTION_FAILED
                        </h3>
                        <p class="font-medium dark:text-y2k-white mb-4">
                            ${escapeHtml(message)}
                        </p>
                        <div class="font-pixel text-sm dark:text-y2k-lime text-gray-600 border-t-2 border-gray-300 dark:border-y2k-lime pt-3 mt-3 space-y-1">
                            <p>&gt; API endpoint: <span class="dark:text-y2k-cyan text-y2k-blue">${escapeHtml(API_URL)}</span></p>
                            <p>&gt; Status: <span class="dark:text-y2k-pink text-red-500">OFFLINE</span></p>
                            <p>&gt; Pastikan server backend sedang berjalan.</p>
                        </div>
                        <button onclick="fetchProjects()" 
                                class="mt-4 font-pixel text-lg border-win95 bg-y2k-light dark:bg-y2k-cyan dark:text-black text-y2k-dark px-6 py-1 font-bold hover:bg-y2k-blue hover:text-white dark:hover:bg-y2k-lime transition-colors active:border-win95-inset">
                            [ RETRY CONNECTION ]
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Update subtitle with error state
    updateSubtitle('Error: Koneksi ke server gagal. <span class="animate-blink">█</span>');
}

/**
 * Renders an empty state when API returns no projects.
 */
function renderEmpty() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full border-win95 bg-y2k-light dark:bg-black">
            <div class="win-titlebar px-2 py-1 flex justify-between items-center text-white font-pixel font-bold">
                <span>INFO.SYS</span>
                <div class="flex gap-1">
                    <button class="border-win95 bg-y2k-light dark:bg-black text-black dark:text-white px-1 text-xs">X</button>
                </div>
            </div>
            <div class="p-6 border-win95-inset m-1 bg-white dark:bg-y2k-dark text-center">
                <p class="font-pixel text-3xl dark:text-y2k-lime mb-2">📂 DIRECTORY EMPTY</p>
                <p class="font-medium dark:text-y2k-white">Tidak ada project yang ditemukan.</p>
            </div>
        </div>
    `;

    updateSubtitle('Executing directory listing... 0 files found.');
}

/**
 * Updates the subtitle text above the grid.
 * @param {string} html - innerHTML to set
 */
function updateSubtitle(html) {
    const subtitle = document.getElementById('projects-subtitle');
    if (subtitle) {
        subtitle.innerHTML = html;
    }
}

/**
 * Parses tech_stack from API response.
 * Handles: comma-separated string, JSON array string, or actual array.
 * @param {string|Array} techStack
 * @returns {Array<string>}
 */
function parseTechStack(techStack) {
    if (!techStack) return [];
    if (Array.isArray(techStack)) return techStack;
    // Try parsing as JSON array first
    try {
        const parsed = JSON.parse(techStack);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {
        // Not JSON, fall through
    }
    // Fall back to comma-separated
    return techStack.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Animates cards into view with staggered entrance.
 * @param {NodeList} cards - Card elements to animate
 */
function animateCards(cards) {
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * Main function: fetches projects from API and renders them.
 */
async function fetchProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    // Show loading skeletons (reset if retrying)
    const existingCards = container.querySelectorAll('.project-card');
    if (existingCards.length > 0 || container.querySelector('.col-span-full')) {
        container.innerHTML = `
            <div class="skeleton-card border-win95 bg-y2k-light dark:bg-black flex flex-col h-full animate-pulse">
                <div class="win-titlebar px-2 py-1 text-white font-pixel font-bold"><span>LOADING...</span></div>
                <div class="p-2 border-win95-inset m-1 bg-white dark:bg-y2k-dark flex-grow flex flex-col gap-3">
                    <div class="h-40 bg-gray-200 dark:bg-black border-2 border-dashed border-y2k-dark dark:border-y2k-lime"></div>
                    <div class="h-6 w-3/4 bg-gray-300 dark:bg-gray-700"></div>
                    <div class="h-4 w-full bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </div>
        `;
        updateSubtitle('Executing directory listing... <span class="animate-blink">█</span>');
    }

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Server merespons dengan status ${response.status} (${response.statusText})`);
        }

        const data = await response.json();

        // Handle different API response structures
        // Common patterns: { data: [...] }, { projects: [...] }, or just [...]
        let projects;
        if (Array.isArray(data)) {
            projects = data;
        } else if (data.data && Array.isArray(data.data)) {
            projects = data.data;
        } else if (data.projects && Array.isArray(data.projects)) {
            projects = data.projects;
        } else {
            // If it's a single object, wrap it
            projects = [data];
        }

        // Handle empty response
        if (!projects || projects.length === 0) {
            renderEmpty();
            return;
        }

        // Render all project cards
        container.innerHTML = projects
            .map((project, index) => createProjectCard(project, index))
            .join('');

        // Update subtitle with count
        updateSubtitle(`Executing directory listing... ${projects.length} file${projects.length !== 1 ? 's' : ''} found.`);

        // Animate cards entrance
        const renderedCards = container.querySelectorAll('.project-card');
        animateCards(renderedCards);

        // Re-initialize Lucide icons for any new elements
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (error) {
        console.error('[PROJECTS.DLL] Fetch error:', error);
        renderError(error.message || 'Tidak dapat terhubung ke server. Pastikan backend berjalan di localhost:8080.');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
});
