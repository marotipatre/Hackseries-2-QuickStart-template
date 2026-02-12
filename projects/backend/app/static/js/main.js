/**
 * ChainGuardian - Main JavaScript
 * Common utilities and helper functions
 */

// API base URL
const API_BASE_URL = window.location.origin;

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
}

/**
 * Format a timestamp to a readable string
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

/**
 * Truncate an address for display
 * @param {string} address - Address to truncate
 * @param {number} startLength - Number of characters to show at start
 * @param {number} endLength - Number of characters to show at end
 * @returns {string} Truncated address
 */
function truncateAddress(address, startLength = 6, endLength = 4) {
    if (!address) return '--';
    if (address.length <= startLength + endLength) return address;
    return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
}

/**
 * Get risk level from score
 * @param {number} score - Risk score (0-100)
 * @returns {object} Risk level object with label, color, etc.
 */
function getRiskLevel(score) {
    if (score >= 80) {
        return {
            label: 'CRITICAL',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700',
            barColor: 'bg-red-500'
        };
    } else if (score >= 60) {
        return {
            label: 'HIGH',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-700',
            barColor: 'bg-orange-500'
        };
    } else if (score >= 40) {
        return {
            label: 'MEDIUM',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700',
            barColor: 'bg-yellow-500'
        };
    } else if (score >= 20) {
        return {
            label: 'LOW',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-700',
            barColor: 'bg-blue-500'
        };
    } else {
        return {
            label: 'SAFE',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
            barColor: 'bg-green-500'
        };
    }
}

/**
 * Get decision label from code
 * @param {number} decision - Decision code (0=BLOCKED, 1=ALLOWED, 2=FROZEN)
 * @returns {string} Decision label
 */
function getDecisionLabel(decision) {
    switch (decision) {
        case 0: return 'BLOCKED';
        case 1: return 'ALLOWED';
        case 2: return 'FROZEN';
        default: return 'UNKNOWN';
    }
}

/**
 * Get decision badge class from code
 * @param {number} decision - Decision code
 * @returns {string} CSS class for badge
 */
function getDecisionBadgeClass(decision) {
    switch (decision) {
        case 0: return 'bg-red-100 text-red-700';
        case 1: return 'bg-green-100 text-green-700';
        case 2: return 'bg-orange-100 text-orange-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transform transition-all duration-300 translate-x-full`;

    // Set color based on type
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500');
            break;
        case 'error':
            toast.classList.add('bg-red-500');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500');
            break;
        default:
            toast.classList.add('bg-blue-500');
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);

    // Remove after delay
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * Show a confirmation dialog
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} User's choice
 */
function confirmAction(message) {
    return new Promise((resolve) => {
        if (confirm(message)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        showToast('Failed to copy to clipboard', 'error');
        return false;
    }
}

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '--';
    return num.toLocaleString();
}

/**
 * Format a currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted amount
 */
function formatCurrency(amount, currency = '') {
    if (amount === null || amount === undefined) return '--';
    const formatted = amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
    return currency ? `${formatted} ${currency}` : formatted;
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
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

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Smooth scroll to element
 * @param {string|HTMLElement} target - Target element or selector
 * @param {number} offset - Offset from top
 */
function scrollToElement(target, offset = 0) {
    const element = typeof target === 'string'
        ? document.querySelector(target)
        : target;

    if (element) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            if (target !== '#') {
                scrollToElement(target, 80);
            }
        });
    });

    // Add loading state to forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function () {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = 'Processing...';
            }
        });
    });
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiRequest,
        formatTimestamp,
        truncateAddress,
        getRiskLevel,
        getDecisionLabel,
        getDecisionBadgeClass,
        showToast,
        confirmAction,
        copyToClipboard,
        formatNumber,
        formatCurrency,
        debounce,
        throttle,
        isInViewport,
        scrollToElement,
    };
}
