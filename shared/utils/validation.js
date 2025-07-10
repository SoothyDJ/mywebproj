// File Path: /shared/utils/validation.js
// Validation utilities for Web Automation Platform
// REF-093: Comprehensive validation functions for data integrity

const { 
    VALIDATION_RULES, 
    REGEX_PATTERNS, 
    TASK_TYPES, 
    TASK_STATUS, 
    TIME_FILTERS,
    CONTENT_TYPES,
    SENTIMENT_TYPES,
    AI_PROVIDERS,
    ERROR_CODES,
    MESSAGES
} = require('../constants/config');

const { createError } = require('./helpers');

// ===========================================
// VALIDATION RESULT STRUCTURE
// ===========================================

/**
 * Create validation result object
 */
function createValidationResult(isValid = true, errors = []) {
    return {
        isValid,
        errors: Array.isArray(errors) ? errors : [errors].filter(Boolean)
    };
}

/**
 * Create validation error object
 */
function createValidationError(field, message, code = ERROR_CODES.VALIDATION_ERROR) {
    return {
        field,
        message,
        code
    };
}

// ===========================================
// BASIC VALIDATION FUNCTIONS
// ===========================================

/**
 * Validate required field
 */
function validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
        return createValidationError(fieldName, `${fieldName} is required`);
    }
    return null;
}

/**
 * Validate string length
 */
function validateStringLength(value, fieldName, minLength = 0, maxLength = Infinity) {
    if (typeof value !== 'string') {
        return createValidationError(fieldName, `${fieldName} must be a string`);
    }
    
    if (value.length < minLength) {
        return createValidationError(fieldName, `${fieldName} must be at least ${minLength} characters long`);
    }
    
    if (value.length > maxLength) {
        return createValidationError(fieldName, `${fieldName} must be no more than ${maxLength} characters long`);
    }
    
    return null;
}

/**
 * Validate number range
 */
function validateNumberRange(value, fieldName, min = -Infinity, max = Infinity) {
    if (typeof value !== 'number' || isNaN(value)) {
        return createValidationError(fieldName, `${fieldName} must be a valid number`);
    }
    
    if (value < min) {
        return createValidationError(fieldName, `${fieldName} must be at least ${min}`);
    }
    
    if (value > max) {
        return createValidationError(fieldName, `${fieldName} must be no more than ${max}`);
    }
    
    return null;
}

/**
 * Validate enum value
 */
function validateEnum(value, fieldName, allowedValues) {
    if (!allowedValues.includes(value)) {
        return createValidationError(
            fieldName, 
            `${fieldName} must be one of: ${allowedValues.join(', ')}`
        );
    }
    return null;
}

/**
 * Validate regex pattern
 */
function validatePattern(value, fieldName, pattern, patternName = 'format') {
    if (typeof value !== 'string') {
        return createValidationError(fieldName, `${fieldName} must be a string`);
    }
    
    if (!pattern.test(value)) {
        return createValidationError(fieldName, `${fieldName} has invalid ${patternName}`);
    }
    
    return null;
}

// ===========================================
// USER VALIDATION
// ===========================================

/**
 * Validate user registration data
 */
function validateUserRegistration(userData) {
    const errors = [];
    const { username, email, password, confirmPassword } = userData;
    
    // Username validation
    let error = validateRequired(username, 'username');
    if (error) errors.push(error);
    else {
        error = validateStringLength(
            username, 
            'username', 
            VALIDATION_RULES.USERNAME_MIN_LENGTH, 
            VALIDATION_RULES.USERNAME_MAX_LENGTH
        );
        if (error) errors.push(error);
        else {
            error = validatePattern(username, 'username', REGEX_PATTERNS.USERNAME, 'username format');
            if (error) errors.push(error);
        }
    }
    
    // Email validation
    error = validateRequired(email, 'email');
    if (error) errors.push(error);
    else {
        error = validateStringLength(email, 'email', 1, VALIDATION_RULES.EMAIL_MAX_LENGTH);
        if (error) errors.push(error);
        else {
            error = validatePattern(email, 'email', REGEX_PATTERNS.EMAIL, 'email format');
            if (error) errors.push(error);
        }
    }
    
    // Password validation
    error = validateRequired(password, 'password');
    if (error) errors.push(error);
    else {
        error = validateStringLength(password, 'password', VALIDATION_RULES.PASSWORD_MIN_LENGTH);
        if (error) errors.push(error);
        else {
            error = validatePattern(password, 'password', REGEX_PATTERNS.PASSWORD, 'password strength');
            if (error) errors.push(error);
        }
    }
    
    // Confirm password validation
    if (password && confirmPassword && password !== confirmPassword) {
        errors.push(createValidationError('confirmPassword', 'Passwords do not match'));
    }
    
    return createValidationResult(errors.length === 0, errors);
}

