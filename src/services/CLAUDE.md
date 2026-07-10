# Services guidance (nested CLAUDE.md)

<!-- Bug #3: per-directory CLAUDE.md files were never discovered (only root was
     read). After the fix this must sync AND be scoped to `src/services/**`, not
     repo-wide. -->

- **SERVICES-CLAUDE-marker**: every service method that performs I/O (network,
  filesystem, child process) MUST wrap the call in try/catch and log the error.
