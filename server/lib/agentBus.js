const { EventEmitter } = require('events');

const runs = new Map(); // runId -> EventEmitter

function createRun(runId) {
  const ee = new EventEmitter();
  runs.set(runId, ee);
  return ee;
}

function getRun(runId) {
  return runs.get(runId);
}

function endRun(runId) {
  const ee = runs.get(runId);
  if (ee) {
    ee.emit('end');
    runs.delete(runId);
  }
}

module.exports = { createRun, getRun, endRun };