/**
 * Validate user login data
 */
function validateUserLogin(loginData) {
    const errors = [];
    const { email, password } = loginData;
    
    // Email validation
    let error = validateRequired(email, 'email');
    if (error) errors.push(error);
    else {
        error = validatePattern(email, 'email', REGEX_PATTERNS.EMAIL, 'email format');
        if (error) errors.push(error);
    }
    
    // Password validation
    error = validateRequired(password, 'password');
    if (error) errors.push(error);
    
    return createValidationResult(errors.length === 0, errors);
}

// ===========================================
// TASK VALIDATION
// ===========================================

/**
 * Validate task creation data
 */
function validateTaskCreation(taskData) {
    const errors = [];
    const { prompt, taskType, parameters } = taskData;
    
    // Prompt validation
    let error = validateRequired(prompt, 'prompt');
    if (error) errors.push(error);
    else {
        error = validateStringLength(
            prompt, 
            'prompt', 
            VALIDATION_RULES.PROMPT_MIN_LENGTH, 
            VALIDATION_RULES.PROMPT_MAX_LENGTH
        );
        if (error) errors.push(error);
    }
    
    // Task type validation
    error = validateRequired(taskType, 'taskType');
    if (error) errors.push(error);
    else {
        error = validateEnum(taskType, 'taskType', Object.values(TASK_TYPES));
        if (error) errors.push(error);
    }
    
    // Parameters validation
    if (parameters) {
        const paramValidation = validateTaskParameters(parameters);
        if (!paramValidation.isValid) {
            errors.push(...paramValidation.errors);
        }
    }
    
    return createValidationResult(errors.length === 0, errors);
}

/**
 * Validate task parameters
 */
function validateTaskParameters(parameters) {
    const errors = [];
    const { maxResults, timeFilter, aiProvider } = parameters;
    
    // Max results validation
    if (maxResults !== undefined) {
        let error = validateNumberRange(maxResults, 'maxResults', 1, 100);
        if (error) errors.push(error);
    }
    
    // Time filter validation
    if (timeFilter !== undefined) {
        let error = validateEnum(timeFilter, 'timeFilter', Object.values(TIME_FILTERS));
        if (error) errors.push(error);
    }
    
    // AI provider validation
    if (aiProvider !== undefined) {
        let error = validateEnum(aiProvider, 'aiProvider', Object.values(AI_PROVIDERS));
        if (error) errors.push(error);
    }
    
    return createValidationResult(errors.length === 0, errors);
}

/**
 * Validate task status update
 */
function validateTaskStatusUpdate(statusData) {
    const errors = [];
    const { status, errorMessage, resultsSummary } = statusData;
    
    // Status validation
    let error = validateRequired(status, 'status');
    if (error) errors.push(error);
    else {
        error = validateEnum(status, 'status', Object.values(TASK_STATUS));
        if (error) errors.push(error);
    }
    
    // Error message validation (optional)
    if (errorMessage !== undefined && errorMessage !== null) {
        error = validateStringLength(errorMessage, 'errorMessage', 0, 1000);
        if (error) errors.push(error);
    }
    
    // Results summary validation (optional)
    if (resultsSummary !== undefined && resultsSummary !== null) {
        error = validateStringLength(resultsSummary, 'resultsSummary', 0, 2000);
        if (error) errors.push(error);
    }
    
    return createValidationResult(errors.length === 0, errors);
}

// ===========================================
// VIDEO DATA VALIDATION
// ===========================================

/**
 * Validate video data
 */
