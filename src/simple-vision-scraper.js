const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

class SimpleVisionScraper {
    constructor() {
        this.localLLMUrl = process.env.LOCAL_LLM_URL || 'http://127.0.0.1:1234';
        this.localLLMModel = process.env.LOCAL_LLM_MODEL || 'deepseek/deepseek-r1-0528-qwen3-8b';
        this.email = process.env.EFORGE_EMAIL;
        this.password = process.env.EFORGE_PASSWORD;
        this.browser = null;
        this.page = null;
        this.isConnected = false;
    }

    async testConnection() {
        try {
            console.log('🔍 Testing connection to local LLM...');
            const response = await axios.get(`${this.localLLMUrl}/v1/models`, {
                timeout: 10000
            });
            
            if (response.data && response.data.data) {
                console.log('✅ Local LLM connection successful!');
                console.log('📋 Available models:', response.data.data.map(m => m.id).join(', '));
                return true;
            } else {
                console.log('❌ Unexpected response format from LLM');
                return false;
            }
        } catch (error) {
            console.log(`❌ LLM connection failed: ${error.message}`);
            return false;
        }
    }

    async findExistingChrome() {
        const ports = [9222, 9223, 9224, 9225, 9226];
        
        for (const port of ports) {
            try {
                const response = await axios.get(`http://localhost:${port}/json/version`, { timeout: 2000 });
                if (response.data && response.data.webSocketDebuggerUrl) {
                    console.log(`✅ Found existing Chrome browser!`);
                    return `http://localhost:${port}`;
                }
            } catch (error) {
                // Port not available, continue to next
            }
        }
        
        return null;
    }

