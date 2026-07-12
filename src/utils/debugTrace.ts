// Debug tracing helper.
// Uses console.log in production code, which violates the
// "Avoid console.log in production code" rule (multi-glob: src/**/*.ts,src/**/*.tsx).
export function debugTrace(label: string, payload: unknown): void {
    console.log(`[trace] ${label}`, payload);
}
