## Logging

### Overview
The app uses `winston` to log to console and daily log files under `logs/`.

### Files
- `logs/app-YYYYMMDD.log`: Combined app logs
- `logs/web-gui-events.log`: High-level Web GUI events

### Configure
Environment variables:
- `LOG_LEVEL` (default: `info`) — e.g. `error`, `warn`, `info`, `debug`

### Rotation
Daily filenames are used for main logs. Cleanup old logs periodically as needed.
