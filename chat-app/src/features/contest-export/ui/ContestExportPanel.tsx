// C-07: SRP — 대회 export 포맷 선택 + 다운로드 패널
// C-04: props 4개 (flat 전략)

import { useState } from 'react';
import type { ContestExportData, ExportFormat } from '../model/types';
import {
  formatContestExport,
  buildExportFileName,
  getExportMimeType,
} from '../model/contestExportRules';

// ✅ T-13: named exported interface
export interface ContestExportPanelProps {
  channelName: string;
  exportData: ContestExportData | null;
  isLoading: boolean;
  onClose: () => void;
}

// ✅ P-03: 모듈 레벨 상수
const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'markdown', label: 'Markdown' },
];

export function ContestExportPanel({
  channelName,
  exportData,
  isLoading,
  onClose,
}: ContestExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');

  // 파생값: 직접 계산 (S-02, S-03)
  const messageCount = exportData?.messages.length ?? 0;
  const threadCount = exportData?.threads.length ?? 0;
  const planCount = exportData?.plans.length ?? 0;

  // ✅ N-03: 내부 handle*
  const handleDownload = () => {
    if (!exportData) return;

    const content = formatContestExport(exportData, selectedFormat);
    const blob = new Blob([content], { type: getExportMimeType(selectedFormat) });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = buildExportFileName(channelName, selectedFormat);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-80 border-l border-gray-200 flex flex-col bg-white" aria-label="대회 Export">
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">대회 Export</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Export 패널 닫기"
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
          </div>
        ) : null}

        {!isLoading && exportData ? (
          <div className="space-y-4">
            <section>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Export 요약</h3>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <dt className="text-xs text-gray-500">메시지</dt>
                  <dd className="text-lg font-semibold text-gray-800">{messageCount}</dd>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <dt className="text-xs text-gray-500">스레드</dt>
                  <dd className="text-lg font-semibold text-gray-800">{threadCount}</dd>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <dt className="text-xs text-gray-500">플랜</dt>
                  <dd className="text-lg font-semibold text-gray-800">{planCount}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="text-sm font-medium text-gray-700 mb-2">포맷 선택</h3>
              <fieldset className="space-y-1">
                <legend className="sr-only">Export 포맷</legend>
                {FORMAT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={option.value}
                      checked={selectedFormat === option.value}
                      onChange={() => setSelectedFormat(option.value)}
                      className="text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </fieldset>
            </section>
          </div>
        ) : null}

        {!isLoading && !exportData ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-400">Export 데이터가 없습니다.</p>
          </div>
        ) : null}
      </div>

      <footer className="px-4 py-3 border-t border-gray-200">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading || !exportData}
          className="w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다운로드
        </button>
      </footer>
    </aside>
  );
}
