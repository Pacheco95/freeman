import { open } from '@tauri-apps/plugin-dialog'
import { mkdir, readDir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import type { TabState } from '@/types/misc.ts'

export type WorkspaceData = {
  tabs: TabState[]
  activeTabId: number
  nextTabId: number
}

type WorkspaceMeta = {
  version: number
  activeTabId: number
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'request'
}

export async function saveWorkspace(tabs: TabState[], activeTabId: number): Promise<boolean> {
  const dir = await open({ directory: true, title: 'Select Workspace Folder' })
  if (dir === null) return false

  const requestsDir = await join(dir, 'requests')
  await mkdir(requestsDir, { recursive: true })

  const meta: WorkspaceMeta = { version: 1, activeTabId }
  await writeTextFile(await join(dir, 'workspace.json'), JSON.stringify(meta, null, 2))

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]!
    const filename = `${tab.id}-${sanitizeFilename(tab.label)}.json`
    await writeTextFile(await join(requestsDir, filename), JSON.stringify(tab, null, 2))
  }

  return true
}

export async function loadWorkspace(): Promise<WorkspaceData | null> {
  const dir = await open({ directory: true, title: 'Open Workspace Folder' })
  if (dir === null) return null

  const meta = JSON.parse(await readTextFile(await join(dir, 'workspace.json'))) as WorkspaceMeta

  const requestsDir = await join(dir, 'requests')
  const entries = await readDir(requestsDir)

  const tabs: TabState[] = []
  for (const entry of entries) {
    if (entry.name.endsWith('.json')) {
      const content = await readTextFile(await join(requestsDir, entry.name))
      tabs.push(JSON.parse(content) as TabState)
    }
  }

  tabs.sort((a, b) => a.id - b.id)
  const nextTabId = tabs.length > 0 ? Math.max(...tabs.map((t) => t.id)) + 1 : 1

  return { tabs, activeTabId: meta.activeTabId, nextTabId }
}
