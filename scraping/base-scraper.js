// File Path: /scraping/base-scraper.js
// Base scraper class providing common functionality for all scrapers
// REF-067: Base scraper class with shared browser management and utilities

const puppeteer = require('puppeteer');

class BaseScraper {
    constructor(options = {}) {
        this.browser = null;
        this.page = null;
        this.options = {
            headless: options.headless !== false,
            timeout: options.timeout || 30000,
            userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: options.viewport || { width: 1366, height: 768 },
            ...options
        };
        this.scraperType = 'base';
    }

    // Initialize browser and page
    async initialize() {
        try {
            this.browser = await puppeteer.launch({
                headless: this.options.headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // Set user agent
            await this.page.setUserAgent(this.options.userAgent);
            
            // Set viewport
            await this.page.setViewport(this.options.viewport);
            
            // Set default timeout
            this.page.setDefaultTimeout(this.options.timeout);
            
            // Block unnecessary resources for faster loading
            await this.page.setRequestInterception(true);
            this.page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'image') {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            console.log(`✓ ${this.scraperType} scraper initialized`);
            return true;
            
        } catch (error) {
            console.error(`✗ ${this.scraperType} scraper initialization failed:`, error.message);
            return false;
        }
    }

    // Navigate to URL with error handling
    async navigateToUrl(url, options = {}) {
        try {
            if (!this.page) {
                throw new Error('Scraper not initialized');
            }

            const navigationOptions = {
                waitUntil: 'networkidle0',
                timeout: this.options.timeout,
                ...options
            };

            console.log(`Navigating to: ${url}`);
            await this.page.goto(url, navigationOptions);
            
            return true;
        } catch (error) {
            console.error(`Navigation failed for ${url}:`, error.message);
            throw error;
        }
    }

    // Wait for selector with custom timeout
    async waitForElement(selector, timeout = null) {
        try {
            const waitTimeout = timeout || this.options.timeout;
            await this.page.waitForSelector(selector, { timeout: waitTimeout });
            return true;
        } catch (error) {
            console.error(`Element not found: ${selector}`, error.message);
            return false;
        }
    }

    // Scroll page to load dynamic content
    async scrollToBottom(maxScrolls = 10, scrollDelay = 2000) {
        let scrollCount = 0;
        let previousHeight = 0;
        
        while (scrollCount < maxScrolls) {
            // Scroll to bottom
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            // Wait for content to load
            await this.delay(scrollDelay);
            
            // Check if new content loaded
            const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);
            
            if (currentHeight === previousHeight) {
                console.log('No more content to load');
                break;
            }
            
            previousHeight = currentHeight;
            scrollCount++;
        }
        
        return scrollCount;
    }

    // Extract data from page using provided function
    async extractData(extractorFunction, ...args) {
        try {
            if (!this.page) {
                throw new Error('Scraper not initialized');
            }
            
            const data = await this.page.evaluate(extractorFunction, ...args);
            return data;
        } catch (error) {
            console.error('Data extraction failed:', error.message);
            throw error;
        }
    }

    // Take screenshot for debugging
    async takeScreenshot(filename = null) {
        try {
            if (!this.page) {
                throw new Error('Scraper not initialized');
            }
            
            const screenshotName = filename || `screenshot-${this.scraperType}-${Date.now()}.png`;
            await this.page.screenshot({ path: screenshotName, fullPage: true });
            console.log(`✓ Screenshot saved: ${screenshotName}`);
            
            return screenshotName;
        } catch (error) {
            console.error('Screenshot failed:', error.message);
            return null;
        }
    }

    // Get page content as HTML
    async getPageContent() {
        try {
            if (!this.page) {
                throw new Error('Scraper not initialized');
            }
            
            return await this.page.content();
        } catch (error) {
            console.error('Failed to get page content:', error.message);
            throw error;
        }
    }

    // Check if element exists on page
    async elementExists(selector) {
        try {
            if (!this.page) {
                return false;
            }
            
            const element = await this.page.$(selector);
            return element !== null;
        } catch (error) {
            return false;
        }
    }

    // Click element with retry logic
    async clickElement(selector, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                await this.page.click(selector);
                console.log(`✓ Clicked element: ${selector}`);
                return true;
            } catch (error) {
                console.warn(`Click attempt ${i + 1}/${retries} failed for ${selector}`);
                if (i === retries - 1) {
                    throw error;
                }
                await this.delay(1000);
            }
        }
        return false;
    }

    // Type text into input field
    async typeText(selector, text, options = {}) {
        try {
            await this.page.waitForSelector(selector);
            
            if (options.clear) {
                await this.page.click(selector, { clickCount: 3 });
            }
            
            await this.page.type(selector, text, { delay: options.delay || 50 });
            console.log(`✓ Typed text into: ${selector}`);
            
            return true;
        } catch (error) {
            console.error(`Failed to type text into ${selector}:`, error.message);
            throw error;
        }
    }

    // Handle pagination
    async handlePagination(nextButtonSelector, maxPages = 5) {
        const results = [];
        let currentPage = 1;
        
        while (currentPage <= maxPages) {
            console.log(`Processing page ${currentPage}`);
            
            // Extract data from current page (to be implemented by child classes)
            const pageData = await this.extractPageData();
            if (pageData && pageData.length > 0) {
                results.push(...pageData);
            }
            
            // Check if next page exists
            const hasNext = await this.elementExists(nextButtonSelector);
            if (!hasNext) {
                console.log('No more pages available');
                break;
            }
            
            // Click next page
            try {
                await this.clickElement(nextButtonSelector);
                await this.delay(2000); // Wait for page to load
                currentPage++;
            } catch (error) {
                console.error('Failed to navigate to next page:', error.message);
                break;
            }
        }
        
        return results;
    }

    // Abstract method to be implemented by child classes
    async extractPageData() {
        throw new Error('extractPageData method must be implemented by child classes');
    }

    // Delay utility method
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Random delay for more human-like behavior
    async randomDelay(minMs = 1000, maxMs = 3000) {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        return this.delay(delay);
    }

    // Get current page URL
    async getCurrentUrl() {
        try {
            if (!this.page) {
                return null;
            }
            return await this.page.url();
        } catch (error) {
            console.error('Failed to get current URL:', error.message);
            return null;
        }
    }

    // Check if page has loaded completely
    async isPageLoaded() {
        try {
            if (!this.page) {
                return false;
            }
            
            const readyState = await this.page.evaluate(() => document.readyState);
            return readyState === 'complete';
        } catch (error) {
            return false;
        }
    }

    // Handle cookies and privacy notices
    async handleCookieConsent(acceptSelector = null) {
        const commonSelectors = [
            '[data-testid="cookie-accept"]',
            '.cookie-accept',
            '#accept-cookies',
            'button[aria-label*="Accept"]',
            'button[aria-label*="I accept"]',
            acceptSelector
        ].filter(Boolean);
        
        for (const selector of commonSelectors) {
            try {
                if (await this.elementExists(selector)) {
                    await this.clickElement(selector);
                    console.log('✓ Cookie consent handled');
                    await this.delay(1000);
                    return true;
                }
            } catch (error) {
                // Continue to next selector
                continue;
            }
        }
        
        return false;
    }

    // Close browser and cleanup
    async close() {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                console.log(`✓ ${this.scraperType} scraper closed`);
            }
        } catch (error) {
            console.error(`Error closing ${this.scraperType} scraper:`, error.message);
        }
    }

    // Get scraper status
    getStatus() {
        return {
            scraperType: this.scraperType,
            browserInitialized: this.browser !== null,
            pageInitialized: this.page !== null,
            currentUrl: this.page ? this.page.url() : null
        };
    }

    // Generic test method
    async test() {
        try {
            console.log(`Testing ${this.scraperType} scraper...`);
            
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Initialization failed');
            }
            
            // Test navigation to a simple page
            await this.navigateToUrl('https://httpbin.org/html');
            
            // Test element detection
            const hasTitle = await this.elementExists('h1');
            console.log(`✓ Element detection test: ${hasTitle ? 'PASS' : 'FAIL'}`);
            
            // Test screenshot
            await this.takeScreenshot();
            
            await this.close();
            
            console.log(`✓ ${this.scraperType} scraper test completed`);
            return true;
            
        } catch (error) {
            console.error(`✗ ${this.scraperType} scraper test failed:`, error.message);
            await this.close();
            throw error;
        }
    }
}

module.exports = BaseScraper;