// File Path: /shared/utils/helpers.js
// Shared utility helper functions for Web Automation Platform
// REF-091: Common utility functions used across the application

const { REGEX_PATTERNS, DEFAULTS, TIME_FILTERS } = require('../constants/config');

// ===========================================
// STRING UTILITIES
// ===========================================

/**
 * Capitalize first letter of a string
 */
function capitalize(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to title case
 */
function toTitleCase(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

/**
 * Truncate string with ellipsis
 */
function truncate(str, length = 100, suffix = '...') {
    if (typeof str !== 'string') return str;
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\n+/g, ' ')  // Replace newlines with spaces
        .trim();               // Remove leading/trailing whitespace
}

/**
 * Generate random string
 */
function generateRandomString(length = 10, includeNumbers = true) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const chars = includeNumbers ? letters + numbers : letters;
    
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Slugify string for URLs
 */
function slugify(str) {
    if (typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// ===========================================
// NUMBER UTILITIES
// ===========================================

/**
 * Parse view count from YouTube format (1.2M, 850K, etc.)
 */
function parseViewCount(viewStr) {
    if (!viewStr || typeof viewStr !== 'string') return 0;
    
    const cleanStr = viewStr.replace(/[^0-9.KMB]/gi, '');
    const number = parseFloat(cleanStr);
    
    if (isNaN(number)) return 0;
    
    if (cleanStr.includes('B') || cleanStr.includes('b')) return Math.round(number * 1000000000);
    if (cleanStr.includes('M') || cleanStr.includes('m')) return Math.round(number * 1000000);
    if (cleanStr.includes('K') || cleanStr.includes('k')) return Math.round(number * 1000);
    
    return Math.round(number);
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
}

/**
 * Parse duration from YouTube format (10:30, 1:05:20)
 */
function parseDuration(durationStr) {
    if (!durationStr || typeof durationStr !== 'string') return 0;
    
    const parts = durationStr.split(':').map(part => parseInt(part, 10));
    
    if (parts.length === 1) return parts[0]; // seconds only
    if (parts.length === 2) return parts[0] * 60 + parts[1]; // minutes:seconds
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hours:minutes:seconds
    
    return 0;
}

/**
 * Format seconds to duration string
 */
function formatDuration(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate percentage
 */
function calculatePercentage(value, total, decimals = 1) {
    if (total === 0) return 0;
    return Number(((value / total) * 100).toFixed(decimals));
}

// ===========================================
// DATE/TIME UTILITIES
// ===========================================

/**
 * Format date to readable string
 */
function formatDate(date, options = {}) {
    if (!date) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
function getRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
    
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
}

/**
 * Add time to date
 */
function addTime(date, amount, unit = 'hours') {
    const newDate = new Date(date);
    
    switch (unit) {
        case 'seconds':
            newDate.setSeconds(newDate.getSeconds() + amount);
            break;
        case 'minutes':
            newDate.setMinutes(newDate.getMinutes() + amount);
            break;
        case 'hours':
            newDate.setHours(newDate.getHours() + amount);
            break;
        case 'days':
            newDate.setDate(newDate.getDate() + amount);
            break;
        default:
            throw new Error(`Unsupported time unit: ${unit}`);
    }
    
    return newDate;
}

/**
 * Check if date is within time filter
 */
function isWithinTimeFilter(date, timeFilter) {
    if (!date || !timeFilter) return false;
    
    const now = new Date();
    const checkDate = new Date(date);
    const diffMs = now - checkDate;
    
    switch (timeFilter) {
        case TIME_FILTERS.HOUR:
            return diffMs <= 3600000; // 1 hour
        case TIME_FILTERS.DAY:
            return diffMs <= 86400000; // 24 hours
        case TIME_FILTERS.WEEK:
            return diffMs <= 604800000; // 7 days
        case TIME_FILTERS.MONTH:
            return diffMs <= 2592000000; // 30 days
        case TIME_FILTERS.YEAR:
            return diffMs <= 31536000000; // 365 days
        default:
            return false;
    }
}

// ===========================================
// ARRAY UTILITIES
// ===========================================

/**
 * Remove duplicates from array
 */
function removeDuplicates(arr, key = null) {
    if (!Array.isArray(arr)) return [];
    
    if (key) {
        const seen = new Set();
        return arr.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    
    return [...new Set(arr)];
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray(arr, size) {
    if (!Array.isArray(arr) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Sort array by key
 */
function sortBy(arr, key, direction = 'asc') {
    if (!Array.isArray(arr)) return [];
    
    return arr.sort((a, b) => {
        let aVal = key ? a[key] : a;
        let bVal = key ? b[key] : b;
        
        // Handle dates
        if (aVal instanceof Date && bVal instanceof Date) {
            aVal = aVal.getTime();
            bVal = bVal.getTime();
        }
        
        // Handle strings (case insensitive)
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (direction === 'desc') {
            return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
}

/**
 * Group array by key
 */
function groupBy(arr, key) {
    if (!Array.isArray(arr)) return {};
    
    return arr.reduce((groups, item) => {
        const value = typeof key === 'function' ? key(item) : item[key];
        groups[value] = groups[value] || [];
        groups[value].push(item);
        return groups;
    }, {});
}

// ===========================================
// OBJECT UTILITIES
// ===========================================

/**
 * Deep clone object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
}

/**
 * Pick specific keys from object
 */
function pick(obj, keys) {
    if (!obj || typeof obj !== 'object') return {};
    
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Omit specific keys from object
 */
function omit(obj, keys) {
    if (!obj || typeof obj !== 'object') return {};
    
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
}

/**
 * Check if object is empty
 */
function isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

// ===========================================
// VALIDATION UTILITIES
// ===========================================

/**
 * Validate email format
 */
function isValidEmail(email) {
    return typeof email === 'string' && REGEX_PATTERNS.EMAIL.test(email);
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
    return typeof url === 'string' && REGEX_PATTERNS.URL.test(url);
}

/**
 * Validate YouTube URL
 */
function isValidYouTubeUrl(url) {
    return typeof url === 'string' && REGEX_PATTERNS.YOUTUBE_URL.test(url);
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url) {
    if (!isValidYouTubeUrl(url)) return null;
    
    const match = url.match(REGEX_PATTERNS.YOUTUBE_URL);
    return match ? match[3] : null;
}

/**
 * Sanitize string for safe output
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    
    return str
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

// ===========================================
// ERROR UTILITIES
// ===========================================

/**
 * Create standardized error object
 */
function createError(code, message, details = null, status = 500) {
    return {
        code,
        message,
        details,
        status,
        timestamp: new Date().toISOString()
    };
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch (error) {
        return fallback;
    }
}

/**
 * Safe property access
 */
function safeGet(obj, path, defaultValue = null) {
    if (!obj || typeof obj !== 'object') return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined || !(key in current)) {
            return defaultValue;
        }
        current = current[key];
    }
    
    return current;
}

// ===========================================
// ASYNC UTILITIES
// ===========================================

/**
 * Create delay promise
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 */
async function retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxAttempts) {
                throw lastError;
            }
            
            const delayTime = baseDelay * Math.pow(2, attempt - 1);
            await delay(delayTime);
        }
    }
}

/**
 * Timeout promise
 */
function withTimeout(promise, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
}

// Export all utilities
module.exports = {
    // String utilities
    capitalize,
    toTitleCase,
    truncate,
    cleanText,
    generateRandomString,
    slugify,
    
    // Number utilities
    parseViewCount,
    formatNumber,
    parseDuration,
    formatDuration,
    calculatePercentage,
    
    // Date/time utilities
    formatDate,
    getRelativeTime,
    addTime,
    isWithinTimeFilter,
    
    // Array utilities
    removeDuplicates,
    chunkArray,
    sortBy,
    groupBy,
    
    // Object utilities
    deepClone,
    pick,
    omit,
    isEmpty,
    
    // Validation utilities
    isValidEmail,
    isValidUrl,
    isValidYouTubeUrl,
    extractYouTubeId,
    sanitizeString,
    
    // Error utilities
    createError,
    safeJsonParse,
    safeGet,
    
    // Async utilities
    delay,
    retry,
    withTimeout
};