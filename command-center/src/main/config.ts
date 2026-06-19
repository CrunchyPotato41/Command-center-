import path from 'path'
import fs from 'fs'
import { app } from 'electron'

function resolveProjectRoot(): string {
  let root = process.env.PROJECT_ROOT

  if (!root) {
    const envPath = path.join(app.getAppPath(), '.env')
    try {
      const text = fs.readFileSync(envPath, 'utf-8')
      const match = text.match(/^PROJECT_ROOT=(.+)$/m)
      if (match) root = match[1].trim()
    } catch { /* .env not present */ }
  }

  if (!root) {
    throw new Error(
      'PROJECT_ROOT is not set.\n' +
      'Create a .env file next to the app with:\n' +
      '  PROJECT_ROOT=C:/path/to/your/project'
    )
  }

  return path.normalize(path.resolve(root))
}

export const PROJECT_ROOT = resolveProjectRoot()
export const TRACKER_PATH = path.join(PROJECT_ROOT, 'project-tracker.json')
