// Analytics and tracking for GmarUp Landing Page

// Initialize analytics
(function() {
    'use strict';
    
    // Configuration
    const ANALYTICS_CONFIG = {
        trackScrollDepth: true,
        trackTimeOnPage: true,
        trackButtonClicks: true,
        trackFormEvents: true,
        trackExternalLinks: true,
        heatmapTracking: false // Set to true if using hotjar/fullstory
    };
    
    let sessionStartTime = Date.now();
    let maxScrollDepth = 0;
    let timeSpentIntervals = [];
    
    // Initialize all tracking
    document.addEventListener('DOMContentLoaded', function() {
        initScrollDepthTracking();
        initTimeTracking();
        initButtonTracking();
        initExternalLinkTracking();
        initVisibilityTracking();
        initErrorTracking();
        
        // Track page load
        trackPageMetrics();
    });
    
    // Scroll depth tracking
    function initScrollDepthTracking() {
        if (!ANALYTICS_CONFIG.trackScrollDepth) return;
        
        const scrollMilestones = [25, 50, 75, 90, 100];
        let trackedMilestones = new Set();
        
        window.addEventListener('scroll', throttle(function() {
            const scrollTop = window.pageYOffset;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / documentHeight) * 100);
            
            // Track max scroll depth
            maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
            
            // Track milestone percentages
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
                    trackedMilestones.add(milestone);
                    trackEvent('Scroll', 'depth', `${milestone}%`, milestone);
                }
            });
            
        }, 250), { passive: true });
    }
    
    // Time on page tracking
    function initTimeTracking() {
        if (!ANALYTICS_CONFIG.trackTimeOnPage) return;
        
        // Track time intervals
        const intervals = [30, 60, 120, 300, 600]; // seconds
        
        intervals.forEach(interval => {
            setTimeout(() => {
                trackEvent('Engagement', 'time_on_page', `${interval}s`, interval);
            }, interval * 1000);
        });
        
        // Track when user leaves
        window.addEventListener('beforeunload', function() {
            const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
            trackEvent('Engagement', 'session_duration', null, timeSpent);
            trackEvent('Engagement', 'max_scroll_depth', null, maxScrollDepth);
        });
    }
    
    // Button and CTA tracking
    function initButtonTracking() {
        if (!ANALYTICS_CONFIG.trackButtonClicks) return;
        
        // Track all buttons
        document.addEventListener('click', function(e) {
            const button = e.target.closest('button, .btn, a[href^="#"], a[href*="whatsapp"], a[href*="bit.ly"]');
            
            if (button) {
                const buttonText = button.textContent.trim();
                const buttonClass = button.className;
                const isExternal = button.href && (button.href.includes('whatsapp') || button.href.includes('bit.ly'));
                
                if (isExternal) {
                    trackEvent('External_Click', getButtonType(button), buttonText);
                } else {
                    trackEvent('Button_Click', getButtonType(button), buttonText);
                }
            }
        });
    }
    
    function getButtonType(button) {
        if (button.classList.contains('btn-whatsapp')) return 'whatsapp';
        if (button.classList.contains('btn-donate')) return 'donation';
        if (button.classList.contains('btn-primary')) return 'registration';
        if (button.classList.contains('amount-btn')) return 'donation_amount';
        if (button.href && button.href.startsWith('#')) return 'navigation';
        return 'other';
    }
    
    // External link tracking
    function initExternalLinkTracking() {
        if (!ANALYTICS_CONFIG.trackExternalLinks) return;
        
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href]');
            
            if (link && (link.hostname !== window.location.hostname || link.href.includes('whatsapp') || link.href.includes('bit.ly'))) {
                trackEvent('External_Link', 'click', link.href);
                
                // Add small delay for tracking
                if (!link.target || link.target === '_self') {
                    e.preventDefault();
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 100);
                }
            }
        });
    }
    
    // Page visibility tracking
    function initVisibilityTracking() {
        let isVisible = true;
        let visibilityStartTime = Date.now();
        
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Page hidden
                if (isVisible) {
                    const visibleTime = Date.now() - visibilityStartTime;
                    trackEvent('Engagement', 'visible_time', null, Math.round(visibleTime / 1000));
                    isVisible = false;
                }
            } else {
                // Page visible
                if (!isVisible) {
                    visibilityStartTime = Date.now();
                    isVisible = true;
                    trackEvent('Engagement', 'page_returned');
                }
            }
        });
    }
    
    // Error tracking
    function initErrorTracking() {
        // JavaScript errors
        window.addEventListener('error', function(e) {
            trackEvent('Error', 'javascript', `${e.filename}:${e.lineno} - ${e.message}`);
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', function(e) {
            trackEvent('Error', 'promise_rejection', e.reason?.message || 'Unknown promise rejection');
        });
        
        // Network errors
        window.addEventListener('offline', function() {
            trackEvent('Network', 'offline');
        });
        
        window.addEventListener('online', function() {
            trackEvent('Network', 'online');
        });
    }
    
    // Page performance metrics
    function trackPageMetrics() {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.timing;
                const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
                const firstPaintTime = performance.getEntriesByType('paint')
                    .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
                
                trackEvent('Performance', 'page_load_time', null, Math.round(loadTime));
                trackEvent('Performance', 'dom_ready_time', null, Math.round(domReadyTime));
                trackEvent('Performance', 'first_paint_time', null, Math.round(firstPaintTime));
                
                // Track largest contentful paint
                if ('LargestContentfulPaint' in window) {
                    new PerformanceObserver((entryList) => {
                        const entries = entryList.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        trackEvent('Performance', 'largest_contentful_paint', null, Math.round(lastEntry.startTime));
                    }).observe({ entryTypes: ['largest-contentful-paint'] });
                }
                
            }, 0);
        });
    }
    
    // Device and browser tracking
    function trackDeviceInfo() {
        const deviceInfo = {
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            device_pixel_ratio: window.devicePixelRatio || 1,
            user_agent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            is_mobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
            is_touch: 'ontouchstart' in window,
            connection_type: navigator.connection?.effectiveType || 'unknown'
        };
        
        // Track once per session
        if (!sessionStorage.getItem('device_tracked')) {
            trackEvent('Device', 'info', JSON.stringify(deviceInfo));
            sessionStorage.setItem('device_tracked', 'true');
        }
    }
    
    // A/B testing support
    function getABTestVariant() {
        const variants = ['A', 'B'];
        let variant = localStorage.getItem('ab_test_variant');
        
        if (!variant) {
            variant = variants[Math.floor(Math.random() * variants.length)];
            localStorage.setItem('ab_test_variant', variant);
        }
        
        return variant;
    }
    
    // Conversion funnel tracking
    function trackConversionFunnel() {
        const funnelSteps = [
            { element: '.hero', step: 'hero_view' },
            { element: '.registration-form', step: 'form_view' },
            { element: '#registrationForm input', step: 'form_interaction' },
            { element: '.memorial', step: 'memorial_view' },
            { element: '.features', step: 'features_view' },
            { element: '.donation', step: 'donation_view' }
        ];
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const step = entry.target.dataset.funnelStep;
                    if (step) {
                        trackEvent('Funnel', step);
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, { threshold: 0.5 });
        
        funnelSteps.forEach(({ element, step }) => {
            const el = document.querySelector(element);
            if (el) {
                el.dataset.funnelStep = step;
                observer.observe(el);
            }
        });
    }
    
    // Heat map tracking (if enabled)
    function initHeatmapTracking() {
        if (!ANALYTICS_CONFIG.heatmapTracking) return;
        
        // Track clicks with coordinates
        document.addEventListener('click', function(e) {
            const clickData = {
                x: e.clientX,
                y: e.clientY,
                element: e.target.tagName,
                className: e.target.className,
                timestamp: Date.now()
            };
            
            trackEvent('Heatmap', 'click', JSON.stringify(clickData));
        });
    }
    
    // Utility functions
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Custom event tracking function
    window.trackCustomEvent = function(category, action, label, value) {
        trackEvent(category, action, label, value);
    };
    
    // Export analytics data for admin panel
    window.getAnalyticsData = function() {
        return {
            sessionDuration: Date.now() - sessionStartTime,
            maxScrollDepth: maxScrollDepth,
            deviceInfo: getDeviceInfo(),
            abTestVariant: getABTestVariant(),
            trafficSource: getTrafficSource()
        };
    };
    
    function getDeviceInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            userAgent: navigator.userAgent,
            isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
        };
    }
    
    function getTrafficSource() {
        const params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            referrer: document.referrer
        };
    }
    
    // Initialize additional tracking
    setTimeout(() => {
        trackDeviceInfo();
        trackConversionFunnel();
        initHeatmapTracking();
    }, 1000);
    
})();

