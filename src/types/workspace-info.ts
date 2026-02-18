/**
 * Types for workspace technical info
 */

export interface DiagnosticEntry {
  uri: string;
  fileName: string;
  diagnostics: Array<{
    message: string;
    severity: string;
    source?: string;
    code?: string | number;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
    relatedInformation?: Array<{
      message: string;
      location: { uri: string; range: unknown };
    }>;
  }>;
}

export interface GitRepositoryInfo {
  rootUri: string;
  state: unknown;
  head: unknown;
  remotes: unknown[];
  submodules: unknown[];
  refs: unknown[];
}

export interface TechnicalInfo {
  workspace: unknown;
  diagnostics: DiagnosticEntry[];
  activeEditor: unknown;
  languages: {
    installedLanguages: unknown[];
    languageExtensions: unknown[];
  };
  extensions: {
    totalExtensions: number;
    enabledExtensions: unknown[];
  };
  typescript: unknown;
  linters: {
    eslint: { isEnabled: boolean };
    prettier: { isEnabled: boolean };
  };
  build: unknown;
  git: { repositories: GitRepositoryInfo[] } | null;
  debug: unknown;
  performance: unknown;
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    vscodeVersion: string;
  };
}
