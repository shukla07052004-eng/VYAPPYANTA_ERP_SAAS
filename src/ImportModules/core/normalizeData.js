import { DEFAULT_RECORD_VALUES } from '../constants.js'
import { buildColumnMapping, mapRowByHeaders } from '../utils/columnMapper.js'
import {
  buildDuplicateKey,
  cleanString,
  detectImportProfile,
  isEmptyRow,
  parseDate,
  parseNumber,
} from '../utils/dataCleaner.js'

/**
 * Normalize raw spreadsheet rows into standardized ERP records.
 * @param {Record<string, unknown>[]} rows
 * @param {{ headers?: string[], onProgress?: (pct: number) => void }} [options]
 */
export function normalizeData(rows = [], options = {}) {
  const headers = options.headers || Object.keys(rows[0] || {})
  const { mapping, unmapped, details, lowConfidence } = buildColumnMapping(headers)
  const importProfile = detectImportProfile(headers)
  const seen = new Set()
  const records = []
  let skippedRows = 0
  const total = rows.length

  rows.forEach((row, index) => {
    if (isEmptyRow(row)) return

    const mapped = headers.length ? { ...mapRowByHeaders(row, headers), ...pickStandardFields(row) } : row
    const record = normalizeRecord(mapped, importProfile)
    record._sourceRow = index + 1

    if (!isUsableRecord(record, options.importKind)) {
      skippedRows += 1
      return
    }

    const duplicateKey = buildDuplicateKey(record)

    if (seen.has(duplicateKey) && duplicateKey !== '|||0|0') {
      record._duplicate = true
    } else {
      seen.add(duplicateKey)
    }

    records.push(record)
    options.onProgress?.(Math.round(((index + 1) / Math.max(total, 1)) * 100))
  })

  const activeRecords = records.filter((record) => !record._duplicate)

  return {
    records: activeRecords,
    duplicates: records.filter((record) => record._duplicate),
    columnMapping: mapping,
    columnMappingDetails: details,
    unmappedColumns: unmapped,
    lowConfidenceMappings: lowConfidence,
    skippedRows,
    importProfile,
  }
}

function normalizeRecord(raw = {}, importProfile = 'generic') {
  const record = { ...DEFAULT_RECORD_VALUES }
  const invalidDates = []
  const invalidNumbers = []

  record.invoiceNo = cleanString(raw.invoiceNo)
  record.partyName = cleanString(raw.partyName)
  record.partyType = cleanString(raw.partyType)
  record.mobile = cleanString(raw.mobile)
  record.email = cleanString(raw.email)
  record.address = cleanString(raw.address)
  record.city = cleanString(raw.city)
  record.gstin = cleanString(raw.gstin)
  record.itemName = cleanString(raw.itemName)
  record.batchNo = cleanString(raw.batchNo)
  record.expenseTitle = cleanString(raw.expenseTitle)
  record.category = cleanString(raw.category)
  record.paymentMode = cleanString(raw.paymentMode)
  record.paymentStatus = cleanString(raw.paymentStatus)
  record.notes = cleanString(raw.notes)
  record.drCr = cleanString(raw.drCr).toUpperCase()

  const invoiceDate = parseDate(raw.invoiceDate)
  record.invoiceDate = invoiceDate.value
  if (!invoiceDate.valid) invalidDates.push('invoiceDate')

  const expiryDate = parseDate(raw.expiryDate)
  record.expiryDate = expiryDate.value
  if (!expiryDate.valid) invalidDates.push('expiryDate')

  const numericFields = [
    ['quantity', 0],
    ['rate', 0],
    ['discount', 0],
    ['gstPercent', 0],
    ['taxableAmount', 0],
    ['gstAmount', 0],
    ['totalAmount', 0],
    ['purchaseRate', 0],
    ['balance', 0],
    ['receivedAmount', 0],
    ['paidAmount', 0],
  ]

  numericFields.forEach(([field, fallback]) => {
    if (raw[field] == null || raw[field] === '') return
    const parsed = parseNumber(raw[field], fallback)
    record[field] = parsed.value
    if (!parsed.valid) invalidNumbers.push(field)
  })

  if (raw.hsnCode != null) record.hsnCode = cleanString(raw.hsnCode)

  if (importProfile === 'marg-erp' && !record.rate && record.purchaseRate) {
    record.rate = record.purchaseRate
  }

  if (!record.taxableAmount && record.quantity && record.rate) {
    const gross = record.quantity * record.rate
    const discountValue = record.discount > 0 && record.discount <= 100
      ? gross * (record.discount / 100)
      : record.discount
    record.taxableAmount = Math.max(gross - discountValue, 0)
  }

  if (!record.gstAmount && record.taxableAmount && record.gstPercent) {
    record.gstAmount = Math.round((record.taxableAmount * record.gstPercent) / 100 * 100) / 100
  }

  if (!record.totalAmount && record.taxableAmount) {
    record.totalAmount = Math.round((record.taxableAmount + record.gstAmount) * 100) / 100
  }

  if (!record.taxableAmount && record.totalAmount) {
    record.taxableAmount = Math.max(record.totalAmount - record.gstAmount, 0)
  }

  if (invalidDates.length) record._invalidDates = invalidDates
  if (invalidNumbers.length) record._invalidNumbers = invalidNumbers

  return record
}

function pickStandardFields(row = {}) {
  const picked = {}
  Object.keys(DEFAULT_RECORD_VALUES).forEach((field) => {
    if (row[field] != null && row[field] !== '') picked[field] = row[field]
  })
  return picked
}

function isUsableRecord(record = {}, importKind = 'complete') {
  const hasParty = Boolean(record.partyName)
  const hasItem = Boolean(record.itemName)
  const hasInvoice = Boolean(record.invoiceNo)
  const hasAmount = Boolean(Number(record.totalAmount) || Number(record.taxableAmount) || Number(record.balance))

  if (importKind === 'parties') return hasParty
  if (importKind === 'products') return hasItem
  if (importKind === 'expenses') return hasAmount || Boolean(record.expenseTitle || record.category)
  if (importKind === 'sales' || importKind === 'purchases') return hasInvoice || hasParty || hasItem || hasAmount

  return hasInvoice || hasParty || hasItem || hasAmount
}

export default normalizeData
