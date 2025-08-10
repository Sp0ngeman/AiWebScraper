const fs = require('fs');
const path = require('path');

const exportsDir = path.join(__dirname, '..', '..', 'exports');
function ensureDir() {
  if (!fs.existsSync(exportsDir)) {
    try { fs.mkdirSync(exportsDir, { recursive: true }); } catch (_) {}
  }
}

async function exportJSON(data, filename = 'scrape.json') {
  ensureDir();
  const safeName = filename.endsWith('.json') ? filename : `${filename}.json`;
  const filePath = path.join(exportsDir, safeName);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return filePath;
}

function toCSV(dataArray) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return '';
  const headers = Array.from(
    dataArray.reduce((set, obj) => {
      Object.keys(obj || {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const rows = [headers.join(',')].concat(
    dataArray.map((obj) => headers.map((h) => escape(obj?.[h])).join(','))
  );
  return rows.join('\n');
}

async function exportCSV(data, filename = 'scrape.csv') {
  ensureDir();
  const safeName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const filePath = path.join(exportsDir, safeName);
  const csv = toCSV(data);
  await fs.promises.writeFile(filePath, csv, 'utf8');
  return filePath;
}

module.exports = { exportJSON, exportCSV };

