// Form handling and validation for GmarUp Landing Page

document.addEventListener('DOMContentLoaded', function() {
    initRegistrationForm();
});

function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const nameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const studyLevelInput = document.getElementById('studyLevel');
    const emailConsentInput = document.getElementById('emailConsent');
    const submitButton = form.querySelector('button[type="submit"]');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Initialize progress tracking
    initFormProgress();

    // Real-time validation with progress update
    if (nameInput) {
        nameInput.addEventListener('blur', () => {
            validateName(nameInput);
            updateProgress();
        });
        nameInput.addEventListener('input', updateProgress);
    }
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            validateEmail(emailInput);
            updateProgress();
        });
        emailInput.addEventListener('input', updateProgress);
    }
    if (phoneInput) {
        phoneInput.addEventListener('blur', () => {
            validatePhone(phoneInput);
            updateProgress();
        });
        phoneInput.addEventListener('input', updateProgress);
    }
    if (studyLevelInput) {
        studyLevelInput.addEventListener('change', updateProgress);
    }
    if (emailConsentInput) {
        emailConsentInput.addEventListener('change', () => {
            validateEmailConsent(emailConsentInput);
            updateProgress();
        });
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate all fields (including consent checkbox)
        const isNameValid = nameInput ? validateName(nameInput) : false;
        const isEmailValid = emailInput ? validateEmail(emailInput) : false;
        const isPhoneValid = phoneInput ? validatePhone(phoneInput) : false;
        const isConsentValid = emailConsentInput ? validateEmailConsent(emailConsentInput) : false;

        if (!isNameValid || !isEmailValid || !isPhoneValid || !isConsentValid) {
            showFormError('אנא תקן את השדות המסומנים באדום ואשר את הסכמתך לדיוור');
            return;
        }

        // Show loading
        showLoading();
        submitButton.disabled = true;

        try {
            const formData = {
                fullName: nameInput ? nameInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : '',
                phone: phoneInput ? phoneInput.value.trim() : '',
                studyLevel: studyLevelInput ? studyLevelInput.value || 'לא צוין' : 'לא צוין',
                emailConsent: emailConsentInput ? emailConsentInput.checked : false,
                source: getTrafficSource(),
                timestamp: new Date().toISOString()
            };

            // Track form submission attempt
            trackEvent('Form', 'registration_attempt', formData.email);

            // Submit to backend
            const response = await submitRegistration(formData);

            if (response.success) {
                // Track successful registration
                trackEvent('Form', 'registration_success', formData.email);
                
                // Show success and redirect
                showSuccessMessage();
                
                // Redirect to thank you page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'thank-you.html?email=' + encodeURIComponent(formData.email);
                }, 2000);
                
            } else {
                throw new Error(response.error || 'שגיאה בהרשמה');
            }

        } catch (error) {
            console.error('Registration error:', error);
            trackEvent('Form', 'registration_error', error.message);
            showFormError('שגיאה בהרשמה. אנא נסה שוב או צור קשר טלפונית');
        } finally {
            hideLoading();
            submitButton.disabled = false;
        }
    });
}

// Validation functions
function validateName(input) {
    const value = input.value.trim();
    // Accept Hebrew, English, and space characters
    const isValid = value.length >= 2 && /^[א-תa-zA-Z\s\u0590-\u05FF]+$/u.test(value);
    
    setFieldValidation(input, isValid, isValid ? '' : 'אנא הכנס שם (לפחות 2 תווים)');
    return isValid;
}

function validateEmail(input) {
    const value = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    
    setFieldValidation(input, isValid, isValid ? '' : 'אנא הכנס כתובת מייל תקינה');
    return isValid;
}

