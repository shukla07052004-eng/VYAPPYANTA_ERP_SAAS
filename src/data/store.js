// ============================================================
// BizLedger Pro — Central Data Store
// ============================================================

export const BUSINESS = {
  name: 'Ram Kishore & Sons',
  gstin: '09ABCDE1234F1Z5',
  phone: '+91 9876543210',
  email: 'ramkishore@bizledger.in',
  address: 'Shop No. 14, Civil Lines, Prayagraj, UP — 211001',
  city: 'Prayagraj, UP',
  initials: 'RK',
  fy: '2024–25',
  bank: 'State Bank of India',
  account: 'XXXX XXXX 4821',
  ifsc: 'SBIN0001234',
}

export const REVENUE_DATA = [
  { month: 'Apr', current: 82000, prev: 68000 },
  { month: 'May', current: 96000, prev: 74000 },
  { month: 'Jun', current: 74000, prev: 80000 },
  { month: 'Jul', current: 110000, prev: 88000 },
  { month: 'Aug', current: 88000, prev: 76000 },
  { month: 'Sep', current: 124000, prev: 94000 },
  { month: 'Oct', current: 102000, prev: 86000 },
  { month: 'Nov', current: 118000, prev: 100000 },
  { month: 'Dec', current: 92000, prev: 82000 },
  { month: 'Jan', current: 104000, prev: 90000 },
  { month: 'Feb', current: 98000, prev: 88000 },
  { month: 'Mar', current: 124000, prev: 105000 },
]

