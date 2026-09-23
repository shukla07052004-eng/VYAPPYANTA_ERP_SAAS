// ============================================================
// BizLedger Pro — Central Data Store
// ============================================================


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

export function normalizePurchase(purchase) {
  if (!purchase) return null

  return {
    ...purchase,

    // MongoDB ID
    id: String(purchase._id ?? purchase.id),

    // Purchase identification
    billNo: purchase.billNo ?? "",
    purchaseType: purchase.purchaseType ?? "Purchase Bill",

    // Supplier / Customer
    customer: purchase.customer ?? {},

    supplier: purchase.customer?.Party ?? "",
    phone: purchase.customer?.phone ?? "",
    city: purchase.customer?.city ?? "",
    gstin: purchase.customer?.gstin ?? "",
    contactPerson: purchase.customer?.contactPerson ?? "",
    billingAddress: purchase.customer?.billingAddress ?? "",

    // Dates
    date: purchase.date ?? purchase.createdAt ?? "",
    dueDate: purchase.dueDate ?? null,

    // Items
    items: (purchase.items ?? []).map((item) => ({
      ...item,

      desc: item.desc ?? "",
      hsn: item.hsn ?? "",

      qty: Number(item.qty ?? 0),
      rate: Number(item.rate ?? 0),
      discountPct: Number(item.discountPct ?? 0),
      taxPct: Number(item.taxPct ?? 0),

      taxLabel: item.taxLabel ?? "",

      baseAmount: Number(item.baseAmount ?? 0),
      taxAmount: Number(item.taxAmount ?? 0),
      amount: Number(item.amount ?? 0),
    })),

    // Totals
    subtotal: Number(purchase.subtotal ?? 0),
    tax: Number(purchase.tax ?? 0),

    taxBreakdown: (purchase.taxBreakdown ?? []).map((row) => ({
      rate: Number(row.rate ?? 0),
      taxable: Number(row.taxable ?? 0),
    })),

    amount: Number(purchase.amount ?? 0),
    paid: Number(purchase.paid ?? 0),

    // Payment
    mode: purchase.mode ?? "Credit",

    // Payment status
    status: purchase.status ?? "Unpaid",

    // Notes
    notes: purchase.notes ?? "",

    // Mongo timestamps
    createdAt: purchase.createdAt ?? null,
    updatedAt: purchase.updatedAt ?? null,
  }
}

