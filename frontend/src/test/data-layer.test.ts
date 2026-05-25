import { describe, it, expect } from 'vitest';
import { dataLayerTestUtils } from '@/lib/data-layer';

describe('data-layer normalizers', () => {
  it('normalizeTask maps _id to id', () => {
    const task = dataLayerTestUtils.normalizeTask({
      _id: '507f1f77bcf86cd799439011',
      title: 'Test',
      status: 'todo',
      priority: 'medium',
    });
    expect(task.id).toBe('507f1f77bcf86cd799439011');
    expect(task.importance).toBe(3);
  });

  it('normalizeGoal maps milestones and links', () => {
    const goal = dataLayerTestUtils.normalizeGoal({
      _id: '507f1f77bcf86cd799439012',
      title: 'Run 5k',
      progress: 50,
      milestones: [{ _id: '507f1f77bcf86cd799439013', title: 'Week 1', completed: true }],
      linkedTaskIds: ['507f1f77bcf86cd799439011'],
    });
    expect(goal.id).toBe('507f1f77bcf86cd799439012');
    expect(goal.milestones[0].id).toBe('507f1f77bcf86cd799439013');
    expect(goal.linkedTaskIds[0]).toBe('507f1f77bcf86cd799439011');
  });

  it('normalizeNote sets defaults', () => {
    const note = dataLayerTestUtils.normalizeNote({
      _id: '507f1f77bcf86cd799439014',
      title: 'Ideas',
      content: '<p>Hello</p>',
    });
    expect(note.id).toBe('507f1f77bcf86cd799439014');
    expect(note.pinned).toBe(false);
    expect(note.tags).toEqual([]);
  });
});
