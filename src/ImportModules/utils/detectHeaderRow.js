import { scoreHeaders } from './columnMapper.js'

export function detectHeaderRow(matrix, options = {}) {
  let bestIndex = 0
  let bestScore = -1

  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
    const row = matrix[rowIndex]
    const nonEmpty = row.filter((cell) => String(cell || '').trim()).length
    if (!nonEmpty) continue
    const score = scoreHeaders(row, options.preferredFields) + Math.min(nonEmpty, 12) / 20

    if (score > bestScore) {
      bestScore = score
      bestIndex = rowIndex
    }
  }

  return bestIndex
}

export default detectHeaderRow
