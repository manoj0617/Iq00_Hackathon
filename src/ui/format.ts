export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  const unitIndex = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1))
  const value = bytes / 1000 ** unitIndex
  const fractionDigits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2

  return `${value.toLocaleString(undefined, { maximumFractionDigits: fractionDigits })} ${units[unitIndex]}`
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