function validateVideoData(videoData) {
    const errors = [];
    const { 
        videoId, title, channelName, viewCount, 
        duration, uploadDate, videoUrl 
    } = videoData;
    
    // Video ID validation
    let error = validateRequired(videoId, 'videoId');
    if (error) errors.push(error);
    else {
        error = validatePattern(videoId, 'videoId', REGEX_PATTERNS.YOUTUBE_VIDEO_ID, 'YouTube video ID format');
        if (error) errors.push(error);
    }
    
    // Title validation
    error = validateRequired(title, 'title');
    if (error) errors.push(error);
    else {
        error = validateStringLength(title, 'title', 1, VALIDATION_RULES.TITLE_MAX_LENGTH);
        if (error) errors.push(error);
    }
    
    // Channel name validation
    error = validateRequired(channelName, 'channelName');
    if (error) errors.push(error);
    else {
        error = validateStringLength(channelName, 'channelName', 1, VALIDATION_RULES.CHANNEL_NAME_MAX_LENGTH);
        if (error) errors.push(error);
    }
    
    // Video URL validation
    error = validateRequired(videoUrl, 'videoUrl');
    if (error) errors.push(error);
    else {
        error = validatePattern(videoUrl, 'videoUrl', REGEX_PATTERNS.YOUTUBE_URL, 'YouTube URL format');
        if (error) errors.push(error);
    }
    
    // View count validation (optional)
    if (viewCount !== undefined && viewCount !== null) {
        error = validateStringLength(viewCount, 'viewCount', 0, 50);
        if (error) errors.push(error);
    }
    
    // Duration validation (optional)
    if (duration !== undefined && duration !== null) {
        error = validateStringLength(duration, 'duration', 0, 20);
        if (error) errors.push(error);
    }
    
    return createValidationResult(errors.length === 0, errors);
}

/**
 * Validate video analysis data
 */
function validateVideoAnalysis(analysisData) {
    const errors = [];
    const { 
        summary, themes, sentiment, sentimentScore, 
        contentType, credibilityScore 
    } = analysisData;
    
    // Summary validation
    let error = validateRequired(summary, 'summary');
    if (error) errors.push(error);
    else {
        error = validateStringLength(summary, 'summary', 10, 2000);
        if (error) errors.push(error);
    }
    
    // Themes validation
    if (themes !== undefined) {
        if (!Array.isArray(themes)) {
            errors.push(createValidationError('themes', 'Themes must be an array'));
        } else if (themes.length > 10) {
            errors.push(createValidationError('themes', 'Too many themes (maximum 10)'));
        }
    }
    
    // Sentiment validation
    if (sentiment !== undefined) {
        error = validateEnum(sentiment, 'sentiment', Object.values(SENTIMENT_TYPES));
        if (error) errors.push(error);
    }
    
    // Sentiment score validation
    if (sentimentScore !== undefined) {
        error = validateNumberRange(sentimentScore, 'sentimentScore', -1, 1);
        if (error) errors.push(error);
    }
    
    // Content type validation
    if (contentType !== undefined) {
        error = validateEnum(contentType, 'contentType', Object.values(CONTENT_TYPES));
        if (error) errors.push(error);
    }
    
    // Credibility score validation
    if (credibilityScore !== undefined) {
        error = validateNumberRange(credibilityScore, 'credibilityScore', 0, 1);
        if (error) errors.push(error);
    }
    
    return createValidationResult(errors.length === 0, errors);
}

// ===========================================
// STORYBOARD VALIDATION
// ===========================================

/**
 * Validate storyboard data
 */
function validateStoryboard(storyboardData) {
    const errors = [];
    const { title, totalScenes, scenes } = storyboardData;
    
    // Title validation
    let error = validateRequired(title, 'title');
    if (error) errors.push(error);
    else {
        error = validateStringLength(title, 'title', 1, 200);
        if (error) errors.push(error);
    }
    
    // Total scenes validation
    error = validateRequired(totalScenes, 'totalScenes');
    if (error) errors.push(error);
    else {
        error = validateNumberRange(totalScenes, 'totalScenes', 1, 20);
        if (error) errors.push(error);
    }
    
    // Scenes validation
    if (scenes !== undefined) {
        if (!Array.isArray(scenes)) {
            errors.push(createValidationError('scenes', 'Scenes must be an array'));
        } else {
            scenes.forEach((scene, index) => {
                const sceneValidation = validateStoryboardScene(scene, index);
                if (!sceneValidation.isValid) {
                    errors.push(...sceneValidation.errors);
                }
            });
        }
    }
    
    return createValidationResult(errors.length === 0, errors);
}

/**
 * Validate storyboard scene
 */