export async function INIT_INVOICES() {
  const response = await fetch("/api/newInvoice", {
    method: "GET",
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch invoices");
  }

  return (result.data ?? []).map((normalizeInvoice) => ({
    // =========================
    // IDs
    // =========================
    id: normalizeInvoice._id?.toString?.() ?? normalizeInvoice._id ?? "",

    invoiceNumber: normalizeInvoice.invoiceNumber ?? "",
    invoiceType: normalizeInvoice.invoiceType ?? "Tax Invoice",

    // =========================
    // Party
    // =========================
    partyId:
      normalizeInvoice.partyId?.toString?.() ??
      normalizeInvoice.partyId ??
      "",

    partySnapshot: {
      name: normalizeInvoice.partySnapshot?.name ?? "",
      gstin: normalizeInvoice.partySnapshot?.gstin ?? "",
      phone: normalizeInvoice.partySnapshot?.phone ?? "",
      contactPerson: normalizeInvoice.partySnapshot?.contactPerson ?? "",
      billingAddress: normalizeInvoice.partySnapshot?.billingAddress ?? "",
      city: normalizeInvoice.partySnapshot?.city ?? "",
    },

    // Keep these because your existing frontend
    // may already use them.
    party: normalizeInvoice.partySnapshot?.name ?? "",
    phone: normalizeInvoice.partySnapshot?.phone ?? "",
    city: normalizeInvoice.partySnapshot?.city ?? "",
    gstin: normalizeInvoice.partySnapshot?.gstin ?? "",

    // =========================
    // Dates
    // =========================
    date: normalizeInvoice.invoiceDate ?? normalizeInvoice.createdAt ?? "",
    invoiceDate: normalizeInvoice.invoiceDate ?? null,
    dueDate: normalizeInvoice.dueDate ?? null,

    createdAt: normalizeInvoice.createdAt ?? null,
    updatedAt: normalizeInvoice.updatedAt ?? null,

    // =========================
    // Items
    // =========================
    items: (normalizeInvoice.items ?? []).map((item) => ({
      itemId:
        item.itemId?.toString?.() ??
        item.itemId ??
        "",

      desc: item.desc ?? "",
      hsn: item.hsn ?? "",

      qty: Number(item.qty ?? 0),
      rate: Number(item.rate ?? 0),

      discountPct: Number(item.discountPct ?? 0),
      taxPct: Number(item.taxPct ?? 0),

      baseAmount: Number(item.baseAmount ?? 0),
      taxAmount: Number(item.taxAmount ?? 0),
      amount: Number(item.amount ?? 0),
    })),

    // =========================
    // Totals
    // =========================
    subtotal: Number(normalizeInvoice.subtotal ?? 0),
    tax: Number(normalizeInvoice.tax ?? 0),
    total: Number(normalizeInvoice.total ?? 0),
    paid: Number(normalizeInvoice.paid ?? 0),

    // =========================
    // Status
    // =========================
    status: normalizeInvoice.status ?? "Pending",

    // =========================
    // Other
    // =========================
    transport: normalizeInvoice.transport ?? {},
    notes: normalizeInvoice.notes ?? "",
  }));
}
export const INIT_PARTIES = [
  { id: 1, name: 'Sharma Traders', type: 'Customer', phone: '9876543210', city: 'Kanpur', gstin: '09SHTRD1234F1Z5', balance: 48200, drCr: 'DR' },
  { id: 2, name: 'Gupta & Sons', type: 'Customer', phone: '9988776655', city: 'Lucknow', gstin: '09GUPTA5678G2Z6', balance: 22500, drCr: 'DR' },
  { id: 3, name: 'Mehta Wholesale', type: 'Both', phone: '9123456789', city: 'Agra', gstin: '09MEHTA9012H3Z7', balance: 0, drCr: '' },
  { id: 4, name: 'National Distributors', type: 'Supplier', phone: '9012345678', city: 'Delhi', gstin: '07NATDST3456I4Z8', balance: 84500, drCr: 'CR' },
  { id: 5, name: 'Patel Distributors', type: 'Customer', phone: '9871234567', city: 'Varanasi', gstin: '09PATDST7890J5Z9', balance: 14400, drCr: 'DR' },
  { id: 6, name: 'Joshi Brothers', type: 'Customer', phone: '9654321098', city: 'Allahabad', gstin: '09JOSHBR2345K6Z1', balance: 0, drCr: '' },
  { id: 7, name: 'Singh Emporium', type: 'Customer', phone: '9543210987', city: 'Prayagraj', gstin: '09SNGEM6789L7Z2', balance: 9800, drCr: 'DR' },
  { id: 8, name: 'Meridian Supplies', type: 'Supplier', phone: '9432123456', city: 'Mumbai', gstin: '27MRSUP1234M8Z3', balance: 8400, drCr: 'CR' },
]

export const INIT_PURCHASES = [
  {
    id: 'PO-225', supplier: 'Meridian Supplies', date: '08 Apr 2025', status: 'Unpaid', amount: 8400,
    items: [{ desc: 'Electronic Components (Lot)', qty: 4, rate: 1500, amount: 6000 }, { desc: 'Shipping & Handling', qty: 1, rate: 2400, amount: 2400 }],
    subtotal: 8400, tax: 0, notes: 'Delivery pending.',
  },
  {
    id: 'PO-312', supplier: 'National Distributors', date: '12 Apr 2025', status: 'Partial', amount: 9200,
    items: [{ desc: 'Wholesale Goods Batch-A', qty: 8, rate: 1000, amount: 8000 }, { desc: 'Freight Charges', qty: 1, rate: 1200, amount: 1200 }],
    subtotal: 9200, tax: 0, notes: 'Partial payment ₹5,000 received.', paid: 5000,
  },
  {
    id: 'PO-C078', supplier: 'Harbor Electronics', date: '18 Apr 2025', status: 'Unpaid', amount: 6800,
    items: [{ desc: 'Circuit Boards (x20)', qty: 20, rate: 320, amount: 6400 }, { desc: 'Packaging', qty: 1, rate: 400, amount: 400 }],
    subtotal: 6800, tax: 0, notes: '',
  },
  {
    id: 'PO-189', supplier: 'City Wholesalers', date: '20 Mar 2025', status: 'Paid', amount: 62000,
    items: [{ desc: 'Mixed Wholesale Items', qty: 40, rate: 1500, amount: 60000 }, { desc: 'Insurance', qty: 1, rate: 2000, amount: 2000 }],
    subtotal: 62000, tax: 0, notes: 'Full payment done via NEFT.', paid: 62000,
  },
  {
    id: 'PO-176', supplier: 'National Distributors', date: '15 Mar 2025', status: 'Paid', amount: 84500,
    items: [{ desc: 'Bulk Supply Lot-7', qty: 50, rate: 1650, amount: 82500 }, { desc: 'Handling Fee', qty: 1, rate: 2000, amount: 2000 }],
    subtotal: 84500, tax: 0, notes: '', paid: 84500,
  },
]

export const INIT_EXPENSES = [
  { id: 1, category: 'Rent', desc: 'Shop rent – April 2025', amount: 15000, date: '01 Apr 2025', mode: 'Bank' },
  { id: 2, category: 'Electricity', desc: 'March electricity bill', amount: 4200, date: '02 Apr 2025', mode: 'UPI' },
  { id: 3, category: 'Transport', desc: 'Delivery charges', amount: 8600, date: '02 Apr 2025', mode: 'Cash' },
  { id: 4, category: 'Salaries', desc: 'Staff advance – April', amount: 12500, date: '01 Apr 2025', mode: 'Cash' },
  { id: 5, category: 'Misc', desc: 'Stationery & supplies', amount: 800, date: '03 Apr 2025', mode: 'Cash' },
]

export const CASH_ENTRIES = [
  { date: '01 Apr', narration: 'Opening Balance', credit: 45200, debit: 0 },
  { date: '01 Apr', narration: 'Cash Sale – Patel', credit: 8000, debit: 0 },
  { date: '01 Apr', narration: 'Rent Paid', credit: 0, debit: 15000 },
  { date: '02 Apr', narration: 'Cash Sale – Mehta', credit: 12000, debit: 0 },
  { date: '02 Apr', narration: 'Electricity Bill', credit: 0, debit: 4200 },
  { date: '03 Apr', narration: 'Cash Purchase', credit: 0, debit: 9800 },
  { date: '03 Apr', narration: 'Cash Sale – Joshi', credit: 9800, debit: 0 },
]

export const BANK_ENTRIES = [
  { date: '01 Apr', description: 'NEFT – Gupta & Sons', credit: 10000, debit: 0 },
  { date: '01 Apr', description: 'UPI to Meridian Supplies', credit: 0, debit: 25000 },
  { date: '02 Apr', description: 'RTGS – National Dist.', credit: 0, debit: 62000 },
  { date: '03 Apr', description: 'Salary Transfer', credit: 0, debit: 65000 },
]

export const INIT_WORKERS = [
  { id: 1, name: 'Rakesh Kumar', role: 'Store Manager', phone: '9876501234', salary: 18000, join: 'Jan 2022', attendance: 26, days: 26, paid: false, advance: 0 },
  { id: 2, name: 'Sunita Devi', role: 'Accountant', phone: '9765401234', salary: 14000, join: 'Mar 2023', attendance: 25, days: 26, paid: true, advance: 2000 },
  { id: 3, name: 'Mohit Yadav', role: 'Salesman', phone: '9654312340', salary: 12000, join: 'Jun 2023', attendance: 24, days: 26, paid: false, advance: 0 },
  { id: 4, name: 'Priya Singh', role: 'Data Entry', phone: '9543212345', salary: 10000, join: 'Sep 2023', attendance: 26, days: 26, paid: false, advance: 0 },
  { id: 5, name: 'Anil Gupta', role: 'Driver', phone: '9432123456', salary: 11000, join: 'Feb 2024', attendance: 22, days: 26, paid: false, advance: 500 },
]

export const BACKUPS = [
  { date: '04 Apr 09:00', size: '12.4 MB', type: 'Auto', status: 'OK' },
  { date: '03 Apr 23:00', size: '12.1 MB', type: 'Auto', status: 'OK' },
  { date: '02 Apr 23:00', size: '11.9 MB', type: 'Auto', status: 'OK' },
  { date: '01 Apr 14:30', size: '11.8 MB', type: 'Manual', status: 'OK' },
]

// ── Central persisted ERP state (import + runtime mutations) ───────────────

export const ERP_STORAGE_KEY = 'bizledger.erp.state'
export const ERP_STATE_VERSION = 1

/** @typedef {object} ErpState */

export function getDefaultErpState() {
  return {
    version: ERP_STATE_VERSION,

    invoices: [],

    parties: structuredCloneSafe(INIT_PARTIES),
    purchases: structuredCloneSafe(INIT_PURCHASES),
    expenses: structuredCloneSafe(INIT_EXPENSES),
    workers: structuredCloneSafe(INIT_WORKERS),

    items: [],

    business: { ...BUSINESS },

    revenueData: structuredCloneSafe(REVENUE_DATA),
    cashEntries: structuredCloneSafe(CASH_ENTRIES),
    bankEntries: structuredCloneSafe(BANK_ENTRIES),
    backups: structuredCloneSafe(BACKUPS),

    importMeta: null,
  }
}
function structuredCloneSafe(value) {
  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value))
  }
}

