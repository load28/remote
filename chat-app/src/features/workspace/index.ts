// A-07: barrel file public API만 노출, P-06: named export만
export { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
export { useWorkspaces, WORKSPACE_QUERY_KEY } from './hooks/useWorkspaces';
export { useWorkspaceStore } from './hooks/useWorkspaceStore';
export type { Workspace } from './types';
