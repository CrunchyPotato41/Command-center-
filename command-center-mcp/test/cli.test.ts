import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleTool } from '../src/tools.js';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI Handlers', () => {
  let tempDir: string;
  let originalProjectRoot: string | undefined;

  beforeEach(() => {
    originalProjectRoot = process.env.PROJECT_ROOT;
    tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-'));
    process.env.PROJECT_ROOT = tempDir;
    
    // Copy real project-tracker if it exists, otherwise create empty one
    const realTrackerPath = path.join(process.cwd(), '..', 'project-tracker.json');
    if (fs.existsSync(realTrackerPath)) {
       fs.copyFileSync(realTrackerPath, path.join(tempDir, 'project-tracker.json'));
    } else {
       fs.writeFileSync(path.join(tempDir, 'project-tracker.json'), JSON.stringify({ milestones: [], project: {}, agents: [], agent_log: [] }));
    }
  });

  afterEach(() => {
    process.env.PROJECT_ROOT = originalProjectRoot;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return project status successfully', async () => {
    const result = await handleTool('get_project_status', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('Project Status:');
  });

  it('should create a milestone successfully', async () => {
    const milestoneId = `test_milestone_${Date.now()}`;
    const result = await handleTool('create_milestone', { id: milestoneId, title: 'Test Milestone' });
    
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('created');
    
    // Verify it was written to the tracker
    const content = JSON.parse(fs.readFileSync(path.join(tempDir, 'project-tracker.json'), 'utf8'));
    const milestone = content.milestones.find((m: any) => m.id === milestoneId);
    expect(milestone).toBeDefined();
    expect(milestone.title).toBe('Test Milestone');
  });
});
