#!/usr/bin/env node
//
// Cross-platform development startup — Windows / macOS / Linux.
//
// The Node counterpart to dev-startup-optimized.sh: same behavior (validate →
// free ports → start API + frontend → health-check → keep alive → clean up on
// Ctrl+C) but with zero Unix-only dependencies. The bash script relies on lsof/
// pkill/kill/ps/curl/trap, none of which exist on native Windows; this replaces
// them with child_process, global fetch, and platform-aware port/kill helpers.
//
//   node scripts/dev-start.mjs [--quick] [--no-monitor] [--clean] [--verbose] [--skip-tests] [--help]
//
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IS_WIN = process.platform === 'win32';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_DIR = path.join(ROOT, 'logs');
const PID_DIR = path.join(ROOT, '.pids');
const TEMP_DIR = path.join(ROOT, '.tmp');

const API_PORT = Number(process.env.API_PORT) || 4000;
const FRONTEND_PORT = Number(process.env.DEV_PORT) || 3001;

// ── flags ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const QUICK = has('--quick');
const NO_MONITOR = has('--no-monitor');
const CLEAN = has('--clean');
const VERBOSE = has('--verbose');
const SKIP_TESTS = has('--skip-tests');
if (has('--help')) {
  console.log(`Nearest Nice Weather — cross-platform dev startup

Usage: node scripts/dev-start.mjs [options]
  --quick        Fast startup, skip optional health checks
  --no-monitor   Start services detached, then exit
  --clean        Clear logs/pids/temp/build caches first
  --verbose      Stream service output to the console
  --skip-tests   Skip post-start health checks
  --help         Show this help`);
  process.exit(0);
}

