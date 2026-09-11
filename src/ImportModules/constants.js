/** Standard ERP record shape returned by every import. */
export const STANDARD_RECORD = {
  invoiceNo: '',
  invoiceDate: '',
  partyName: '',
  partyType: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  gstin: '',
  itemName: '',
  batchNo: '',
  expiryDate: '',
  quantity: 0,
  rate: 0,
  discount: 0,
  gstPercent: 0,
  taxableAmount: 0,
  gstAmount: 0,
  totalAmount: 0,
  purchaseRate: 0,
  hsnCode: '',
  expenseTitle: '',
  category: '',
  paymentMode: '',
  paymentStatus: '',
  receivedAmount: 0,
  paidAmount: 0,
  notes: '',
  balance: 0,
  drCr: '',
}

/** Kept for older callers. Validation now uses IMPORT_KIND_FIELDS. */
export const MANDATORY_FIELDS = ['itemName']
export const RECOMMENDED_FIELDS = ['invoiceNo', 'invoiceDate', 'quantity']

export const IMPORT_KIND_FIELDS = {
  sales: {
    entity: 'Sales',
    requiredAny: ['invoiceNo', 'partyName', 'itemName', 'totalAmount'],
    recommended: ['invoiceNo', 'invoiceDate', 'partyName', 'itemName', 'quantity', 'rate', 'gstPercent', 'totalAmount'],
  },
  purchases: {
    entity: 'Purchases',
    requiredAny: ['invoiceNo', 'partyName', 'itemName', 'totalAmount'],
    recommended: ['invoiceNo', 'invoiceDate', 'partyName', 'itemName', 'quantity', 'purchaseRate', 'rate', 'gstPercent'],
  },
  parties: {
    entity: 'Parties',
    requiredAny: ['partyName'],
    recommended: ['partyName', 'mobile', 'gstin', 'address', 'city', 'email', 'balance'],
  },
  products: {
    entity: 'Items',
    requiredAny: ['itemName'],
    recommended: ['itemName', 'batchNo', 'expiryDate', 'hsnCode', 'gstPercent', 'purchaseRate', 'rate', 'quantity'],
  },
  expenses: {
    entity: 'Expenses',
    requiredAny: ['expenseTitle', 'category', 'totalAmount', 'taxableAmount', 'balance'],
    recommended: ['expenseTitle', 'category', 'totalAmount', 'paymentMode'],
  },
  complete: {
    entity: 'ERP Data',
    requiredAny: ['invoiceNo', 'partyName', 'itemName', 'totalAmount', 'balance'],
    recommended: [],
  },
}

export const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.json']
export const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'application/json',
  'text/plain',
]

export const MAX_ROWS = 50000
export const PREVIEW_ROW_COUNT = 20
export const CHUNK_SIZE = 1000

