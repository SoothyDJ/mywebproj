// File Path: /scraping/utils/browser-setup.js
// Browser configuration and setup utilities for web scraping
// REF-069: Browser setup utilities with configuration presets

const puppeteer = require('puppeteer');

class BrowserSetup {
    constructor() {
        this.defaultConfig = this.getDefaultConfig();
        this.presets = this.getConfigPresets();
    }

    // Get default browser configuration
    getDefaultConfig() {
        return {
            headless: true,
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
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection'
            ],
            defaultViewport: {
                width: 1366,
                height: 768
            },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            timeout: 30000
        };
    }

    // Get configuration presets for different scenarios
    getConfigPresets() {
        return {
            // Fast scraping with minimal resources
            lightweight: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-images',
                    '--disable-javascript',
                    '--disable-plugins',
                    '--disable-extensions'
                ],
                defaultViewport: { width: 1024, height: 768 },
                timeout: 15000
            },

            // Stealth mode for bot detection avoidance
            stealth: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--disable-gpu'
                ],
                defaultViewport: { width: 1366, height: 768 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                timeout: 45000
            },

            // Mobile device simulation
            mobile: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: { 
                    width: 375, 
                    height: 667,
                    isMobile: true,
                    hasTouch: true
                },
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                timeout: 30000
            },

            // Desktop with GUI for debugging
            debug: {
                headless: false,
                args: ['--no-sandbox'],
                defaultViewport: { width: 1366, height: 768 },
                slowMo: 100,
                devtools: true,
                timeout: 60000
            },

            // High performance for bulk scraping
            performance: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-images',
                    '--disable-plugins',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--max_old_space_size=4096'
                ],
                defaultViewport: { width: 1024, height: 768 },
                timeout: 20000
            }
        };
    }

    // Create browser instance with specified configuration
    async createBrowser(preset = 'default', customOptions = {}) {
        try {
            let config;
            
            if (preset === 'default') {
                config = this.defaultConfig;
            } else if (this.presets[preset]) {
                config = this.presets[preset];
            } else {
                console.warn(`Unknown preset '${preset}', using default configuration`);
                config = this.defaultConfig;
            }

            // Merge custom options
            const finalConfig = this.mergeConfigs(config, customOptions);
            
            console.log(`Creating browser with '${preset}' configuration...`);
            const browser = await puppeteer.launch(finalConfig);
            
            console.log('✓ Browser created successfully');
            return browser;
            
        } catch (error) {
            console.error('✗ Browser creation failed:', error.message);
            throw error;
        }
    }

    // Create page with common setup
    async createPage(browser, options = {}) {
        try {
            const page = await browser.newPage();
            
            // Set viewport if provided
            if (options.viewport) {
                await page.setViewport(options.viewport);
            }
            
            // Set user agent if provided
            if (options.userAgent) {
                await page.setUserAgent(options.userAgent);
            }
            
            // Set timeout if provided
            if (options.timeout) {
                page.setDefaultTimeout(options.timeout);
            }
            
            // Setup request interception for resource blocking
            if (options.blockResources) {
                await this.setupResourceBlocking(page, options.blockResources);
            }
            
            // Setup stealth mode
            if (options.stealth) {
                await this.setupStealthMode(page);
            }
            
            // Setup request logging
            if (options.logRequests) {
                this.setupRequestLogging(page);
            }
            
            console.log('✓ Page configured successfully');
            return page;
            
        } catch (error) {
            console.error('✗ Page setup failed:', error.message);
            throw error;
        }
    }

    // Setup resource blocking to improve performance
    async setupResourceBlocking(page, blockTypes = ['stylesheet', 'font', 'image']) {
        await page.setRequestInterception(true);
        
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            
            if (blockTypes.includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });
        
        console.log(`✓ Resource blocking enabled for: ${blockTypes.join(', ')}`);
    }

    // Setup stealth mode to avoid bot detection
    async setupStealthMode(page) {
        // Hide webdriver property
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });
        
        // Override plugins array
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
        });
        
        // Override languages
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        });
        
        // Override permissions
        await page.evaluateOnNewDocument(() => {
            const originalQuery = window.navigator.permissions.query;
            return window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        });
        
        console.log('✓ Stealth mode configured');
    }

    // Setup request logging for debugging
    setupRequestLogging(page) {
        page.on('request', request => {
            console.log(`➤ ${request.method()} ${request.url()}`);
        });
        
        page.on('response', response => {
            console.log(`✓ ${response.status()} ${response.url()}`);
        });
        
        console.log('✓ Request logging enabled');
    }

    // Get user agents for different devices/browsers
    getUserAgents() {
        return {
            chrome_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            chrome_mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            firefox_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            safari_mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
            android: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        };
    }

    // Get random user agent
    getRandomUserAgent() {
        const userAgents = Object.values(this.getUserAgents());
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    // Merge configuration objects
    mergeConfigs(baseConfig, customConfig) {
        const merged = { ...baseConfig };
        
        if (customConfig.args) {
            merged.args = [...(baseConfig.args || []), ...customConfig.args];
        }
        
        if (customConfig.defaultViewport) {
            merged.defaultViewport = { ...baseConfig.defaultViewport, ...customConfig.defaultViewport };
        }
        
        // Override other properties
        Object.keys(customConfig).forEach(key => {
            if (key !== 'args' && key !== 'defaultViewport') {
                merged[key] = customConfig[key];
            }
        });
        
        return merged;
    }

    // Create browser pool for concurrent scraping
    async createBrowserPool(poolSize = 3, preset = 'performance') {
        const pool = [];
        
        console.log(`Creating browser pool with ${poolSize} instances...`);
        
        for (let i = 0; i < poolSize; i++) {
            try {
                const browser = await this.createBrowser(preset, {
                    userAgent: this.getRandomUserAgent()
                });
                pool.push(browser);
                console.log(`✓ Browser ${i + 1}/${poolSize} created`);
            } catch (error) {
                console.error(`✗ Failed to create browser ${i + 1}:`, error.message);
            }
        }
        
        return pool;
    }

    // Close browser pool
    async closeBrowserPool(pool) {
        console.log(`Closing browser pool with ${pool.length} instances...`);
        
        const closePromises = pool.map(async (browser, index) => {
            try {
                await browser.close();
                console.log(`✓ Browser ${index + 1} closed`);
            } catch (error) {
                console.error(`✗ Failed to close browser ${index + 1}:`, error.message);
            }
        });
        
        await Promise.all(closePromises);
        console.log('✓ Browser pool closed');
    }

    // Test browser setup
    async test() {
        try {
            console.log('Testing Browser Setup utilities...');
            
            // Test default browser creation
            const browser = await this.createBrowser('default');
            const page = await this.createPage(browser, {
                stealth: true,
                blockResources: ['image', 'stylesheet'],
                timeout: 10000
            });
            
            // Test navigation
            await page.goto('https://httpbin.org/user-agent');
            const userAgent = await page.evaluate(() => document.body.textContent);
            console.log('✓ User agent test:', JSON.parse(userAgent)['user-agent']);
            
            await browser.close();
            
            // Test browser pool
            const pool = await this.createBrowserPool(2, 'lightweight');
            await this.closeBrowserPool(pool);
            
            console.log('✓ Browser Setup test completed successfully!');
            return true;
            
        } catch (error) {
            console.error('✗ Browser Setup test failed:', error.message);
            throw error;
        }
    }
}

module.exports = BrowserSetup;