const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config({ path: './config.env' });
const fs = require('fs');
const path = require('path');
const { getLogger } = require('./logger');

class WebGUI {
    constructor() {
        this.localLLMUrl = process.env.LOCAL_LLM_URL || 'http://127.0.0.1:1234';
        this.localLLMModel = process.env.LOCAL_LLM_MODEL || 'deepseek/deepseek-r1-0528-qwen3-8b';
        this.email = process.env.EFORGE_EMAIL;
        this.password = process.env.EFORGE_PASSWORD;
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.logs = [];
        this.logger = getLogger('web-gui');
        this.isConnected = false;
        this.browser = null;
        this.page = null;
    }

    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));

        // basic health
        this.app.get('/healthz', (_req, res) => res.json({ ok: true }));

        // Serve the web GUI HTML
        this.app.get('/', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>AI Web Scraper - Web GUI</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5; color: #333; margin: 0; padding: 20px;
        }
        .container { 
            max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;
        }
        .header { 
            background: #2c3e50; color: white; padding: 20px; text-align: center;
        }
        .controls { 
            background: #ecf0f1; padding: 20px; border-bottom: 1px solid #bdc3c7;
        }
        .button-group { 
            display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;
        }
        .btn { 
            padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;
            font-size: 14px; transition: background 0.3s;
        }
        .btn-primary { background: #3498db; color: white; }
        .btn-primary:hover { background: #2980b9; }
        .btn-success { background: #27ae60; color: white; }
        .btn-success:hover { background: #229954; }
        .btn-warning { background: #f39c12; color: white; }
        .btn-warning:hover { background: #e67e22; }
        .btn-danger { background: #e74c3c; color: white; }
        .btn-danger:hover { background: #c0392b; }
        .input-group { 
            display: flex; gap: 10px; margin-bottom: 15px;
        }
        .input { 
            flex: 1; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;
            font-size: 14px;
        }
        .status { 
            background: #34495e; color: white; padding: 10px; text-align: center;
            font-weight: bold;
        }
        .logs { 
            background: #2c3e50; color: #ecf0f1; padding: 20px; height: 400px;
            overflow-y: auto; font-family: monospace; font-size: 12px;
        }
        .log-entry { 
            margin: 5px 0; padding: 5px; border-left: 3px solid #3498db;
            background: rgba(52, 152, 219, 0.1);
        }
        .log-error { border-left-color: #e74c3c; background: rgba(231, 76, 60, 0.1); }
        .log-success { border-left-color: #27ae60; background: rgba(39, 174, 96, 0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Web Scraper - Web GUI</h1>
            <p>Control your browser automation through a web interface</p>
        </div>
        
        <div class="status" id="status">
            <span id="connection-status">❌ Disconnected from browser</span>
        </div>
        
        <div class="controls">
            <div class="button-group">
                <button class="btn btn-primary" onclick="connectBrowser()">🔗 Connect Browser</button>
                <button class="btn btn-success" onclick="loginEForge()">🔐 Login to EForge</button>
                <button class="btn btn-warning" onclick="takeScreenshot()">📸 Take Screenshot</button>
                <button class="btn btn-primary" onclick="goToGoogle()">🌐 Go to Google</button>
                <button class="btn btn-primary" onclick="runBrowserUse()">🧠 Run Browser-Use Task</button>
            </div>
            
            <div class="input-group">
                <input type="text" class="input" id="task-input" placeholder="Enter custom task...">
                <button class="btn btn-primary" onclick="executeTask()">Execute</button>
            </div>
            
            <div class="button-group">
                <button class="btn btn-danger" onclick="disconnectBrowser()">❌ Disconnect</button>
                <button class="btn btn-warning" onclick="clearLogs()">🗑️ Clear Logs</button>
            </div>
        </div>
        
        <div class="logs" id="logs">
            <div class="log-entry">🚀 Web GUI started. Ready for commands!</div>
        </div>
    </div>

    <script>
        function addLog(message, type = 'info') {
            const logs = document.getElementById('logs');
            const entry = document.createElement('div');
            entry.className = \`log-entry log-\${type}\`;
            entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            logs.appendChild(entry);
            logs.scrollTop = logs.scrollHeight;
        }
        
        function updateStatus(connected) {
            const status = document.getElementById('connection-status');
            if (connected) {
                status.textContent = '✅ Connected to browser';
                status.style.color = '#27ae60';
            } else {
                status.textContent = '❌ Disconnected from browser';
                status.style.color = '#e74c3c';
            }
        }
        
        async function makeRequest(endpoint, data = {}) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                addLog(result.message || result.response, result.success ? 'success' : 'error');
                updateStatus(result.connected);
                return result;
            } catch (error) {
                addLog('Error: ' + error.message, 'error');
                return { success: false, message: error.message };
            }
        }
        
        async function connectBrowser() {
            addLog('Connecting to browser...', 'info');
            await makeRequest('/api/connect');
        }
        
        async function loginEForge() {
            addLog('Logging into EForge...', 'info');
            await makeRequest('/api/login-eforge');
        }
        
        async function takeScreenshot() {
            addLog('Taking screenshot...', 'info');
            await makeRequest('/api/screenshot');
        }
        
        async function goToGoogle() {
            addLog('Navigating to Google...', 'info');
            await makeRequest('/api/navigate', { url: 'https://google.com' });
        }

        async function runBrowserUse() {
            const task = prompt('Enter a natural language task for Browser-Use (e.g., "Go to Hacker News and return the first title")');
            if (!task) return;
            addLog('Starting Browser-Use task...', 'info');
            const result = await makeRequest('/api/browser-use', { task });
            if (result && result.jobId) {
              addLog('Task submitted. Tracking job: ' + result.jobId, 'info');
            }
        }
        
        async function executeTask() {
            const input = document.getElementById('task-input');
            const task = input.value.trim();
            if (!task) return;
            
            addLog('Executing task: ' + task, 'info');
            await makeRequest('/api/execute', { task });
            input.value = '';
        }
        
        async function disconnectBrowser() {
            addLog('Disconnecting from browser...', 'info');
            await makeRequest('/api/disconnect');
        }
        
        function clearLogs() {
            document.getElementById('logs').innerHTML = '<div class="log-entry">🗑️ Logs cleared</div>';
        }
        
        // Check status on load
        fetch('/api/status')
        .then(response => response.json())
        .then(data => updateStatus(data.connected))
        .catch(() => updateStatus(false));
    </script>
</body>
</html>
            `);
        });

        // API endpoints
        this.app.post('/api/connect', async (req, res) => {
            try {
                const success = await this.connectToBrowser();
                res.json({ 
                    success, 
                    message: success ? '✅ Connected to browser' : '❌ Failed to connect',
                    connected: this.isConnected 
                });
            } catch (error) {
                res.json({ success: false, message: error.message, connected: false });
            }
        });

        this.app.post('/api/login-eforge', async (req, res) => {
            try {
                const result = await this.loginToEForge();
                res.json({ 
                    success: true, 
                    message: result,
                    connected: this.isConnected 
                });
            } catch (error) {
                res.json({ success: false, message: error.message, connected: this.isConnected });
            }
        });

        this.app.post('/api/screenshot', async (req, res) => {
            try {
                const filename = await this.takeScreenshot();
                res.json({ 
                    success: !!filename, 
                    message: filename ? `📸 Screenshot saved as ${filename}` : '❌ Failed to take screenshot',
                    connected: this.isConnected 
                });
            } catch (error) {
                res.json({ success: false, message: error.message, connected: this.isConnected });
            }
        });

        this.app.post('/api/navigate', async (req, res) => {
            try {
                const { url } = req.body;
                const result = await this.navigateToWebsite(url);
                res.json({ 
                    success: true, 
                    message: result,
                    connected: this.isConnected 
                });
            } catch (error) {
                res.json({ success: false, message: error.message, connected: this.isConnected });
            }
        });

        this.app.post('/api/execute', async (req, res) => {
            try {
                const { task } = req.body;
                const result = await this.executeTask(task);
                res.json({ 
                    success: true, 
                    message: result,
                    connected: this.isConnected 
                });
            } catch (error) {
                res.json({ success: false, message: error.message, connected: this.isConnected });
            }
        });

        // Start a Browser-Use style task using local LLM vision analysis
        this.app.post('/api/browser-use', async (req, res) => {
            const { task } = req.body || {};
            if (!task) return res.json({ success: false, message: 'Task is required' });
            try {
                const jobId = await this.startBrowserUseTask(task);
                res.json({ success: true, jobId, message: 'Task accepted', connected: this.isConnected });
            } catch (error) {
                res.json({ success: false, message: error.message, connected: this.isConnected });
            }
        });

        this.app.post('/api/disconnect', async (req, res) => {
            try {
                await this.disconnectBrowser();
                res.json({ 
                    success: true, 
                    message: '✅ Disconnected from browser',
                    connected: false 
                });
            } catch (error) {
                res.json({ success: false, message: error.message, connected: false });
            }
        });

        this.app.get('/api/status', (req, res) => {
            res.json({ connected: this.isConnected });
        });
    }

    addLog(message) {
        const entry = { message, timestamp: new Date() };
        this.logs.push(entry);
        this.logger.info(message);
        try {
            const line = `${entry.timestamp.toISOString()} ${message}\n`;
            const logPath = path.join(__dirname, '..', 'logs', 'web-gui-events.log');
            fs.appendFileSync(logPath, line);
        } catch (_) {/* ignore file log errors */}
    }

    async connectToBrowser() {
        try {
            this.addLog('🔌 Connecting to browser...');
            
            const browserPath = await this.findExistingChrome();
            if (browserPath) {
                this.browser = await puppeteer.connect({ 
                    browserURL: browserPath,
                    defaultViewport: null
                });
                this.addLog('✅ Connected to existing browser');
            } else {
                this.browser = await puppeteer.launch({
                    headless: false,
                    args: ['--remote-debugging-port=9222', '--no-sandbox']
                });
                this.addLog('✅ Started new browser');
            }
            
            this.page = await this.browser.newPage();
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            this.isConnected = true;
            this.addLog('✅ Successfully connected to browser!');
            return true;
        } catch (error) {
            this.addLog(`❌ Error connecting to browser: ${error.message}`);
            return false;
        }
    }

    async findExistingChrome() {
        const ports = [9222, 9223, 9224, 9225, 9226];
        
        for (const port of ports) {
            try {
                const response = await axios.get(`http://localhost:${port}/json/version`, { timeout: 2000 });
                if (response.data && response.data.webSocketDebuggerUrl) {
                    this.addLog(`✅ Found existing Chrome on port ${port}`);
                    return `http://localhost:${port}`;
                }
            } catch (error) {
                // Port not available, continue to next
            }
        }
        
        return null;
    }

    async takeScreenshot() {
        try {
            if (!this.page || this.page.isClosed()) {
                this.addLog('⚠️ Page was closed, creating new page...');
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screenshots/screenshot-${timestamp}.png`;
            await this.page.screenshot({ path: filename, fullPage: true });
            this.addLog(`📸 Screenshot saved as ${filename}`);
            return filename;
        } catch (error) {
            this.addLog(`❌ Screenshot failed: ${error.message}`);
            return null;
        }
    }

    async loginToEForge() {
        try {
            this.addLog('🔐 Logging into EForge...');
            
            if (!this.page) {
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            await this.page.goto('https://se.eforge.online/users/login', { waitUntil: 'networkidle2' });
            this.addLog('✅ Navigated to EForge login page');
            await this.takeScreenshot();
            
            // Try different selectors for email field
            const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[type="text"]', '#email'];
            for (const selector of emailSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.type(selector, this.email);
                    this.addLog(`✅ Entered email using ${selector}`);
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
                    this.addLog(`✅ Entered password using ${selector}`);
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
                    this.addLog(`✅ Clicked login button using ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            await this.page.waitForTimeout(3000);
            await this.takeScreenshot();
            this.addLog('✅ Login process completed');
            
            return '✅ Successfully logged into EForge! I\'ve taken screenshots to show the progress.';
            
        } catch (error) {
            this.addLog(`❌ Error logging into EForge: ${error.message}`);
            return `❌ Login failed: ${error.message}. Please try again or let me know if you need help troubleshooting.`;
        }
    }

    async navigateToWebsite(url) {
        try {
            this.addLog(`🧭 Navigating to ${url}...`);
            
            if (!this.page) {
                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            }
            
            await this.page.goto(url, { waitUntil: 'networkidle2' });
            this.addLog(`✅ Navigated to ${url}`);
            await this.takeScreenshot();
            
            return `✅ Successfully navigated to ${url}! I've taken a screenshot so you can see the current page.`;
            
        } catch (error) {
            this.addLog(`❌ Error navigating: ${error.message}`);
            return `❌ Navigation failed: ${error.message}`;
        }
    }

    async executeTask(task) {
        try {
            this.addLog(`🎯 Executing task: ${task}`);
            
            const lowerTask = task.toLowerCase();
            
            if (lowerTask.includes('login') && lowerTask.includes('eforge')) {
                return await this.loginToEForge();
            } else if (lowerTask.includes('screenshot')) {
                const filename = await this.takeScreenshot();
                return filename ? `📸 Screenshot saved as ${filename}` : '❌ Failed to take screenshot';
            } else if (lowerTask.includes('navigate') || lowerTask.includes('go to')) {
                const urlMatch = task.match(/https?:\/\/[^\s]+/);
                if (urlMatch) {
                    return await this.navigateToWebsite(urlMatch[0]);
                } else {
                    return 'Please provide a valid URL to navigate to.';
                }
            } else {
                return 'I understand you want to do something. Try specific commands like "Login to EForge", "Take screenshot", or "Navigate to https://example.com"';
            }
            
        } catch (error) {
            this.addLog(`❌ Error executing task: ${error.message}`);
            return `❌ Task execution failed: ${error.message}`;
        }
    }

    async startBrowserUseTask(task) {
        // Minimal local LLM powered stepper: screenshot → analyze → act (repeat once)
        if (!this.isConnected) {
            await this.connectToBrowser();
        }
        const initialScreenshot = await this.takeScreenshot();
        const analysis = await this.analyzeScreenshotWithLLM(initialScreenshot, task);
        this.addLog(`🤖 LLM analysis: ${analysis?.slice(0, 300) || 'n/a'}...`);
        // naive action routing
        const lowerTask = task.toLowerCase();
        if (lowerTask.includes('click')) {
            await this.clickCommon();
        } else if (lowerTask.includes('type')) {
            await this.typeIntoCommon(task);
        } else if (lowerTask.includes('navigate') || lowerTask.includes('go to')) {
            const urlMatch = task.match(/https?:\/\/[^\s]+/);
            if (urlMatch) await this.navigateToWebsite(urlMatch[0]);
        }
        await this.takeScreenshot();
        const jobId = `job_${Date.now()}`;
        return jobId;
    }

    async analyzeScreenshotWithLLM(screenshotPath, task) {
        try {
            const buf = fs.readFileSync(screenshotPath);
            const base64Image = buf.toString('base64');
            const body = {
                model: this.localLLMModel,
                messages: [
                    { role: 'system', content: `You analyze browser screenshots and suggest concrete next UI actions for task: ${task}.` },
                    { role: 'user', content: [
                        { type: 'text', text: `Analyze this screenshot for the task: ${task}` },
                        { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
                    ] }
                ],
                max_tokens: 600,
                temperature: 0.7,
            };
            const resp = await axios.post(`${this.localLLMUrl}/v1/chat/completions`, body, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
            const content = resp?.data?.choices?.[0]?.message?.content;
            return content || null;
        } catch (err) {
            this.addLog(`❌ LLM analysis error: ${err.message}`);
            return null;
        }
    }

    async clickCommon() {
        const commonSelectors = ['button', 'a', 'input[type="submit"]', '.btn', '.button'];
        for (const selector of commonSelectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 1500 });
                await this.page.click(selector);
                this.addLog(`✅ Clicked element using selector: ${selector}`);
                return true;
            } catch (_) {}
        }
        this.addLog('❌ No clickable element found');
        return false;
    }

    async typeIntoCommon(task) {
        const m = task.match(/type\s+(.+)/i);
        const text = m ? m[1] : '';
        const inputSelectors = ['input[type="text"]', 'input[type="email"]', 'textarea', 'input'];
        for (const selector of inputSelectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 1500 });
                await this.page.type(selector, text);
                this.addLog(`✅ Typed into ${selector}`);
                return true;
            } catch (_) {}
        }
        this.addLog('❌ No input found to type into');
        return false;
    }

    async disconnectBrowser() {
        try {
            if (this.browser) {
                await this.browser.disconnect();
                this.browser = null;
                this.page = null;
                this.isConnected = false;
                this.addLog('✅ Disconnected from browser');
            }
        } catch (error) {
            this.addLog(`❌ Error disconnecting: ${error.message}`);
        }
    }

    async start() {
        try {
            this.setupExpress();
            
            this.app.listen(this.port, () => {
                this.addLog(`🚀 Web GUI started on http://localhost:${this.port}`);
                this.addLog('🌐 Open your browser and navigate to the URL above');
                this.addLog('🎮 Use the buttons to control browser automation!');
            });

        } catch (error) {
            this.addLog(`❌ Error starting web GUI: ${error.message}`);
        }
    }
}

module.exports = WebGUI;

if (require.main === module) {
    const webGUI = new WebGUI();
    webGUI.start();
} 