export const FIELD_ALIAS_GROUPS = {
  invoiceNo: ['Invoice No', 'Invoice Number', 'Invoice#', 'Invoice No.', 'Bill No', 'Bill No.', 'Bill Number', 'Voucher No', 'Doc No', 'Inv No', 'Inv Number', 'Ref No', 'Ref No.'],
  invoiceDate: ['Invoice Date', 'Inv Date', 'Bill Date', 'Date'],
  partyName: ['Party', 'Customer', 'Supplier', 'Ledger', 'Account Name', 'Party Name', 'Customer Name', 'Supplier Name', 'Vendor Name', 'Client Name', 'Buyer Name', 'Name'],
  partyType: ['Party Type', 'Type', 'Transaction Type'],
  mobile: ['Phone', 'Phone No', 'Phone No.', 'Mobile', 'Mobile No', 'Number', 'Contact', 'Contact No'],
  email: ['Email', 'Email ID', 'Email-ID', 'E-Mail', 'Mail'],
  address: ['Address', 'Billing Address', 'Party Address'],
  city: ['City', 'Place', 'Location', 'Area'],
  gstin: ['GSTIN', 'GST No', 'GST Number', "Party's GSTIN No.", 'Party GSTIN', 'GSTIN No'],
  itemName: ['Item', 'Product', 'Medicine', 'Stock Item', 'Product Name', 'Item Name', 'Description', 'Particulars'],
  batchNo: ['Batch', 'Batch No', 'Batch No.', 'Lot', 'Lot No'],
  expiryDate: ['Expiry', 'Expiry Date', 'Exp Date', 'Exp. Date', 'EXP'],
  quantity: ['Qty', 'Quantity', 'QTY', 'Units', 'Stock', 'Closing Stock', 'Closing Balance', 'Opening Stock', 'Opening Balance'],
  rate: ['Rate', 'Price', 'Price/Unit', 'Sales Rate', 'Sale Rate', 'MRP', 'Unit Rate'],
  purchaseRate: ['Purchase Rate', 'Pur Rate', 'Purchase Price', 'Cost Price'],
  discount: ['Discount', 'Disc', 'Discount %', 'Discount Percent', 'Discount Amount'],
  gstPercent: ['GST', 'GST%', 'GST %', 'Tax', 'Tax %', 'GST Percent', 'GST Percentage', 'Tax Rate', 'CGST SGST', 'IGST'],
  taxableAmount: ['Taxable', 'Taxable Amount', 'Taxable Value', 'Sub Total', 'Subtotal'],
  gstAmount: ['GST Amount', 'Tax Amount', 'Total Tax'],
  totalAmount: ['Amount', 'Total', 'Total Amount', 'Grand Total', 'Net Amount', 'Bill Amount', 'BILL AMT.', 'Bill Amt.', 'BILL AMOUNT', 'Balance Amount'],
  hsnCode: ['HSN', 'HSN Code', 'HSN/SAC', 'HSN No'],
  expenseTitle: ['Expense', 'Expense Title', 'Expense Name', 'Title', 'Narration', 'Description'],
  category: ['Category', 'Expense Category'],
  paymentMode: ['Payment Mode', 'Payment Type', 'Mode'],
  paymentStatus: ['Payment Status', 'Status'],
  receivedAmount: ['Received Amount', 'Amount Received', 'Receipt Amount', 'Received'],
  paidAmount: ['Paid Amount', 'Amount Paid', 'Payment Amount', 'Paid'],
  notes: ['Notes', 'Note', 'Remarks', 'Description'],
  balance: ['Opening Balance', 'Balance', 'Receivable Balance', 'Payable Balance', 'Credit Limit'],
  drCr: ['DR/CR', 'Dr Cr', 'Debit Credit'],
}

function aliasKey(header = '') {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[%]/g, 'percent')
    .replace(/[^a-z0-9]+/g, '')
}

/**
 * Smart column alias map. Keys are normalized header tokens, values are standard fields.
 * Supports Marg ERP, Vyapar, Tally-style, and generic accounting exports.
 */
export const FIELD_ALIASES = Object.entries(FIELD_ALIAS_GROUPS).reduce((acc, [field, aliases]) => {
  aliases.forEach((alias) => {
    acc[aliasKey(alias)] = field
  })
  return acc
}, {})

/** Marg ERP export headers mapped explicitly for documentation and priority matching. */
export const MARG_ERP_FIELD_MAP = {
  'Item Name': 'itemName',
  Batch: 'batchNo',
  Expiry: 'expiryDate',
  'Exp. Date': 'expiryDate',
  MRP: 'rate',
  'Sale Rate': 'rate',
  'Sales Rate': 'rate',
  'Purchase Rate': 'purchaseRate',
  HSN: 'hsnCode',
  'HSN Code': 'hsnCode',
  GST: 'gstPercent',
  'GST %': 'gstPercent',
  Stock: 'quantity',
  'Closing Stock': 'quantity',
  'Opening Stock': 'quantity',
  'Closing Balance': 'quantity',
  'Opening Balance': 'quantity',
  'BILL NO.': 'invoiceNo',
  'BILL AMT.': 'totalAmount',
  TAXABLE: 'taxableAmount',
  TAX: 'gstAmount',
  DATE: 'invoiceDate',
  'PARTY NAME': 'partyName',
}

export const DEFAULT_RECORD_VALUES = { ...STANDARD_RECORD }
