import { open } from '@tauri-apps/plugin-dialog'
import { mkdir, readDir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import type { TabState } from '@/types/misc.ts'

export type WorkspaceData = {
  name: string
  requests: TabState[]
  openRequestIds: number[]
  activeRequestId: number
  nextRequestId: number
}

type WorkspaceMeta = {
  version: number
  name: string
  openRequestIds: number[]
  activeRequestId: number
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'request'
}

export async function saveWorkspace(
  requests: TabState[],
  openRequestIds: number[],
  activeRequestId: number,
  name: string,
): Promise<boolean> {
  const dir = await open({ directory: true, title: 'Select Workspace Folder' })
  if (dir === null) return false

  const requestsDir = await join(dir, 'requests')
  await mkdir(requestsDir, { recursive: true })

  const meta: WorkspaceMeta = { version: 2, name, openRequestIds, activeRequestId }
  await writeTextFile(await join(dir, 'workspace.json'), JSON.stringify(meta, null, 2))

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]!
    const filename = `${request.id}-${sanitizeFilename(request.label)}.json`
    await writeTextFile(await join(requestsDir, filename), JSON.stringify(request, null, 2))
  }

  return true
}

export async function loadWorkspace(): Promise<WorkspaceData | null> {
  const dir = await open({ directory: true, title: 'Open Workspace Folder' })
  if (dir === null) return null

  const meta = JSON.parse(await readTextFile(await join(dir, 'workspace.json'))) as WorkspaceMeta

  const requestsDir = await join(dir, 'requests')
  const entries = await readDir(requestsDir)

  const requests: TabState[] = []
  for (const entry of entries) {
    if (entry.name.endsWith('.json')) {
      const content = await readTextFile(await join(requestsDir, entry.name))
      requests.push(JSON.parse(content) as TabState)
    }
  }

  requests.sort((a, b) => a.id - b.id)
  const nextRequestId = requests.length > 0 ? Math.max(...requests.map((r) => r.id)) + 1 : 1

  // Handle v1 workspaces (only had tabs, no openRequestIds)
  const openRequestIds = meta.openRequestIds ?? requests.map((r) => r.id)
  const activeRequestId = meta.activeRequestId ?? requests[0]?.id ?? 1

  return {
    name: meta.name ?? 'Imported Workspace',
    requests,
    openRequestIds,
    activeRequestId,
    nextRequestId,
  }
}
