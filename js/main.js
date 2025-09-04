// GmarUp Beta Landing Page - Main JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Initializing GmarUp Beta Landing Page...');
        
        // Initialize components safely
        safeInit(initMobileMenu, 'Mobile Menu');
        // safeInit(initFormHandling, 'Form Handling'); // Disabled - using form-handler.js instead
        safeInit(initSmoothScrolling, 'Smooth Scrolling');
        safeInit(initAnimations, 'Animations');
        safeInit(initDonationModalEvents, 'Donation Modal Events');
        safeInit(trackPageView, 'Analytics');
        
        console.log('✅ GmarUp Beta Landing Page initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing page:', error);
    }
});

// Safe initialization wrapper
function safeInit(initFunction, componentName) {
    try {
        initFunction();
        console.log(`✅ ${componentName} initialized`);
    } catch (error) {
        console.error(`❌ Failed to initialize ${componentName}:`, error);
    }
}

// Mobile Menu functionality
function initMobileMenu() {
    try {
        const menuToggle = document.querySelector('.nav-mobile-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!menuToggle || !navMenu) {
            console.warn('Mobile menu elements not found');
            return;
        }
        
        // Toggle menu function
        function toggleMenu(forceClose = false) {
            const isActive = menuToggle.classList.contains('active');
            
            if (forceClose || isActive) {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            } else {
                menuToggle.classList.add('active');
                navMenu.classList.add('active');
                menuToggle.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
            }
        }
        
        // Menu toggle click
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        // Close menu when clicking on links
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                toggleMenu(true);
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                toggleMenu(true);
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                toggleMenu(true);
            }
        });
        
    } catch (error) {
        console.error('Error initializing mobile menu:', error);
    }
}

// Form handling for beta registration
function initFormHandling() {
    const form = document.getElementById('registrationForm');
    
    if (form) {
        // Enhanced form validation and UX
        const inputs = form.querySelectorAll('.form-input, .form-select');
        inputs.forEach(input => {
            // Real-time validation
            input.addEventListener('blur', () => {
                validateField(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateField(input);
                }
            });
        });
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('.btn-submit');
            
            // Validate form
            const fullName = formData.get('fullName')?.trim();
            const email = formData.get('email')?.trim();
            const phone = formData.get('phone')?.trim();
            const studyLevel = formData.get('studyLevel');
            
            // Enhanced validation with field highlighting
            let hasErrors = false;
            
            if (!fullName || fullName.length < 2) {
                showFieldError('fullName', 'אנא הכנס שם מלא תקין (לפחות 2 תווים)');
                hasErrors = true;
            }
            
            if (!isValidEmail(email)) {
                showFieldError('email', 'אנא הכנס כתובת מייל תקינה');
                hasErrors = true;
            }
            
            if (!isValidPhone(phone)) {
                showFieldError('phone', 'אנא הכנס מספר טלפון ישראלי תקין');
                hasErrors = true;
            }
            
            if (!studyLevel) {
                showFieldError('studyLevel', 'אנא בחר רמת לימוד');
                hasErrors = true;
            }
            
            if (hasErrors) {
                showErrorMessage('אנא תקן את השגיאות בטופס');
                return;
            }
            
            // Enhanced loading state
            submitBtn.classList.add('loading', 'btn-loading');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-loader"></span> שולח...';
            
            // Collect form data
            const data = {
                fullName: fullName,
                email: email,
                phone: phone,
                studyLevel: studyLevel,
                source: 'beta_landing',
                timestamp: new Date().toISOString()
            };
            
            // Send to registration API
            fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    showSuccessMessage('מעולה! נרשמת בהצלחה לגירסת הבטא');
                    form.reset();
                    clearAllErrors();
                    // Show next steps
                    setTimeout(() => {
                        showNextSteps();
                    }, 2000);
                    trackEvent('beta_registration', 'success');
                } else {
                    showErrorMessage(result.error || 'שגיאה ברישום. אנא נסה שוב.');
                    trackEvent('beta_registration', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showErrorMessage('שגיאה בחיבור לשרת. אנא נסה שוב.');
                trackEvent('beta_registration', 'error');
            })
            .finally(() => {
                // Remove loading state
                submitBtn.classList.remove('loading', 'btn-loading');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="btn-text">הירשם לגירסת בטא</span>';
            });
        });
    }
}

