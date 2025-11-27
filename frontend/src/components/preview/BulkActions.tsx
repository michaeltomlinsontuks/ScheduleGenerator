'use client';

import { Button } from '@/components/common';

export interface BulkActionsProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

/**
 * BulkActions - Select All / Deselect All buttons with count display
 * Requirements: 6.6, 6.7
 */
export function BulkActions({
  totalCount,
  selectedCount,
  onSelectAll,
  onDeselectAll,
}: BulkActionsProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const noneSelected = selectedCount === 0;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={allSelected}
        >
          Select All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          disabled={noneSelected}
        >
          Deselect All
        </Button>
      </div>
      
      <span className="text-sm text-base-content/70">
        {selectedCount} of {totalCount} selected
      </span>
    </div>
  );
}
