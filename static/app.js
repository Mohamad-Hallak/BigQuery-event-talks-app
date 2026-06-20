/**
 * BigQuery Release Notes Portal - Client Application
 */

// Application State
const state = {
    allEntries: [],      // Original entries from feed
    filteredEntries: [], // Current filtered subset
    stats: {
        total: 0,
        features: 0,
        issues: 0,
        announcements: 0,
        deprecations: 0
    },
    filters: {
        search: '',
        category: 'All',
        timeframe: 'all', // 'all', '30', '90'
        layout: 'timeline' // 'timeline', 'card'
    }
};

// DOM Elements
const DOM = {
    releasesContainer: document.getElementById('releases-container'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    emptyState: document.getElementById('empty-state'),
    
    // Inputs & Filters
    searchInput: document.getElementById('search-input'),
    categoryButtons: document.querySelectorAll('.filter-btn'),
    timeButtons: document.querySelectorAll('.time-btn'),
    
    // View Controls
    btnTimelineView: document.getElementById('btn-timeline-view'),
    btnCardView: document.getElementById('btn-card-view'),
    refreshBtn: document.getElementById('refresh-btn'),
    exportBtn: document.getElementById('export-btn'),
    retryBtn: document.getElementById('retry-btn'),
    clearFiltersBtn: document.getElementById('clear-filters-btn'),
    
    // Stats & Sync Info
    statTotal: document.getElementById('stat-total'),
    statFeatures: document.getElementById('stat-features'),
    statIssues: document.getElementById('stat-issues'),
    statAnnouncements: document.getElementById('stat-announcements'),
    
    countAll: document.getElementById('count-all'),
    countFeatures: document.getElementById('count-features'),
    countAnnouncements: document.getElementById('count-announcements'),
    countIssues: document.getElementById('count-issues'),
    countDeprecations: document.getElementById('count-deprecations'),
    
    syncTime: document.getElementById('sync-time'),
    sourceBadge: document.getElementById('source-badge'),
    backToTop: document.getElementById('back-to-top')
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleases();
});

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
    // Search input event
    DOM.searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value.toLowerCase().trim();
        applyFiltersAndRender();
    });

    // Keyboard shortcut for search focus ('/')
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== DOM.searchInput) {
            e.preventDefault();
            DOM.searchInput.focus();
            DOM.searchInput.select();
        }
        if (e.key === 'Escape' && document.activeElement === DOM.searchInput) {
            DOM.searchInput.blur();
        }
    });

    // Category button filters
    DOM.categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filters.category = btn.getAttribute('data-category');
            applyFiltersAndRender();
        });
    });

    // Timeframe buttons
    DOM.timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filters.timeframe = btn.getAttribute('data-days');
            applyFiltersAndRender();
        });
    });

    // Layout view buttons
    DOM.btnTimelineView.addEventListener('click', () => {
        setViewLayout('timeline');
    });
    DOM.btnCardView.addEventListener('click', () => {
        setViewLayout('card');
    });

    // Refresh & Retry actions
    DOM.refreshBtn.addEventListener('click', () => {
        fetchReleases(true);
    });
    DOM.exportBtn.addEventListener('click', exportToCSV);
    DOM.retryBtn.addEventListener('click', () => {
        fetchReleases();
    });
    DOM.clearFiltersBtn.addEventListener('click', clearAllFilters);

    // Card copy listener (event delegation)
    DOM.releasesContainer.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-card-btn');
        if (copyBtn) {
            const index = parseInt(copyBtn.getAttribute('data-index'));
            copyCardToClipboard(index);
        }
    });

    // Scroll handlers
    window.addEventListener('scroll', handleWindowScroll);
    DOM.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Clear filters helper
function clearAllFilters() {
    DOM.searchInput.value = '';
    state.filters.search = '';
    
    DOM.categoryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === 'All') {
            btn.classList.add('active');
        }
    });
    state.filters.category = 'All';

    DOM.timeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-days') === 'all') {
            btn.classList.add('active');
        }
    });
    state.filters.timeframe = 'all';

    applyFiltersAndRender();
}

// Toggle layout class
function setViewLayout(layout) {
    state.filters.layout = layout;
    if (layout === 'timeline') {
        DOM.btnTimelineView.classList.add('active');
        DOM.btnCardView.classList.remove('active');
        DOM.releasesContainer.classList.add('timeline-layout');
        DOM.releasesContainer.classList.remove('card-layout');
    } else {
        DOM.btnTimelineView.classList.remove('active');
        DOM.btnCardView.classList.add('active');
        DOM.releasesContainer.classList.remove('timeline-layout');
        DOM.releasesContainer.classList.add('card-layout');
    }
}

