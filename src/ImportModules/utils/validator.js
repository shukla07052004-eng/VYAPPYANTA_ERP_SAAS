import { ACCEPTED_EXTENSIONS, IMPORT_KIND_FIELDS } from '../constants.js'
import { cleanString } from './dataCleaner.js'

const FIELD_LABELS = {
  invoiceNo: 'Invoice Number',
  invoiceDate: 'Invoice Date',
  partyName: 'Party Name',
  mobile: 'Phone',
  email: 'Email',
  address: 'Address',
  city: 'City',
  gstin: 'GSTIN',
  itemName: 'Item Name',
  batchNo: 'Batch',
  expiryDate: 'Expiry',
  quantity: 'Quantity',
  rate: 'Rate',
  purchaseRate: 'Purchase Rate',
  gstPercent: 'GST',
  totalAmount: 'Amount',
  balance: 'Opening Balance',
}

const MAX_DETAILED_WARNINGS = 300

/**
 * Validate normalized ERP records.
 * Missing page-level fields are warnings so "Import Anyway" can preserve partial data.
 * Critical errors are reserved for unreadable/unsupported files or no usable rows.
 * @param {Record<string, unknown>[]} records
 * @param {{ importKind?: string }} [options]
 * @returns {{ success: boolean, errors: object[], warnings: object[], criticalErrors: object[] }}
 */
export function validateData(records = [], options = {}) {
  const errors = []
  const warnings = []
  const importKind = options.importKind || 'complete'
  const rules = IMPORT_KIND_FIELDS[importKind] || IMPORT_KIND_FIELDS.complete

  if (!records.length) {
    errors.push({ row: 0, field: '_file', message: 'No usable rows found in the uploaded file.' })
    return { success: false, errors, criticalErrors: errors, warnings }
  }

  records.forEach((record, index) => {
    const rowNumber = Number(record._sourceRow) || index + 1

    rules.recommended?.forEach((field) => {
      const value = record[field]
      const isMissing = value == null || cleanString(value) === '' || (isNumericRecommended(field) && Number(value) === 0)
      if (isMissing) {
        pushWarning(warnings, { row: rowNumber, field, message: `Missing ${FIELD_LABELS[field] || field}.` })
      }
    })

    if (record._invalidDates?.length) {
      record._invalidDates.forEach((field) => {
        pushWarning(warnings, { row: rowNumber, field, message: `Invalid date for ${FIELD_LABELS[field] || field}; imported as blank/default.` })
      })
    }

    if (record._invalidNumbers?.length) {
      record._invalidNumbers.forEach((field) => {
        pushWarning(warnings, { row: rowNumber, field, message: `Invalid number for ${FIELD_LABELS[field] || field}; imported as 0.` })
      })
    }

    if (record._duplicate) {
      pushWarning(warnings, { row: rowNumber, field: '_duplicate', message: 'Duplicate record detected and skipped.' })
    }
  })

  return {
    success: errors.length === 0,
    errors,
    criticalErrors: errors,
    warnings,
  }
}

/**
 * Validate file before parsing.
 * @param {File|{ name: string, size?: number, type?: string }} file
 */
export function validateFileType(file) {
  const name = String(file?.name || '').toLowerCase()
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const allowed = ACCEPTED_EXTENSIONS

  if (!allowed.includes(extension)) {
    return {
      valid: false,
      message: `Unsupported file type. Please upload ${allowed.join(', ')} files only.`,
    }
  }

  return { valid: true, extension, fileType: extension.replace('.', '') }
}

export function validateRowLimit(totalRows, maxRows) {
  if (totalRows > maxRows) {
    return {
      valid: false,
      message: `File exceeds the maximum supported limit of ${maxRows.toLocaleString()} rows.`,
    }
  }
  return { valid: true }
}

function isNumericRecommended(field) {
  return ['quantity', 'rate', 'purchaseRate', 'gstPercent', 'totalAmount', 'balance'].includes(field)
}

function pushWarning(warnings, warning) {
  const summary = warnings.find((item) => item.field === '_warning_limit')
  if (warnings.length < MAX_DETAILED_WARNINGS) {
    warnings.push(warning)
    return
  }

  if (summary) {
    summary.count += 1
    summary.message = `${summary.count} additional warning(s) hidden. Import Anyway will still preserve usable data.`
  } else {
    warnings.push({
      row: 0,
      field: '_warning_limit',
      count: 1,
      message: '1 additional warning(s) hidden. Import Anyway will still preserve usable data.',
    })
  }
}
