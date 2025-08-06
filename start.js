#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AppStarter {
    constructor() {
        this.config = this.loadConfig();
        this.processes = new Map();
    }

    loadConfig() {
        const configPath = path.join(__dirname, 'app.config.json');
        if (fs.existsSync(configPath)) {
            try {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch (error) {
                console.log('⚠️ Error loading config, using defaults');
            }
        }
        
        // Default configuration
        return {
            port: 3001,
            host: 'localhost',
            mode: 'chat',
            autoStart: true,
            browserPath: this.detectBrowserPath(),
            llmUrl: 'http://127.0.0.1:1234',
            llmModel: 'deepseek/deepseek-r1-0528-qwen3-8b',
            headless: false,
            debug: false
        };
    }

    detectBrowserPath() {
        const platform = os.platform();
        const paths = {
            win32: [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
            ],
            darwin: [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium'
            ],
            linux: [
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/snap/bin/chromium'
            ]
        };

        const platformPaths = paths[platform] || paths.linux;
        for (const browserPath of platformPaths) {
            if (fs.existsSync(browserPath)) {
                return browserPath;
            }
        }
        
        return null;
    }

    async start(mode = 'chat') {
        console.log('🚀 Starting AI Web Scraper...');
        console.log(`📋 Mode: ${mode}`);
        console.log(`🌐 Platform: ${os.platform()} ${os.arch()}`);
        console.log(`🔧 Node.js: ${process.version}`);
        
        // Check dependencies
        await this.checkDependencies();
        
        // Start the appropriate mode
        switch (mode) {
            case 'chat':
                await this.startChatInterface();
                break;
            case 'web-gui':
                await this.startWebGUI();
                break;
            case 'simple':
                await this.startSimpleScraper();
                break;
            case 'vision':
                await this.startVisionScraper();
                break;
            default:
                console.log('❌ Unknown mode. Available modes: chat, web-gui, simple, vision');
                process.exit(1);
        }
    }

    async checkDependencies() {
        console.log('🔍 Checking dependencies...');
        
        const requiredFiles = [
            'package.json',
            'node_modules',
            'config.env'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(__dirname, file))) {
                console.log(`❌ Missing: ${file}`);
                if (file === 'node_modules') {
                    console.log('📦 Installing dependencies...');
                    await this.runCommand('npm', ['install']);
                }
            }
        }

        // Check if config.env exists, create template if not
        if (!fs.existsSync(path.join(__dirname, 'config.env'))) {
            console.log('📝 Creating config template...');
            this.createConfigTemplate();
        }
    }

    createConfigTemplate() {
        const template = `# AI Web Scraper Configuration
# Copy this file and fill in your details

# EForge Credentials (optional)
EFORGE_EMAIL=your-email@example.com
EFORGE_PASSWORD=your-password

# Local LLM Configuration
LOCAL_LLM_URL=http://127.0.0.1:1234
LOCAL_LLM_MODEL=deepseek/deepseek-r1-0528-qwen3-8b

# Browser Configuration
CHROME_PATH=${this.config.browserPath || '/usr/bin/google-chrome'}
HEADLESS_MODE=false

# Server Configuration
PORT=${this.config.port}
HOST=${this.config.host}
`;
        
        fs.writeFileSync(path.join(__dirname, 'config.env'), template);
        console.log('✅ Created config.env template. Please edit it with your settings.');
    }

    async startChatInterface() {
        console.log('💬 Starting ChatGPT-style interface...');
        
        const child = spawn('node', ['src/chat-interface.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });

        this.processes.set('chat', child);

        child.on('close', (code) => {
            console.log(`💬 Chat interface stopped with code ${code}`);
            this.processes.delete('chat');
        });

        child.on('error', (error) => {
            console.error('❌ Chat interface error:', error);
        });

        console.log(`🌐 Chat interface available at: http://${this.config.host}:${this.config.port}`);
        console.log('💡 Press Ctrl+C to stop');
    }

    async startWebGUI() {
        console.log('🖥️ Starting Web GUI...');
        
        const child = spawn('node', ['src/web-gui.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });

        this.processes.set('web-gui', child);

        child.on('close', (code) => {
            console.log(`🖥️ Web GUI stopped with code ${code}`);
            this.processes.delete('web-gui');
        });

        console.log(`🌐 Web GUI available at: http://${this.config.host}:${this.config.port}`);
    }

    async startSimpleScraper() {
        console.log('🔧 Starting Simple Scraper...');
        
        const child = spawn('node', ['src/simple-vision-scraper.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });

        this.processes.set('simple', child);

        child.on('close', (code) => {
            console.log(`🔧 Simple scraper stopped with code ${code}`);
            this.processes.delete('simple');
        });
    }

    async startVisionScraper() {
        console.log('👁️ Starting Vision Scraper...');
        
        const child = spawn('node', ['src/vision-browser-use.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });

        this.processes.set('vision', child);

        child.on('close', (code) => {
            console.log(`👁️ Vision scraper stopped with code ${code}`);
            this.processes.delete('vision');
        });
    }

    async runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                stdio: 'inherit',
                cwd: __dirname
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with code ${code}`));
                }
            });

            child.on('error', reject);
        });
    }

    stop() {
        console.log('🛑 Stopping all processes...');
        for (const [name, process] of this.processes) {
            console.log(`🛑 Stopping ${name}...`);
            process.kill();
        }
        this.processes.clear();
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'chat';

const starter = new AppStarter();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    starter.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    starter.stop();
    process.exit(0);
});

// Start the application
starter.start(mode).catch(error => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
}); 