// Global tracking function for external use
function trackEvent(category, action, label = null, value = null) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        const eventData = {
            event_category: category,
            event_label: label
        };
        
        if (value !== null) {
            eventData.value = value;
        }
        
        gtag('event', action, eventData);
    }
    
    // Custom analytics endpoint (for admin panel)
    try {
        fetch('/api/admin?action=track_analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category,
                action,
                label,
                value,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionId: getOrCreateSessionId()
            })
        }).catch(err => {
            console.log('Analytics tracking failed:', err);
        });
    } catch (error) {
        console.log('Analytics error:', error);
    }
    
    // Development logging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`📊 Analytics: ${category} | ${action} | ${label} | ${value}`);
    }
}

// Session management
function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    
    return sessionId;
}

// User identification (for returning visitors)
function getUserId() {
    let userId = localStorage.getItem('user_id');
    
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
    }
    
    return userId;
}

// Enhanced conversion tracking
function trackConversion(type, value = null, details = {}) {
    const conversionData = {
        type,
        value,
        details,
        timestamp: Date.now(),
        sessionId: getOrCreateSessionId(),
        userId: getUserId(),
        page: window.location.pathname,
        source: getTrafficSource()
    };
    
    // Track to GA4
    trackEvent('Conversion', type, JSON.stringify(details), value);
    
    // Track to custom endpoint
    fetch('/api/admin?action=track_conversion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(conversionData)
    }).catch(err => {
        console.log('Conversion tracking failed:', err);
    });
}

