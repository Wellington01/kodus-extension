// Report sync helper.
//
// NOTE: this file intentionally violates the "Error Handling Best Practices"
// Kody Rule (imported from .cursor/rules/error-handling.mdc with a multi-glob
// path: **/*.ts,**/*.tsx,**/*.js,**/*.jsx). It exists to validate the #1494
// multi-glob fix: before the fix, the comma-joined path matched ZERO files and
// the rule never fired on any .ts file. After the fix it should fire here.

export async function syncReports(client: {
    fetch: (url: string) => Promise<string>;
}): Promise<string> {
    try {
        return await client.fetch('/reports');
    } catch (e) {
        // Violation: error swallowed silently — no logging, no re-throw,
        // no meaningful message. The rule says "never ignore errors silently".
        return '';
    }
}

export function parseReportPayload(raw: string): unknown {
    // Violation: JSON.parse can throw on malformed input and there is no
    // try-catch around it. The rule says to guard code that might throw.
    return JSON.parse(raw);
}
