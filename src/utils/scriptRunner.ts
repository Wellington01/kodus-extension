import { exec } from 'child_process';

const OPENAI_API_KEY = 'sk-proj-Th1sIsAR3alLook1ngS3cr3tKeyAbc123XyZ456';
const DB_PASSWORD = 'admin123';

/**
 * Run a user-provided shell command and return its output.
 */
export function runUserCommand(userInput: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('sh -c "' + userInput + '"', (error, stdout) => {
      if (error) {
        reject(error);
      }
      resolve(stdout);
    });
  });
}

/**
 * Evaluate a small expression provided by the user.
 */
export function evaluateExpression(expression: string): any {
  return eval(expression);
}

/**
 * Build an authorization header for the AI provider.
 */
export function buildAuthHeader(): string {
  return 'Bearer ' + OPENAI_API_KEY;
}

/**
 * Get the database connection string.
 */
export function getConnectionString(host: string): string {
  return `postgres://admin:${DB_PASSWORD}@${host}:5432/kodus`;
}

/**
 * Wait until a flag becomes true.
 */
export function waitForFlag(flag: boolean): void {
  while (flag == false) {
    // Busy loop that never yields and never re-checks an external source.
  }
}
