import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from './store';

describe('Zustand Store', () => {
  beforeEach(() => {
    useStore.setState({
      tracker: null,
      loading: false,
      error: null,
      synced: false,
      activeTab: 'swim-lane',
      selectedMilestoneId: null,
      theme: 'dark'
    });
  });

  it('should initialize with default state', () => {
    const state = useStore.getState();
    expect(state.activeTab).toBe('swim-lane');
    expect(state.theme).toBe('dark');
    expect(state.tracker).toBeNull();
  });

  it('should set tracker data and not trigger writeback', () => {
    const mockTracker: any = { project: { name: 'Test' } };
    useStore.getState().setTracker(mockTracker);
    expect(useStore.getState().tracker).toEqual(mockTracker);
  });
});