function validateStoryboardScene(sceneData, sceneIndex = 0) {
    const errors = [];
    const { sequenceNumber, narrationText, visualElements, audioCues } = sceneData;
    
    const fieldPrefix = `scenes[${sceneIndex}]`;
    
    // Sequence number validation
    let error = validateRequired(sequenceNumber, `${fieldPrefix}.sequenceNumber`);
    if (error) errors.push(error);
    else {
        error = validateNumberRange(sequenceNumber, `${fieldPrefix}.sequenceNumber`, 1, 100);
        if (error) errors.push(error);
    }
    
    // Narration text validation
    error = validateRequired(narrationText, `${fieldPrefix}.narrationText`);
    if (error) errors.push(error);
    else {
        error = validateStringLength(narrationText, `${fieldPrefix}.narrationText`, 10, 1000);
        if (error) errors.push(error);
    }
    
    // Visual elements validation (optional)
    if (visualElements !== undefined && !Array.isArray(visualElements)) {
        errors.push(createValidationError(`${fieldPrefix}.visualElements`, 'Visual elements must be an array'));
    }
    
    // Audio cues validation (optional)
    if (audioCues !== undefined && !Array.isArray(audioCues)) {
        errors.push(createValidationError(`${fieldPrefix}.audioCues`, 'Audio cues must be an array'));
    }
    
    return createValidationResult(errors.length === 0, errors);
}

// ===========================================
// PAGINATION VALIDATION
// ===========================================

/**
 * Validate pagination parameters
 */
function validatePagination(paginationData) {
    const errors = [];
    const { page, limit, sortBy, sortOrder } = paginationData;
    
    // Page validation
    if (page !== undefined) {
        let error = validateNumberRange(page, 'page', 1, 1000);
        if (error) errors.push(error);
    }
    
    // Limit validation
    if (limit !== undefined) {
        let error = validateNumberRange(limit, 'limit', 1, 100);
        if (error) errors.push(error);
    }
    
    // Sort order validation
    if (sortOrder !== undefined) {
        let error = validateEnum(sortOrder, 'sortOrder', ['asc', 'desc']);
        if (error) errors.push(error);
    }
    
    // Sort by validation (basic string check)
    if (sortBy !== undefined) {
        let error = validateStringLength(sortBy, 'sortBy', 1, 50);
        if (error) errors.push(error);
    }
    
    return createValidationResult(errors.length === 0, errors);
}

// ===========================================
// BATCH VALIDATION
// ===========================================

/**
 * Validate multiple items using a validation function
 */
function validateBatch(items, validationFn, fieldName = 'items') {
    if (!Array.isArray(items)) {
        return createValidationResult(false, [
            createValidationError(fieldName, `${fieldName} must be an array`)
        ]);
    }
    
    if (items.length === 0) {
        return createValidationResult(false, [
            createValidationError(fieldName, `${fieldName} cannot be empty`)
        ]);
    }
    
    const errors = [];
    items.forEach((item, index) => {
        const validation = validationFn(item);
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                errors.push({
                    ...error,
                    field: `${fieldName}[${index}].${error.field}`
                });
            });
        }
    });
    
    return createValidationResult(errors.length === 0, errors);
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Sanitize and prepare data for validation
 */
function sanitizeForValidation(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = {};
    Object.keys(data).forEach(key => {
        let value = data[key];
        
        // Trim strings
        if (typeof value === 'string') {
            value = value.trim();
        }
        
        // Convert empty strings to null
        if (value === '') {
            value = null;
        }
        
        sanitized[key] = value;
    });
    
    return sanitized;
}

/**
 * Get validation summary
 */
function getValidationSummary(validationResult) {
    if (!validationResult || typeof validationResult !== 'object') {
        return 'Invalid validation result';
    }
    
    if (validationResult.isValid) {
        return 'Validation passed';
    }
    
    const errorCount = validationResult.errors ? validationResult.errors.length : 0;
    return `Validation failed with ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
}

// Export all validation functions
module.exports = {
    // Core validation functions
    createValidationResult,
    createValidationError,
    validateRequired,
    validateStringLength,
    validateNumberRange,
    validateEnum,
    validatePattern,
    
    // User validation
    validateUserRegistration,
    validateUserLogin,
    
    // Task validation
    validateTaskCreation,
    validateTaskParameters,
    validateTaskStatusUpdate,
    
    // Video validation
    validateVideoData,
    validateVideoAnalysis,
    
    // Storyboard validation
    validateStoryboard,
    validateStoryboardScene,
    
    // Pagination validation
    validatePagination,
    
    // Batch validation
    validateBatch,
    
    // Utility functions
    sanitizeForValidation,
    getValidationSummary
};