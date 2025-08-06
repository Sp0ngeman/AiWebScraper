const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config({ path: './config.env' });

class ChatInterface {
    constructor() {
        this.localLLMUrl = process.env.LOCAL_LLM_URL || 'http://127.0.0.1:1234';
        this.localLLMModel = process.env.LOCAL_LLM_MODEL || 'deepseek/deepseek-r1-0528-qwen3-8b';
        this.email = process.env.EFORGE_EMAIL;
        this.password = process.env.EFORGE_PASSWORD;
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.conversationHistory = [];
        this.isConnected = false;
        this.browser = null;
        this.page = null;
    }

    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));

        // Serve the chat interface HTML
        this.app.get('/', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Browser AI Assistant</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #343541; color: #ececf1; margin: 0; height: 100vh;
            display: flex; flex-direction: column;
        }
        .header { 
            background: #202123; padding: 1rem; text-align: center; border-bottom: 1px solid #4a4b53;
        }
        .chat-container { 
            flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column;
        }
        .message { 
            margin: 0.5rem 0; padding: 1rem; border-radius: 0.5rem; max-width: 80%;
        }
        .user-message { 
            background: #444654; align-self: flex-end; margin-left: 20%;
        }
        .assistant-message { 
            background: #343541; align-self: flex-start; margin-right: 20%;
        }
        .system-message { 
            background: #2d2d2d; align-self: center; text-align: center; font-style: italic;
        }
        .input-container { 
            background: #202123; padding: 1rem; border-top: 1px solid #4a4b53;
        }
        .input-form { 
            display: flex; gap: 0.5rem;
        }
        .message-input { 
            flex: 1; padding: 0.75rem; border: 1px solid #4a4b53; border-radius: 0.5rem;
            background: #40414f; color: #ececf1; font-size: 1rem;
        }
        .send-button { 
            padding: 0.75rem 1.5rem; background: #19c37d; color: white; border: none;
            border-radius: 0.5rem; cursor: pointer; font-size: 1rem;
        }
        .send-button:hover { background: #1a8870; }
        .status { 
            background: #202123; padding: 0.5rem; text-align: center; font-size: 0.9rem;
            border-bottom: 1px solid #4a4b53;
        }
        .quick-actions { 
            background: #202123; padding: 0.5rem; text-align: center; border-bottom: 1px solid #4a4b53;
        }
        .quick-action { 
            margin: 0.25rem; padding: 0.5rem 1rem; background: #40414f; color: #ececf1;
            border: 1px solid #4a4b53; border-radius: 0.25rem; cursor: pointer; font-size: 0.9rem;
        }
        .quick-action:hover { background: #4a4b53; }
        .connected { color: #19c37d; }
        .disconnected { color: #ff6b6b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI Web Scraper</h1>
        <p>Chat with your AI assistant to automate browser tasks</p>
    </div>
    
    <div class="status" id="status">
        <span id="connection-status" class="disconnected">❌ Disconnected from browser</span>
    </div>
    
    <div class="quick-actions">
        <button class="quick-action" onclick="sendMessage('Connect to browser')">🔗 Connect</button>
        <button class="quick-action" onclick="sendMessage('Login to EForge')">🔐 Login</button>
        <button class="quick-action" onclick="sendMessage('Take a screenshot')">📸 Screenshot</button>
        <button class="quick-action" onclick="sendMessage('Go to Google')">🌐 Google</button>
    </div>
    
    <div class="chat-container" id="chat-container">
        <div class="message system-message">
            💬 Start a conversation with me to automate your browser tasks!
        </div>
    </div>
    
    <div class="input-container">
        <form class="input-form" onsubmit="sendMessage(event)">
            <input type="text" class="message-input" id="message-input" 
                   placeholder="Type your message here..." autocomplete="off">
            <button type="submit" class="send-button">Send</button>
        </form>
    </div>

    <script>
        let conversationHistory = [];
        
        function sendMessage(event) {
            if (event.preventDefault) event.preventDefault();
            const input = document.getElementById('message-input');
            const message = input.value.trim();
            if (!message) return;
            
            addMessage('user', message);
            input.value = '';
            
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            })
            .then(response => response.json())
            .then(data => {
                addMessage('assistant', data.response);
                updateConnectionStatus(data.connected);
            })
            .catch(error => {
                addMessage('system', '❌ Error: ' + error.message);
            });
        }
        
        function addMessage(role, content) {
            const container = document.getElementById('chat-container');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${role}-message\`;
            messageDiv.textContent = content;
            container.appendChild(messageDiv);
            container.scrollTop = container.scrollHeight;
        }
        
        function updateConnectionStatus(connected) {
            const status = document.getElementById('connection-status');
            if (connected) {
                status.textContent = '✅ Connected to browser';
                status.className = 'connected';
            } else {
                status.textContent = '❌ Disconnected from browser';
                status.className = 'disconnected';
            }
        }
        
        // Check connection status on load
        fetch('/api/status')
        .then(response => response.json())
        .then(data => updateConnectionStatus(data.connected))
        .catch(() => updateConnectionStatus(false));
    </script>
</body>
</html>
            `);
        });

        // API endpoints
        this.app.post('/api/chat', async (req, res) => {
            try {
                const { message } = req.body;
                const response = await this.processMessage(message);
                res.json({ response, connected: this.isConnected });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/status', (req, res) => {
            res.json({ connected: this.isConnected });
        });
    }

    addMessage(role, content) {
        const message = { role, content, timestamp: new Date() };
        this.conversationHistory.push(message);
        console.log(`[${role.toUpperCase()}] ${content}`);
    }

    async connectToBrowser() {
        try {
            this.addMessage('system', '🔌 Connecting to browser...');
            
            const browserPath = await this.findExistingChrome();
            if (browserPath) {
                this.browser = await puppeteer.connect({ 
                    browserURL: browserPath,
                    defaultViewport: null
                });
                this.addMessage('system', '✅ Connected to existing browser');
            } else {
                this.browser = await puppeteer.launch({
                    headless: false,
                    args: ['--remote-debugging-port=9222', '--no-sandbox']
                });
                this.addMessage('system', '✅ Started new browser');
            }
            
            this.page = await this.browser.newPage();
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            this.isConnected = true;
            this.addMessage('system', '✅ Successfully connected to browser!');
            return true;
        } catch (error) {
            this.addMessage('system', `❌ Error connecting to browser: ${error.message}`);
            return false;
        }
    }

    async findExistingChrome() {
        const ports = [9222, 9223, 9224, 9225, 9226];
        
        for (const port of ports) {
            try {
                const response = await axios.get(`http://localhost:${port}/json/version`, { timeout: 2000 });
                if (response.data && response.data.webSocketDebuggerUrl) {
                    this.addMessage('system', `✅ Found existing Chrome on port ${port}`);
                    return `http://localhost:${port}`;
                }
            } catch (error) {
                // Port not available, continue to next
            }
        }
        
        return null;
    }

    async processMessage(message) {
        try {
            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('connect')) {
                const success = await this.connectToBrowser();
                return success ? '✅ Successfully connected to browser!' : '❌ Failed to connect to browser';
            }
            
            if (lowerMessage.includes('login') && lowerMessage.includes('eforge')) {
                return await this.loginToEForge();
            }
            
            if (lowerMessage.includes('go to') || lowerMessage.includes('navigate')) {
                return await this.navigateToWebsite(message);
            }
            
            if (lowerMessage.includes('google')) {
                return await this.goToGoogle(message);
            }
            
            if (lowerMessage.includes('screenshot')) {
                const filename = await this.takeScreenshot();
                return filename ? `📸 Screenshot saved as ${filename}` : '❌ Failed to take screenshot';
            }
            
            // Fallback to LLM for general queries
            return await this.askLLM(message);
            
        } catch (error) {
            return `❌ Error processing request: ${error.message}`;
        }
    }

    async askLLM(message) {
        try {
            const systemPrompt = `You are a helpful browser automation assistant. The user wants to perform a task on the web. 

Current context: ${this.isConnected ? 'Connected to browser' : 'Not connected to browser'}

Provide a helpful response that:
1. Understands what they want to do
2. Suggests browser automation actions if relevant
3. Offers to help with browser automation if relevant

Keep responses conversational and helpful.`;

            const requestBody = {
                model: this.localLLMModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                max_tokens: 300,
                temperature: 0.7,
                stream: false
            };

            const response = await axios.post(`${this.localLLMUrl}/v1/chat/completions`, requestBody, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            if (response.data && response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message.content;
            } else {
                return "I'm here to help with browser automation! Try asking me to connect to a browser, navigate to websites, or take screenshots.";
            }
        } catch (error) {
            return "I'm having trouble connecting to my AI brain right now. Try asking me to connect to a browser or navigate to a website!";
        }
    }

    async takeScreenshot() {
        try {
            if (!this.page || this.page.isClosed()) {
                this.addMessage('system', '⚠️ Page was closed, creating new page...');
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screenshots/screenshot-${timestamp}.png`;
            await this.page.screenshot({ path: filename, fullPage: true });
            this.addMessage('system', `📸 Screenshot saved as ${filename}`);
            return filename;
        } catch (error) {
            this.addMessage('system', `❌ Screenshot failed: ${error.message}`);
            return null;
        }
    }

    async loginToEForge() {
        try {
            this.addMessage('system', '🔐 Logging into EForge...');
            
            if (!this.page) {
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            await this.page.goto('https://se.eforge.online/users/login', { waitUntil: 'networkidle2' });
            this.addMessage('system', '✅ Navigated to EForge login page');
            await this.takeScreenshot();
            
            // Try different selectors for email field
            const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[type="text"]', '#email'];
            for (const selector of emailSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.type(selector, this.email);
                    this.addMessage('system', `✅ Entered email using ${selector}`);
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
                    this.addMessage('system', `✅ Entered password using ${selector}`);
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
                    this.addMessage('system', `✅ Clicked login button using ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            await this.page.waitForTimeout(3000);
            await this.takeScreenshot();
            this.addMessage('system', '✅ Login process completed');
            
            return '✅ Successfully logged into EForge! I\'ve taken screenshots to show the progress.';
            
        } catch (error) {
            this.addMessage('system', `❌ Error logging into EForge: ${error.message}`);
            return `❌ Login failed: ${error.message}. Please try again or let me know if you need help troubleshooting.`;
        }
    }

    async navigateToWebsite(message) {
        try {
            this.addMessage('system', '🧭 Navigating based on your request...');
            
            let url = '';
            if (message.toLowerCase().includes('youtube')) {
                url = 'https://youtube.com';
            } else if (message.toLowerCase().includes('google')) {
                url = 'https://google.com';
            } else {
                const urlMatch = message.match(/https?:\/\/[^\s]+/);
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
            this.addMessage('system', `✅ Navigated to ${url}`);
            await this.takeScreenshot();
            
            return `✅ Successfully navigated to ${url}! I've taken a screenshot so you can see the current page.`;
            
        } catch (error) {
            this.addMessage('system', `❌ Error navigating: ${error.message}`);
            return `❌ Navigation failed: ${error.message}`;
        }
    }

    async goToGoogle(message) {
        try {
            this.addMessage('system', '🌐 Going to Google...');
            
            if (!this.page) {
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            await this.page.goto('https://google.com', { waitUntil: 'networkidle2' });
            this.addMessage('system', '✅ Navigated to Google');
            await this.takeScreenshot();
            
            // Check if user wants to search
            if (message.toLowerCase().includes('search')) {
                const searchTerm = message.toLowerCase().replace(/.*search\s+(?:for\s+)?(.+)/, '$1').trim();
                if (searchTerm && searchTerm !== 'search') {
                    try {
                        await this.page.type('input[name="q"]', searchTerm);
                        await this.page.keyboard.press('Enter');
                        await this.page.waitForTimeout(2000);
                        await this.takeScreenshot();
                        return `✅ Searched Google for "${searchTerm}"! I've taken screenshots of the results.`;
                    } catch (error) {
                        return `✅ Navigated to Google, but couldn't perform the search: ${error.message}`;
                    }
                }
            }
            
            return '✅ Successfully navigated to Google! I\'ve taken a screenshot so you can see the page.';
            
        } catch (error) {
            this.addMessage('system', `❌ Error going to Google: ${error.message}`);
            return `❌ Failed to go to Google: ${error.message}`;
        }
    }

    async start() {
        try {
            this.setupExpress();
            
            this.app.listen(this.port, () => {
                this.addMessage('system', `🚀 Chat interface started on http://localhost:${this.port}`);
                this.addMessage('system', '🌐 Open your browser and navigate to the URL above');
                this.addMessage('system', '💬 Start a conversation with me to automate your browser tasks!');
            });

        } catch (error) {
            this.addMessage('system', `❌ Error starting chat interface: ${error.message}`);
        }
    }
}

module.exports = ChatInterface;

if (require.main === module) {
    const chatInterface = new ChatInterface();
    chatInterface.start();
} 