// Smooth scrolling for navigation
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Donation Modal Events Initialization
function initDonationModalEvents() {
    // Handle clicks outside modal to close
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('donation-modal-main');
        if (modal && modal.classList.contains('show') && e.target === modal) {
            closeDonationModal();
        }
    });
    
    // Handle escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('donation-modal-main');
            if (modal && modal.classList.contains('show')) {
                closeDonationModal();
            }
        }
    });
}

// Scroll to registration function
function scrollToRegistration() {
    try {
        const registerSection = document.getElementById('register');
        if (registerSection) {
            registerSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            trackEvent('cta_click', 'scroll_to_registration');
        } else {
            console.warn('Registration section not found');
        }
    } catch (error) {
        console.error('Error scrolling to registration:', error);
    }
}

// Scroll to donation function
function scrollToDonation() {
    try {
        const donationCard = document.querySelector('.donation-card');
        if (donationCard) {
            donationCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            // Highlight donation section briefly
            donationCard.style.border = '3px solid #f59e0b';
            donationCard.style.transition = 'border 0.3s ease';
            setTimeout(() => {
                donationCard.style.border = '';
            }, 2000);
            trackEvent('cta_click', 'scroll_to_donation');
        } else {
            console.warn('Donation section not found');
        }
    } catch (error) {
        console.error('Error scrolling to donation:', error);
    }
}

// WhatsApp group join - will be overridden by dynamic-settings.js
function joinWhatsApp() {
    try {
        // This function will be replaced by dynamic-settings.js with current settings
        // Fallback in case dynamic settings haven't loaded yet
        const whatsappURL = 'https://wa.me/972502277660?text=היי%20אני%20רוצה%20להצטרף%20לקבוצת%20העדכונים%20של%20GmarUp';
        
        if (whatsappURL) {
            window.open(whatsappURL, '_blank');
            showSuccessMessage('פותח וואטסאפ...');
            trackEvent('whatsapp_join', 'click');
        } else {
            throw new Error('WhatsApp link not configured');
        }
    } catch (error) {
        console.error('Error opening WhatsApp:', error);
        showErrorMessage('שגיאה בפתיחת וואטסאפ. אנא נסה שוב.');
    }
}

// Donation functions
async function donate(amount) {
    try {
        console.log(`Starting donation process for amount: ₪${amount}`);
        
        // First save donation to database
        const donationData = {
            amount: amount,
            donor_name: 'תורם אנונימי',
            donor_email: '',
            donor_phone: '',
            message: 'תרומה מדף הנחיתה הראשי',
            source: 'main_page',
            is_anonymous: 1
        };
        
        try {
            const response = await fetch('/api/donate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(donationData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Donation saved to database:', result.donation_id);
                trackEvent('donation_saved', 'amount_' + amount);
            } else {
                console.warn('Failed to save donation to database');
            }
        } catch (dbError) {
            console.warn('Database save failed, continuing with payment:', dbError);
        }
        
        // Then redirect to BIT app with the specified amount
        const bitBaseURL = 'https://www.bitpay.co.il/app/me/14D6AE95-19DD-340D-BE3D-1EB146D9A0B420D2';
        const bitURLWithAmount = `${bitBaseURL}?amount=${amount}`;
        
        // Open the BIT payment page with the amount parameter
        window.open(bitURLWithAmount, '_blank');
        
        showSuccessMessage(`מפנה לתשלום ₪${amount} באפליקציית ביט...`);
        trackEvent('donation_bit_redirect', 'amount_' + amount);
        
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('שגיאה בתרומה. אנא נסה שוב.');
    }
}

function donateCustom() {
    showDonationModal();
}

// Enhanced Donation Modal for Main Page
let selectedDonationAmount = 180;
let modalInitialized = false;

function showDonationModal() {
    const modal = document.getElementById('donation-modal-main');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Initialize only once
        if (!modalInitialized) {
            initializeDonationModal();
            modalInitialized = true;
        }
    }
}

