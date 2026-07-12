// Export command.
// This class lives in src/commands/** — the SECOND glob of the rule
// "Service class and method naming" (path: src/services/**/*.ts,src/commands/**/*.ts).
// Before the multi-glob fix, the comma-joined path matched ZERO files, so a
// violation here was silently missed. It violates NAME1 twice:
//   1. exported class without a `Service` suffix
//   2. a method named in Pascal/snake_case
export class exportCommand {
    Run_Export(id: string): string {
        return `exported-${id}`;
    }
}
