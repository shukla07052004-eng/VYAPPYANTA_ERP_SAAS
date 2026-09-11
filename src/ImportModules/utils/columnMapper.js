import { FIELD_ALIASES, FIELD_ALIAS_GROUPS, MARG_ERP_FIELD_MAP } from '../constants.js'

/**
 * Normalize a spreadsheet header into a lookup token.
 * @param {string} header
 */
export function normalizeHeaderKey(header = '') {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[%]/g, 'percent')
    .replace(/[^a-z0-9]+/g, '')
}

/**
 * Resolve a raw header to a standard ERP field name with confidence metadata.
 * @param {string} header
 */
export function matchHeaderToField(header = '') {
  const trimmed = String(header).trim()
  if (MARG_ERP_FIELD_MAP[trimmed]) {
    return { field: MARG_ERP_FIELD_MAP[trimmed], confidence: 1, strategy: 'profile', header: trimmed }
  }

  const normalized = normalizeHeaderKey(trimmed)
  if (FIELD_ALIASES[normalized]) {
    return { field: FIELD_ALIASES[normalized], confidence: 1, strategy: 'alias', header: trimmed }
  }

  const fuzzy = findFuzzyAlias(normalized)
  if (fuzzy) return { ...fuzzy, header: trimmed }

  return { field: null, confidence: 0, strategy: 'unmapped', header: trimmed }
}

export function mapHeaderToField(header = '') {
  return matchHeaderToField(header).field
}

/**
 * Build a column index map from spreadsheet headers.
 * @param {string[]} headers
 * @returns {{ mapping: Record<number, string>, unmapped: string[] }}
 */
export function buildColumnMapping(headers = []) {
  const mapping = {}
  const details = {}
  const unmapped = []
  const lowConfidence = []

  headers.forEach((header, index) => {
    const match = matchHeaderToField(header)
    const field = match.field
    if (field) {
      if (mapping[field] === undefined || match.confidence > (details[field]?.confidence || 0)) {
        mapping[field] = index
        details[field] = { ...match, index }
      }
      if (match.confidence < 0.82) lowConfidence.push({ ...match, index })
    } else if (String(header || '').trim()) {
      unmapped.push(String(header).trim())
    }
  })

  return { mapping, unmapped, details, lowConfidence }
}

/**
 * Convert a raw row object keyed by original headers into a mapped object.
 * @param {Record<string, unknown>} row
 * @param {Record<string, number>} fieldToIndex - inverted mapping field -> column index
 * @param {string[]} headers
 */
export function mapRowByHeaders(row, headers) {
  const { mapping } = buildColumnMapping(headers)
  const mapped = {}

  Object.entries(mapping).forEach(([field, index]) => {
    const header = headers[index]
    mapped[field] = row[header] ?? row[index] ?? row[String(index)] ?? null
  })

  return mapped
}

/**
 * Map array-of-arrays row using column mapping.
 * @param {unknown[]} row
 * @param {Record<string, number>} mapping - field -> column index
 */
export function mapRowByIndex(row = [], mapping = {}) {
  const mapped = {}
  Object.entries(mapping).forEach(([field, index]) => {
    mapped[field] = row[index] ?? null
  })
  return mapped
}

export function invertColumnMapping(columnMapping) {
  return columnMapping
}

export function getMappedFields(columnMapping) {
  return Object.keys(columnMapping)
}

export function scoreHeaders(headers = [], preferredFields = []) {
  const { mapping, details } = buildColumnMapping(headers)
  const mappedFields = Object.keys(mapping)
  const preferred = preferredFields.filter((field) => mapping[field] !== undefined).length
  const confidence = Object.values(details).reduce((sum, detail) => sum + (detail.confidence || 0), 0)
  return mappedFields.length + preferred * 2 + confidence
}

function findFuzzyAlias(normalizedHeader) {
  if (!normalizedHeader || normalizedHeader.length < 4) return null

  let best = null
  Object.entries(FIELD_ALIAS_GROUPS).forEach(([field, aliases]) => {
    aliases.forEach((alias) => {
      const aliasKey = normalizeHeaderKey(alias)
      if (!aliasKey || aliasKey.length < 4) return

      const contains = normalizedHeader.includes(aliasKey) || aliasKey.includes(normalizedHeader)
      if (!contains) return
      if (field === 'expiryDate' && /^expiry(in|out)$/.test(normalizedHeader)) return

      const ratio = Math.min(normalizedHeader.length, aliasKey.length) / Math.max(normalizedHeader.length, aliasKey.length)
      const confidence = Math.max(0.7, Math.min(0.9, ratio))
      if (!best || confidence > best.confidence) {
        best = { field, confidence, strategy: 'fuzzy-alias' }
      }
    })
  })

  return best
}
