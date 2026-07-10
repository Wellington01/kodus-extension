# Webview guidance (nested, LOWERCASE filename)

<!-- Bug #5: matching was case-sensitive on the PR-sync path, so a lowercase
     `claude.md` synced on full sync but not on PR merge. After the fix both
     paths are case-insensitive — this file must be detected either way and
     scoped to `src/webview/**`. -->

- **WEBVIEW-CLAUDE-lowercase-marker**: webview message handlers MUST validate the
  incoming message `type` before dispatching to a handler.
