import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock getStorageAdapter before importing the store
// We need to do this because the store initialization uses it immediately
vi.mock('@/utils/storage', () => ({
    getStorageAdapter: vi.fn(() => ({
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    })),
}));

describe('ConfigStore Environment Variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.clearAllMocks();
    });

    it('should initialize with default null values when no env vars are present', async () => {
        delete process.env.NEXT_PUBLIC_SEMESTER_START_DATE;
        delete process.env.NEXT_PUBLIC_SEMESTER_END_DATE;

        const { useConfigStore } = await import('./configStore');
        const store = useConfigStore.getState();

        // Reset store to ensure clean state
        store.reset();

        expect(store.semesterStart).toBeNull();
        expect(store.semesterEnd).toBeNull();
    });

    it('should initialize with environment variable values', async () => {
        process.env.NEXT_PUBLIC_SEMESTER_START_DATE = '2024-02-12';
        process.env.NEXT_PUBLIC_SEMESTER_END_DATE = '2024-05-31';

        const { useConfigStore } = await import('./configStore');
        // We need to re-create the store to pick up the new env vars which run at module level
        // However, since Zustand stores are singletons, we rely on the fact that we resetModules()
        // and re-imported the module.

        const store = useConfigStore.getState();

        // The initialState is evaluated at module load time. 
        // Since we resetModules(), the module code re-runs with the new process.env

        // Note: persistence might interfere if not mocked correctly, but we mocked getStorageAdapter to return null

        expect(store.semesterStart).toEqual(new Date('2024-02-12'));
        expect(store.semesterEnd).toEqual(new Date('2024-05-31'));
    });

    it('should handle invalid date strings gracefully', async () => {
        process.env.NEXT_PUBLIC_SEMESTER_START_DATE = 'invalid-date';

        const { useConfigStore } = await import('./configStore');
        const store = useConfigStore.getState();

        expect(store.semesterStart).toBeNull();
    });
});