export function normalizeParty(party, index = 0) {
  if (!party) return null;

  return {
    // =========================
    // Serial Number
    // =========================
    sr: index + 1,

    // =========================
    // MongoDB ID
    // =========================
    id:
      party._id?.toString?.() ??
      party._id ??
      party.id ??
      "",

    // =========================
    // Basic Party Information
    // =========================
    name: party.companyName ?? "",
    companyName: party.companyName ?? "",
    type: party.partyType ?? "Customer",
    accountGroup: party.accountGroup ?? "",
    partyCode: party.partyCode ?? "",

    // =========================
    // Tax Information
    // =========================
    gstin: party.gstin ?? "",
    taxID: party.taxID ?? "",

    // =========================
    // Contact Information
    // =========================
    primaryContactName: party.primaryContactName ?? "",
    primaryContactRole: party.primaryContactRole ?? "",
    phone: party.phone ?? "",
    email: party.email ?? "",

    // =========================
    // Address
    // =========================
    address: {
      addressLine1: party.address?.addressLine1 ?? "",
      city: party.address?.city ?? "",
      state: party.address?.state ?? "",
      postalCode: party.address?.postalCode ?? "",
      country: party.address?.country ?? "",
    },

    // =========================
    // Payment
    // =========================
    paymentTerm: party.paymentTerm ?? "",
    creditLimit: Number(party.creditLimit ?? 0),
    currency: party.currency ?? "INR",
    discountStructure: party.discountStructure ?? "",

    // =========================
    // Bank
    // =========================
    bank: {
      bankName: party.bank?.bankName ?? "",
      ifsc: party.bank?.ifsc ?? "",
      accountNo: party.bank?.accountNo ?? "",
    },

    // =========================
    // Partner / Shipping
    // =========================
    partnerRoles: Array.isArray(party.partnerRoles)
      ? party.partnerRoles
      : [],

    shippingMethods: Array.isArray(party.shippingMethods)
      ? party.shippingMethods
      : [],

    // =========================
    // Status
    // =========================
    status: party.status ?? "Active",

    // =========================
    // Remarks
    // =========================
    remarks: {
      notes: party.remarks?.notes ?? "",
      openingBalance: Number(
        party.remarks?.openingBalance ?? 0
      ),
      carrierInfo: party.remarks?.carrierInfo ?? "",
      supplierDetails: party.remarks?.supplierDetails ?? "",
    },

    // =========================
    // Location
    // =========================
    location: {
      latitude: Number(party.location?.latitude ?? 0),
      longitude: Number(party.location?.longitude ?? 0),
    },

    // =========================
    // Ledger
    // =========================
    balance: Number(party.balance ?? 0),
    drCr: party.drCr ?? "Dr",

    // =========================
    // Timestamps
    // =========================
    createdAt: party.createdAt ?? null,
    updatedAt: party.updatedAt ?? null,
  };
}

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
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to fetch invoices"
    )
  }

  return (result.data ?? [])
    .map(normalizeInvoice)
    .filter(Boolean)
}
export async function INIT_PARTIES() {
  const response = await fetch("/api/newParty", {
    method: "GET",
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to fetch parties"
    );
  }

  return (result.data ?? []).map((party, index) =>
    normalizeParty(party, index)
  );
}
export async function INIT_PURCHASES() {
  const response = await fetch("/api/newPurchase", {
    method: "GET",
    cache: "no-store",
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to fetch purchases"
    )
  }

  return (result.data ?? [])
    .map(normalizePurchase)
    .filter(Boolean)
}

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



export async function INIT_WORKERS() {
  const response = await fetch("/api/Worker", {
    method: "GET",
    cache: "no-store",
  })

  const result = await response.json()

  console.log("WORKER GET RESPONSE:", result)

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch workers")
  }

  return (result.data ?? []).map((worker) => ({
    id: String(worker._id ?? worker.id ?? ""),

    name: worker.fullName ?? "",
    role: worker.Role ?? "",
    phone: worker.Phone ?? "",
    salary: Number(worker.Salary ?? 0),
    join: worker.joinDate ?? "",

    paid: Boolean(worker.paid ?? false),
    advance: Number(worker.advance ?? 0),
  }))
}



// export const INIT_WORKERS = [
//   { id: 1, name: 'Rakesh Kumar', role: 'Store Manager', phone: '9876501234', salary: 18000, join: 'Jan 2022', attendance: 26, days: 26, paid: false, advance: 0 },
//   { id: 2, name: 'Sunita Devi', role: 'Accountant', phone: '9765401234', salary: 14000, join: 'Mar 2023', attendance: 25, days: 26, paid: true, advance: 2000 },
//   { id: 3, name: 'Mohit Yadav', role: 'Salesman', phone: '9654312340', salary: 12000, join: 'Jun 2023', attendance: 24, days: 26, paid: false, advance: 0 },
//   { id: 4, name: 'Priya Singh', role: 'Data Entry', phone: '9543212345', salary: 10000, join: 'Sep 2023', attendance: 26, days: 26, paid: false, advance: 0 },
//   { id: 5, name: 'Anil Gupta', role: 'Driver', phone: '9432123456', salary: 11000, join: 'Feb 2024', attendance: 22, days: 26, paid: false, advance: 500 },
// ]
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

    parties: [],
    purchases: [],
    expenses: structuredCloneSafe(INIT_EXPENSES),
    workers: [],

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
  const [
    invoices,
    parties,
    purchases,
    workers,
  ] = await Promise.all([
    INIT_INVOICES(),
    INIT_PARTIES(),
    INIT_PURCHASES(),
    INIT_WORKERS(),
  ])

  const cached = loadErpState()

  const state = {
    ...cached,
    invoices,
    parties,
    purchases,
    workers,
  }

  saveErpState(state)

  return state
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

