// GmarUp Admin Dashboard - Modern and Comprehensive
// Created with love for managing the GmarUp beta project

let currentData = {
    registrations: [],
    donations: [],
    analytics: [],
    settings: {}
};

let currentSection = 'dashboard';
let lastRefresh = null;
let refreshInterval = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing GmarUp Admin Dashboard...');
    
    // Check authentication
    if (!isAuthenticated()) {
        showAuthenticationForm();
    } else {
        showDashboard();
    }
});

// Authentication functions
function isAuthenticated() {
    const token = localStorage.getItem('admin_auth_token');
    return token === 'authenticated';
}

function showAuthenticationForm() {
    const authOverlay = document.getElementById('auth-overlay');
    const dashboard = document.getElementById('dashboard');
    
    authOverlay.style.display = 'flex';
    dashboard.style.display = 'none';
    
    const authForm = document.getElementById('auth-form');
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('admin-password').value;
        
        if (password === '0544227754') {
            localStorage.setItem('admin_auth_token', 'authenticated');
            showDashboard();
        } else {
            showNotification('קוד שגוי. נסה שוב.', 'error');
            document.getElementById('admin-password').value = '';
        }
    });
}

function showDashboard() {
    const authOverlay = document.getElementById('auth-overlay');
    const dashboard = document.getElementById('dashboard');
    
    authOverlay.style.display = 'none';
    dashboard.style.display = 'flex';
    
    // Initialize dashboard and force immediate data load
    initializeDashboard();
    
    // Force immediate refresh
    setTimeout(() => {
        console.log('🔄 Forcing immediate data refresh...');
        loadAllData();
    }, 500);
}

function logout() {
    ensureSidebarClosed();
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        localStorage.removeItem('admin_auth_token');
        location.reload();
    }
}

// Dashboard initialization
function initializeDashboard() {
    console.log('📊 Loading dashboard data...');
    
    // Setup navigation
    setupNavigation();
    
    // Load initial data
    loadAllData();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('✅ Dashboard initialized successfully');
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            switchToSection(section);
        });
    });
    
    // Setup mobile navigation
    setupMobileNavigation();
}

function switchToSection(sectionName) {
    console.log(`📍 Switching to section: ${sectionName}`);
    
    // Always close mobile sidebar when switching sections
    closeMobileSidebar();
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Update header title
    const titles = {
        'dashboard': 'דשבורד ראשי',
        'registrations': 'ניהול רישומים',
        'donations': 'ניהול תרומות',
        'analytics': 'נתוני אנליטיקס',
        'communications': 'מערכת תקשורת',
        'export': 'ייצוא נתונים',
        'settings': 'הגדרות מערכת'
    };
    
    document.getElementById('main-title').textContent = titles[sectionName] || 'דשבורד';
    
    // Load section-specific data
    loadSectionData(sectionName);
    
    currentSection = sectionName;
}

// Data loading functions
async function loadAllData() {
    try {
        showLoading();
        
        // Load data in parallel for better performance
        await Promise.all([
            loadRegistrations(),
            loadDonations(),
            loadAnalytics(),
            loadSettings()
        ]);
        
        updateDashboardStats();
        lastRefresh = new Date();
        
        console.log('✅ All data loaded successfully');
        showNotification('נתונים עודכנו בהצלחה', 'success');
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showNotification('שגיאה בטעינת הנתונים', 'error');
    } finally {
        hideLoading();
    }
}

async function loadRegistrations() {
    try {
        console.log('📋 Loading registrations from API...');
        const data = await makeApiCall('/api/admin/registrations');
        currentData.registrations = data || [];
        
        console.log(`📋 Successfully loaded ${currentData.registrations.length} registrations`);
        console.log('Latest registration:', currentData.registrations[0]);
        
        if (currentSection === 'registrations') {
            renderRegistrationsTable();
        }
        
        return currentData.registrations;
        
    } catch (error) {
        console.error('❌ Error loading registrations:', error);
        currentData.registrations = [];
        showNotification('שגיאה בטעינת רישומים מהשרת', 'error');
        
        if (currentSection === 'registrations') {
            renderRegistrationsTable();
        }
    }
}

async function loadDonations() {
    try {
        console.log('💝 Loading donations from API...');
        const data = await makeApiCall('/api/admin/donations');
        currentData.donations = data || [];
        
        console.log(`💝 Successfully loaded ${currentData.donations.length} donations`);
        console.log('Latest donation:', currentData.donations[0]);
        
        if (currentSection === 'donations') {
            renderDonationsTable();
        }
        
        return currentData.donations;
        
    } catch (error) {
        console.error('❌ Error loading donations:', error);
        currentData.donations = [];
        showNotification('שגיאה בטעינת תרומות מהשרת', 'error');
        
        if (currentSection === 'donations') {
            renderDonationsTable();
        }
    }
}

