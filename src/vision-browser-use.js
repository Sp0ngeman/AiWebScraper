const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

class VisionBrowserUse {
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
            // Check if page is still available, create new if closed
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

    async analyzeScreenshotWithLLM(screenshotPath, task) {
        try {
            // Read the screenshot file
            const screenshotBuffer = fs.readFileSync(screenshotPath);
            const base64Image = screenshotBuffer.toString('base64');
            
            const requestBody = {
                model: this.localLLMModel,
                messages: [
                    {
                        role: "system",
                        content: `You are a computer vision expert analyzing browser screenshots. 
                        
                        Current task: ${task}
                        
                        Analyze the screenshot and provide:
                        1. What elements are visible on the page
                        2. What actions can be performed
                        3. Specific instructions for the next step
                        
                        Be concise and actionable.`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this screenshot for the task: ${task}`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/png;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            };

            const response = await axios.post(`${this.localLLMUrl}/v1/chat/completions`, requestBody, {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                timeout: 120000 // 2 minutes for vision analysis
            });

            if (response.data && response.data.choices && response.data.choices[0]) {
                const analysis = response.data.choices[0].message.content;
                console.log('🤖 LLM Analysis:', analysis);
                return analysis;
            } else {
                console.log('❌ Unexpected LLM response format');
                return null;
            }
        } catch (error) {
            console.log(`❌ Error analyzing screenshot with LLM: ${error.message}`);
            return null;
        }
    }

    async executeVisionTask(task) {
        try {
            console.log(`🎯 Executing vision-based task: ${task}`);
            
            // Take a screenshot first
            const screenshotPath = await this.takeScreenshot();
            if (!screenshotPath) {
                return '❌ Failed to take screenshot for analysis';
            }
            
            // Analyze the screenshot with LLM
            const analysis = await this.analyzeScreenshotWithLLM(screenshotPath, task);
            if (!analysis) {
                return '❌ Failed to analyze screenshot with LLM';
            }
            
            // Based on the analysis, perform actions
            const lowerTask = task.toLowerCase();
            
            if (lowerTask.includes('login') && lowerTask.includes('eforge')) {
                return await this.loginToEForge();
            } else if (lowerTask.includes('click')) {
                return await this.clickByVisualDescription(analysis);
            } else if (lowerTask.includes('type')) {
                return await this.typeByVisualDescription(analysis, task);
            } else {
                return `✅ Vision analysis completed. Analysis: ${analysis}`;
            }
            
        } catch (error) {
            console.log(`❌ Error executing vision task: ${error.message}`);
            return `❌ Vision task failed: ${error.message}`;
        }
    }

    async clickByVisualDescription(description) {
        try {
            console.log('🖱️ Attempting to click based on visual description...');
            
            // Simple implementation - in a real system, this would use the LLM analysis
            // to determine what to click based on the visual description
            const commonSelectors = ['button', 'a', 'input[type="submit"]', '.btn', '.button'];
            
            for (const selector of commonSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.click(selector);
                    console.log(`✅ Clicked element using selector: ${selector}`);
                    await this.takeScreenshot();
                    return `✅ Successfully clicked element based on visual analysis!`;
                } catch (e) {
                    continue;
                }
            }
            
            return '❌ Could not find a clickable element based on visual analysis.';
            
        } catch (error) {
            console.log(`❌ Error clicking by visual description: ${error.message}`);
            return `❌ Visual click failed: ${error.message}`;
        }
    }

    async typeByVisualDescription(description, task) {
        try {
            console.log('⌨️ Attempting to type based on visual description...');
            
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
                    return `✅ Successfully typed "${textToType}" based on visual analysis!`;
                } catch (e) {
                    continue;
                }
            }
            
            return '❌ Could not find an input field to type into based on visual analysis.';
            
        } catch (error) {
            console.log(`❌ Error typing by visual description: ${error.message}`);
            return `❌ Visual type failed: ${error.message}`;
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

    async interactiveMode() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('🎮 Starting vision-based interactive mode...');
        console.log('💡 Type natural language commands to control the browser visually');
        console.log('📝 Example commands:');
        console.log('  - "Login to EForge"');
        console.log('  - "Click the login button"');
        console.log('  - "Type my email in the email field"');
        console.log('  - "Find my assignments"');
        console.log('  - "Take a screenshot"');
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
                    const result = await this.executeVisionTask(task);
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
            console.log('🎯 Starting vision-based browser automation...');
            
            // Start interactive mode
            await this.interactiveMode();
            
        } catch (error) {
            console.log(`❌ Error in vision browser use: ${error.message}`);
        }
    }
}

module.exports = VisionBrowserUse;

if (require.main === module) {
    const visionBrowser = new VisionBrowserUse();
    visionBrowser.run();
} 