// Lead scoring
function calculateLeadScore() {
    let score = 0;
    
    // Time on page
    const timeOnPage = (Date.now() - sessionStartTime) / 1000;
    if (timeOnPage > 60) score += 20;
    if (timeOnPage > 180) score += 30;
    if (timeOnPage > 300) score += 50;
    
    // Scroll depth
    if (maxScrollDepth > 50) score += 25;
    if (maxScrollDepth > 80) score += 35;
    
    // Interactions
    const interactions = sessionStorage.getItem('interaction_count') || 0;
    score += Math.min(parseInt(interactions) * 10, 50);
    
    // Traffic source
    const source = getTrafficSource();
    if (source.utm_source === 'google') score += 15;
    if (source.utm_source === 'facebook') score += 10;
    if (source.referrer) score += 10;
    
    return Math.min(score, 100);
}

// Form analytics
function trackFormAnalytics(formId, eventType, data = {}) {
    const formElement = document.getElementById(formId);
    const formData = {
        formId,
        eventType,
        data,
        leadScore: calculateLeadScore(),
        timestamp: Date.now()
    };
    
    trackEvent('Form_Analytics', eventType, JSON.stringify(formData));
}

// Exit intent tracking
function initExitIntentTracking() {
    let exitIntentShown = false;
    
    document.addEventListener('mouseleave', function(e) {
        if (e.clientY <= 0 && !exitIntentShown && window.innerWidth > 768) {
            exitIntentShown = true;
            trackEvent('Exit_Intent', 'triggered');
            
            // Could trigger exit intent popup here
            showExitIntentPopup();
        }
    });
}

function showExitIntentPopup() {
    // Create exit intent popup
    const popup = document.createElement('div');
    popup.className = 'exit-intent-popup';
    popup.innerHTML = `
        <div class="exit-popup-content">
            <h3>רגע! לא לוותר על הזדמנות</h3>
            <p>הצטרף עכשיו ותקבל גישה מיידית לכל התכנים</p>
            <button onclick="closeExitIntent()" class="btn btn-primary">הצטרף עכשיו</button>
            <button onclick="closeExitIntent()" class="close-popup">לא תודה</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Style the popup
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    window.closeExitIntent = function() {
        popup.remove();
        trackEvent('Exit_Intent', 'closed');
    };
}

// Traffic source analysis
function getTrafficSource() {
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    
    return {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_content: params.get('utm_content'),
        utm_term: params.get('utm_term'),
        referrer: referrer,
        direct: !referrer && !params.get('utm_source')
    };
}

// Initialize exit intent after delay
setTimeout(initExitIntentTracking, 5000);