async function loadAnalytics() {
    try {
        const data = await makeApiCall('/api/admin/analytics');
        currentData.analytics = data || [];
        
        if (currentSection === 'analytics') {
            renderAnalyticsTable();
        }
        
        console.log(`📈 Loaded ${currentData.analytics.length} analytics events`);
        return currentData.analytics;
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        currentData.analytics = [];
        showNotification('שגיאה בטעינת אנליטיקס מהשרת', 'error');
        
        if (currentSection === 'analytics') {
            renderAnalyticsTable();
        }
    }
}

async function loadSettings() {
    try {
        const data = await makeApiCall('/api/admin/settings');
        currentData.settings = data || {};
        
        // Save to localStorage as backup
        localStorage.setItem('admin_settings_backup', JSON.stringify(currentData.settings));
        
        if (currentSection === 'settings') {
            renderSettingsForm();
        }
        
        console.log('⚙️ Settings loaded from server');
        return currentData.settings;
        
    } catch (error) {
        console.error('Error loading settings:', error);
        
        // Try to load from localStorage first
        const backupSettings = localStorage.getItem('admin_settings_backup');
        if (backupSettings) {
            try {
                currentData.settings = JSON.parse(backupSettings);
                console.log('⚙️ Settings loaded from localStorage backup');
                showNotification('שרת לא זמין - נטענו הגדרות שמורות מקומית', 'warning');
            } catch (parseError) {
                console.error('Error parsing backup settings:', parseError);
                currentData.settings = getDefaultSettings();
                showNotification('שגיאה בטעינת הגדרות - משתמש בהגדרות ברירת מחדל', 'warning');
            }
        } else {
            currentData.settings = getDefaultSettings();
            showNotification('שגיאה בטעינת הגדרות מהשרת - משתמש בהגדרות ברירת מחדל', 'warning');
        }
        
        if (currentSection === 'settings') {
            renderSettingsForm();
        }
    }
}

// Real API calls to the server
async function makeApiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
        
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error);
        throw error;
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    // Update registrations count
    const totalRegs = currentData.registrations.length;
    document.getElementById('total-registrations').textContent = totalRegs.toLocaleString('he-IL');
    
    // Update donations
    const totalDonationAmount = currentData.donations
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + d.amount, 0);
    
    const totalDonationsCount = currentData.donations.filter(d => d.status === 'completed').length;
    
    document.getElementById('total-donations-amount').textContent = `₪${totalDonationAmount.toLocaleString('he-IL')}`;
    document.getElementById('total-donations-count').textContent = totalDonationsCount.toLocaleString('he-IL');
    
    // Update analytics (simulated visitors)
    const todayVisitors = currentData.analytics.filter(a => {
        const eventDate = new Date(a.created_at);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
    }).length;
    
    // Check if reset was applied today
    const resetDate = localStorage.getItem('visitors_reset_date');
    const resetApplied = localStorage.getItem('visitors_reset_applied');
    const todayDate = new Date().toISOString().split('T')[0];
    
    let displayVisitors = Math.max(todayVisitors, 15);
    
    // If reset was applied today, show 0
    if (resetApplied === 'true' && resetDate === todayDate) {
        displayVisitors = 0;
    }
    
    document.getElementById('today-visitors').textContent = displayVisitors.toLocaleString('he-IL');
    
    // Update study levels distribution
    const studyLevels = {
        beginner: 0,
        intermediate: 0,
        advanced: 0
    };
    
    currentData.registrations.forEach(reg => {
        const notes = reg.notes || '';
        if (notes.includes('beginner') || notes.includes('מתחיל')) {
            studyLevels.beginner++;
        } else if (notes.includes('intermediate') || notes.includes('בינוני')) {
            studyLevels.intermediate++;
        } else if (notes.includes('advanced') || notes.includes('מתקדם')) {
            studyLevels.advanced++;
        }
    });
    
    document.getElementById('beginners-count').textContent = studyLevels.beginner.toLocaleString('he-IL');
    document.getElementById('intermediate-count').textContent = studyLevels.intermediate.toLocaleString('he-IL');
    document.getElementById('advanced-count').textContent = studyLevels.advanced.toLocaleString('he-IL');
    
    console.log('📊 Dashboard stats updated with study levels:', studyLevels);
}