function initializeDonationModal() {
    const amountButtons = document.querySelectorAll('#donation-modal-main .amount-btn');
    const customAmount = document.getElementById('modal-custom-amount-main');
    const donateBtn = document.getElementById('modal-donate-btn-main');
    
    // Set default selection (180)
    amountButtons.forEach(btn => {
        if (btn.dataset.amount === '180') {
            btn.classList.add('selected');
        }
        
        btn.addEventListener('click', function() {
            // Remove selection from all buttons
            amountButtons.forEach(b => b.classList.remove('selected'));
            // Add selection to clicked button
            this.classList.add('selected');
            // Clear custom amount
            if (customAmount) customAmount.value = '';
            // Update selected amount
            selectedDonationAmount = parseInt(this.dataset.amount);
            
            // Visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Handle custom amount input
    if (customAmount) {
        customAmount.addEventListener('input', function() {
            if (this.value && this.value >= 10) {
                amountButtons.forEach(btn => btn.classList.remove('selected'));
                selectedDonationAmount = parseInt(this.value) || 0;
            } else if (!this.value) {
                // If custom amount is cleared, reselect default
                amountButtons.forEach(btn => {
                    if (btn.dataset.amount === '180') {
                        btn.classList.add('selected');
                    }
                });
                selectedDonationAmount = 180;
            }
        });
    }
    
    // Handle donation button click
    if (donateBtn) {
        donateBtn.addEventListener('click', async function() {
            if (selectedDonationAmount <= 0) {
                alert('אנא בחר סכום תרומה (מינימום 10 ₪)');
                return;
            }
            
            if (selectedDonationAmount < 10) {
                alert('סכום מינימלי לתרומה: 10 ₪');
                return;
            }
            
            // Show loading state
            this.innerHTML = '🔄 מכין תשלום...';
            this.disabled = true;
            
            // Track donation
            trackEvent('donation_modal', 'amount_' + selectedDonationAmount);
            
            try {
                // First save donation to database
                const donationData = {
                    amount: selectedDonationAmount,
                    donor_name: 'תורם אנונימי',
                    donor_email: '',
                    donor_phone: '',
                    message: 'תרומה מדף הנחיתה - מודל תרומות',
                    source: 'main_page_modal',
                    is_anonymous: 1
                };
                
                this.innerHTML = '🔄 שומר תרומה...';
                
                const response = await fetch('/api/donate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(donationData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Donation saved to database:', result.donation_id);
                    trackEvent('donation_saved', 'amount_' + selectedDonationAmount);
                    
                    this.innerHTML = '🔄 פותח תשלום...';
                    
                    // Then redirect to BIT app with the selected amount
                    const bitBaseURL = 'https://www.bitpay.co.il/app/me/14D6AE95-19DD-340D-BE3D-1EB146D9A0B420D2';
                    const bitURLWithAmount = `${bitBaseURL}?amount=${selectedDonationAmount}`;
                    
                    // Open the BIT payment page with the amount parameter
                    window.open(bitURLWithAmount, '_blank');
                    
                    showSuccessMessage(`תרומה נשמרה! מפנה לתשלום ₪${selectedDonationAmount}...`);
                    trackEvent('donation_modal_bit_redirect', 'amount_' + selectedDonationAmount);
                    
                    setTimeout(() => {
                        closeDonationModal();
                    }, 1500);
                    
                } else {
                    throw new Error('שגיאה בשמירת התרומה');
                }
                
            } catch (error) {
                console.error('Donation process error:', error);
                showErrorMessage('שגיאה בתהליך התרומה. אנא נסה שוב.');
            } finally {
                // Reset button
                this.innerHTML = '🚀 תרום עכשיו';
                this.disabled = false;
            }
        });
    }
}

function closeDonationModal() {
    const modalMain = document.getElementById('donation-modal-main');
    const modalThankYou = document.getElementById('donation-modal');
    
    if (modalMain && modalMain.classList.contains('show')) {
        modalMain.classList.remove('show');
        document.body.style.overflow = '';
        
        // Reset form state
        setTimeout(() => {
            const customAmount = document.getElementById('modal-custom-amount-main');
            if (customAmount) customAmount.value = '';
            document.querySelectorAll('#donation-modal-main .amount-btn').forEach(btn => {
                btn.classList.remove('selected');
                if (btn.dataset.amount === '180') {
                    btn.classList.add('selected');
                }
            });
            selectedDonationAmount = 180;
        }, 300);
    }
    
    if (modalThankYou && modalThankYou.classList.contains('show')) {
        modalThankYou.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Memorial section actions
function learnInMemory() {
    scrollToRegistration();
    showSuccessMessage('הירשם לגירסת הבטא ותזכה ללמוד לעילוי נשמת אור');
    trackEvent('memorial_action', 'learn_click');
}

function shareDonation() {
    try {
        // Scroll to donation section
        const donationCard = document.querySelector('.donation-card');
        if (donationCard) {
            donationCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            // Highlight donation section briefly
            donationCard.style.border = '3px solid #f59e0b';
            donationCard.style.transition = 'border 0.3s ease';
            setTimeout(() => {
                donationCard.style.border = '';
            }, 2000);
        } else {
            // Fallback - scroll to registration section
            scrollToRegistration();
            showSuccessMessage('תוכל לתרום לזכר אור דרך הקישורים בדף');
        }
        trackEvent('memorial_action', 'share_donation');
    } catch (error) {
        console.error('Error in shareDonation:', error);
    }
}

// Animation initialization
function initAnimations() {
    // Check if IntersectionObserver is supported
    if (!window.IntersectionObserver) {
        // Fallback - just show all elements
        document.querySelectorAll('.section-title, .benefit-card, .action-card').forEach(el => {
            el.classList.add('visible');
        });
        return;
    }

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stop observing this element once it's visible
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements for animation
    document.querySelectorAll('.section-title, .benefit-card, .action-card').forEach(el => {
        // Add initial animation class
        el.classList.add('fade-in-up');
        observer.observe(el);
    });
}

// Success/Error message display
function showSuccessMessage(message) {
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function showErrorMessage(message) {
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function removeExistingMessages() {
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
}

// Analytics tracking
function trackPageView() {
    try {
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: 'GmarUp Beta Landing',
                page_location: window.location.href
            });
        }
        console.log('Page view tracked');
    } catch (error) {
        console.warn('Analytics not available:', error);
    }
}

function trackEvent(action, label) {
    try {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: 'beta_landing',
                event_label: label,
                value: 1
            });
        }
        
        // Console log for development
        console.log('Event tracked:', action, label);
    } catch (error) {
        console.warn('Event tracking failed:', error);
    }
}

// Utility functions (consolidated)
function validateEmail(email) {
    return isValidEmail(email);
}

function validatePhone(phone) {
    return isValidPhone(phone);
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
    // Don't show user error messages for external scripts
    if (!e.filename.includes(window.location.hostname)) {
        return;
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

// Enhanced validation functions
function validateField(input) {
    const value = input.value.trim();
    const fieldId = input.id;
    let isValid = true;
    let errorMessage = '';
    
    switch (fieldId) {
        case 'fullName':
            isValid = value.length >= 2 && /^[א-ת\s\u0590-\u05FF]+$/u.test(value);
            errorMessage = isValid ? '' : 'אנא הכנס שם בעברית (לפחות 2 תווים)';
            break;
        case 'email':
            isValid = isValidEmail(value);
            errorMessage = isValid ? '' : 'אנא הכנס כתובת מייל תקינה';
            break;
        case 'phone':
            isValid = isValidPhone(value);
            errorMessage = isValid ? '' : 'אנא הכנס מספר טלפון ישראלי תקין (050-1234567)';
            break;
        case 'studyLevel':
            isValid = value !== '';
            errorMessage = isValid ? '' : 'אנא בחר רמת לימוד';
            break;
    }
    
    if (isValid) {
        clearFieldError(fieldId);
        input.classList.remove('error');
        input.classList.add('success');
    } else if (value) {
        showFieldError(fieldId, errorMessage);
        input.classList.add('error');
        input.classList.remove('success');
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + '-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId + '-error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('show');
    });
    
    const inputs = document.querySelectorAll('.form-input, .form-select');
    inputs.forEach(input => {
        input.classList.remove('error', 'success');
    });
}

function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
}

function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const re = /^0(5[0-9]|2|3|4|8|9)\d{7}$/;
    return re.test(cleanPhone);
}

