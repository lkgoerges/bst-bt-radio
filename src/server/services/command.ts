import { execFile } from "node:child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export function runCommand(command: string, args: string[], timeoutMs = 15_000): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} ${args.join(" ")} failed: ${stderr || error.message}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
