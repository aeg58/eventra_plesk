'use client';

import { useFilters } from '@/app/context/FilterContext';
import type { ViewMode } from '@/app/utils/helpers';

export default function ViewModeSelector() {
  const { viewMode, setViewMode } = useFilters();

  const modes: { value: ViewMode; label: string }[] = [
    { value: 'monthly', label: 'Aylık' },
    { value: '3month', label: '3 Aylık' },
    { value: 'yearly', label: 'Yıllık' },
  ];

  return (
    <div className="flex gap-2">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setViewMode(mode.value)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === mode.value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}





