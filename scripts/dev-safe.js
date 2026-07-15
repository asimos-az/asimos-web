const { execFileSync, spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const nextBin = path.join(projectRoot, "node_modules", ".bin", "next");
const nextPattern = `${nextBin} dev`;
const devDistDirName = ".next-dev";
const nextDir = path.join(projectRoot, devDistDirName);
const pidFile = path.join(projectRoot, ".dev-server.pid");

function killRecordedProcess() {
  try {
    const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return;

    process.kill(pid, 0);
    process.kill(pid, "SIGTERM");
  } catch {
    // PID faylı yoxdursa və ya proses artıq bağlanıbsa davam et.
  } finally {
    try { fs.unlinkSync(pidFile); } catch {}
  }
}

function listStalePids() {
  try {
    const output = execFileSync("/usr/bin/pgrep", ["-af", nextPattern], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!output) return [];

    return output
      .split("\n")
      .map((line) => Number(line.trim().split(/\s+/, 1)[0]))
      .filter((pid) => Number.isInteger(pid) && pid !== process.pid);
  } catch {
    return [];
  }
}

function killStaleProcesses() {
  const pids = listStalePids();
  if (!pids.length) return;

  try {
    execFileSync("/bin/kill", pids.map(String), {
      cwd: projectRoot,
      stdio: "ignore",
    });
  } catch {
    // Ignore kill races; cleanup below will still retry.
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function removeNextDir() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.rmSync(nextDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 150,
      });
      return;
    } catch (error) {
      if (attempt === 4) {
        console.warn(`Warning: failed to clear .next: ${error.message}`);
        return;
      }
      sleep(150);
    }
  }
}

function startDevServer() {
  const child = spawn(nextBin, ["dev"], {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, NEXT_DIST_DIR: devDistDirName },
  });

  fs.writeFileSync(pidFile, String(child.pid));

  const cleanup = () => {
    try {
      if (fs.readFileSync(pidFile, "utf8").trim() === String(child.pid)) fs.unlinkSync(pidFile);
    } catch {}
  };

  child.on("exit", (code, signal) => {
    cleanup();
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });
}

killRecordedProcess();
killStaleProcesses();
removeNextDir();
startDevServer();