function mergeWithDefaults(partial = {}) {
  const defaults = getDefaultErpState()
  return {
    ...defaults,
    ...partial,
    business: { ...defaults.business, ...(partial.business || {}) },
    invoices: Array.isArray(partial.invoices) ? partial.invoices : Array.isArray(partial.sales) ? partial.sales : defaults.invoices,
    parties: Array.isArray(partial.parties) ? partial.parties : defaults.parties,
    purchases: Array.isArray(partial.purchases) ? partial.purchases : defaults.purchases,
    expenses: Array.isArray(partial.expenses) ? partial.expenses : defaults.expenses,
    workers: Array.isArray(partial.workers) ? partial.workers : defaults.workers,
    items: Array.isArray(partial.items) ? partial.items : Array.isArray(partial.products) ? partial.products : defaults.items,
    revenueData: Array.isArray(partial.revenueData) ? partial.revenueData : defaults.revenueData,
    cashEntries: Array.isArray(partial.cashEntries) ? partial.cashEntries : defaults.cashEntries,
    bankEntries: Array.isArray(partial.bankEntries) ? partial.bankEntries : defaults.bankEntries,
    backups: Array.isArray(partial.backups) ? partial.backups : defaults.backups,
    importMeta: partial.importMeta ?? defaults.importMeta,
  }
}

