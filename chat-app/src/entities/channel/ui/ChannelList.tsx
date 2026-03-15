// N-01: PascalCase, N-03: on/handle, C-10: 파일당 1 exported, T-11: 시맨틱 HTML

import type { Channel } from '../model/types';

// T-13: named exported interface
export interface ChannelListProps {
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void; // N-03: on 접두사
}

// N-01: PascalCase, C-10: 파일당 1 exported 컴포넌트
export function ChannelList({
  channels,
  selectedChannelId,
  onSelectChannel,
}: ChannelListProps) {
  // N-03: 내부 핸들러 handle 접두사
  const handleChannelClick = (channelId: string) => {
    onSelectChannel(channelId);
  };

  return (
    // T-11: 시맨틱 HTML
    <nav aria-label="채널 목록">
      <ul className="space-y-1">
        {channels.map((channel) => {
          const isSelected = channel.id === selectedChannelId; // N-04: is 접두사
          return (
            <li key={channel.id}>
              <button
                type="button"
                onClick={() => handleChannelClick(channel.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? 'bg-indigo-100 text-indigo-900 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={isSelected ? 'page' : undefined}
              >
                <span className="mr-2">{channel.isPrivate ? '🔒' : '#'}</span>
                {channel.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