function showNextSteps() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
        <strong>🎉 ברוך הבא לקהילת GmarUp!</strong><br>
        📧 קיבלת מייל עם פרטי הגישה<br>
        📱 הצטרף לקבוצת הוואטסאפ לעדכונים
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 8000);
}

// Privacy modal functionality
function showPrivacy() {
    if (document.getElementById('privacy-modal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'privacy-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closePrivacy()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>מדיניות פרטיות</h3>
                    <button onclick="closePrivacy()" aria-label="סגור">×</button>
                </div>
                <div class="modal-body">
                    <h4>איסוף ושימוש במידע</h4>
                    <p>אנחנו אוספים:</p>
                    <ul>
                        <li>שם מלא - לזיהוי ויצירת קשר</li>
                        <li>מייל - לשליחת עדכונים על המוצר</li>
                        <li>טלפון - לתמיכה ועדכונים חשובים</li>
                        <li>רמת לימוד - להתאמת החוויה</li>
                    </ul>
                    <h4>אבטחת מידע</h4>
                    <p>הנתונים נשמרים בשרתים מאובטחים בישראל ולא מועברים לצד שלישי ללא הסכמתך.</p>
                    <h4>זכויותיך</h4>
                    <p>תוכל לבקש מחיקת הנתונים בכל עת על ידי פנייה למייל: info@gmarup.co.il</p>
                </div>
                <div class="modal-footer">
                    <button onclick="closePrivacy()" class="btn-primary">הבנתי</button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closePrivacy() {
    const modal = document.getElementById('privacy-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Secret Admin Access
let adminClickCount = 0;
let adminClickTimer = null;

function adminSecretAccess(event) {
    event.preventDefault();
    adminClickCount++;
    
    // Reset counter after 3 seconds
    if (adminClickTimer) clearTimeout(adminClickTimer);
    adminClickTimer = setTimeout(() => {
        adminClickCount = 0;
    }, 3000);
    
    // Require 5 clicks within 3 seconds
    if (adminClickCount >= 5) {
        adminClickCount = 0;
        requestAdminPassword();
    }
}

function requestAdminPassword() {
    const password = prompt('🔐 הכנס קוד אדמין:');
    
    if (password === '0544227754') {
        // Set local authentication
        localStorage.setItem('admin_auth_token', 'authenticated');
        
        // Try to authenticate with server (optional - won't fail if server is down)
        authenticateWithServer(password).catch(error => {
            console.log('Server authentication failed (server may be down):', error);
        });
        
        showAdminPanel();
        trackEvent('admin_access', 'success');
    } else if (password !== null) {
        alert('❌ קוד שגוי');
        trackEvent('admin_access', 'failed');
    }
}

function showAdminPanel() {
    // Remove existing admin panel if exists
    const existingPanel = document.getElementById('admin-panel');
    if (existingPanel) existingPanel.remove();
    
    const adminPanel = document.createElement('div');
    adminPanel.id = 'admin-panel';
    adminPanel.innerHTML = `
        <div class="admin-overlay" onclick="closeAdminPanel()">
            <div class="admin-content" onclick="event.stopPropagation()">
                <div class="admin-header">
                    <h3>🛠️ פאנל ניהול</h3>
                    <button onclick="closeAdminPanel()" class="admin-close">×</button>
                </div>
                <div class="admin-body">
                    <div class="admin-stats">
                        <h4>📊 סטטיסטיקות מהירות</h4>
                        <p><strong>🕒 עדכון אחרון:</strong> ${new Date().toLocaleString('he-IL')}</p>
                        <p><strong>📍 דף נוכחי:</strong> דף נחיתה ראשי</p>
                        <p><strong>🌐 URL:</strong> ${window.location.href}</p>
                    </div>
                    
                    <div class="admin-actions">
                        <h4>⚡ פעולות מהירות</h4>
                        <div class="admin-buttons">
                            <button onclick="openFullDashboard()" class="admin-btn">
                                📈 דאשבורד מלא
                            </button>
                            <button onclick="window.open('/api/admin?action=analytics_stats', '_blank')" class="admin-btn">
                                📊 אנליטיקס
                            </button>
                            <button onclick="downloadLeads()" class="admin-btn">
                                📋 הורד רישומים
                            </button>
                            <button onclick="testEmailSystem()" class="admin-btn">
                                ✉️ בדוק מיילים
                            </button>
                        </div>
                    </div>
                    
                    <div class="admin-info">
                        <p style="color: var(--gray-500); font-size: 0.85rem; text-align: center;">
                            🔒 גישת מנהל | נוצר: ${new Date().toLocaleTimeString('he-IL')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    adminPanel.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 15000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(adminPanel);
    document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) {
        panel.remove();
        document.body.style.overflow = '';
    }
}

function downloadLeads() {
    // Simulate downloading leads data
    alert('🔄 מכין קובץ הרישומים... (בפיתוח)');
    // In real implementation, this would call the API
}

function testEmailSystem() {
    alert('📧 בודק מערכת מיילים... (בפיתוח)');
    // In real implementation, this would test email functionality
}

function openFullDashboard() {
    // Set authentication token before opening dashboard
    localStorage.setItem('admin_auth_token', 'authenticated');
    window.open('admin.html', '_blank');
}

async function authenticateWithServer(password) {
    try {
        const response = await fetch('/api/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `login=1&password=${encodeURIComponent(password)}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('admin_auth_token', 'authenticated');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}

// Ensure page is fully interactive
setTimeout(() => {
    console.log('🎉 GmarUp Beta Landing Page fully loaded and interactive');
}, 100);