// Show/hide back to top button
function handleWindowScroll() {
    if (window.scrollY > 400) {
        DOM.backToTop.classList.remove('hidden');
    } else {
        DOM.backToTop.classList.add('hidden');
    }
}

// ==========================================================================
// DATA FETCHING
// ==========================================================================
async function fetchReleases(forceRefresh = false) {
    // Show spinner and loader
    DOM.refreshBtn.classList.add('spinning');
    DOM.loadingState.classList.remove('hidden');
    DOM.releasesContainer.classList.add('hidden');
    DOM.errorState.classList.add('hidden');
    DOM.emptyState.classList.add('hidden');

    try {
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }
        
        const resData = await response.json();
        
        if (resData.error) {
            throw new Error(resData.error);
        }

        // Set global entries data
        state.allEntries = resData.data.entries || [];
        
        // Update Sync Header Details
        updateSyncDetails(resData.source, resData.last_updated_time);
        
        // Calculate initial stats on raw data
        calculateStats();
        
        // Apply filters & render
        applyFiltersAndRender();
        
    } catch (err) {
        console.error("Error loading release notes:", err);
        DOM.errorMessage.textContent = err.message || "Failed to load release notes. Please check your internet connection.";
        DOM.errorState.classList.remove('hidden');
        DOM.loadingState.classList.add('hidden');
    } finally {
        DOM.refreshBtn.classList.remove('spinning');
    }
}

// Sync information update
function updateSyncDetails(source, timestamp) {
    // Source tag styling
    DOM.sourceBadge.className = 'source-badge';
    if (source === 'cache' || source === 'cache_fallback') {
        DOM.sourceBadge.textContent = 'Cached';
        DOM.sourceBadge.classList.add('cache');
    } else {
        DOM.sourceBadge.textContent = 'Live Feed';
        DOM.sourceBadge.classList.add('network');
    }

    // Friendly date for sync
    const lastSyncDate = new Date(timestamp * 1000);
    const timeString = lastSyncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    DOM.syncTime.textContent = `Synced at ${timeString}`;
}

// ==========================================================================
// CALCULATE STATISTICS & STAT CONTROLLER COUNTS
// ==========================================================================
function calculateStats() {
    let totalItems = 0;
    let features = 0;
    let announcements = 0;
    let issues = 0;
    let deprecations = 0;

    state.allEntries.forEach(entry => {
        (entry.items || []).forEach(item => {
            totalItems++;
            const type = (item.type || '').toLowerCase();
            if (type.includes('feature')) features++;
            else if (type.includes('announce')) announcements++;
            else if (type.includes('issue')) issues++;
            else if (type.includes('deprecate')) deprecations++;
        });
    });

    state.stats = {
        total: totalItems,
        features,
        announcements,
        issues,
        deprecations
    };

    // Update Left Sidebar Summary Panel Values
    DOM.statTotal.textContent = totalItems;
    DOM.statFeatures.textContent = features;
    DOM.statIssues.textContent = issues;
    DOM.statAnnouncements.textContent = announcements;

    // Update Sidebar Filter Badge Counters
    DOM.countAll.textContent = totalItems;
    DOM.countFeatures.textContent = features;
    DOM.countAnnouncements.textContent = announcements;
    DOM.countIssues.textContent = issues;
    DOM.countDeprecations.textContent = deprecations;
}

// ==========================================================================
// FILTER LOGIC
// ==========================================================================
function applyFiltersAndRender() {
    const { search, category, timeframe } = state.filters;
    const now = new Date();
    
    state.filteredEntries = state.allEntries.map(entry => {
        // Parse date for timeframe filter
        const entryDate = new Date(entry.updated_iso);
        let passesTimeframe = true;

        if (timeframe !== 'all') {
            const timeDiff = Math.abs(now.getTime() - entryDate.getTime());
            const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            if (diffDays > parseInt(timeframe)) {
                passesTimeframe = false;
            }
        }

        if (!passesTimeframe) {
            return null; // Entire entry is excluded based on time
        }

        // Filter individual items within the entry
        const filteredItems = (entry.items || []).filter(item => {
            // Category check
            if (category !== 'All' && item.type.toLowerCase() !== category.toLowerCase()) {
                return false;
            }

            // Search query check
            if (search) {
                const typeMatch = item.type.toLowerCase().includes(search);
                const htmlMatch = item.html.toLowerCase().includes(search);
                const dateMatch = entry.date.toLowerCase().includes(search);
                return typeMatch || htmlMatch || dateMatch;
            }

            return true;
        });

        // If this entry still has items, keep it
        if (filteredItems.length > 0) {
            return {
                ...entry,
                items: filteredItems
            };
        }
        
        return null;
    }).filter(entry => entry !== null);

    renderReleases();
}

