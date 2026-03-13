import { spawn } from 'child_process';

const APPS = {
  server: { script: 'dev:server', color: '\x1b[36m' },
  client: { script: 'dev:client', color: '\x1b[33m' },
};

const RESET = '\x1b[0m';

const args = process.argv.slice(2);

const names = args.length > 0 ? args : Object.keys(APPS);

for (const name of names) {
  if (!APPS[name]) {
    console.error(`Unknown app: "${name}". Valid: ${Object.keys(APPS).join(', ')}`);
    process.exit(1);
  }
}

const children = [];

for (const name of names) {
  const { script, color } = APPS[name];
  const prefix = `${color}[${name}]${RESET}`;

  const spawnArgs = ['run', script];

  const child = spawn('npm', spawnArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env },
  });

  child._name = name;

  child.stdout.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line) console.log(`${prefix} ${line}`);
    }
  });

  child.stderr.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line) console.error(`${prefix} ${line}`);
    }
  });

  child.on('exit', (code, signal) => {
    console.log(`${prefix} exited (code=${code}, signal=${signal})`);
  });

  children.push(child);
}

function killAll() {
  for (const child of children) {
    if (child.exitCode !== null) continue;
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', String(child.pid)], {
          stdio: 'ignore',
        });
      } else {
        child.kill('SIGTERM');
      }
    } catch {}
  }
}

let exiting = false;

function cleanup() {
  if (exiting) return;
  exiting = true;
  console.log('\nShutting down all apps...');
  killAll();
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', killAll);
