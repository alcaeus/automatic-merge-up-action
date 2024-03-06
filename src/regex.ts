export function escapeRegex(regex: string): string {
  // Shamelessly copied from https://stackoverflow.com/a/6969486
  return regex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function createRegexFromPattern(pattern: string): RegExp {
  return new RegExp(
    `^${escapeRegex(pattern)
      .replace('<major>', '([0-9]+)')
      .replace('<minor>', '([0-9]+)')}$`
  )
}
