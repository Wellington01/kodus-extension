// Report URL helpers.
// Exported functions here intentionally OMIT return types to exercise
// CONV-KDX-9137 — the convention that lives in docs/conventions.md and is
// pulled into the AGENTS.md rule via the @docs/conventions.md reference.
export function buildReportUrl(base: string, path: string) {
    return `${base}/${path}`;
}

export function parseReportId(raw: string) {
    return raw.split(':')[1];
}
