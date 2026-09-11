/**
 * Export normalized records into the standardized JSON envelope.
 * @param {Record<string, unknown>[]} records
 * @param {{ fileName?: string, fileType?: string, uploadedAt?: string, importProfile?: string, columnMapping?: Record<string, number>, unmappedColumns?: string[] }} metadata
 */
export function exportJSON(records = [], metadata = {}) {
  const cleanedRecords = records.map((record) => sanitizeRecord(record))

  return {
    metadata: {
      fileName: metadata.fileName || '',
      fileType: metadata.fileType || '',
      uploadedAt: metadata.uploadedAt || new Date().toISOString(),
      totalRows: cleanedRecords.length,
      importProfile: metadata.importProfile || 'generic',
      importKind: metadata.importKind || 'complete',
      columnMapping: metadata.columnMapping || {},
      columnMappingDetails: metadata.columnMappingDetails || {},
      unmappedColumns: metadata.unmappedColumns || [],
      lowConfidenceMappings: metadata.lowConfidenceMappings || [],
      skippedRows: metadata.skippedRows || 0,
    },
    records: cleanedRecords,
  }
}

function sanitizeRecord(record = {}) {
  const output = {
    invoiceNo: record.invoiceNo ?? '',
    invoiceDate: record.invoiceDate ?? '',
    partyName: record.partyName ?? '',
    partyType: record.partyType ?? '',
    mobile: record.mobile ?? '',
    email: record.email ?? '',
    address: record.address ?? '',
    city: record.city ?? '',
    gstin: record.gstin ?? '',
    itemName: record.itemName ?? '',
    batchNo: record.batchNo ?? '',
    expiryDate: record.expiryDate ?? '',
    quantity: Number(record.quantity ?? 0),
    rate: Number(record.rate ?? 0),
    discount: Number(record.discount ?? 0),
    gstPercent: Number(record.gstPercent ?? 0),
    taxableAmount: Number(record.taxableAmount ?? 0),
    gstAmount: Number(record.gstAmount ?? 0),
    totalAmount: Number(record.totalAmount ?? 0),
    balance: Number(record.balance ?? 0),
    drCr: record.drCr ?? '',
    expenseTitle: record.expenseTitle ?? '',
    category: record.category ?? '',
    paymentMode: record.paymentMode ?? '',
    paymentStatus: record.paymentStatus ?? '',
    receivedAmount: Number(record.receivedAmount ?? 0),
    paidAmount: Number(record.paidAmount ?? 0),
    notes: record.notes ?? '',
  }

  if (record.purchaseRate != null) output.purchaseRate = Number(record.purchaseRate)
  if (record.hsnCode) output.hsnCode = String(record.hsnCode)

  return output
}

/**
 * Trigger browser download of JSON output.
 * @param {object} payload
 * @param {string} [fileName='import.json']
 */
export function downloadJSON(payload, fileName = 'import.json') {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
