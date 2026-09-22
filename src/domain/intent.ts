import type { CandidateScope, ParsedIntent, ProtectedScope } from '../contracts'

const DECIMAL_MB = 1_000_000
const DECIMAL_GB = 1_000_000_000

interface AliasMatch<T> {
  value: T
  index: number
  text: string
}

const candidateAliases: ReadonlyArray<readonly [CandidateScope, RegExp]> = [
  ['exact_duplicates', /\b(?:exact\s+)?duplicates?\b/gi],
  ['semester_1', /\b(?:semester\s*(?:1|one)|sem\s*1|first\s+semester)\b/gi],
  ['old_downloads', /\b(?:old|older)\s+downloads?\b/gi],
]

const protectedAliases: ReadonlyArray<readonly [ProtectedScope, RegExp]> = [
  ['semester_2', /\b(?:semester\s*(?:2|two)|sem\s*2|second\s+semester)\b/gi],
  ['camera', /\b(?:dcim(?:\s*\/\s*camera)?|camera(?:\s+photos?)?)\b/gi],
]

const targetPattern = /\b(?:free|clear|reclaim|recover)?\s*(?:at\s+least|minimum\s+of|minimum|>=|≥)?\s*(\d+(?:\.\d+)?)\s*(gb|mb)\b/i
const unsafeNegationPattern = /\b(?:no|not|never|without|exclude|excluding|skip|avoid|don['’]?t|do\s+not)\b/i
const protectionPattern = /\b(?:keep|protect|preserve|retain|save|don['’]?t\s+(?:touch|delete|remove)|do\s+not\s+(?:touch|delete|remove))\b/i
const unsupportedProtectionNegationPattern = /\b(?:don['’]?t|do\s+not|not|never)\s+(?:keep|protect|preserve|retain|save)\b/i
const cleanupPattern = /\b(?:clean(?:\s*up)?|remove|delete|start\s+with|prioriti[sz]e|include|find)\b/i

const ignoredWords = new Set([
  'a', 'an', 'and', 'at', 'but', 'clean', 'cleanup', 'clear', 'delete', 'exact', 'file', 'files',
  'find', 'free', 'from', 'gb', 'include', 'keep', 'least', 'material', 'mb', 'my', 'of',
  'photo', 'photos', 'please', 'prioritize', 'prioritise', 'reclaim', 'recover', 'remove',
  'only', 'or', 'space', 'start', 'storage', 'the', 'then', 'with',
])

function collectMatches<T>(request: string, aliases: ReadonlyArray<readonly [T, RegExp]>): AliasMatch<T>[] {
  const matches: AliasMatch<T>[] = []

  for (const [value, pattern] of aliases) {
    pattern.lastIndex = 0
    for (const match of request.matchAll(pattern)) {
      matches.push({ value, index: match.index ?? 0, text: match[0] })
    }
  }

  return matches.sort((left, right) => left.index - right.index)
}

function clauseAt(request: string, index: number): string {
  const clauseStart = Math.max(
    request.lastIndexOf('.', index - 1),
    request.lastIndexOf(',', index - 1),
    request.lastIndexOf(';', index - 1),
    request.lastIndexOf('!', index - 1),
    request.lastIndexOf('?', index - 1),
  ) + 1
  const ends = ['.', ',', ';', '!', '?']
    .map((separator) => request.indexOf(separator, index))
    .filter((end) => end >= 0)
  const clauseEnd = ends.length > 0 ? Math.min(...ends) : request.length
  return request.slice(clauseStart, clauseEnd).trim()
}

function uniqueInOrder<T>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index)
}

function targetFromRequest(request: string, unresolvedTerms: string[]): number | null {
  const match = targetPattern.exec(request)
  if (!match) return null

  const clause = clauseAt(request, match.index)
  const beforeTarget = clause.slice(0, Math.max(0, clause.indexOf(match[0])))
  const unsupportedComparison = /\b(?:under|over|less\s+than|more\s+than|at\s+most|no\s+more\s+than|max(?:imum)?)\b/i
  if (unsafeNegationPattern.test(beforeTarget) || unsupportedComparison.test(beforeTarget)) {
    unresolvedTerms.push(clause)
    return null
  }

  const amount = Number(match[1])
  if (!Number.isFinite(amount) || amount <= 0) {
    unresolvedTerms.push(match[0])
    return null
  }

  const multiplier = match[2].toLowerCase() === 'gb' ? DECIMAL_GB : DECIMAL_MB
  return Math.round(amount * multiplier)
}

function unsupportedRemainder(request: string): string | null {
  let remainder = request.toLowerCase()
  remainder = remainder.replace(targetPattern, ' ')
  remainder = remainder.replace(
    /\b(?:keep|protect|preserve|retain|save|don['’]?t\s+(?:touch|delete|remove)|do\s+not\s+(?:touch|delete|remove))\b/gi,
    ' ',
  )
  for (const [, pattern] of [...candidateAliases, ...protectedAliases]) {
    pattern.lastIndex = 0
    remainder = remainder.replace(pattern, ' ')
  }

  const words = remainder
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !ignoredWords.has(word))

  return words.length > 0 ? words.join(' ') : null
}

/**
 * Interprets only the small, disclosed language surface supported by the demo.
 * Unknown or negated scopes are reported for review instead of becoming actions.
 */
export function parseIntent(request: string): ParsedIntent {
  const originalRequest = request
  const trimmedRequest = request.trim()
  const unresolvedTerms: string[] = []
  const targetBytes = targetFromRequest(trimmedRequest, unresolvedTerms)

  const priorities: CandidateScope[] = []
  for (const match of collectMatches(trimmedRequest, candidateAliases)) {
    const clause = clauseAt(trimmedRequest, match.index)
    const isProtectionRequest = protectionPattern.test(clause)
    const isNegated = unsafeNegationPattern.test(clause)

    if (isProtectionRequest || isNegated) {
      unresolvedTerms.push(clause || match.text)
      continue
    }

    const containsTarget = targetPattern.test(clause)
    if (cleanupPattern.test(clause) || containsTarget || unsupportedRemainder(clause) === null) {
      priorities.push(match.value)
    } else {
      unresolvedTerms.push(clause || match.text)
    }
  }

  const protectedScopes: ProtectedScope[] = []
  for (const match of collectMatches(trimmedRequest, protectedAliases)) {
    const clause = clauseAt(trimmedRequest, match.index)
    if (unsupportedProtectionNegationPattern.test(clause)) {
      unresolvedTerms.push(clause || match.text)
      continue
    }

    if (protectionPattern.test(clause)) {
      protectedScopes.push(match.value)
    } else {
      unresolvedTerms.push(clause || match.text)
    }
  }

  const remainder = unsupportedRemainder(trimmedRequest)
  if (remainder) unresolvedTerms.push(remainder)

  if (trimmedRequest && targetBytes === null && priorities.length === 0 && protectedScopes.length === 0) {
    unresolvedTerms.push(trimmedRequest)
  }

  return {
    originalRequest,
    targetBytes,
    protectedScopes: uniqueInOrder(protectedScopes),
    priorities: uniqueInOrder(priorities),
    unresolvedTerms: uniqueInOrder(unresolvedTerms.filter(Boolean)),
    source: 'demo-parser',
  }
}
