/**
 * Frees the backend's port before start/dev so a leftover process from a
 * previous run (crashed terminal, orphaned `nohup`, a second launch you
 * forgot was running) never causes EADDRINUSE again. Runs automatically via
 * npm's "pre" hook (prestart/predev) — no manual intervention needed.
 */
const { execSync } = require('child_process');

const PORT = process.env.PORT || 5000;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', windowsHide: true });
  } catch (err) {
    // Non-zero exit just means "nothing found" for netstat/findstr/lsof — not a real error.
    return err.stdout ? err.stdout.toString() : '';
  }
}

function freeWindows() {
  const output = run(`netstat -ano | findstr :${PORT}`);
  const pids = new Set();
  for (const line of output.split('\n')) {
    const parts = line.trim().split(/\s+/);
    const state = parts[3];
    const pid = parts[4];
    if (state === 'LISTENING' && pid && pid !== String(process.pid)) {
      pids.add(pid);
    }
  }
  for (const pid of pids) {
    console.log(`[free-port] Port ${PORT} is held by PID ${pid} — stopping it.`);
    run(`taskkill /F /PID ${pid}`);
  }
}

function freePosix() {
  const output = run(`lsof -ti tcp:${PORT}`);
  const pids = output.split('\n').map(p => p.trim()).filter(p => p && p !== String(process.pid));
  for (const pid of pids) {
    console.log(`[free-port] Port ${PORT} is held by PID ${pid} — stopping it.`);
    run(`kill -9 ${pid}`);
  }
}

if (process.platform === 'win32') {
  freeWindows();
} else {
  freePosix();
}
