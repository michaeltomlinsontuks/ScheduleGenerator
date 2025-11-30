/**
 * Workflow Guard Hook - Navigation protection for workflow pages
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * This hook guards workflow pages and redirects users if they don't have
 * the required state to access a particular page in the workflow.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEventStore } from '@/stores/eventStore';

export type WorkflowPage = 'preview' | 'customize' | 'generate';

interface WorkflowRequirements {
  preview: () => boolean;
  customize: () => boolean;
  generate: () => boolean;
}

/**
 * Hook to guard workflow pages and redirect if requirements not met
 * 
 * @param page - The workflow page being guarded ('preview', 'customize', or 'generate')
 * 
 * @example
 * ```tsx
 * // In preview page
 * export default function PreviewPage() {
 *   useWorkflowGuard('preview');
 *   // ... rest of component
 * }
 * ```
 */
export function useWorkflowGuard(page: WorkflowPage) {
  const router = useRouter();
  const events = useEventStore((state) => state.events);
  const selectedIds = useEventStore((state) => state.selectedIds);

  useEffect(() => {
    // Define requirements for each workflow page
    const requirements: WorkflowRequirements = {
      // Preview page requires events to be loaded
      preview: () => events.length > 0,
      
      // Customize page requires events AND at least one selected event
      customize: () => events.length > 0 && selectedIds.size > 0,
      
      // Generate page requires events AND at least one selected event
      generate: () => events.length > 0 && selectedIds.size > 0,
    };

    // Define where to redirect if requirements not met
    const redirects: Record<WorkflowPage, string> = {
      preview: '/upload',      // No events -> go to upload
      customize: '/preview',   // No selections -> go to preview
      generate: '/customize',  // No selections -> go to customize
    };

    // Check if current page requirements are met
    if (!requirements[page]()) {
      console.log(
        `Workflow guard: redirecting from ${page} to ${redirects[page]}`,
        { 
          eventsCount: events.length, 
          selectedCount: selectedIds.size 
        }
      );
      router.push(redirects[page]);
    }
  }, [page, events.length, selectedIds.size, router]);
}
