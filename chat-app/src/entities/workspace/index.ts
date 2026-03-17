// A-07: barrel file public API만 노출, P-06: named export만
export { WorkspaceSwitcher } from './ui/WorkspaceSwitcher';
export type { WorkspaceSwitcherProps } from './ui/WorkspaceSwitcher';
export { useWorkspaces, WORKSPACE_QUERY_KEY } from './model/useWorkspaces';
export { selectedWorkspaceIdAtom, selectWorkspaceAtom } from './model/workspaceAtoms';
export type { Workspace } from './model/types';