// Table rendering functions
function renderRegistrationsTable() {
    const tbody = document.getElementById('registrations-table');
    
    if (!currentData.registrations || currentData.registrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-title">אין רישומים עדיין</div>
                    <div class="empty-state-desc">רישומים חדשים יופיעו כאן</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = currentData.registrations.map((reg, index) => `
        <tr data-id="${reg.id}">
            <td class="table-actions">
                <button class="action-btn edit" onclick="editRegistration(${reg.id})" title="ערוך">✏️</button>
                <button class="action-btn delete" onclick="deleteRegistration(${reg.id})" title="מחק">🗑️</button>
            </td>
            <td>
                <span class="status-badge status-${(reg.status || 'pending').replace('_', '-')}">
                    ${getStatusText(reg.status || 'pending_beta')}
                </span>
            </td>
            <td>${formatDate(reg.created_at)}</td>
            <td>${getStudyLevelFromNotes(reg.notes || '')}</td>
            <td>${getSourceText(reg.source)}</td>
            <td><a href="tel:${reg.phone}" style="color: var(--primary-600);">${reg.phone}</a></td>
            <td><a href="mailto:${reg.email}" style="color: var(--primary-600);">${reg.email}</a></td>
            <td style="font-weight: 600;">${reg.name}</td>
            <td style="color: var(--gray-500);">${reg.id}</td>
        </tr>
    `).join('');
    
    console.log(`📋 Rendered ${currentData.registrations.length} registrations`);
}

function renderDonationsTable() {
    const tbody = document.getElementById('donations-table');
    
    if (!currentData.donations || currentData.donations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <div class="empty-state-icon">💝</div>
                    <div class="empty-state-title">אין תרומות עדיין</div>
                    <div class="empty-state-desc">תרומות חדשות יופיעו כאן</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = currentData.donations.map((don, index) => `
        <tr data-id="${don.id}">
            <td class="table-actions">
                <button class="action-btn edit" onclick="editDonation(${don.id})" title="ערוך">✏️</button>
                <button class="action-btn delete" onclick="deleteDonation(${don.id})" title="מחק">🗑️</button>
            </td>
            <td>
                <span class="status-badge status-${don.status || 'pending'}">
                    ${getDonationStatusText(don.status || 'pending')}
                </span>
            </td>
            <td>${formatDate(don.created_at)}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;" title="${don.message || 'ללא הודעה'}">${don.message || 'ללא הודעה'}</td>
            <td>${don.donor_phone ? `<a href="tel:${don.donor_phone}" style="color: var(--primary-600);">${don.donor_phone}</a>` : '-'}</td>
            <td>${don.donor_email ? `<a href="mailto:${don.donor_email}" style="color: var(--primary-600);">${don.donor_email}</a>` : '-'}</td>
            <td style="font-weight: 700; color: var(--green-600);">₪${don.amount.toLocaleString('he-IL')}</td>
            <td style="font-weight: 600;">${don.donor_name}</td>
            <td style="color: var(--gray-500);">${don.id}</td>
        </tr>
    `).join('');
    
    console.log(`💰 Rendered ${currentData.donations.length} donations`);
}

function renderAnalyticsTable() {
    const tbody = document.getElementById('analytics-table');
    
    if (!currentData.analytics || currentData.analytics.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <div class="empty-state-icon">📈</div>
                    <div class="empty-state-title">אין נתוני אנליטיקס</div>
                    <div class="empty-state-desc">נתוני אנליטיקס יופיעו כאן</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = currentData.analytics.slice(0, 50).map((event, index) => `
        <tr data-id="${event.id}">
            <td>${formatDate(event.created_at)}</td>
            <td style="color: var(--gray-500); font-family: monospace;">${event.ip_address || '-'}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${event.url || ''}">${event.url || '-'}</td>
            <td>${event.value || '-'}</td>
            <td>${event.label || '-'}</td>
            <td style="color: var(--primary-600);">${event.action}</td>
            <td><span style="background: var(--gray-100); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.75rem;">${event.category}</span></td>
            <td style="color: var(--gray-500); font-family: monospace;">${event.session_id}</td>
            <td style="color: var(--gray-400);">${event.id}</td>
        </tr>
    `).join('');
    
    console.log(`📊 Rendered ${Math.min(currentData.analytics.length, 50)} analytics events`);
}

function renderSettingsForm() {
    const container = document.getElementById('settings-form');
    
    container.innerHTML = `
        <div style="max-width: 600px;">
            <div style="display: grid; gap: 1.5rem;">
                
                <div class="form-group">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700);">קישור קבוצת וואטסאפ</label>
                    <input type="url" id="setting-whatsapp-link" value="${currentData.settings.whatsapp_link || ''}" 
                           style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius);">
                </div>
                
                <div class="form-group">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700);">מספר ביט לתרומות</label>
                    <input type="tel" id="setting-bit-phone" value="${currentData.settings.bit_phone || ''}" 
                           style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius);">
                </div>
                
                <div class="form-group">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700);">אימייל אדמין</label>
                    <input type="email" id="setting-admin-email" value="${currentData.settings.admin_email || ''}" 
                           style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius);">
                </div>
                
                <div class="form-group">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700);">כותרת האתר</label>
                    <input type="text" id="setting-site-title" value="${currentData.settings.site_title || ''}" 
                           style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius);">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700);">מונה זיכרון התחלתי</label>
                        <input type="number" id="setting-memorial-counter" value="${currentData.settings.memorial_counter_start || ''}" 
                               style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius);">
                    </div>
                    
                    <div class="form-group">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700);">מונה תרומות התחלתי</label>
                        <input type="number" id="setting-donations-counter" value="${currentData.settings.donations_counter_start || ''}" 
                               style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius);">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--gray-700);">
                            <input type="checkbox" id="setting-auto-backup" ${currentData.settings.auto_backup_enabled === '1' ? 'checked' : ''}>
                            גיבוי אוטומטי
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--gray-700);">
                            <input type="checkbox" id="setting-email-notifications" ${currentData.settings.email_notifications === '1' ? 'checked' : ''}>
                            התראות מייל
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--gray-700);">
                            <input type="checkbox" id="setting-analytics-enabled" ${currentData.settings.analytics_enabled === '1' ? 'checked' : ''}>
                            אנליטיקס מופעל
                        </label>
                    </div>
                </div>
                
            </div>
        </div>
    `;
    
    console.log('⚙️ Settings form rendered');
}

// Section data loading
function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'registrations':
            renderRegistrationsTable();
            break;
        case 'donations':
            renderDonationsTable();
            break;
        case 'analytics':
            renderAnalyticsTable();
            break;
        case 'settings':
            renderSettingsForm();
            break;
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

function getStatusText(status) {
    const statusMap = {
        'pending_beta': 'ממתין לבטא',
        'contacted': 'נוצר קשר',
        'completed': 'הושלם',
        'failed': 'נכשל'
    };
    return statusMap[status] || status;
}

function getDonationStatusText(status) {
    const statusMap = {
        'completed': 'הושלם',
        'pending': 'ממתין',
        'failed': 'נכשל'
    };
    return statusMap[status] || status;
}

function getSourceText(source) {
    const sourceMap = {
        'beta_landing': 'דף נחיתה',
        'whatsapp': 'ווטסאפ',
        'direct': 'ישיר',
        'google': 'גוגל',
        'facebook': 'פייסבוק'
    };
    return sourceMap[source] || source;
}

function getStudyLevelFromNotes(notes) {
    if (!notes) return '-';
    
    // חילוץ רמת לימוד מההערות
    if (notes.includes('beginner')) return '🌱 מתחיל';
    if (notes.includes('intermediate')) return '📚 בינוני';
    if (notes.includes('advanced')) return '🎓 מתקדם';
    
    // אם זה בפורמט "רמת לימוד: ..."
    const match = notes.match(/רמת לימוד:\s*(.+?)(?:\n|$)/);
    if (match) {
        const level = match[1].trim();
        switch (level) {
            case 'beginner': return '🌱 מתחיל';
            case 'intermediate': return '📚 בינוני';
            case 'advanced': return '🎓 מתקדם';
            default: return level;
        }
    }
    
    return notes.length > 30 ? notes.substring(0, 30) + '...' : notes;
}

// CRUD operations
async function editRegistration(id) {
    const registration = currentData.registrations.find(r => r.id === id);
    if (!registration) return;
    
    const statusOptions = ['pending_beta', 'contacted', 'completed', 'failed'];
    const currentIndex = statusOptions.indexOf(registration.status);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];
    
    const newStatus = prompt(`עדכן סטטוס (נוכחי: ${getStatusText(registration.status)}):`, nextStatus);
    
    if (newStatus && newStatus !== registration.status) {
        try {
            await makeApiCall('/api/admin/registration', {
                method: 'POST',
                body: JSON.stringify({
                    id: id,
                    status: newStatus,
                    notes: registration.notes || ''
                })
            });
            
            registration.status = newStatus;
            registration.updated_at = new Date().toISOString();
            renderRegistrationsTable();
            updateDashboardStats();
            showNotification('רישום עודכן בהצלחה', 'success');
            
        } catch (error) {
            console.error('Failed to update registration:', error);
            showNotification('שגיאה בעדכון הרישום', 'error');
        }
    }
}

async function deleteRegistration(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק רישום זה? פעולה זו לא ניתנת לביטול.')) {
        try {
            // Call POST API endpoint with delete action
            await makeApiCall('/api/admin/registration', {
                method: 'POST',
                body: JSON.stringify({
                    id: id,
                    action: 'delete'
                })
            });
            
            // Remove from local data after successful server deletion
            currentData.registrations = currentData.registrations.filter(r => r.id !== id);
            renderRegistrationsTable();
            updateDashboardStats();
            showNotification('רישום נמחק בהצלחה מהמסד נתונים', 'success');
            console.log(`✅ Registration ${id} deleted from database`);
            
        } catch (error) {
            console.error('Failed to delete registration:', error);
            showNotification('שגיאה במחיקת הרישום מהמסד נתונים', 'error');
        }
    }
}

async function editDonation(id) {
    const donation = currentData.donations.find(d => d.id === id);
    if (!donation) return;
    
    const statusOptions = ['pending', 'completed', 'failed'];
    const currentIndex = statusOptions.indexOf(donation.status);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];
    
    const newStatus = prompt(`עדכן סטטוס תרומה (נוכחי: ${getDonationStatusText(donation.status)}):`, nextStatus);
    
    if (newStatus && newStatus !== donation.status) {
        try {
            await makeApiCall('/api/admin/donation', {
                method: 'POST',
                body: JSON.stringify({
                    id: id,
                    status: newStatus
                })
            });
            
            donation.status = newStatus;
            if (newStatus === 'completed' && !donation.completed_at) {
                donation.completed_at = new Date().toISOString();
            }
            renderDonationsTable();
            updateDashboardStats();
            showNotification('תרומה עודכנה בהצלחה', 'success');
            
        } catch (error) {
            console.error('Failed to update donation:', error);
            showNotification('שגיאה בעדכון התרומה', 'error');
        }
    }
}

