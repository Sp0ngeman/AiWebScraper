## Web GUI Guide

### Start
- Run: `node start.js web-gui`
- Open: `http://localhost:3001`

### Features
- Connect/Disconnect to a Chrome instance (auto-starts if not found)
- Login to EForge (requires `EFORGE_EMAIL` and `EFORGE_PASSWORD` in `config.env`)
- Navigate to a URL and take screenshots (saved under `screenshots/`)
- Execute simple tasks by text
- Run a minimal Browser-Use style task powered by your local LLM (`/api/browser-use`)

### Local LLM
Set in `config.env`:
- `LOCAL_LLM_URL` (e.g. `http://127.0.0.1:1234`)
- `LOCAL_LLM_MODEL` (e.g. `deepseek/deepseek-r1-0528-qwen3-8b`)

The GUI will send screenshots to your local LLM for analysis when using the Browser-Use action.

### Logging
- Console logs are persisted to `logs/app-YYYYMMDD.log`
- Web GUI events additionally go to `logs/web-gui-events.log`
- Tune via `LOG_LEVEL` env var (default `info`)