export function loadErpState() {
  if (typeof window === 'undefined') return getDefaultErpState()
  try {
    const raw = window.localStorage.getItem(ERP_STORAGE_KEY)
    if (!raw) return getDefaultErpState()
    return mergeWithDefaults(JSON.parse(raw))
  } catch {
    return getDefaultErpState()
  }
}
// ************************************************************************This function is going to replace loadErpState()************************************************************************************
export async function initializeErpData() {
  try {
    const invoices = await INIT_INVOICES();

    const cached = loadErpState();

    const state = {
      ...cached,
      invoices,
    };

    saveErpState(state);

    return state;
  } catch (error) {
    console.error("Failed to initialize ERP:", error);

    throw error;
  }
}

export function saveErpState(state) {
  if (typeof window === 'undefined' || !state) return false
  try {
    const { _importStats, ...persistable } = state
    window.localStorage.setItem(ERP_STORAGE_KEY, JSON.stringify(persistable))
    return true
  } catch {
    return false
  }
}

export function clearErpState() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ERP_STORAGE_KEY)
}

export async function applyImportPayloadToStore(payload, meta = {}) {
  const { mergeImportIntoErpState } = await import('./importBridge.js')
  const current = loadErpState()
  const merged = mergeImportIntoErpState(current, payload, meta)
  const { _importStats, ...persistable } = merged
  saveErpState(persistable)
  return { state: persistable, stats: _importStats }
}


export function normalizeInvoice(invoice) {
  if (!invoice) return null

  return {
    ...invoice,

    id: String(invoice._id ?? invoice.id),

    invoiceNumber: invoice.invoiceNumber ?? "",

    invoiceType: invoice.invoiceType ?? "Tax Invoice",

    partyId: invoice.partyId
      ? String(invoice.partyId)
      : "",

    partySnapshot: invoice.partySnapshot ?? {},

    party: invoice.partySnapshot?.name ?? "",
    phone: invoice.partySnapshot?.phone ?? "",
    city: invoice.partySnapshot?.city ?? "",
    gstin: invoice.partySnapshot?.gstin ?? "",

    date: invoice.invoiceDate ?? invoice.createdAt,

    items: (invoice.items ?? []).map((item) => ({
      ...item,

      itemId: item.itemId
        ? String(item.itemId)
        : "",

      desc: item.desc ?? "",
      hsn: item.hsn ?? "",

      qty: Number(item.qty ?? 0),
      rate: Number(item.rate ?? 0),

      discountPct: Number(item.discountPct ?? 0),
      taxPct: Number(item.taxPct ?? 0),

      baseAmount: Number(item.baseAmount ?? 0),
      taxAmount: Number(item.taxAmount ?? 0),
      amount: Number(item.amount ?? 0),
    })),

    subtotal: Number(invoice.subtotal ?? 0),
    tax: Number(invoice.tax ?? 0),
    total: Number(invoice.total ?? 0),
    paid: Number(invoice.paid ?? 0),

    status: invoice.status ?? "Pending",

    notes: invoice.notes ?? "",
  }
}