async function deleteDonation(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק תרומה זו? פעולה זו לא ניתנת לביטול.')) {
        try {
            // Call POST API endpoint with delete action
            await makeApiCall('/api/admin/donation', {
                method: 'POST',
                body: JSON.stringify({
                    id: id,
                    action: 'delete'
                })
            });
            
            // Remove from local data after successful server deletion
            currentData.donations = currentData.donations.filter(d => d.id !== id);
            renderDonationsTable();
            updateDashboardStats();
            showNotification('תרומה נמחקה בהצלחה מהמסד נתונים', 'success');
            console.log(`✅ Donation ${id} deleted from database`);
            
        } catch (error) {
            console.error('Failed to delete donation:', error);
            showNotification('שגיאה במחיקת התרומה מהמסד נתונים', 'error');
        }
    }
}

// Filtering functions
function filterRegistrations() {
    const statusFilter = document.getElementById('reg-status-filter').value;
    const sourceFilter = document.getElementById('reg-source-filter').value;
    const levelFilter = document.getElementById('reg-level-filter').value;
    
    let filteredData = currentData.registrations;
    
    if (statusFilter) {
        filteredData = filteredData.filter(r => r.status === statusFilter);
    }
    
    if (sourceFilter) {
        filteredData = filteredData.filter(r => r.source === sourceFilter);
    }
    
    if (levelFilter) {
        filteredData = filteredData.filter(r => {
            const notes = r.notes || '';
            return notes.includes(levelFilter);
        });
    }
    
    // Re-render table with filtered data
    const tbody = document.getElementById('registrations-table');
    tbody.innerHTML = filteredData.map((reg, index) => `
        <tr data-id="${reg.id}">
            <td class="table-actions">
                <button class="action-btn edit" onclick="editRegistration(${reg.id})" title="ערוך">✏️</button>
                <button class="action-btn delete" onclick="deleteRegistration(${reg.id})" title="מחק">🗑️</button>
            </td>
            <td>
                <span class="status-badge status-${(reg.status || 'pending').replace('_', '-')}">
                    ${getStatusText(reg.status || 'pending_beta')}
                </span>
            </td>
            <td>${formatDate(reg.created_at)}</td>
            <td>${getStudyLevelFromNotes(reg.notes || '')}</td>
            <td>${getSourceText(reg.source)}</td>
            <td><a href="tel:${reg.phone}" style="color: var(--primary-600);">${reg.phone}</a></td>
            <td><a href="mailto:${reg.email}" style="color: var(--primary-600);">${reg.email}</a></td>
            <td style="font-weight: 600;">${reg.name}</td>
            <td style="color: var(--gray-500);">${reg.id}</td>
        </tr>
    `).join('');
    
    console.log(`🔍 Filtered to ${filteredData.length} registrations`);
}