// ==========================================================================
// RENDER DATA TO CONTAINER
// ==========================================================================
function renderReleases() {
    DOM.loadingState.classList.add('hidden');
    DOM.releasesContainer.classList.remove('hidden');

    if (state.filteredEntries.length === 0) {
        DOM.emptyState.classList.remove('hidden');
        DOM.releasesContainer.innerHTML = '';
        return;
    }

    DOM.emptyState.classList.add('hidden');
    
    // Render filtered list
    DOM.releasesContainer.innerHTML = state.filteredEntries.map((entry, index) => {
        // Fade in delay for micro-animation list entrance
        const delay = index * 0.05;
        
        const itemsHtml = entry.items.map(item => {
            const badgeClass = getBadgeClass(item.type);
            return `
                <div class="release-item">
                    <div class="release-item-header">
                        <span class="badge ${badgeClass}">${escapeHtml(item.type)}</span>
                    </div>
                    <div class="release-item-content">
                        ${item.html}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <article class="timeline-group card" style="animation-delay: ${delay}s">
                <div class="timeline-dot"></div>
                <div class="timeline-group-inner">
                    <header class="timeline-header">
                        <h3 class="timeline-date">${escapeHtml(entry.date)}</h3>
                        <div class="timeline-actions">
                            <button class="copy-card-btn" data-index="${index}" title="Copy card to clipboard">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <span>Copy</span>
                            </button>
                            <a href="${entry.link}" target="_blank" rel="noopener noreferrer" class="timeline-link" title="Open official GCP Release Note link">
                                <span>Link</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </a>
                        </div>
                    </header>
                    <div class="timeline-items-container">
                        ${itemsHtml}
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// Badge styling selector
function getBadgeClass(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'badge-feature';
    if (t.includes('announce')) return 'badge-announce';
    if (t.includes('issue')) return 'badge-issue';
    if (t.includes('deprecate')) return 'badge-deprecate';
    return 'badge-general';
}

// Simple HTML escaping helper for title attributes, etc.
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Utility function to copy release card content to clipboard
async function copyCardToClipboard(index) {
    const entry = state.filteredEntries[index];
    if (!entry) return;
    
    let text = `BigQuery Release - ${entry.date}\n`;
    text += `Link: ${entry.link}\n\n`;
    
    entry.items.forEach(item => {
        const temp = document.createElement('div');
        temp.innerHTML = item.html;
        const plainText = (temp.textContent || temp.innerText || "").trim();
        text += `[${item.type}]\n${plainText}\n\n`;
    });
    
    try {
        await navigator.clipboard.writeText(text.trim());
        showCopyFeedback(index);
    } catch (err) {
        console.error("Failed to copy text: ", err);
    }
}

// Show micro-interaction feedback on copy
function showCopyFeedback(index) {
    const btn = document.querySelector(`.copy-card-btn[data-index="${index}"]`);
    if (!btn) return;
    
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Copied!</span>
    `;
    btn.classList.add('copied');
    
    setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove('copied');
    }, 1500);
}

// Export active filtered releases to CSV
function exportToCSV() {
    if (state.filteredEntries.length === 0) {
        alert("No release notes to export.");
        return;
    }
    
    const csvRows = [];
    csvRows.push(["Date", "Link", "Category", "Content"]);
    
    state.filteredEntries.forEach(entry => {
        const date = entry.date;
        const link = entry.link;
        
        entry.items.forEach(item => {
            const category = item.type;
            const temp = document.createElement('div');
            temp.innerHTML = item.html;
            const plainText = (temp.textContent || temp.innerText || "").trim();
            csvRows.push([date, link, category, plainText]);
        });
    });
    
    const csvString = csvRows.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", url);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadLink.setAttribute("download", `bigquery_releases_${dateStr}.csv`);
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}
