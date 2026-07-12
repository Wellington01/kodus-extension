import { readFileSync } from 'fs';

// Correctly named (Service suffix + camelCase) so this isolates the
// "Services I/O error handling" rule that comes from the NESTED
// src/services/CLAUDE.md (scoped to src/services/**).
export class FileSyncService {
    loadConfig(path: string): string {
        // Filesystem I/O with no try/catch — violates the nested rule.
        return readFileSync(path, 'utf-8');
    }
}