function validatePhone(input) {
    const value = input.value.trim();
    // Israeli phone number validation - supports both +972 and 0 prefixes
    const cleanValue = value.replace(/[\s-]/g, '');
    const phoneRegex = /^(\+972(5[0-9]|2|3|4|8|9)\d{7}|0(5[0-9]|2|3|4|8|9)\d{7})$/;
    const isValid = phoneRegex.test(cleanValue);
    
    setFieldValidation(input, isValid, isValid ? '' : 'אנא הכנס מספר טלפון ישראלי תקין (050-1234567 או +972501234567)');
    return isValid;
}

function validateEmailConsent(input) {
    const isValid = input.checked;
    const formGroup = input.closest('.form-group');
    let errorElement = formGroup.querySelector('.field-error');
    
    // Remove existing error element
    if (errorElement) {
        errorElement.remove();
    }
    
    // Remove previous validation classes from wrapper
    const checkboxWrapper = formGroup.querySelector('.checkbox-wrapper');
    checkboxWrapper.classList.remove('checkbox-error');
    
    if (!isValid) {
        checkboxWrapper.classList.add('checkbox-error');
        
        // Add error message
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = 'חובה לאשר את הסכמתך לקבלת עדכונים';
        errorElement.style.color = '#E53E3E';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '0.5rem';
        formGroup.appendChild(errorElement);
    }
    
    return isValid;
}

function setFieldValidation(input, isValid, errorMessage) {
    const formGroup = input.closest('.form-group');
    let errorElement = formGroup.querySelector('.field-error');
    
    // Remove existing error element
    if (errorElement) {
        errorElement.remove();
    }
    
    // Remove previous validation classes
    input.classList.remove('form-error', 'form-success');
    
    if (isValid && input.value.trim()) {
        input.classList.add('form-success');
    } else if (!isValid && input.value.trim()) {
        input.classList.add('form-error');
        
        // Add error message
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = errorMessage;
        errorElement.style.color = '#E53E3E';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '0.5rem';
        formGroup.appendChild(errorElement);
    }
}

// Backend communication
async function submitRegistration(formData) {
    try {
        console.log('Submitting registration to server:', formData);
        
        // שליחה לשרת האמיתי
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('Registration submitted successfully:', result);
            return result;
        } else {
            throw new Error(result.error || 'שגיאה בשרת');
        }
        
    } catch (error) {
        console.error('Registration failed:', error);
        
        // Fallback - שמירה מקומית כגיבוי
        console.warn('Server not available, saving locally as backup...');
        const registrations = JSON.parse(localStorage.getItem('gmarup_registrations_backup') || '[]');
        registrations.push({
            ...formData,
            id: Date.now(),
            created_at: new Date().toISOString(),
            status: 'backup_submission'
        });
        localStorage.setItem('gmarup_registrations_backup', JSON.stringify(registrations));
        
        // Don't return success if server is not available - throw the error instead
        throw new Error('השרת לא זמין כרגע. אנא נסה שוב מאוחר יותר או צור קשר טלפונית');
    }
}

// Traffic source detection
function getTrafficSource() {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const referrer = document.referrer;
    
    if (utmSource) {
        return `${utmSource}${utmMedium ? `/${utmMedium}` : ''}`;
    }
    
    if (referrer) {
        try {
            const domain = new URL(referrer).hostname;
            if (domain.includes('google')) return 'google';
            if (domain.includes('facebook')) return 'facebook';
            if (domain.includes('whatsapp')) return 'whatsapp';
            return domain;
        } catch (e) {
            return 'referrer';
        }
    }
    
    return 'direct';
}

