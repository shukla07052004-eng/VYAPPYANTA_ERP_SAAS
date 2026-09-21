"use client"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createInvoiceRecord } from '../data/salesData.js'
import { createPartyRecord } from '../data/partyData.js'
import { createPurchaseRecord } from '../data/purchaseData.js'
import { createExpenseRecord } from '../data/expenseData.js'
import {
  loadErpState,
  saveErpState,
  getDefaultErpState,
  INIT_INVOICES,
} from '../data/store.js'
import {
  buildNormalizedErpData,
  importErpData,
  normalizePersistedState,
  resetRuntimeErpState,
} from '../data/dataManager.js'
import { buildReportState } from '../data/reportUtils.js'
import { deriveStockLedger } from '../data/stockData.js'
import {
  SAMPLE_BACKUP_SETTINGS,
  SAMPLE_BANK_ACCOUNTS,
  SAMPLE_CASH_TRANSACTIONS,
  SAMPLE_CHECKS,
  SAMPLE_COMPANIES,
  SAMPLE_LOANS,
  SHARED_COMPANIES,
} from '../data/erpModules.js'

const AppContext = createContext(null)
export function normalizeItem(item = {}) {
  return {
    id: String(item._id ?? item.id ?? ''),
    name: item.name ?? item.itemName ?? item.desc ?? '',
    category: item.category ?? 'Other Goods',
    batchNo: item.batchNo ?? '',
    mfgDate: item.mfgDate ?? '',
    expiryDate: item.expiryDate ?? '',
    expiryAlert: item.expiryAlert ?? true,
    gstSlab: Number(item.gstSlab ?? item.gst ?? 18),
    gst: Number(item.gst ?? item.gstSlab ?? 18),
    purchasePrice: Number(item.purchasePrice ?? item.rate ?? 0),
    salesPrice: Number(item.salesPrice ?? item.rate ?? 0),
    mrp: Number(item.mrp ?? item.rate ?? 0),
    stockQty: Number(item.stockQty ?? item.stock ?? 0),
    discount: Number(item.discount ?? item.discountPct ?? 0),
    unitType: item.unitType ?? 'Nos',
    barcode: item.barcode ?? '',
    hsn: item.hsn ?? '',
    notesTag: item.notesTag ?? '',
    notes: item.notes ?? '',
    status: item.status ?? 'Active',
    recentScore: Number(item.recentScore ?? 0),
    recentUsedOn: item.recentUsedOn ?? '',
    recentEditedOn: item.recentEditedOn ?? '',
    deleted: Boolean(item.deleted ?? false),
    version: Number(item.version ?? 1),
  }
}

function buildInitialItemMaster({ sales = [], purchases = [] }) {
  const stockLedger = deriveStockLedger(sales, purchases)
  const byName = new Map()

  stockLedger.forEach((row, index) => {
    const key = String(row.item || '').trim().toLowerCase()

    if (!key) return

    byName.set(key, normalizeItem({
      id: row.sku || `legacy-${index + 1}`,

      name: row.item,

      category: guessCategory(row.item),

      gstSlab: row.gstSlab ?? 18,

      gst: row.gstSlab ?? 18,

      purchasePrice: row.valuationRate || 0,

      salesPrice: row.valuationRate || 0,

      mrp: row.valuationRate || 0,

      stockQty: row.closingQty,

      hsn: row.hsn || '',

      status: row.closingQty > 0
        ? 'Active'
        : 'Inactive',
    }))
  })

  const ingestEntries = (entries = [], type) => {
    entries.forEach((entry) => {
      entry.items?.forEach((item) => {

        const key = String(item.desc || '')
          .trim()
          .toLowerCase()

        if (!key) return

        const current = byName.get(key)

        if (!current) {
          byName.set(
            key,
            normalizeItem({
              id: item.itemId || `legacy-${byName.size + 1}`,

              name: item.desc,

              category: 'Other Goods',

              gstSlab: Number(item.taxPct) || 18,

              gst: Number(item.taxPct) || 18,

              purchasePrice:
                type === 'purchase'
                  ? Number(item.rate) || 0
                  : 0,

              salesPrice:
                type === 'sales'
                  ? Number(item.rate) || 0
                  : 0,

              mrp: Number(item.rate) || 0,

              stockQty: 0,

              discount: Number(item.discountPct) || 0,

              hsn: item.hsn || '',

              recentScore: 1,

              recentUsedOn: entry.date || '',
            })
          )

          return
        }

        byName.set(key, normalizeItem({
          ...current,

          id: current.id,

          hsn: current.hsn || item.hsn || '',

          gstSlab:
            Number(item.taxPct) ||
            current.gstSlab ||
            18,

          gst:
            Number(item.taxPct) ||
            current.gst ||
            18,

          purchasePrice:
            type === 'purchase'
              ? Number(item.rate) || current.purchasePrice
              : current.purchasePrice,

          salesPrice:
            type === 'sales'
              ? Number(item.rate) || current.salesPrice
              : current.salesPrice,

          mrp:
            current.mrp ||
            Number(item.rate) ||
            0,

          discount:
            current.discount ||
            Number(item.discountPct) ||
            0,

          recentScore:
            Number(current.recentScore || 0) + 1,

          recentUsedOn:
            entry.date ||
            current.recentUsedOn,
        }))
      })
    })
  }

  ingestEntries(sales, 'sales')
  ingestEntries(purchases, 'purchase')

  return Array.from(byName.values())
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
}