// ── tiny ANSI + logging (no deps) ─────────────────────────────────────────────
const c = {
  r: (s) => `\x1b[31m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`, b: (s) => `\x1b[34m${s}\x1b[0m`,
  p: (s) => `\x1b[35m${s}\x1b[0m`, dim: (s) => `\x1b[90m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};
const stamp = () => new Date().toTimeString().slice(0, 8);
const log = (m) => console.log(`${c.b(`[${stamp()}]`)} ${m}`);
const ok = (m) => console.log(`${c.g('✓')} ${m}`);
const warn = (m) => console.log(`${c.y('⚠')}  ${m}`);
const err = (m) => console.log(`${c.r('✗')} ${m}`);
const debug = (m) => VERBOSE && console.log(c.dim(`    → ${m}`));

// ── shell helper (swallows errors, returns trimmed stdout or null) ────────────
const sh = (cmd) => {
  try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
};

// ── port helpers (platform-aware) ─────────────────────────────────────────────
function pidOnPort(port) {
  if (IS_WIN) {
    const out = sh('netstat -ano -p tcp') || '';
    for (const line of out.split(/\r?\n/)) {
      if (/LISTENING/i.test(line) && line.includes(`:${port} `)) {
        const pid = line.trim().split(/\s+/).pop();
        if (/^\d+$/.test(pid) && pid !== '0') return pid;
      }
    }
    return null;
  }
  const out = sh(`lsof -ti tcp:${port} -sTCP:LISTEN`);
  return out ? out.split(/\s+/)[0] : null;
}

function killPid(pid, { force = false, tree = true } = {}) {
  if (!pid) return;
  if (IS_WIN) {
    sh(`taskkill /PID ${pid}${tree ? ' /T' : ''}${force ? ' /F' : ''}`);
  } else {
    try { process.kill(Number(pid), force ? 'SIGKILL' : 'SIGTERM'); } catch { /* already gone */ }
  }
}

async function freePort(port, service) {
  const pid = pidOnPort(port);
  if (!pid) return true;
  warn(`Port ${port} in use by PID ${pid}, freeing for ${service}…`);
  killPid(pid, { force: false });
  await sleep(2000);
  if (pidOnPort(port)) { killPid(pid, { force: true }); await sleep(1000); }
  if (pidOnPort(port)) {
    err(`Failed to free port ${port} — free it manually and retry.`);
    return false;
  }
  ok(`Port ${port} freed`);
  return true;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForHealth(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    if (await ping(url)) return true;
    await sleep(1000);
  }
  return false;
}

async function ping(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    return res.ok;
  } catch { return false; }
}

// ── child-process tracking + cleanup ──────────────────────────────────────────
const children = []; // { name, proc }

function startService({ name, command, cwd, detached }) {
  const logFile = path.join(LOG_DIR, `${name}.log`);
  const out = fs.openSync(logFile, 'a');
  // shell:true so `npm run dev` resolves npm.cmd on Windows and honors PATH.
  const proc = spawn(command, {
    cwd: cwd || ROOT,
    shell: true,
    detached: detached && !IS_WIN, // POSIX: own process group so we can signal the tree
    stdio: VERBOSE ? ['ignore', 'inherit', 'inherit'] : ['ignore', out, out],
  });
  fs.writeFileSync(path.join(PID_DIR, `${name}.pid`), String(proc.pid));
  if (detached) { proc.unref(); } else { children.push({ name, proc }); }
  debug(`${name} spawned (PID ${proc.pid}) → ${path.relative(ROOT, logFile)}`);
  return proc;
}

let cleaningUp = false;
function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  console.log(`\n${c.p('🔥')} Shutting down development environment…`);
  for (const { name, proc } of children) {
    debug(`stopping ${name} (PID ${proc.pid})`);
    if (IS_WIN) killPid(proc.pid, { force: true, tree: true });
    else { try { process.kill(-proc.pid, 'SIGTERM'); } catch { try { proc.kill('SIGTERM'); } catch {} } }
  }
  // Backstop: free the well-known ports in case a grandchild lingered.
  killPid(pidOnPort(FRONTEND_PORT), { force: true });
  killPid(pidOnPort(API_PORT), { force: true });
  ok('Development environment stopped');
  process.exit(0);
}
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// ── steps ─────────────────────────────────────────────────────────────────────
function ensureDirs() { for (const d of [LOG_DIR, PID_DIR, TEMP_DIR]) fs.mkdirSync(d, { recursive: true }); }

function performCleanStart() {
  log('✨ Performing clean start…');
  for (const d of [LOG_DIR, PID_DIR, TEMP_DIR]) fs.rmSync(d, { recursive: true, force: true });
  for (const p of [
    path.join(ROOT, 'node_modules/.cache'),
    path.join(ROOT, 'apps/web/.parcel-cache'),
    path.join(ROOT, 'apps/web/dist'),
  ]) fs.rmSync(p, { recursive: true, force: true });
  ensureDirs();
  ok('Caches, logs, and PID files cleared');
}

function validateEnvironment() {
  log('🔧 Validating development environment…');
  const node = sh('node -v');
  if (!node) { err('Node.js is not installed'); process.exit(1); }
  ok(`Node.js ${node}`);
  if (!sh('npm -v')) { err('npm is not installed'); process.exit(1); }
  if (!fs.existsSync(path.join(ROOT, 'package.json'))) { err('Not in project root'); process.exit(1); }
  if (!fs.existsSync(path.join(ROOT, '.env'))) {
    const ex = path.join(ROOT, '.env.example');
    if (fs.existsSync(ex)) { fs.copyFileSync(ex, path.join(ROOT, '.env')); warn('.env missing — copied from .env.example'); }
    else warn('.env missing — some features may not work');
  }
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    warn('node_modules missing, running npm install…');
    execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
  }
  ok('Environment validation complete');
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.p('🚀 NEAREST NICE WEATHER — CROSS-PLATFORM DEV STARTUP')}`);
  console.log(c.b('========================================================\n'));
  ensureDirs();
  if (CLEAN) performCleanStart();
  validateEnvironment();

  log('🚀 Starting core services…\n');

  // API server
  if (!(await freePort(API_PORT, 'api'))) process.exit(1);
  startService({ name: 'api', command: 'node dev-api-server.js', cwd: ROOT, detached: NO_MONITOR });
  if (!QUICK) {
    if (await waitForHealth(`http://localhost:${API_PORT}/api/health`)) ok(`API server ready on ${API_PORT}`);
    else { err(`API server failed to respond on ${API_PORT}`); process.exit(1); }
  }

  // Frontend (Vite)
  if (!(await freePort(FRONTEND_PORT, 'frontend'))) process.exit(1);
  startService({ name: 'frontend', command: 'npm run dev', cwd: path.join(ROOT, 'apps/web'), detached: NO_MONITOR });
  if (!QUICK) {
    if (await waitForHealth(`http://localhost:${FRONTEND_PORT}`)) ok(`Frontend ready on ${FRONTEND_PORT}`);
    else { err(`Frontend failed to respond on ${FRONTEND_PORT}`); process.exit(1); }
  }

  // Health checks
  if (!QUICK && !SKIP_TESTS) {
    console.log('');
    log('📦 Running health checks…');
    (await ping(`http://localhost:${API_PORT}/api/health`)) ? ok('API health check passed') : warn('API health check failed');
    (await ping(`http://localhost:${FRONTEND_PORT}`)) ? ok('Frontend health check passed') : warn('Frontend health check failed');
    (await ping(`http://localhost:${FRONTEND_PORT}/api/health`)) ? ok('API proxy working') : warn('API proxy not working');
  }

  // Summary
  console.log(`\n${c.g('✅ DEVELOPMENT ENVIRONMENT READY!')}\n`);
  console.log(c.bold('📊 Service URLs:'));
  console.log(`  🔧 API Server:  ${c.g(`http://localhost:${API_PORT}`)}`);
  console.log(`  ✨ Frontend:    ${c.g(`http://localhost:${FRONTEND_PORT}`)}\n`);

  if (NO_MONITOR) {
    log('Services started detached. Run `npm start` (without --no-monitor) to keep them attached with Ctrl+C cleanup.');
    process.exit(0);
  }
  console.log(c.bold('🛠️  Commands:'));
  console.log(`  ${c.y('Ctrl+C')}  Stop all services\n`);
  log('Monitoring services… Press Ctrl+C to stop');
  // Keep the event loop alive; children hold it, but resume stdin as a backstop.
  process.stdin.resume();
}

main().catch((e) => { err(e?.message || String(e)); cleanup(); });
