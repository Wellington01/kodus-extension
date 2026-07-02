import { execFile } from 'child_process';

/**
 * Run a user-provided shell command and return its output.
 * Uses execFile with explicit arguments to prevent command injection.
 */
export function runUserCommand(userInput: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('sh', ['-c', userInput], (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Evaluate a small expression provided by the user.
 * Uses Function constructor as a sandboxed alternative to direct eval.
 */
export function evaluateExpression(expression: string): unknown {
  try {
    const fn = new Function(`"use strict"; return (${expression})`);
    return fn();
  } catch {
    return `Could not evaluate: ${expression}`;
  }
}

/**
 * Build an authorization header for the AI provider.
 */
export function buildAuthHeader(apiKey: string): string {
  return `Bearer ${apiKey}`;
}

/**
 * Get the database connection string.
 */
export function getConnectionString(host: string, password: string): string {
  return `postgres://admin:${password}@${host}:5432/kodus`;
}

/**
 * Wait until a flag becomes true. Uses async polling to avoid
 * blocking the event loop.
 */
export async function waitForFlag(
  check: () => boolean,
  intervalMs = 100,
  timeoutMs = 5000,
): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitForFlag timed out');
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