function mapCategoryFromMongo(category) {
  if (category === 'OtherGoods') return 'Other Goods'
  if (category === 'infusion') return 'Infusion'
  return category ?? 'Tablet'
}

function normalizeMongoItem(item) {
  if (!item) return null

  return {
    ...item,
    id: String(item._id ?? item.id),
    name: item.name ?? '',
    category: mapCategoryFromMongo(item.category),

    recentScore: item.recentScore ?? 0,
    recentUsedOn: item.recentUsedOn ?? '',
    recentEditedOn: item.recentEditedOn ?? '',
    deleted: item.deleted ?? false,
    version: item.version ?? 1,

    batchNo: item.batchNo ?? '',
    mfgDate: item.mfgDate ?? '',
    expiryDate: item.expiryDate ?? '',
    expiryAlert: item.expiryAlert !== false,

    gstSlab: Number(
      item.gstSlab
      ?? (Array.isArray(item.gst) ? item.gst[0] : item.gst)
      ?? 0
    ),
    gst: Number(
      item.gstSlab
      ?? (Array.isArray(item.gst) ? item.gst[0] : item.gst)
      ?? 0
    ),

    purchasePrice: Number(item.purchasePrice ?? 0),
    salesPrice: Number(item.salesPrice ?? 0),
    mrp: Number(item.mrp ?? 0),
    stockQty: Number(item.stockQty ?? 0),
    discount: Number(item.discount ?? 0),

    unitType: item.unitType ?? 'Nos',
    barcode: item.barcode ?? item.Barcode ?? '',
    hsn: item.hsn ?? '',
    notesTag: item.notesTag ?? '',
    notes: item.notes ?? '',
    status: item.status ?? 'Active',
  }
}

