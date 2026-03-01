// Dynamic Settings Loader for GmarUp
// This script loads settings from the database and updates all relevant elements in real-time

let siteSettings = {
    whatsapp_link: 'https://chat.whatsapp.com/LNmVCXvv35S9SsbWTol2qW',
    bit_phone: '0502277660', 
    admin_email: 'gmarupil@gmail.com',
    site_title: 'גמראפ - לימוד גמרא לכל אחד',
    memorial_counter_start: '2500'
};

// Load settings from server
async function loadDynamicSettings() {
    try {
        console.log('🔧 Loading dynamic settings from server...');
        const response = await fetch('/api/settings');
        
        if (response.ok) {
            const settings = await response.json();
            siteSettings = { ...siteSettings, ...settings };
            console.log('✅ Dynamic settings loaded:', siteSettings);
            updateSiteElements();
        } else {
            console.warn('⚠️ Failed to load settings from server, using defaults');
            updateSiteElements();
        }
        
    } catch (error) {
        console.warn('⚠️ Settings API not available, using defaults:', error.message);
        updateSiteElements();
    }
}

// Update all relevant elements on the page
function updateSiteElements() {
    console.log('🔄 Updating site elements with current settings...');
    
    // Update WhatsApp links
    updateWhatsAppLinks();
    
    // Update email links
    updateEmailLinks();
    
    // Update phone numbers
    updatePhoneNumbers();
    
    // Update site title if needed
    updateSiteTitle();
    
    // Update donation functions and static text
    updateDonationFunctions();
    
    console.log('✅ Site elements updated with dynamic settings');
}

// Update all WhatsApp links and functions
function updateWhatsAppLinks() {
    // Update global WhatsApp functions
    if (typeof window.joinWhatsApp === 'function') {
        // Override the existing function
        window.joinWhatsApp = function() {
            try {
                const whatsappURL = siteSettings.whatsapp_link;
                
                if (whatsappURL && whatsappURL !== 'https://chat.whatsapp.com/your-group-link') {
                    window.open(whatsappURL, '_blank');
                    trackEvent('whatsapp_join', 'click');
                } else {
                    // Fallback to direct message
                    const message = 'היי אני רוצה להצטרף לקבוצת העדכונים של GmarUp';
                    const fallbackURL = `https://wa.me/972${siteSettings.bit_phone.substring(1)}?text=${encodeURIComponent(message)}`;
                    window.open(fallbackURL, '_blank');
                    trackEvent('whatsapp_join_fallback', 'click');
                }
            } catch (error) {
                console.error('Error opening WhatsApp:', error);
                alert('שגיאה בפתיחת WhatsApp. אנא נסה שוב.');
            }
        };
    }
    
    // Update thank-you page WhatsApp function
    if (typeof window.openWhatsApp === 'function') {
        window.openWhatsApp = function() {
            const message = encodeURIComponent('היי! הצטרפתי לרשימת ההמתנה של GmarUp. אני מעוניין לקבל עדכונים על הפרויקט המיוחד הזה לעילוי נשמת אור מנצור הי״ד');
            
            let whatsappUrl;
            if (siteSettings.whatsapp_link && siteSettings.whatsapp_link !== 'https://chat.whatsapp.com/your-group-link') {
                whatsappUrl = siteSettings.whatsapp_link;
            } else {
                whatsappUrl = `https://wa.me/972${siteSettings.bit_phone.substring(1)}?text=${message}`;
            }
            
            window.open(whatsappUrl, '_blank');
            
            // Track action
            if (typeof gtag !== 'undefined') {
                gtag('event', 'whatsapp_click', {
                    event_category: 'Social',
                    event_label: 'thank_you_page_modern'
                });
            }
        };
    }
}

