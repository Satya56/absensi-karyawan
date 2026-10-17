import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const projects = [
  { name: "api", prefix: "backend", script: "start:dev" },
  { name: "web", prefix: "frontend", script: "dev" },
];

const processes = projects.map(({ name, prefix, script }) => {
  const child = spawn(npm, ["--prefix", prefix, "run", script], {
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`${name} process exited with code ${code ?? "unknown"}.`);
      stopProcesses();
      process.exitCode = code ?? 1;
    }
  });

  return child;
});

function stopProcesses() {
  for (const child of processes) {
    if (!child.killed) child.kill("SIGTERM");
  }
}

process.on("SIGINT", stopProcesses);
process.on("SIGTERM", stopProcesses);
