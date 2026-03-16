// C-07: SRP — 워크스페이스 전환만 담당
// N-03: on/handle 이벤트 네이밍, T-11: 시맨틱 HTML

import type { Workspace } from '../model/types';

// T-13: named exported interface
export interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (workspaceId: string) => void; // N-03: on 접두사
}

// P-03: 모듈 레벨 상수
const ICON_SIZE = 'w-10 h-10';

// C-10: 파일당 1 exported 컴포넌트
export function WorkspaceSwitcher({
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace,
}: WorkspaceSwitcherProps) {
  // N-03: handle 접두사
  const handleWorkspaceClick = (workspaceId: string) => {
    onSelectWorkspace(workspaceId);
  };

  return (
    // T-11: 시맨틱 HTML
    <nav aria-label="워크스페이스 목록" className="flex flex-col items-center gap-2 py-3 px-2 border-b border-gray-700">
      {workspaces.map((workspace) => {
        const isSelected = workspace.id === selectedWorkspaceId; // N-04: is 접두사
        return (
          <button
            key={workspace.id}
            type="button"
            onClick={() => handleWorkspaceClick(workspace.id)}
            className={`${ICON_SIZE} rounded-lg overflow-hidden flex items-center justify-center text-sm font-bold transition-all ${
              isSelected
                ? 'ring-2 ring-white rounded-xl'
                : 'opacity-60 hover:opacity-100 hover:rounded-xl'
            }`}
            aria-current={isSelected ? 'page' : undefined}
            aria-label={workspace.name}
            title={workspace.name}
          >
            <img
              src={workspace.iconUrl}
              alt=""
              className={`${ICON_SIZE} object-cover`}
            />
          </button>
        );
      })}
    </nav>
  );
}
