# 📁 AI Web Scraper - Project Structure

## 🏗️ Directory Organization

```
ai-web-scraper/
├── 📄 README.md                    # Main project documentation
├── 📄 package.json                 # NPM package configuration (now includes dev scripts)
├── 📄 app.config.json             # Application configuration
├── 📄 start.js                    # Main startup script
├── 📄 config.env.example          # Configuration template
├── 📄 .gitignore                  # Git ignore rules
│
├── 📁 server/                     # Express API server (new)
│   ├── index.js                   # API entry, CORS, routes
│   ├── routes/
│   │   └── scrape.js              # Scrape endpoints (Hacker News example)
│   ├── services/
│   │   └── scraper.js             # Puppeteer scraping logic
│   └── utils/
│       └── export.js              # JSON/CSV export utilities
│
├── 📁 client/                     # Vite + React + Tailwind frontend (new)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
│           ├── ScrapeControls.jsx
│           └── ResultsTable.jsx
│
├── 📁 src/                        # Legacy prototypes (kept)
│   ├── chat-interface.js          # ChatGPT-style interface
│   ├── web-gui.js                 # Web GUI interface
│   ├── logger.js                  # Shared logging utility
│   ├── simple-vision-scraper.js   # Simple scraper
│   └── vision-browser-use.js      # Vision-based scraper
│
├── 📁 docs/                       # Documentation
│   ├── STARTUP-GUIDE.md          # Startup instructions
│   ├── CHAT-INTERFACE-GUIDE.md   # Chat interface guide
│   ├── WEB-GUI-GUIDE.md          # Web GUI guide
│   ├── BROWSER-USE-GUIDE.md      # Browser automation guide
│   ├── CHROME-SETUP.md           # Chrome setup guide
│   ├── LOGGING.md                # Logging setup and usage
│   └── LLM-SETUP.md              # Local LLM configuration
│
├── 📁 examples/                   # Example implementations
│   └── ...
│
├── 📁 screenshots/               # Screenshot storage
│   └── README.md
│
├── 📁 logs/                      # Application logs
│   └── README.md
│
└── 📁 node_modules/              # Dependencies (auto-generated)
```

## 🎯 File Purposes

### Core Application Files
- **`start.js`**: Main startup script with cross-platform support
- **`app.config.json`**: Application configuration and settings
- **`package.json`**: NPM package metadata and scripts
- **`config.env.example`**: Configuration template for users
  
### Logging
- **`logs/`** contains daily logs (e.g. `app-YYYYMMDD.log`) and Web GUI event log `web-gui-events.log`. Configure verbosity via `LOG_LEVEL`.

### Source Code
- Legacy `src/` contains the original interfaces and remains intact.
- New `server/` and `client/` folders provide a modern full-stack GUI and API surface.

### Documentation (`docs/`)
- Adds references for logging and LLM setup used by the new API/UI.

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
1. Add API logic to `server/` and UI to `client/`
2. Keep `src/` modes functional; do not break existing flows
3. Update docs in `docs/`
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