function filterDonations() {
    const statusFilter = document.getElementById('don-status-filter').value;
    
    let filteredData = currentData.donations;
    
    if (statusFilter) {
        filteredData = filteredData.filter(d => d.status === statusFilter);
    }
    
    // Re-render table with filtered data
    const tbody = document.getElementById('donations-table');
    tbody.innerHTML = filteredData.map((don, index) => `
        <tr data-id="${don.id}">
            <td class="table-actions">
                <button class="action-btn edit" onclick="editDonation(${don.id})" title="ערוך">✏️</button>
                <button class="action-btn delete" onclick="deleteDonation(${don.id})" title="מחק">🗑️</button>
            </td>
            <td>
                <span class="status-badge status-${don.status || 'pending'}">
                    ${getDonationStatusText(don.status || 'pending')}
                </span>
            </td>
            <td>${formatDate(don.created_at)}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;" title="${don.message || 'ללא הודעה'}">${don.message || 'ללא הודעה'}</td>
            <td>${don.donor_phone ? `<a href="tel:${don.donor_phone}" style="color: var(--primary-600);">${don.donor_phone}</a>` : '-'}</td>
            <td>${don.donor_email ? `<a href="mailto:${don.donor_email}" style="color: var(--primary-600);">${don.donor_email}</a>` : '-'}</td>
            <td style="font-weight: 700; color: var(--green-600);">₪${don.amount.toLocaleString('he-IL')}</td>
            <td style="font-weight: 600;">${don.donor_name}</td>
            <td style="color: var(--gray-500);">${don.id}</td>
        </tr>
    `).join('');
    
    console.log(`🔍 Filtered to ${filteredData.length} donations`);
}

