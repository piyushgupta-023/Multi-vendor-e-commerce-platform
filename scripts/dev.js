const { spawn } = require('child_process');
const path = require('path');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rootDir = path.resolve(__dirname, '..');
const spawnOptions = {
  cwd: rootDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
};

const processes = [
  spawn(npmCommand, ['--prefix', 'server', 'run', 'dev'], {
    ...spawnOptions,
  }),
  spawn(npmCommand, ['--prefix', 'client', 'run', 'dev'], {
    ...spawnOptions,
  }),
];

let stopping = false;
const stop = (exitCode = 0) => {
  if (stopping) return;
  stopping = true;
  processes.forEach((process) => {
    if (!process.killed) process.kill();
  });
  process.exit(exitCode);
};

processes.forEach((process) => {
  process.on('exit', (code) => {
    if (!stopping) stop(code || 0);
  });
});

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
