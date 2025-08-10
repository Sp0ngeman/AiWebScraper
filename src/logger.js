const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (_) {
    // ignore
  }
}

function getDailyLogFilename() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return path.join(logsDir, `app-${yyyy}${mm}${dd}.log`);
}

function getLogger(scope = 'app') {
  const level = process.env.LOG_LEVEL || 'info';
  return createLogger({
    level,
    defaultMeta: { scope },
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message, scope: s }) => {
        return `${timestamp} [${s}] ${level}: ${message}`;
      })
    ),
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
      new transports.File({ filename: getDailyLogFilename() }),
    ],
  });
}

module.exports = { getLogger };

