// A-07: barrel file — FSD: entities에서 re-export
// P-06: named export만

export { WorkspaceSwitcher, useWorkspaces, useWorkspaceStore, WORKSPACE_QUERY_KEY } from '@/entities/workspace';
export type { Workspace, WorkspaceSwitcherProps, WorkspaceStoreState, WorkspaceStoreActions } from '@/entities/workspace';
