import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRecurringInstances } from '@/lib/recurrence';
import { dataLayer } from '@/lib/data-layer';

vi.mock('@/lib/data-layer', () => ({
  dataLayer: {
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
  },
}));

describe('generateRecurringInstances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates missing daily instance', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    vi.mocked(dataLayer.listTasks).mockResolvedValue([
      {
        id: 'parent1',
        title: 'Daily standup',
        status: 'todo',
        priority: 'medium',
        importance: 3,
        urgency: 3,
        effort: 3,
        energyRequired: 'medium',
        tags: [],
        dueDate: yesterdayStr,
        recurrence: { frequency: 'daily' },
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.mocked(dataLayer.createTask).mockResolvedValue({} as never);
    vi.mocked(dataLayer.updateTask).mockResolvedValue({} as never);

    const mutated = await generateRecurringInstances();
    expect(mutated).toBe(true);
    expect(dataLayer.createTask).toHaveBeenCalled();
  });
});