// UI feedback functions
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showFormError(message) {
    // Create or update error message
    let errorDiv = document.getElementById('form-error-message');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'form-error-message';
        errorDiv.style.cssText = `
            background: #FED7D7;
            color: #C53030;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
            border: 1px solid #FEB2B2;
        `;
        
        const form = document.getElementById('registrationForm');
        form.insertBefore(errorDiv, form.firstChild);
    }
    
    errorDiv.textContent = message;
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccessMessage() {
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #C6F6D5;
        color: #22543D;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border: 2px solid #9AE6B4;
        max-width: 90%;
        animation: scale-in 0.5s ease;
    `;
    
    successDiv.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
        <h3 style="margin-bottom: 1rem; color: #22543D;">ברוך הבא למשפחת גמראפ!</h3>
        <p style="margin: 0; color: #2F855A;">קיבלנו את ההרשמה שלך.<br>בעוד רגע תועבר לדף המשך...</p>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after redirect
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Auto-fill detection and handling
function detectAutoFill() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    
    inputs.forEach(input => {
        // Check for auto-filled content periodically
        const checkAutoFill = () => {
            if (input.value && !input.dataset.userEntered) {
                input.classList.add('autofilled');
                
                // Trigger validation for auto-filled fields
                setTimeout(() => {
                    if (input.type === 'email') validateEmail(input);
                    else if (input.type === 'tel') validatePhone(input);
                    else if (input.id === 'name') validateName(input);
                }, 100);
            }
        };
        
        // Mark when user actually types
        input.addEventListener('input', function() {
            this.dataset.userEntered = 'true';
            this.classList.remove('autofilled');
        });
        
        // Check for auto-fill
        setTimeout(checkAutoFill, 500);
        setInterval(checkAutoFill, 1000);
    });
}

// Initialize auto-fill detection
setTimeout(detectAutoFill, 1000);

// Form analytics
function trackFormInteraction() {
    const form = document.getElementById('registrationForm');
    const inputs = form.querySelectorAll('input');
    
    let startTime = Date.now();
    let interactions = 0;
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (interactions === 0) {
                startTime = Date.now();
                trackEvent('Form', 'started');
            }
            interactions++;
            trackEvent('Form', 'field_focus', this.id);
        });
        
        input.addEventListener('blur', function() {
            const timeSpent = Date.now() - startTime;
            trackEvent('Form', 'field_blur', this.id, Math.round(timeSpent / 1000));
        });
    });
}

// Initialize form analytics
trackFormInteraction();

// Debug function to test form submission
function testFormSubmission() {
    const formData = {
        fullName: 'בדיקת טופס',
        email: 'test-form@test.com',
        phone: '050-9999999',
        studyLevel: 'auto-detect',
        source: 'form-test',
        timestamp: new Date().toISOString()
    };
    
    submitRegistration(formData).then(result => {
        console.log('Form test result:', result);
    }).catch(error => {
        console.error('Form test error:', error);
    });
}

// Make debug function available globally
window.testFormSubmission = testFormSubmission;

// Form Progress Functions
function initFormProgress() {
    updateProgress();
}

function updateProgress() {
    const nameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const emailConsentInput = document.getElementById('emailConsent');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (!progressFill || !progressText) return;

    let filledFields = 0;
    const totalFields = 4; // Updated to include consent checkbox

    // Check each field
    if (nameInput && nameInput.value.trim().length >= 2) filledFields++;
    if (emailInput && emailInput.value.trim().includes('@')) filledFields++;
    if (phoneInput && phoneInput.value.trim().length >= 9) filledFields++;
    if (emailConsentInput && emailConsentInput.checked) filledFields++;

    const percentage = (filledFields / totalFields) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${filledFields}/${totalFields} שדות מולאו`;

    // Update progress text color
    if (filledFields === totalFields) {
        progressText.style.color = 'var(--accent)';
        progressText.innerHTML = '✅ הטופס מוכן להגשה!';
    } else {
        progressText.style.color = 'var(--gray-600)';
    }
}

// Sticky CTA Bar Functionality
function initStickyCta() {
    const stickyCta = document.getElementById('stickyCta');
    const heroSection = document.querySelector('.hero-beta');
    
    if (!stickyCta || !heroSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                stickyCta.classList.remove('show');
            } else {
                stickyCta.classList.add('show');
            }
        });
    }, { threshold: 0.1 });

    observer.observe(heroSection);
}

// Initialize sticky CTA on load
document.addEventListener('DOMContentLoaded', function() {
    initStickyCta();
});