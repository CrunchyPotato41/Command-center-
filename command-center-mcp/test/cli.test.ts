import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleTool } from '../src/tools.js';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI Handlers', () => {
  const testTrackerPath = path.join(process.cwd(), '..', 'project-tracker.json');
  let originalTrackerContent: string;

  beforeEach(() => {
    // Backup original tracker
    if (fs.existsSync(testTrackerPath)) {
      originalTrackerContent = fs.readFileSync(testTrackerPath, 'utf8');
    }
  });

  afterEach(() => {
    // Restore original tracker
    if (originalTrackerContent !== undefined) {
      fs.writeFileSync(testTrackerPath, originalTrackerContent, 'utf8');
    }
  });

  it('should return project status successfully', () => {
    const result = handleTool('get_project_status', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('Project Status:');
  });

  it('should create a milestone successfully', () => {
    const milestoneId = `test_milestone_${Date.now()}`;
    const result = handleTool('create_milestone', { id: milestoneId, title: 'Test Milestone' });
    
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('created');
    
    // Verify it was written to the tracker
    const content = JSON.parse(fs.readFileSync(testTrackerPath, 'utf8'));
    const milestone = content.milestones.find((m: any) => m.id === milestoneId);
    expect(milestone).toBeDefined();
    expect(milestone.title).toBe('Test Milestone');
  });
});
