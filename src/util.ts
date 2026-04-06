export const isTauriEnv = () => window.isTauri

export function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, name: string) => {
    const key = name.trim()
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key]! : match
  })
}
