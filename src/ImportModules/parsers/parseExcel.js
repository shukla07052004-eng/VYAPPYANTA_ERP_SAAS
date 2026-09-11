import { buildColumnMapping } from '../utils/columnMapper.js'
import { isEmptyRow } from '../utils/dataCleaner.js'
import { detectHeaderRow } from '../utils/detectHeaderRow.js'
import { IMPORT_KIND_FIELDS } from '../constants.js'

/**
 * Parse Excel workbook buffer using XLSX.
 * @param {ArrayBuffer|Uint8Array|Buffer} buffer
 * @param {typeof import('xlsx')} XLSX
 * @param {{ sheetName?: string }} [options]
 */
export function parseExcelBuffer(buffer, XLSX, options = {}) {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    raw: false,
  })

  const sheetName = options.sheetName || selectSheetName(workbook, XLSX, options)
  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" not found in workbook.`)
  }

  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  if (!matrix.length) return { headers: [], rows: [], sheetName, columnMapping: { mapping: {}, unmapped: [] } }

  const headerRowIndex = detectHeaderRow(matrix, {
    preferredFields: getPreferredFields(options.importKind, sheetName),
  })

  const headers = matrix[headerRowIndex].map((cell, index) =>
    String(cell ?? '').trim() || `column_${index}`
  )
  const rows = []
  const supplements = buildDocumentSupplements(workbook, XLSX, sheetName, options)
  const selectedMapping = buildColumnMapping(headers).mapping

  for (let rowIndex = headerRowIndex + 1; rowIndex < matrix.length; rowIndex++) {
    const values = matrix[rowIndex] || []
    const row = {}
    headers.forEach((header, colIndex) => {
      row[header] = values[colIndex] ?? ''
    })
    const invoiceNo = getMappedValue(row, headers, selectedMapping, 'invoiceNo')
    if (invoiceNo && supplements.has(String(invoiceNo).trim().toLowerCase())) {
      Object.assign(row, supplements.get(String(invoiceNo).trim().toLowerCase()))
    }
    if (!isEmptyRow(row)) rows.push(row)
  }

  return {
    headers,
    rows,
    sheetName,
    headerRowIndex,
    columnMapping: buildColumnMapping(headers),
  }
}

function buildDocumentSupplements(workbook, XLSX, selectedSheetName, options = {}) {
  const importKind = options.importKind || 'complete'
  if (!['sales', 'purchases'].includes(importKind)) return new Map()

  const lookup = new Map()
  const preferredFields = [
    'invoiceNo',
    'partyName',
    'mobile',
    'gstin',
    'paymentStatus',
    'paymentMode',
    importKind === 'sales' ? 'receivedAmount' : 'paidAmount',
  ]

  ;(workbook.SheetNames || []).forEach((name) => {
    if (name === selectedSheetName) return
    const worksheet = workbook.Sheets[name]
    if (!worksheet) return
    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    })
    if (!matrix.length) return

    const headerRowIndex = detectHeaderRow(matrix, { preferredFields })
    const headers = (matrix[headerRowIndex] || []).map((cell, index) =>
      String(cell ?? '').trim() || `column_${index}`
    )
    const { mapping } = buildColumnMapping(headers)
    const paymentField = importKind === 'sales' ? 'receivedAmount' : 'paidAmount'
    if (mapping.invoiceNo === undefined || mapping[paymentField] === undefined) return

    for (let rowIndex = headerRowIndex + 1; rowIndex < matrix.length; rowIndex++) {
      const values = matrix[rowIndex] || []
      const row = {}
      headers.forEach((header, colIndex) => {
        row[header] = values[colIndex] ?? ''
      })
      if (isEmptyRow(row)) continue

      const invoiceNo = getMappedValue(row, headers, mapping, 'invoiceNo')
      if (!invoiceNo) continue

      const supplement = {
        mobile: getMappedValue(row, headers, mapping, 'mobile'),
        gstin: getMappedValue(row, headers, mapping, 'gstin'),
        paymentStatus: getMappedValue(row, headers, mapping, 'paymentStatus'),
        paymentMode: getMappedValue(row, headers, mapping, 'paymentMode'),
        [paymentField]: getMappedValue(row, headers, mapping, paymentField),
      }

      lookup.set(String(invoiceNo).trim().toLowerCase(), removeEmptyValues(supplement))
    }
  })

  return lookup
}

function getMappedValue(row, headers, mapping, field) {
  const index = mapping[field]
  if (index === undefined) return ''
  const header = headers[index]
  return row[header] ?? ''
}

function removeEmptyValues(value = {}) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue != null && String(fieldValue).trim() !== '')
  )
}

/**
 * Parse Excel File/Blob/Buffer.
 * @param {File|Blob|ArrayBuffer|Buffer} file
 * @param {typeof import('xlsx')} [XLSX]
 */
export async function parseExcel(file, XLSX) {
  let injectedXlsx = XLSX
  let options = {}
  if (XLSX && !XLSX.read && !XLSX.utils) {
    injectedXlsx = null
    options = XLSX
  }

  const xlsxModule = injectedXlsx || await import('xlsx')
  const xlsx = xlsxModule.default || xlsxModule
  const buffer = await readAsArrayBuffer(file)
  return parseExcelBuffer(buffer, xlsx, options)
}

async function readAsArrayBuffer(file) {
  if (file instanceof ArrayBuffer) return file
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(file)) {
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
  }
  if (file && typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  throw new Error('Unsupported Excel input type.')
}

export default parseExcel

function selectSheetName(workbook, XLSX, options = {}) {
  const names = workbook.SheetNames || []
  if (names.length <= 1) return names[0]

  const preferredFields = getPreferredFields(options.importKind)
  const scored = names.map((name) => {
    const worksheet = workbook.Sheets[name]
    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    })
    const headerRowIndex = detectHeaderRow(matrix, { preferredFields })
    const headers = matrix[headerRowIndex] || []
    const { mapping } = buildColumnMapping(headers)
    const mappedFields = Object.keys(mapping)
    const nameScore = scoreSheetName(name, options.importKind)
    const preferredScore = preferredFields.filter((field) => mapping[field] !== undefined).length * 4
    const rowScore = Math.min(Math.max(matrix.length - headerRowIndex - 1, 0), 1000) / 1000
    return {
      name,
      score: mappedFields.length + preferredScore + nameScore + rowScore,
    }
  })

  scored.sort((left, right) => right.score - left.score)
  return scored[0]?.name || names[0]
}

function getPreferredFields(importKind = 'complete', sheetName = '') {
  const base = IMPORT_KIND_FIELDS[importKind]?.recommended || IMPORT_KIND_FIELDS.complete.requiredAny
  const lowerName = String(sheetName).toLowerCase()

  if (lowerName.includes('item')) {
    return Array.from(new Set([...base, 'itemName', 'quantity', 'rate', 'batchNo', 'expiryDate']))
  }

  return base
}

function scoreSheetName(sheetName = '', importKind = 'complete') {
  const name = sheetName.toLowerCase()
  let score = 0

  if (importKind === 'sales' && /sale|sales|item details|sale items/.test(name)) score += 8
  if (importKind === 'sales' && /sale items|item details/.test(name)) score += 6
  if (importKind === 'purchases' && /purchase|purchases|purchase items/.test(name)) score += 8
  if (importKind === 'purchases' && /purchase items/.test(name)) score += 6
  if (importKind === 'parties' && /part(y|ies)|ledger|account/.test(name)) score += 10
  if (importKind === 'products' && /item|stock|product/.test(name)) score += 10
  if (importKind === 'complete' && /item details|sale items|purchase items/.test(name)) score += 4

  return score
}
