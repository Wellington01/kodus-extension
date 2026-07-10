# Repository guidance (root CLAUDE.md)

<!-- Baseline: a single root CLAUDE.md always worked. Here to contrast with the
     nested files below (bug: only one CLAUDE.md was read, no nested traversal). -->

- **ROOT-CLAUDE-marker**: prefer `const` over `let` for bindings that are never
  reassigned. This rule applies repository-wide.