    async startChromeWithDebugging() {
        try {
            console.log('🚀 Starting Chrome with remote debugging...');
            const { spawn } = require('child_process');
            const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
            
            spawn(chromePath, [
                '--remote-debugging-port=9222',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-popup-blocking',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ], { detached: true, stdio: 'ignore' });
            
            // Wait a moment for Chrome to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            return 'http://localhost:9222';
        } catch (error) {
            console.log(`❌ Error starting Chrome: ${error.message}`);
            return null;
        }
    }

    async connectToBrowser() {
        try {
            console.log('🔌 Connecting to browser...');
            
            // First try to find existing Chrome
            let browserPath = await this.findExistingChrome();
            
            if (!browserPath) {
                console.log('📝 No existing Chrome found. Starting new Chrome with debugging...');
                browserPath = await this.startChromeWithDebugging();
            }
            
            if (browserPath) {
                this.browser = await puppeteer.connect({ 
                    browserURL: browserPath,
                    defaultViewport: null
                });
                console.log('✅ Connected to existing page');
            } else {
                throw new Error('Could not start or connect to Chrome');
            }
            
            this.page = await this.browser.newPage();
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            this.isConnected = true;
            console.log('✅ Successfully connected to browser!');
            return true;
        } catch (error) {
            console.log(`❌ Error connecting to browser: ${error.message}`);
            return false;
        }
    }

    async takeScreenshot() {
        try {
            if (!this.page || this.page.isClosed()) {
                console.log('⚠️ Page was closed, creating new page...');
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screenshots/screenshot-${timestamp}.png`;
            await this.page.screenshot({ path: filename, fullPage: true });
            console.log(`📸 Screenshot saved as ${filename}`);
            return filename;
        } catch (error) {
            console.log(`❌ Screenshot failed: ${error.message}`);
            return null;
        }
    }

    async executeSimpleTask(task) {
        console.log(`🎯 Executing simple task: ${task}`);
        
        const lowerTask = task.toLowerCase();
        
        if (lowerTask.includes('login') && lowerTask.includes('eforge')) {
            return await this.loginToEForge();
        } else if (lowerTask.includes('screenshot')) {
            return await this.takeScreenshot();
        } else if (lowerTask.includes('navigate') || lowerTask.includes('go to')) {
            return await this.navigateToPage(task);
        } else if (lowerTask.includes('click')) {
            return await this.clickElement(task);
        } else if (lowerTask.includes('type')) {
            return await this.typeText(task);
        } else {
            return 'I understand you want to do something. Try commands like "Login to EForge", "Take screenshot", "Navigate to Google", or "Click the button"';
        }
    }

    async loginToEForge() {
        try {
            console.log('🔐 Logging into EForge...');
            
            if (!this.page) {
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            await this.page.goto('https://se.eforge.online/users/login', { waitUntil: 'networkidle2' });
            console.log('✅ Navigated to EForge login page');
            await this.takeScreenshot();
            
            // Try different selectors for email field
            const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[type="text"]', '#email'];
            for (const selector of emailSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.type(selector, this.email);
                    console.log(`✅ Entered email using selector: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            // Try different selectors for password field
            const passwordSelectors = ['input[type="password"]', 'input[name="password"]', '#password'];
            for (const selector of passwordSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.type(selector, this.password);
                    console.log(`✅ Entered password using selector: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            // Try different selectors for login button
            const loginSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button:contains("Login")', '.login-button'];
            for (const selector of loginSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.click(selector);
                    console.log(`✅ Clicked login button using selector: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            await this.page.waitForTimeout(3000);
            await this.takeScreenshot();
            console.log('✅ Login process completed');
            
            return '✅ Successfully logged into EForge! I\'ve taken screenshots to show the progress.';
            
        } catch (error) {
            console.log(`❌ Error logging into EForge: ${error.message}`);
            return `❌ Login failed: ${error.message}. Please try again or let me know if you need help troubleshooting.`;
        }
    }

    async navigateToPage(task) {
        try {
            console.log('🧭 Navigating based on your request...');
            
            let url = '';
            if (task.toLowerCase().includes('youtube')) {
                url = 'https://youtube.com';
            } else if (task.toLowerCase().includes('google')) {
                url = 'https://google.com';
            } else {
                const urlMatch = task.match(/https?:\/\/[^\s]+/);
                if (urlMatch) {
                    url = urlMatch[0];
                } else {
                    return "I couldn't identify which website you want to go to. Please specify a website like 'Go to Google' or provide a URL.";
                }
            }
            
            if (!this.page) {
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            await this.page.goto(url, { waitUntil: 'networkidle2' });
            console.log(`✅ Navigated to ${url}`);
            await this.takeScreenshot();
            
            return `✅ Successfully navigated to ${url}! I've taken a screenshot so you can see the current page.`;
            
        } catch (error) {
            console.log(`❌ Error navigating: ${error.message}`);
            return `❌ Navigation failed: ${error.message}`;
        }
    }

    async clickElement(task) {
        try {
            console.log('🖱️ Attempting to click element...');
            
            // Simple click logic - this is a basic implementation
            const commonSelectors = ['button', 'a', 'input[type="submit"]', '.btn', '.button'];
            
            for (const selector of commonSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.click(selector);
                    console.log(`✅ Clicked element using selector: ${selector}`);
                    await this.takeScreenshot();
                    return `✅ Successfully clicked element! I've taken a screenshot to show the result.`;
                } catch (e) {
                    continue;
                }
            }
            
            return '❌ Could not find a clickable element. Try being more specific about what you want to click.';
            
        } catch (error) {
            console.log(`❌ Error clicking element: ${error.message}`);
            return `❌ Click failed: ${error.message}`;
        }
    }

    async typeText(task) {
        try {
            console.log('⌨️ Attempting to type text...');
            
            // Extract text to type from the task
            const textMatch = task.match(/type\s+(.+)/i);
            if (!textMatch) {
                return 'Please specify what text to type. Example: "Type hello world"';
            }
            
            const textToType = textMatch[1];
            
            // Try to find an input field
            const inputSelectors = ['input[type="text"]', 'input[type="email"]', 'textarea', 'input'];
            
            for (const selector of inputSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.type(selector, textToType);
                    console.log(`✅ Typed "${textToType}" using selector: ${selector}`);
                    await this.takeScreenshot();
                    return `✅ Successfully typed "${textToType}"! I've taken a screenshot to show the result.`;
                } catch (e) {
                    continue;
                }
            }
            
            return '❌ Could not find an input field to type into.';
            
        } catch (error) {
            console.log(`❌ Error typing text: ${error.message}`);
            return `❌ Type failed: ${error.message}`;
        }
    }

    async interactiveMode() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('🎮 Starting simple vision-based interactive mode...');
        console.log('💡 Type simple commands to control the browser');
        console.log('📝 Example commands:');
        console.log('  - "Login to EForge"');
        console.log('  - "Take a screenshot"');
        console.log('  - "Navigate to Google"');
        console.log('  - "Click the button"');
        console.log('  - "Type hello"');
        console.log('  - "exit" to quit');

        const askQuestion = () => {
            rl.question('🤖 Enter your task: ', async (task) => {
                if (task.toLowerCase() === 'exit') {
                    console.log('👋 Goodbye!');
                    rl.close();
                    if (this.browser) {
                        await this.browser.disconnect();
                    }
                    return;
                }

                try {
                    const result = await this.executeSimpleTask(task);
                    console.log(`📋 Result: ${result}`);
                } catch (error) {
                    console.log(`❌ Error: ${error.message}`);
                }

                askQuestion();
            });
        };

        askQuestion();
    }

    async run() {
        try {
            // Test LLM connection
            await this.testConnection();
            
            // Connect to browser
            const connected = await this.connectToBrowser();
            if (!connected) {
                console.log('❌ Could not connect to browser. Exiting.');
                return;
            }
            
            console.log('✅ All dependencies ready!');
            console.log('🎯 Starting simple vision-based browser automation...');
            
            // Start interactive mode
            await this.interactiveMode();
            
        } catch (error) {
            console.log(`❌ Error in simple vision scraper: ${error.message}`);
        }
    }
}

module.exports = SimpleVisionScraper;

if (require.main === module) {
    const scraper = new SimpleVisionScraper();
    scraper.run();
} 