// Update all email links
function updateEmailLinks() {
    // Update all mailto links
    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    emailLinks.forEach(link => {
        const originalHref = link.getAttribute('href');
        
        // Replace old email addresses with new admin email
        if (originalHref.includes('info@gmarup.co.il') || originalHref.includes('admin@gmarapp.com')) {
            link.setAttribute('href', `mailto:${siteSettings.admin_email}`);
            
            // Update text content if it shows the email
            if (link.textContent.includes('@')) {
                link.textContent = siteSettings.admin_email;
            }
        }
    });
    
    // Update email addresses in text content
    const allElements = document.getElementsByTagName('*');
    for (let element of allElements) {
        if (element.children.length === 0 && element.textContent) {
            let text = element.textContent;
            
            // Replace email addresses in text
            if (text.includes('info@gmarup.co.il')) {
                element.textContent = text.replace(/info@gmarup\.co\.il/g, siteSettings.admin_email);
            }
            if (text.includes('admin@gmarapp.com')) {
                element.textContent = text.replace(/admin@gmarapp\.com/g, siteSettings.admin_email);
            }
        }
    }
}

// Update phone numbers
function updatePhoneNumbers() {
    // Update tel: links
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        const originalHref = link.getAttribute('href');
        
        // Replace old phone numbers with new bit phone
        if (originalHref.includes('0502277660') || originalHref.includes('050-227-7660')) {
            link.setAttribute('href', `tel:${siteSettings.bit_phone}`);
            
            // Update text content if it shows the phone number
            if (link.textContent.includes('050')) {
                link.textContent = siteSettings.bit_phone;
            }
        }
    });
    
    // Update phone numbers in text content
    const allElements = document.getElementsByTagName('*');
    for (let element of allElements) {
        if (element.children.length === 0 && element.textContent) {
            let text = element.textContent;
            
            // Replace phone numbers in text
            if (text.includes('050-227-7660')) {
                element.textContent = text.replace(/050-227-7660/g, siteSettings.bit_phone);
            }
            if (text.includes('0502277660')) {
                element.textContent = text.replace(/0502277660/g, siteSettings.bit_phone);
            }
        }
    }
}

// Update site title
function updateSiteTitle() {
    if (document.title && siteSettings.site_title) {
        // Only update if the current title contains "GmarUp" or "גמראפ"
        if (document.title.includes('GmarUp') || document.title.includes('גמראפ')) {
            const titleParts = document.title.split(' | ');
            if (titleParts.length > 1) {
                document.title = `${siteSettings.site_title} | ${titleParts.slice(1).join(' | ')}`;
            }
        }
    }
}

// Update donation functions to use dynamic bit_phone
function updateDonationFunctions() {
    // Update all static text that contains phone numbers or emails
    updateStaticText();
    
    // Update processDonation function for thank-you page
    if (typeof window.processDonation === 'function') {
        console.log('🔧 Donation functions updated with dynamic settings');
    }
}

// Update static text content throughout the page
function updateStaticText() {
    // Find all text nodes and update phone numbers and emails
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    textNodes.forEach(textNode => {
        let text = textNode.textContent;
        let updated = false;

        // Update phone numbers
        if (text.includes('050-227-7660')) {
            text = text.replace(/050-227-7660/g, siteSettings.bit_phone);
            updated = true;
        }
        if (text.includes('0502277660')) {
            text = text.replace(/0502277660/g, siteSettings.bit_phone);
            updated = true;
        }

        // Update email addresses
        if (text.includes('info@gmarup.co.il')) {
            text = text.replace(/info@gmarup\.co\.il/g, siteSettings.admin_email);
            updated = true;
        }
        if (text.includes('admin@gmarapp.com')) {
            text = text.replace(/admin@gmarapp\.com/g, siteSettings.admin_email);
            updated = true;
        }

        if (updated) {
            textNode.textContent = text;
        }
    });
}

// Initialize dynamic settings when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicSettings);
} else {
    loadDynamicSettings();
}

// Also load settings when the page becomes visible (for SPA-like behavior)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        loadDynamicSettings();
    }
});

// Export for other scripts to use
window.siteSettings = siteSettings;
window.loadDynamicSettings = loadDynamicSettings;