// Data export functions
function exportData(type) {
    console.log(`📁 Exporting data: ${type}`);
    ensureSidebarClosed();
    
    let data, filename;
    
    switch (type) {
        case 'registrations':
            data = currentData.registrations;
            filename = `gmarup-registrations-${new Date().toISOString().split('T')[0]}.csv`;
            break;
        case 'donations':
            data = currentData.donations;
            filename = `gmarup-donations-${new Date().toISOString().split('T')[0]}.csv`;
            break;
        case 'analytics':
            data = currentData.analytics;
            filename = `gmarup-analytics-${new Date().toISOString().split('T')[0]}.csv`;
            break;
        case 'all':
            exportAllData();
            return;
        default:
            showNotification('סוג ייצוא לא ידוע', 'error');
            return;
    }
    
    if (!data || data.length === 0) {
        showNotification('אין נתונים לייצוא', 'error');
        return;
    }
    
    try {
        const csv = convertToCSV(data);
        downloadCSV(csv, filename);
        showNotification(`ייצוא ${type} הושלם בהצלחה`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('שגיאה בייצוא הנתונים', 'error');
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('הדפדפן שלך לא תומך בהורדת קבצים');
    }
}

function exportAllData() {
    const allData = {
        registrations: currentData.registrations,
        donations: currentData.donations,
        analytics: currentData.analytics,
        settings: currentData.settings,
        exported_at: new Date().toISOString()
    };
    
    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    
    const filename = `gmarup-full-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('ייצוא מלא הושלם בהצלחה', 'success');
}

// Settings management
async function saveSettings() {
    try {
        const settings = {
            whatsapp_link: document.getElementById('setting-whatsapp-link').value,
            bit_phone: document.getElementById('setting-bit-phone').value,
            admin_email: document.getElementById('setting-admin-email').value,
            site_title: document.getElementById('setting-site-title').value,
            memorial_counter_start: document.getElementById('setting-memorial-counter').value,
            donations_counter_start: document.getElementById('setting-donations-counter').value,
            auto_backup_enabled: document.getElementById('setting-auto-backup').checked ? '1' : '0',
            email_notifications: document.getElementById('setting-email-notifications').checked ? '1' : '0',
            analytics_enabled: document.getElementById('setting-analytics-enabled').checked ? '1' : '0'
        };
        
        // Update local data first
        currentData.settings = settings;
        
        // Always save to localStorage as backup
        localStorage.setItem('admin_settings_backup', JSON.stringify(settings));
        
        // Save to server
        try {
            await makeApiCall('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
            
            showNotification('הגדרות נשמרו בהצלחה בשרת ומקומית', 'success');
            console.log('⚙️ Settings saved to server and localStorage:', settings);
            
        } catch (error) {
            console.error('Failed to save to server:', error);
            showNotification('הגדרות נשמרו מקומית (שרת לא זמין)', 'warning');
            console.log('⚙️ Settings saved to localStorage only:', settings);
        }
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('שגיאה בשמירת ההגדרות', 'error');
    }
}

// Sample data functions (fallbacks)
function getSampleRegistrations() {
    return [
        {
            id: 1,
            name: 'דוד כהן',
            email: 'david@example.com',
            phone: '050-1234567',
            status: 'pending_beta',
            source: 'beta_landing',
            created_at: '2025-08-28T10:30:00',
            lead_score: 85,
            notes: ''
        },
        {
            id: 2,
            name: 'משה לוי',
            email: 'moshe@example.com',
            phone: '052-7654321',
            status: 'contacted',
            source: 'whatsapp',
            created_at: '2025-08-29T14:20:00',
            lead_score: 92,
            notes: 'התקשר - מעוניין מאוד'
        },
        {
            id: 3,
            name: 'שרה אברהם',
            email: 'sarah@example.com',
            phone: '054-9876543',
            status: 'pending_beta',
            source: 'beta_landing',
            created_at: '2025-08-30T09:15:00',
            lead_score: 76,
            notes: ''
        }
    ];
}

function getSampleDonations() {
    return [
        {
            id: 1,
            donation_id: 'DON_2025_000001',
            amount: 180,
            donor_name: 'יוסי ישראלי',
            donor_email: 'yossi@example.com',
            donor_phone: '050-1111111',
            message: 'לזכר אור מנצור',
            status: 'completed',
            created_at: '2025-08-29T12:30:00',
            completed_at: '2025-08-29T12:32:00'
        },
        {
            id: 2,
            donation_id: 'DON_2025_000002',
            amount: 365,
            donor_name: 'רחל כהן',
            donor_email: 'rachel@example.com',
            donor_phone: '052-2222222',
            message: 'תרומה חשובה לפרויקט',
            status: 'completed',
            created_at: '2025-08-30T15:20:00',
            completed_at: '2025-08-30T15:22:00'
        },
        {
            id: 3,
            donation_id: 'DON_2025_000003',
            amount: 100,
            donor_name: 'אנונימי',
            donor_email: '',
            donor_phone: '',
            message: '',
            status: 'pending',
            created_at: '2025-08-31T10:15:00',
            completed_at: null
        }
    ];
}

function getSampleAnalytics() {
    return [
        {
            id: 1,
            session_id: 'sess_001',
            category: 'Page',
            action: 'page_view',
            label: 'index.html',
            value: null,
            url: 'https://gmarapp.com/',
            ip_address: '192.168.1.100',
            created_at: '2025-08-31T14:30:00'
        },
        {
            id: 2,
            session_id: 'sess_001',
            category: 'Form',
            action: 'registration',
            label: 'beta_signup',
            value: 1,
            url: 'https://gmarapp.com/',
            ip_address: '192.168.1.100',
            created_at: '2025-08-31T14:35:00'
        },
        {
            id: 3,
            session_id: 'sess_002',
            category: 'Button_Click',
            action: 'donation',
            label: 'donate_180',
            value: 180,
            url: 'https://gmarapp.com/',
            ip_address: '10.0.0.25',
            created_at: '2025-08-31T16:20:00'
        }
    ];
}

function getDefaultSettings() {
    return {
        whatsapp_link: 'https://chat.whatsapp.com/your-group-link',
        bit_phone: '0502277660',
        admin_email: 'admin@gmarapp.com',
        site_title: 'גמראפ - לימוד גמרא לכל אחד',
        memorial_counter_start: '2500',
        donations_counter_start: '120000',
        auto_backup_enabled: '1',
        email_notifications: '1',
        analytics_enabled: '1'
    };
}

// Communications
function createCommunication() {
    const message = prompt('הכנס הודעה לשליחה לכל הרשומים:');
    if (message && message.trim()) {
        // In real implementation, this would send emails
        showNotification(`הודעה נשלחה ל-${currentData.registrations.length} רשומים`, 'success');
        console.log('📧 Communication sent:', message);
    }
}

function sendCommunication() {
    createCommunication();
}

// Refresh functions
async function refreshData() {
    console.log('🔄 Refreshing all data...');
    ensureSidebarClosed();
    await loadAllData();
}

async function refreshRegistrations() {
    console.log('🔄 Refreshing registrations...');
    ensureSidebarClosed();
    await loadRegistrations();
    updateDashboardStats();
}

async function refreshDonations() {
    console.log('🔄 Refreshing donations...');
    ensureSidebarClosed();
    await loadDonations();
    updateDashboardStats();
}

async function refreshAnalytics() {
    console.log('🔄 Refreshing analytics...');
    ensureSidebarClosed();
    await loadAnalytics();
}

// Auto-refresh setup
function setupAutoRefresh() {
    // Refresh data every 30 seconds for better real-time updates
    refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing data...');
        loadAllData();
    }, 30 * 1000);
    
    console.log('⏰ Auto-refresh setup: every 30 seconds');
}

// Loading states
function showLoading() {
    // Could add a global loading indicator here
}

function hideLoading() {
    // Could hide global loading indicator here
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Mobile menu toggle with backdrop
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const isOpen = sidebar.classList.contains('open');
    
    if (isOpen) {
        closeMobileSidebar();
    } else {
        openMobileSidebar();
    }
}

function openMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    
    // Create backdrop if it doesn't exist
    let backdrop = document.querySelector('.mobile-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'mobile-backdrop';
        document.body.appendChild(backdrop);
        
        // Close sidebar when clicking backdrop
        backdrop.addEventListener('click', closeMobileSidebar);
    }
    
    // Show sidebar and backdrop
    sidebar.classList.add('open');
    backdrop.classList.add('show');
    
    // Prevent body scroll when sidebar is open
    document.body.classList.add('sidebar-open');
    
    // Update mobile menu button state
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
        menuBtn.setAttribute('aria-expanded', 'true');
    }
    
    console.log('🔧 Mobile sidebar opened');
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.mobile-backdrop');
    
    // Ensure sidebar is closed
    if (sidebar) {
        sidebar.classList.remove('open');
    }
    
    // Ensure backdrop is hidden
    if (backdrop) {
        backdrop.classList.remove('show');
    }
    
    // Always restore body scroll regardless of sidebar state
    document.body.classList.remove('sidebar-open');
    
    // Update mobile menu button state
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
        menuBtn.setAttribute('aria-expanded', 'false');
    }
    
    console.log('🔧 Mobile sidebar closed');
}

// Close sidebar when navigation item is clicked (mobile)
function setupMobileNavigation() {
    // This function is no longer needed since we handle closing in switchToSection
    // Keeping empty for backward compatibility
}

// Helper function to ensure sidebar is closed on mobile
function ensureSidebarClosed() {
    if (window.innerWidth <= 1024) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            closeMobileSidebar();
        }
    }
}

// Handle window resize
function handleWindowResize() {
    if (window.innerWidth > 1024) {
        // Desktop mode - ensure sidebar is properly positioned
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.querySelector('.mobile-backdrop');
        
        sidebar.classList.remove('open');
        if (backdrop) {
            backdrop.classList.remove('show');
        }
        document.body.classList.remove('sidebar-open');
    }
}

// Add resize listener
window.addEventListener('resize', handleWindowResize);

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // ESC key - close mobile sidebar
        if (e.key === 'Escape') {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                closeMobileSidebar();
            }
        }
        
        // Ctrl/Cmd + M - toggle mobile menu (for testing)
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            toggleSidebar();
        }
    });
    
    console.log('⌨️ Keyboard shortcuts setup complete');
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('שגיאה במערכת. אנא רענן את הדף.', 'error');
});

// Reset today visitors function
function resetTodayVisitors() {
    if (confirm('האם אתה בטוח שברצונך לאפס את מונה הביקורים של היום?')) {
        try {
            // Reset local analytics for today
            const today = new Date().toDateString();
            currentData.analytics = currentData.analytics.filter(a => {
                const eventDate = new Date(a.created_at);
                return eventDate.toDateString() !== today;
            });
            
            // Save reset state in localStorage so it persists after page refresh
            const resetDate = new Date().toISOString().split('T')[0];
            localStorage.setItem('visitors_reset_date', resetDate);
            localStorage.setItem('visitors_reset_applied', 'true');
            
            // Update the display to 0
            document.getElementById('today-visitors').textContent = '0';
            
            showNotification('מונה הביקורים של היום אופס בהצלחה', 'success');
            console.log('🔄 Today visitors counter reset and saved to localStorage');
            
        } catch (error) {
            console.error('Error resetting today visitors:', error);
            showNotification('שגיאה באיפוס מונה הביקורים', 'error');
        }
    }
}

// Development helpers
window.adminDebug = {
    getCurrentData: () => currentData,
    forceRefresh: () => loadAllData(),
    switchSection: switchToSection,
    exportAll: () => exportAllData(),
    clearSettingsBackup: () => {
        localStorage.removeItem('admin_settings_backup');
        console.log('🗑️ Settings backup cleared from localStorage');
    },
    testConnection: async () => {
        try {
            const regResponse = await fetch('/api/admin/registrations');
            const donResponse = await fetch('/api/admin/donations');
            console.log('Registration API Status:', regResponse.status);
            console.log('Donation API Status:', donResponse.status);
            const regData = await regResponse.json();
            const donData = await donResponse.json();
            console.log('Registrations loaded:', regData.length);
            console.log('Donations loaded:', donData.length);
            return {registrations: regData.length, donations: donData.length};
        } catch (error) {
            console.error('Connection test failed:', error);
            return {error: error.message};
        }
    }
};

console.log('🎉 GmarUp Admin Dashboard loaded successfully');
console.log('🛠️ Debug tools available in window.adminDebug');