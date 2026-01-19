import * as vscode from 'vscode';

/**
 * Git extension API types based on vscode.git extension
 * These types define the structure of the Git extension API
 */

export interface GitExtension {
  readonly enabled: boolean;
  readonly onDidChangeEnablement: vscode.Event<boolean>;
  getAPI(version: number): API;
}

export interface API {
  readonly repositories: Repository[];
  getRepository(uri: vscode.Uri): Repository | null;
  getRepositoryFromUri(uri: vscode.Uri): Repository | null;
  getRepositoryFromPath(path: string): Repository | null;
  getState(): State;
  onDidChangeState(e: State): void;
  onDidOpenRepository(repository: Repository): void;
  onDidCloseRepository(repository: Repository): void;
}

export interface Repository {
  readonly rootUri: vscode.Uri;
  readonly inputBox: InputBox;
  readonly state: RepositoryState;
  readonly sourceControl: SourceControl;
  readonly operations: Operations;
  readonly mergeGroup: SourceControlResourceGroup;
  readonly indexGroup: SourceControlResourceGroup;
  readonly workingTreeGroup: SourceControlResourceGroup;
}

export interface RepositoryState {
  readonly HEAD: Branch | undefined;
  readonly refs: Ref[];
  readonly remotes: Remote[];
  readonly submodules: Submodule[];
  readonly rebaseCommit: Commit | undefined;
  readonly mergeChanges: Resource[];
  readonly indexChanges: Resource[];
  readonly workingTreeChanges: Resource[];
  readonly onDidChange: vscode.Event<void>;
}

export interface Branch {
  readonly name?: string;
  readonly commit?: string;
  readonly type: RefType;
  readonly remote?: string;
  readonly ahead?: number;
  readonly behind?: number;
}

export interface Ref {
  readonly type: RefType;
  readonly name?: string;
  readonly commit?: string;
}

export enum RefType {
  Head = 0,
  RemoteHead = 1,
  Tag = 2,
}

export interface Remote {
  readonly name: string;
  readonly fetchUrl?: string;
  readonly pushUrl?: string;
  readonly isReadOnly: boolean;
}

export interface Submodule {
  readonly name: string;
  readonly path: string;
  readonly url: string;
}

export interface Resource {
  readonly resourceUri: vscode.Uri;
  readonly type: ResourceType;
  readonly originalResourceUri?: vscode.Uri;
  readonly renameResourceUri?: vscode.Uri;
}

export enum ResourceType {
  File = 0,
  Directory = 1,
}

export interface InputBox {
  value: string;
  onDidChange: vscode.Event<string>;
}

export interface SourceControl {
  readonly id: string;
  readonly label: string;
  readonly rootUri?: vscode.Uri;
  readonly inputBox: InputBox;
  readonly count: number;
  readonly selected: boolean;
  readonly onDidChangeSelection: vscode.Event<boolean>;
}

export interface SourceControlResourceGroup {
  readonly id: string;
  readonly label: string;
  readonly resourceStates: Resource[];
  readonly hideWhenEmpty?: boolean;
  readonly onDidChangeResourceStates: vscode.Event<void>;
}

export interface Operations {
  readonly onDidStartOperation: vscode.Event<Operation>;
  readonly onDidEndOperation: vscode.Event<Operation>;
}

export interface Operation {
  readonly operation: OperationType;
  readonly repository: Repository;
}

export enum OperationType {
  Checkout = 0,
  Fetch = 1,
  Pull = 2,
  Push = 3,
  Sync = 4,
}

export interface Commit {
  readonly hash: string;
  readonly message: string;
  readonly parents: string[];
  readonly authorDate?: Date;
  readonly authorName?: string;
  readonly authorEmail?: string;
  readonly commitDate?: Date;
}

export interface State {
  readonly enabled: boolean;
  readonly onDidChange: vscode.Event<void>;
}
