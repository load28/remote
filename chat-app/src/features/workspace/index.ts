// A-07: barrel file — FSD: entities에서 re-export
// P-06: named export만

export { WorkspaceSwitcher, useWorkspaces, selectedWorkspaceIdAtom, selectWorkspaceAtom, WORKSPACE_QUERY_KEY } from '@/entities/workspace';
export type { Workspace, WorkspaceSwitcherProps } from '@/entities/workspace';