export function AppProvider({ children }) {
  const initialErpState = useMemo(
    () => normalizePersistedState(getDefaultErpState()),
    []
  )
  const [invoices, setInvoices] = useState(initialErpState.invoices)
  const [parties, setParties] = useState([])
  const [purchases, setPurchases] = useState(initialErpState.purchases)
  const [expenses, setExpenses] = useState(initialErpState.expenses)
  const [workers, setWorkers] = useState(initialErpState.workers)
  const [revenueData, setRevenueData] = useState(initialErpState.revenueData)
  const [importMeta, setImportMeta] = useState(initialErpState.importMeta)
  const [companies, setCompanies] = useState(SAMPLE_COMPANIES)
  const [sharedCompanies] = useState(SHARED_COMPANIES)
  const [loans, setLoans] = useState(SAMPLE_LOANS)
  const [checks] = useState(SAMPLE_CHECKS)
  const [bankAccounts, setBankAccounts] = useState(SAMPLE_BANK_ACCOUNTS)
  const [cashTransactions] = useState(SAMPLE_CASH_TRANSACTIONS)
  const [backupSettings, setBackupSettings] = useState(SAMPLE_BACKUP_SETTINGS)
    const [items, setItems] = useState(() => {
      if (initialErpState.items?.length) return initialErpState.items
      return buildInitialItemMaster({ sales: initialErpState.invoices, purchases: initialErpState.purchases })
    })


  useEffect(() => {
    const loadPartiesFromMongoDB = async () => {
      try {
        const response = await fetch('/api/newParty')

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Failed to fetch parties'
          )
        }

        console.log('MongoDB parties:', result.data)

        setParties(result.data || [])
      } catch (error) {
        console.error(
          'Failed to load parties from MongoDB:',
          error
        )
      }
    }

    loadPartiesFromMongoDB()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function refreshFromDatabase() {
      try {
        const freshInvoices = await INIT_INVOICES()

        if (cancelled) return

        setInvoices(freshInvoices)
      } catch (error) {
        console.error("Invoice refresh failed:", error)
      }
    }

    refreshFromDatabase()

    return () => {
      cancelled = true
    }
  }, [])

  const deleteParty = useCallback((partyId) => {
    setParties((prev) =>
      prev.filter(
        (party) => String(party._id) !== String(partyId)
      )
    )
  }, [])

  useEffect(() => {
    const loadItemsFromMongoDB = async () => {
      try {
        const response = await fetch('/api/itemContent')
        const result = await response.json()

        console.log('ITEM GET STATUS:', response.status)
        console.log('ITEM GET RESPONSE:', result)

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Failed to fetch items'
          )
        }

        const mongoItems = (result.data || []).map(normalizeMongoItem)

        setItems(mongoItems)
      } catch (error) {
        console.error('❌ Failed to load items from MongoDB:', error)
      }
    }

    loadItemsFromMongoDB()
  }, [])


  useEffect(() => {
    saveErpState({
      version: initialErpState.version,
      invoices,
      parties,
      purchases,
      expenses,
      workers,
      items,
      revenueData,
      importMeta,
      business: initialErpState.business,
      cashEntries: initialErpState.cashEntries,
      bankEntries: initialErpState.bankEntries,
      backups: initialErpState.backups,
    })
  }, [expenses, importMeta, initialErpState, invoices, items, parties, purchases, revenueData, workers])

  const undoStack = useRef([])
  const pushUndo = (fn) => {
    undoStack.current = [fn, ...undoStack.current].slice(0, 20)
  }

  const touchItemsFromDocument = useCallback((lineItems = [], dateLabel = '') => {
    setItems((prev) => {
      const existingByName = new Map(prev.map((item) => [item.name.toLowerCase(), item]))
      lineItems.forEach((line) => {
        const key = String(line.desc || '').trim().toLowerCase()
        if (!key) return
        const current = existingByName.get(key)
        if (current) {
          existingByName.set(key, {
            ...current,
            hsn: current.hsn || line.hsn || '',
            gstSlab: Number(line.taxPct) || current.gstSlab || 18,
            gst: Number(line.taxPct) || current.gst || current.gstSlab || 18,
            purchasePrice: Number(line.rate) || current.purchasePrice,
            salesPrice: Number(line.rate) || current.salesPrice,
            mrp: current.mrp || Number(line.rate) || 0,
            discount: current.discount || Number(line.discountPct) || 0,
            recentScore: (current.recentScore || 0) + 5,
            recentUsedOn: dateLabel || current.recentUsedOn,
            status: current.status || 'Active',
          })
          return
        }
        existingByName.set(key, {
          id: `itm-${Date.now()}-${existingByName.size + 1}`,
          name: line.desc,
          category: 'Other Goods',
          batchNo: '',
          mfgDate: '',
          expiryDate: '',
          expiryAlert: true,
          gstSlab: Number(line.taxPct) || 18,
          gst: Number(line.taxPct) || 18,
          purchasePrice: Number(line.rate) || 0,
          salesPrice: Number(line.rate) || 0,
          mrp: Number(line.rate) || 0,
          stockQty: 0,
          discount: Number(line.discountPct) || 0,
          unitType: 'Nos',
          barcode: '',
          hsn: line.hsn || '',
          notesTag: '',
          notes: '',
          status: 'Active',
          recentScore: 5,
          recentUsedOn: dateLabel,
          recentEditedOn: '',
          deleted: false,
          version: 1,
        })
      })
      return Array.from(existingByName.values())
    })
  }, [])
  const recordPayment = useCallback(async (invoiceId, amount) => {
    const response = await fetch(`/api/newInvoice/${invoiceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentAmount: Number(amount),
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to record payment")
    }

    const updatedInvoice = normalizeInvoice(result.data)

    setInvoices((prev) =>
      prev.map((invoice) =>
        String(invoice.id) === String(invoiceId)
          ? updatedInvoice
          : invoice
      )
    )

    return updatedInvoice
  }, [])

  const deleteInvoice = useCallback(async (invoiceId) => {
    const response = await fetch(
      `/api/newInvoice/${invoiceId}`,
      {
        method: "DELETE",
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to delete invoice"
      )
    }

    setInvoices((prev) =>
      prev.filter(
        (invoice) =>
          String(invoice.id) !== String(invoiceId)
      )
    )

    return true
  }, [])

  const addParty = useCallback((party) => {
    setParties((prev) => [party, ...prev])
  }, [])

  const updateParty = useCallback((partyId, updates) => {
    setParties((prev) =>
      prev.map((party) =>
        String(party._id) === String(partyId)
          ? { ...party, ...updates }
          : party
      )
    )
  }, [])

  const addPurchase = useCallback((purchase) => {
    const nextPurchase = createPurchaseRecord(purchase)
    setPurchases((prev) => [nextPurchase, ...prev])
    touchItemsFromDocument(nextPurchase.items, nextPurchase.date)
  }, [touchItemsFromDocument])

  const getPartyPurchases = useCallback((supplierName) =>
    purchases.filter((purchase) => purchase.supplier?.toLowerCase() === supplierName?.toLowerCase())
    , [purchases])

  const addExpense = useCallback((expense) => {
    setExpenses((prev) => [createExpenseRecord(expense), ...prev])
  }, [])

  const addWorker = useCallback((worker) => {
    setWorkers((prev) => [...prev, {
      ...worker,
      id: Date.now(),
      advance: 0,
      paid: false,
    }])
  }, [])

  const paySalary = useCallback((workerId) => {
    setWorkers((prev) => prev.map((worker) => (
      worker.id === workerId ? { ...worker, paid: true } : worker
    )))
  }, [])

  const recordAdvance = useCallback((workerId, amount) => {
    setWorkers((prev) => prev.map((worker) => (
      worker.id === workerId ? { ...worker, advance: (worker.advance || 0) + amount } : worker
    )))
  }, [])

  const addCompany = useCallback((company) => {
    setCompanies((prev) => [
      {
        id: `cmp-${Date.now()}`,
        sharedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        accessType: 'Owner',
        name: company.companyName,
        owner: company.ownerName,
        ...company,
      },
      ...prev,
    ])
  }, [])

  const saveBackupSettings = useCallback((settings) => {
    setBackupSettings((current) => ({ ...current, ...settings }))
  }, [])

  const upsertLoan = useCallback((payload) => {
    setLoans((prev) => {
      const existing = prev.find((loan) => loan.id === payload.id)
      if (existing) return prev.map((loan) => (loan.id === payload.id ? { ...loan, ...payload } : loan))
      return [{ ...payload, id: payload.id ?? `loan-${Date.now()}` }, ...prev]
    })
  }, [])

  const deleteLoan = useCallback((loanId) => {
    setLoans((prev) => prev.filter((loan) => loan.id !== loanId))
  }, [])

  const upsertBankAccount = useCallback((payload) => {
    setBankAccounts((prev) => {
      const existing = prev.find((account) => account.id === payload.id)
      if (existing) return prev.map((account) => (account.id === payload.id ? { ...account, ...payload } : account))
      return [{ ...payload, id: payload.id ?? `bank-${Date.now()}` }, ...prev]
    })
  }, [])

  const deleteBankAccount = useCallback((accountId) => {
    setBankAccounts((prev) => prev.filter((account) => account.id !== accountId))
  }, [])

  const addItem = useCallback(async (item) => {
    try {
      const response = await fetch('/api/itemContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      })

      const text = await response.text()

      console.log("ITEM POST STATUS:", response.status)
      console.log("ITEM POST RAW RESPONSE:", text)

      let result

      try {
        result = JSON.parse(text)
      } catch {
        throw new Error(
          `API returned non-JSON response (${response.status})`
        )
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to create item'
        )
      }

      const newItem = normalizeMongoItem(result.data)

      setItems((prev) => [
        newItem,
        ...prev,
      ])

      return newItem

    } catch (error) {
      console.error('❌ Failed to create item:', error)
      throw error
    }
  }, [])

  const updateItem = useCallback(async (itemId, updates) => {
    try {
      const response = await fetch('/api/itemContent', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemId,
          ...updates,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to update item'
        )
      }

      const updatedItem = normalizeMongoItem(result.data)

      setItems((prev) =>
        prev.map((item) =>
          String(item.id) === String(itemId)
            ? updatedItem
            : item
        )
      )

      return updatedItem
    } catch (error) {
      console.error('❌ Failed to update item:', error)
      throw error
    }
  }, [])

  const deleteItem = useCallback(async (itemId) => {
    try {
      const response = await fetch(
        `/api/itemContent?id=${encodeURIComponent(itemId)}`,
        {
          method: 'DELETE',
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to delete item'
        )
      }

      setItems((prev) =>
        prev.filter((item) => String(item.id) !== String(itemId))
      )

      return true
    } catch (error) {
      console.error('❌ Failed to delete item:', error)
      throw error
    }
  }, [])

  const touchRecentItem = useCallback((itemId, reason = 'used') => {
    setItems((prev) => prev.map((item) => (
      item.id === itemId
        ? {
          ...item,
          recentScore: (item.recentScore || 0) + (reason === 'edited' ? 4 : 6),
          recentUsedOn: reason === 'used' ? todayStamp() : item.recentUsedOn,
          recentEditedOn: reason === 'edited' ? todayStamp() : item.recentEditedOn,
        }
        : item
    )))
  }, [])

  const undo = useCallback(() => {
    const fn = undoStack.current.shift()
    if (fn) fn()
  }, [])

  const getStateSnapshot = useCallback(() => normalizePersistedState({
    ...initialErpState,
    invoices,
    parties,
    purchases,
    expenses,
    workers,
    items,
    revenueData,
    importMeta,
  }), [expenses, importMeta, initialErpState, invoices, items, parties, purchases, revenueData, workers])

  const applyStateSnapshot = useCallback((state) => {
    const normalized = normalizePersistedState(state)
    setInvoices(normalized.invoices)
    setParties(normalized.parties)
    setPurchases(normalized.purchases)
    setExpenses(normalized.expenses)
    setWorkers(normalized.workers)
    setItems(normalized.items?.length ? normalized.items : buildInitialItemMaster({ sales: normalized.invoices, purchases: normalized.purchases }))
    setRevenueData(normalized.revenueData)
    setImportMeta(normalized.importMeta)
  }, [])

  const importData = useCallback((importResult, options = {}) => {
    const outcome = importErpData(getStateSnapshot(), importResult, options)
    if (!outcome.ok) return outcome
    applyStateSnapshot(outcome.state)
    return { ok: true, errors: [], stats: outcome.stats }
  }, [applyStateSnapshot, getStateSnapshot])

  const importFromParsedPayload = useCallback((importResult, options = {}) =>
    importData(importResult, options)
    , [importData])

  const clearImportedData = useCallback(() => {
    const defaults = resetRuntimeErpState()
    applyStateSnapshot(defaults)
    return defaults
  }, [applyStateSnapshot])

  const getPartyInvoices = useCallback((partyName) =>
    invoices.filter((invoice) => invoice.party === partyName)
    , [invoices])

  const getPartyProfit = useCallback((partyName) => {
    const sales = invoices.filter((invoice) => invoice.party === partyName).reduce((sum, invoice) => sum + invoice.total, 0)
    const purchaseTotal = purchases.filter((purchase) => purchase.supplier === partyName).reduce((sum, purchase) => sum + purchase.amount, 0)
    return { sales, purchases: purchaseTotal, net: sales - purchaseTotal }
  }, [invoices, purchases])

  const stockLedger = useMemo(() => deriveStockLedger(invoices, purchases), [invoices, purchases])

  const itemMaster = useMemo(() => {
    const stockByName = new Map(stockLedger.map((row) => [row.item.toLowerCase(), row]))
    return items
      .filter((item) => !item.deleted)
      .map((item) => {
        const stockRow = stockByName.get(item.name.toLowerCase())
        return {
          ...item,
          stockQty: stockRow?.closingQty ?? item.stockQty ?? 0,
          purchasePrice: item.purchasePrice ?? stockRow?.valuationRate ?? 0,
          salesPrice: item.salesPrice ?? stockRow?.valuationRate ?? 0,
          mrp: item.mrp ?? item.salesPrice ?? item.purchasePrice ?? stockRow?.valuationRate ?? 0,
          discount: item.discount ?? 0,
          gst: item.gst ?? item.gstSlab ?? 0,
          batchNo: item.batchNo || '',
          mfgDate: item.mfgDate || '',
          expiryDate: item.expiryDate || '',
          expiryAlert: item.expiryAlert !== false,
          notesTag: item.notesTag || '',
          notes: item.notes || '',
          lastRate: item.salesPrice ?? item.purchasePrice ?? stockRow?.valuationRate ?? 0,
          usageCount: item.recentScore || 0,
        }
      })
      .sort((a, b) => {
        if ((b.recentScore || 0) !== (a.recentScore || 0)) return (b.recentScore || 0) - (a.recentScore || 0)
        return a.name.localeCompare(b.name)
      })
  }, [items, stockLedger])

  const deletedItems = useMemo(() => items.filter((item) => item.deleted), [items])

  const recentItems = useMemo(
    () => itemMaster
      .filter((item) => item.recentScore || item.recentEditedOn || item.recentUsedOn)
      .sort((a, b) => (b.recentScore || 0) - (a.recentScore || 0))
      .slice(0, 10),
    [itemMaster],
  )

  const reports = useMemo(() => buildReportState({
    sales: invoices,
    purchases,
    parties,
    expenses,
    itemMaster,
  }), [expenses, invoices, itemMaster, parties, purchases])

  const erpData = useMemo(() => buildNormalizedErpData({
    ...initialErpState,
    invoices,
    parties,
    purchases,
    expenses,
    workers,
    items,
    revenueData,
    importMeta,
    business: initialErpState.business,
  }), [expenses, importMeta, initialErpState, invoices, items, parties, purchases, revenueData, workers])

  const getSummary = useCallback(() => {
    const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const netProfit = totalSales - totalPurchases - totalExpenses
    const gstTotal = invoices.reduce((sum, invoice) => sum + (invoice.tax || 0), 0)
    const cgst = Math.round(gstTotal / 2)
    const sgst = Math.round(gstTotal / 2)
    return { totalSales, totalPurchases, totalExpenses, netProfit, gstTotal, cgst, sgst, igst: 0 }
  }, [expenses, invoices, purchases])

  return (
    <AppContext.Provider value={{
      invoices,
      sales: invoices,
      parties,
      purchases,
      expenses,
      products: itemMaster,
      dashboard: erpData.dashboard,
      stock: erpData.stock,
      analytics: erpData.analytics,
      payments: erpData.payments,
      gst: erpData.gst,
      company: erpData.company,
      workers,
      companies,
      sharedCompanies,
      loans,
      checks,
      bankAccounts,
      cashTransactions,
      backupSettings,
      itemMaster,
      deletedItems,
      recentItems,
      revenueData,
      importMeta,
      erpData,
      recordPayment,
      deleteInvoice,
      addParty,
      updateParty,
      deleteParty,
      addPurchase,
      getPartyPurchases,
      addExpense,
      addWorker,
      paySalary,
      recordAdvance,
      addCompany,
      saveBackupSettings,
      upsertLoan,
      deleteLoan,
      upsertBankAccount,
      deleteBankAccount,
      addItem,
      updateItem,
      deleteItem,
      touchRecentItem,
      importFromParsedPayload,
      importData,
      clearImportedData,
      undo,
      getPartyInvoices,
      getPartyProfit,
      getSummary,
      reports,
      stockLedger,
    }}
    >
      {children}
    </AppContext.Provider>
  )
}

function guessCategory(name = '') {
  const value = name.toLowerCase()
  if (value.includes('tablet') || value.includes(' tab')) return 'Tablet'
  if (value.includes('capsule') || value.includes(' cap')) return 'Capsule'
  if (value.includes('softgel')) return 'Softgel'
  if (value.includes('syrup')) return 'Syrup'
  if (value.includes('infusion')) return 'Infusion'
  if (value.includes('injection') || value.includes(' inj')) return 'Injection'
  return 'Other Goods'
}

function todayStamp() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
