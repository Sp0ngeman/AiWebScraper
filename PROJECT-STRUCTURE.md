# 📁 AI Web Scraper - Project Structure

## 🏗️ Directory Organization

```
ai-web-scraper/
├── 📄 README.md                    # Main project documentation
├── 📄 package.json                 # NPM package configuration
├── 📄 app.config.json             # Application configuration
├── 📄 start.js                    # Main startup script
├── 📄 config.env.example          # Configuration template
├── 📄 .gitignore                  # Git ignore rules
│
├── 📁 src/                        # Source code
│   ├── chat-interface.js          # ChatGPT-style interface
│   ├── web-gui.js                 # Web GUI interface
│   ├── simple-vision-scraper.js   # Simple scraper
│   └── vision-browser-use.js      # Vision-based scraper
│
├── 📁 docs/                       # Documentation
│   ├── STARTUP-GUIDE.md          # Startup instructions
│   ├── CHAT-INTERFACE-GUIDE.md   # Chat interface guide
│   ├── WEB-GUI-GUIDE.md          # Web GUI guide
│   ├── BROWSER-USE-GUIDE.md      # Browser automation guide
│   ├── CHROME-SETUP.md           # Chrome setup guide
│   └── USAGE.md                  # Usage documentation
│
├── 📁 examples/                   # Example implementations
│   ├── scraper.js                # Basic scraper example
│   ├── enhanced-scraper.js       # Enhanced scraper example
│   ├── custom-scraper.js         # Custom scraper example
│   ├── gui-scraper.js            # GUI scraper example
│   ├── web-gui-scraper.js        # Web GUI scraper example
│   ├── chat-gui.js               # Chat GUI example
│   ├── simple-browser-use.js     # Simple browser automation
│   ├── browser-use-integration.js # Browser integration
│   ├── custom-llm-integration.js # Custom LLM integration
│   └── llm-integration.js        # LLM integration example
│
├── 📁 screenshots/               # Screenshot storage
│   └── README.md                 # Screenshot documentation
│
├── 📁 logs/                      # Application logs
│   └── README.md                 # Log documentation
│
└── 📁 node_modules/              # Dependencies (auto-generated)
```

## 🎯 File Purposes

### Core Application Files
- **`start.js`**: Main startup script with cross-platform support
- **`app.config.json`**: Application configuration and settings
- **`package.json`**: NPM package metadata and scripts
- **`config.env.example`**: Configuration template for users

### Source Code (`src/`)
- **`chat-interface.js`**: ChatGPT-style conversational interface
- **`web-gui.js`**: Web-based graphical user interface
- **`simple-vision-scraper.js`**: Simple command-line scraper
- **`vision-browser-use.js`**: Vision-based browser automation

### Documentation (`docs/`)
- **`STARTUP-GUIDE.md`**: Complete startup instructions
- **`CHAT-INTERFACE-GUIDE.md`**: Chat interface usage guide
- **`WEB-GUI-GUIDE.md`**: Web GUI usage guide
- **`BROWSER-USE-GUIDE.md`**: Browser automation guide
- **`CHROME-SETUP.md`**: Chrome browser setup guide
- **`USAGE.md`**: General usage documentation

### Examples (`examples/`)
- **`scraper.js`**: Basic web scraper implementation
- **`enhanced-scraper.js`**: Enhanced scraper with LLM integration
- **`custom-scraper.js`**: Customizable scraper with CLI
- **`gui-scraper.js`**: GUI-based scraper interface
- **`web-gui-scraper.js`**: Web-based GUI scraper
- **`chat-gui.js`**: Chat-based GUI interface
- **`simple-browser-use.js`**: Simple browser automation
- **`browser-use-integration.js`**: Browser automation integration
- **`custom-llm-integration.js`**: Custom LLM integration
- **`llm-integration.js`**: LLM integration example

### Data Directories
- **`screenshots/`**: Screenshot storage with documentation
- **`logs/`**: Application logs with documentation
- **`node_modules/`**: NPM dependencies (auto-generated)

## 🔧 Development Workflow

### Adding New Features
1. Create new files in `src/` directory
2. Update `start.js` to include new modes
3. Add documentation in `docs/` directory
4. Update `package.json` scripts if needed

### Testing
1. Use `npm start` for main interface
2. Use `npm run [mode]` for specific modes
3. Check logs in `logs/` directory
4. Review screenshots in `screenshots/` directory

### Publishing
1. Update version in `package.json`
2. Update documentation in `docs/`
3. Test all modes before release
4. Create GitHub release and NPM package

## 📋 Maintenance

### Regular Tasks
- Clean old screenshots: `rm screenshots/screenshot-*.png`
- Clean old logs: `rm logs/app-*.log`
- Update dependencies: `npm update`
- Test all modes: `npm test`

### Backup
- Configuration: `config.env`
- Screenshots: `screenshots/`
- Logs: `logs/`
- Documentation: `docs/`

---

**This structure provides a clean, organized, and maintainable codebase ready for cross-platform deployment!** 🚀 