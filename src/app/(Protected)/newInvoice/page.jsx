"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { addDays, fmt, todayISO } from '@/utils/helpers.js'
import useAutocomplete from '@/hooks/useAutocomplete.js'
import useKeyboard from '@/hooks/useKeyboard.js'
import Button from '@/components/frontendUi/Button.jsx'
import { Input, Select, Textarea } from '@/components/frontendUi/Form.jsx'
import ItemAutocompleteInput from '@/components/frontendUi/ItemAutocompleteInput.jsx'
import { consumeSequentialEnter } from '@/utils/erpEnterNav.js'
import { scrollElementIntoView } from '@/utils/focusScroll.js'

const GST_OPTIONS = [0, 5, 12, 18, 28]
const GRID_COLUMNS = '56px minmax(220px, 1.8fr) 110px 90px 110px 92px 92px 132px'
const GRID_FIELDS = ['desc', 'hsn', 'qty', 'rate', 'discountPct', 'taxPct']
const ENTER_FLOW_FIELDS = ['desc', 'qty', 'rate', 'discountPct', 'taxPct']
const MIN_VISIBLE_ROWS = 12

const emptyItem = () => ({
  desc: '',
  hsn: '',
  qty: '1',
  rate: '0',
  discountPct: '0',
  taxPct: 18,
})

export default function NewInvoicePage() {
  const router = useRouter()
  const { addInvoice, invoices, itemMaster, parties, purchases, touchRecentItem } = useApp()
  const toast = useToast()
  const [form, setForm] = useState(() => initialForm())
  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})
  const [transport, setTransport] = useState({ vehicleNo: '', dispatchFrom: '', dispatchThrough: 'Cash' })
  const [taxPickerState, setTaxPickerState] = useState(null)
  const [activePreview, setActivePreview] = useState({ type: null, record: null, rowIndex: null })
  const [partyPreviewArmed, setPartyPreviewArmed] = useState(false)
  const headerFocusRefs = useRef([])
  const footerFocusRefs = useRef([])
  const rowRefs = useRef([])
  const partyOptionRefs = useRef([])
  const customerParties = useMemo(() => (parties ?? []).filter((party) => party.type !== 'Supplier'), [parties])
  const { isOpen, setOpen, suggestions, highlightedIndex, setHighlightedIndex } = useAutocomplete({
    items: customerParties,
    value: form.party,
    getLabel: (party) => party.name,
  })

  const computedItems = items.map((item) => {
    const qty = Number(item.qty) || 0
    const rate = Number(item.rate) || 0
    const discountPct = Number(item.discountPct) || 0
    const grossAmount = qty * rate
    const discountAmount = Math.round(grossAmount * discountPct / 100)
    const baseAmount = grossAmount - discountAmount
    const taxPct = Number(item.taxPct) || 0
    const taxAmount = Math.round(baseAmount * taxPct / 100)
    const lineTotal = baseAmount + taxAmount
    return { ...item, qty, rate, discountPct, grossAmount, discountAmount, baseAmount, taxPct, taxAmount, lineTotal }
  })

  const subtotal = computedItems.reduce((sum, item) => sum + item.baseAmount, 0)
  const tax = computedItems.reduce((sum, item) => sum + item.taxAmount, 0)
  const total = subtotal + tax
  const taxBreakdown = GST_OPTIONS
    .map((rate) => ({
      rate,
      taxable: computedItems.filter((item) => item.taxPct === rate).reduce((sum, item) => sum + item.baseAmount, 0),
    }))
    .filter((row) => row.taxable > 0)

  const partyInsight = useMemo(() => (
    activePreview.type === 'party'
      ? buildPartyInsight(activePreview.record, invoices, purchases)
      : null
  ), [activePreview.record, activePreview.type, invoices, purchases])

  const itemInsight = useMemo(() => (
    activePreview.type === 'item'
      ? buildItemInsight(activePreview.record, invoices, purchases, itemMaster)
      : null
  ), [activePreview.record, activePreview.type, invoices, itemMaster, purchases])

  // i make a change hear inside of workspace-scroll-lock this class make it visible from hidden
  useEffect(() => {
    document.body.classList.add('workspace-scroll-lock')
    return () => document.body.classList.remove('workspace-scroll-lock')
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => headerFocusRefs.current[0]?.focus?.({ preventScroll: true }))
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const activeOption = partyOptionRefs.current[highlightedIndex]
    if (!(activeOption instanceof HTMLElement)) return
    scrollElementIntoView(activeOption, { behavior: 'auto', block: 'nearest', padding: 8 })
  }, [highlightedIndex, isOpen, suggestions])

  useEffect(() => {
    if (!isOpen) return

    const record = suggestions[highlightedIndex] ?? null

    setActivePreview(prev => {
      const previousId = prev?.record?.id ?? null
      const currentId = record?.id ?? null

      if (
        prev?.type === 'party' &&
        previousId === currentId &&
        prev?.rowIndex === null
      ) {
        return prev
      }

      return {
        type: 'party',
        record,
        rowIndex: null
      }
    })
  }, [highlightedIndex, isOpen, suggestions])

  useEffect(() => {
    const handlePreviewEscape = (event) => {
      if (event.key !== 'Escape' || !activePreview.type) return
      setActivePreview({ type: null, record: null, rowIndex: null })
      setPartyPreviewArmed(false)
    }

    document.addEventListener('keydown', handlePreviewEscape)
    return () => document.removeEventListener('keydown', handlePreviewEscape)
  }, [activePreview.type])

  const focusWhenReady = useCallback((resolveNode, attempts = 8) => {
    const tryFocus = (remaining) => {
      const node = resolveNode()
      if (node instanceof HTMLElement) {
        node.focus({ preventScroll: true })
        return
      }
      if (remaining <= 0) return
      requestAnimationFrame(() => tryFocus(remaining - 1))
    }

    requestAnimationFrame(() => tryFocus(attempts))
  }, [])

  const setHeaderRef = (index) => (el) => {
    headerFocusRefs.current[index] = el
  }

  const setFooterRef = (index) => (el) => {
    footerFocusRefs.current[index] = el
  }

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const applyParty = (party) => {
    if (!party || typeof party !== 'object') return
    const billing = party.billingAddress || {}
    setForm((current) => ({
      ...current,
      party: party.name || party.companyName || '',
      phone: party.phone || '',
      city: party.city || billing.city || '',
      gstin: party.gstin || party.taxId || '',
      contactPerson: party.contactPerson || party.primaryContactName || '',
      billingAddress: billing.addressLine1 || party.billingAddressLine1 || current.billingAddress,
    }))
    setOpen(false)
  }

  const focusHeaderField = useCallback((index) => {
    const node = headerFocusRefs.current[index]
    if (!(node instanceof HTMLElement)) return
    node.focus({ preventScroll: true })
  }, [])

  const focusFooterField = useCallback((index) => {
    const node = footerFocusRefs.current.filter(Boolean)[index]
    if (!(node instanceof HTMLElement)) return
    node.focus({ preventScroll: true })
  }, [])

  const focusCell = useCallback((rowIndex, key) => {
    focusWhenReady(() => rowRefs.current[rowIndex]?.[key])
  }, [focusWhenReady])

  const commitPartySelection = useCallback((party) => {
    applyParty(party)
    setActivePreview({ type: null, record: null, rowIndex: null })
    setPartyPreviewArmed(false)
    focusCell(0, 'desc')
  }, [focusCell])

  const previewPartySelection = useCallback((party) => {
    setActivePreview({ type: 'party', record: party ?? null, rowIndex: null })
    setPartyPreviewArmed(true)
  }, [])

  const handleItemPreview = useCallback((item, { rowIndex } = {}) => {
    setActivePreview(prev => {
        const previousId =
            prev?.record?.id ??
            null

        const currentId =
            item?.id ??

            null

        const currentRowIndex = rowIndex ?? null

        if (
            prev?.type === 'item' &&
            previousId === currentId &&
            prev?.rowIndex === currentRowIndex
        ) {
            return prev
        }

        return {
            type: 'item',
            record: item ?? null,
            rowIndex: currentRowIndex
        }
    })
  }, [])

  const clearPreviewPanel = useCallback(() => {
    setActivePreview({ type: null, record: null, rowIndex: null })
    setPartyPreviewArmed(false)
  }, [])

  const focusNumericField = useCallback((event) => {
    const target = event.currentTarget
    if (!(target instanceof HTMLInputElement)) return
    if (!isZeroLikeValue(target.value)) return
    requestAnimationFrame(() => target.setSelectionRange?.(0, target.value.length))
  }, [])

  const clearZeroOnType = useCallback((event) => {
    const target = event.currentTarget
    if (!(target instanceof HTMLInputElement)) return
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (!/^[0-9.]$/.test(event.key)) return
    if (!isZeroLikeValue(target.value)) return

    event.preventDefault()
    target.value = event.key === '.' ? '0.' : event.key
    target.setSelectionRange?.(target.value.length, target.value.length)
    target.dispatchEvent(new Event('input', { bubbles: true }))
  }, [])

  const updateItem = (index, key, value) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )))
    setErrors((current) => ({ ...current, items: undefined }))
  }

  const applyItemMaster = useCallback((rowIndex, item) => {
    setItems((current) => current.map((row, index) => (
      index === rowIndex
        ? {
          ...row,
          desc: item.name,
          hsn: item.hsn || row.hsn,
          rate: item.lastRate ? String(item.lastRate) : row.rate,
          taxPct: item.gstSlab ?? row.taxPct,
        }
        : row
    )))
  }, [])

  const appendRow = useCallback(() => {
    setTaxPickerState(null)
    setItems((current) => {
      const nextIndex = current.length
      focusCell(nextIndex, 'desc')
      return [...current, emptyItem()]
    })
  }, [focusCell])

  const removeRow = (index) => {
    if (items.length === 1) return
    setTaxPickerState((current) => (current?.rowIndex === index ? null : current))
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
    requestAnimationFrame(() => focusCell(Math.max(index - 1, 0), 'desc'))
  }

  const advanceFromTaxField = useCallback((rowIndex) => {
    if (rowIndex === items.length - 1) {
      appendRow()
      return
    }
    focusCell(rowIndex + 1, 'desc')
  }, [appendRow, focusCell, items.length])

  const closeTaxPicker = useCallback(() => {
    setTaxPickerState(null)
  }, [])

  const openTaxPicker = useCallback((rowIndex, direction = 'down') => {
    const currentValue = Number(items[rowIndex]?.taxPct ?? GST_OPTIONS[0])
    const currentIndex = Math.max(GST_OPTIONS.indexOf(currentValue), 0)
    setTaxPickerState({ rowIndex, highlightedIndex: currentIndex, openedBy: direction })
  }, [items])

  const moveTaxHighlight = useCallback((rowIndex, step) => {
    setTaxPickerState((current) => {
      if (!current || current.rowIndex !== rowIndex) {
        const currentValue = Number(items[rowIndex]?.taxPct ?? GST_OPTIONS[0])
        const baseIndex = Math.max(GST_OPTIONS.indexOf(currentValue), 0)
        return {
          rowIndex,
          highlightedIndex: Math.min(Math.max(baseIndex + step, 0), GST_OPTIONS.length - 1),
        }
      }

      return {
        rowIndex,
        highlightedIndex: Math.min(Math.max(current.highlightedIndex + step, 0), GST_OPTIONS.length - 1),
      }
    })
  }, [items])

  const commitTaxSelection = useCallback((rowIndex, nextRate, { moveForward = false } = {}) => {
    updateItem(rowIndex, 'taxPct', nextRate)
    setTaxPickerState(null)

    if (moveForward) {
      advanceFromTaxField(rowIndex)
    }
  }, [advanceFromTaxField])


  const saveInvoice = useCallback(() => {
    const nextErrors = {}
    if (!form.party.trim()) nextErrors.party = 'Customer or party name is required'
    if (!computedItems.some((item) => item.desc.trim())) nextErrors.items = 'Add at least one invoice item'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return false

    const invoice = addInvoice({
      ...form,
      transport,
      items: computedItems
        .filter((item) => item.desc.trim())
        .map((item) => ({
          desc: item.desc,
          hsn: item.hsn,
          qty: item.qty,
          rate: item.rate,
          discountPct: item.discountPct,
          taxPct: item.taxPct,
          taxLabel: `GST ${item.taxPct}%`,
          baseAmount: item.baseAmount,
          taxAmount: item.taxAmount,
          amount: item.lineTotal,
        })),
      subtotal,
      tax,
      taxBreakdown,
      total,
    })

    toast(`Invoice ${invoice.id} created for ${invoice.party}`, 'success')
    router.push('/sales')
    return true
  }, [addInvoice, computedItems, form, subtotal, tax, taxBreakdown, toast, total, transport])

  useKeyboard({
    bindings: [{ id: 'saveRecord', allowInEditable: true, handler: saveInvoice }],
  })

  useEffect(() => {
    const handleKeyDownGlobal = (event) => {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        saveInvoice()
      }
    }

    document.addEventListener('keydown', handleKeyDownGlobal, true)
    return () => document.removeEventListener('keydown', handleKeyDownGlobal, true)
  }, [saveInvoice])

  const moveGridFocus = (rowIndex, fieldKey, direction) => {
    const columnIndex = GRID_FIELDS.indexOf(fieldKey)
    if (columnIndex < 0) return

    if (direction === 'left' && columnIndex > 0) focusCell(rowIndex, GRID_FIELDS[columnIndex - 1])
    if (direction === 'right' && columnIndex < GRID_FIELDS.length - 1) focusCell(rowIndex, GRID_FIELDS[columnIndex + 1])
    if (direction === 'up' && rowIndex > 0) focusCell(rowIndex - 1, fieldKey)
    if (direction === 'down') {
      if (rowIndex === items.length - 1) {
        appendRow()
        return
      }
      focusCell(rowIndex + 1, fieldKey)
    }
  }

  const moveEnterFlowForward = useCallback((rowIndex, fieldKey) => {
    const columnIndex = ENTER_FLOW_FIELDS.indexOf(fieldKey)
    if (columnIndex === -1) return
    if (fieldKey === 'taxPct') {
      advanceFromTaxField(rowIndex)
      return
    }
    const nextField = ENTER_FLOW_FIELDS[columnIndex + 1]
    if (nextField) {
      focusCell(rowIndex, nextField)
    }
  }, [advanceFromTaxField, focusCell])

  const orderedHeaderEls = () => headerFocusRefs.current.filter(Boolean)

  const consumeHeaderEnter = (index) => (event) => {
    const chain = orderedHeaderEls()
    const partyInput = chain[0]

    if (index === 0) {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        clearPreviewPanel()
        return
      }

      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length > 0) {
        event.preventDefault()
        event.stopPropagation()
        setOpen(true)
        setHighlightedIndex((current) => {
          const next = event.key === 'ArrowDown' ? current + 1 : current - 1
          return Math.min(Math.max(next, 0), suggestions.length - 1)
        })
        setPartyPreviewArmed(false)
        return
      }

      const activeEl = document.activeElement
      if (!(activeEl instanceof HTMLElement) || !(partyInput instanceof HTMLElement)) return
      if (activeEl !== partyInput && !partyInput.contains(activeEl)) return
      if (event.key !== 'Enter' || event.repeat) return
      if (event.ctrlKey || event.metaKey || event.altKey) return

      if (event.shiftKey) {
        consumeSequentialEnter(event, 0, chain, {
          onTrailForward: () => focusCell(0, 'desc'),
          onTrailBackward: () => undefined,
        })
        return
      }

      event.preventDefault()
      if (isOpen && suggestions.length > 0) {
        const highlightedParty = suggestions[highlightedIndex] ?? suggestions[0]

        commitPartySelection(highlightedParty)
        return
      }

      const exact = customerParties.find((party) => party.name?.toLowerCase() === form.party.toLowerCase())
      if (exact) {
        commitPartySelection(exact)
      }
      else {
        focusCell(0, 'desc')
      }
      return
    }

    consumeSequentialEnter(event, index, chain, {
      onTrailForward: () => focusCell(0, 'desc'),
      onTrailBackward: () => undefined,
    })
  }

  const consumeFooterEnter = (index) => (event) => {
    consumeSequentialEnter(event, index, footerFocusRefs.current.filter(Boolean), {
      onTrailForward: () => undefined,
      onTrailBackward: () => focusCell(Math.max(items.length - 1, 0), 'taxPct'),
    })
  }

  const handleGridKeyDown = (event, rowIndex, fieldKey) => {
    if (fieldKey === 'taxPct') {
      const pickerOpen = taxPickerState?.rowIndex === rowIndex

      if (event.key === 'Escape') {
        if (!pickerOpen) return
        event.preventDefault()
        closeTaxPicker()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (!pickerOpen) {
          openTaxPicker(rowIndex, 'down')
          return
        }
        moveTaxHighlight(rowIndex, 1)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (!pickerOpen) {
          openTaxPicker(rowIndex, 'up')
          return
        }
        moveTaxHighlight(rowIndex, -1)
        return
      }
    }

    if (event.key === 'Enter') {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      event.preventDefault()

      if (event.shiftKey) {
        const col = GRID_FIELDS.indexOf(fieldKey)
        if (col > 0) {
          moveGridFocus(rowIndex, fieldKey, 'left')
        } else if (rowIndex > 0) {
          focusCell(rowIndex - 1, 'taxPct')
        } else {
          const lastHeaderIndex = headerFocusRefs.current.filter(Boolean).length - 1
          focusHeaderField(lastHeaderIndex)
        }
        return
      }

      if (fieldKey === 'taxPct') {
        if (taxPickerState?.rowIndex === rowIndex) {
          commitTaxSelection(rowIndex, GST_OPTIONS[taxPickerState.highlightedIndex], { moveForward: true })
          return
        }

        advanceFromTaxField(rowIndex)
        return
      }

      moveEnterFlowForward(rowIndex, fieldKey)
      return
    }

    if (event.key === 'ArrowLeft' && (event.currentTarget.selectionStart ?? 0) === 0) {
      event.preventDefault()
      moveGridFocus(rowIndex, fieldKey, 'left')
      return
    }
    if (event.key === 'ArrowRight') {
      const valueLength = String(event.currentTarget.value ?? '').length
      if ((event.currentTarget.selectionStart ?? valueLength) === valueLength) {
        event.preventDefault()
        moveGridFocus(rowIndex, fieldKey, 'right')
      }
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveGridFocus(rowIndex, fieldKey, 'up')
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveGridFocus(rowIndex, fieldKey, 'down')
    }
  }

  const visibleRows = Math.max(MIN_VISIBLE_ROWS, items.length)

  return (
    <div className="erp-workspace-shell erp-workspace-shell--invoice">
      <div className="erp-workspace erp-invoice-workspace">
        <section className="erp-workspace-band erp-workspace-band--header">
          <div className="erp-header-strip">
            <div className="erp-header-party">
              <div style={{ position: 'relative'  }}>
                <Input
                  ref={setHeaderRef(0)}
                  data-page-focus="invoice-party"
                  label="Party / Customer *"
                  value={form.party}
                  onFocus={() => {
                    setOpen(true)
                    setActivePreview({ type: 'party', record: suggestions[highlightedIndex] ?? null, rowIndex: null })
                  }}
                  onChange={(event) => {
                    setField('party', event.target.value)
                    setOpen(true)
                    setPartyPreviewArmed(false)
                  }}
                  onKeyDown={consumeHeaderEnter(0)}
                  error={errors.party}
                  placeholder="Search customer"
                  inputClassName="erp-field"
                />
                {isOpen && suggestions.length > 0 && (
                  <div className="erp-dropdown">
                    {suggestions.map((party, index) => (
                      <button
                        key={party.id}
                        ref={(node) => {
                          partyOptionRefs.current[index] = node
                        }}
                        type="button"
                        className="erp-dropdown-option"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          if (highlightedIndex === index && partyPreviewArmed) {
                            commitPartySelection(party)
                            return
                          }
                          setHighlightedIndex(index)
                          previewPartySelection(party)
                        }}
                        onDoubleClick={() => commitPartySelection(party)}
                        onMouseEnter={() => {
                          setHighlightedIndex(index)
                          setPartyPreviewArmed(false)
                        }}
                        data-active={highlightedIndex === index ? 'true' : 'false'}
                      >
                        <div>{party.name}</div>
                        <div>{party.city || party.billingAddress?.city || 'No city'} | {party.phone || 'No phone'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Textarea
                ref={setHeaderRef(1)}
                label="Billing Address"
                rows={2}
                value={form.billingAddress}
                onChange={(event) => setField('billingAddress', event.target.value)}
                onKeyDown={consumeHeaderEnter(1)}
                textareaClassName="erp-field erp-field--textarea"
              />
            </div>

            <div className="erp-header-meta">
              <Input ref={setHeaderRef(2)} label="Invoice Date" type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} onKeyDown={consumeHeaderEnter(2)} inputClassName="erp-field" />
              <Input ref={setHeaderRef(3)} label="Due Date" type="date" value={form.dueDate} onChange={(event) => setField('dueDate', event.target.value)} onKeyDown={consumeHeaderEnter(3)} inputClassName="erp-field" />
              <Select ref={setHeaderRef(4)} label="Invoice Type" value={form.invoiceType} onChange={(event) => setField('invoiceType', event.target.value)} options={['Tax Invoice', 'Retail Invoice', 'Proforma Invoice']} onKeyDown={consumeHeaderEnter(4)} selectClassName="erp-field" />
              <Input ref={setHeaderRef(5)} label="Contact" value={form.contactPerson} onChange={(event) => setField('contactPerson', event.target.value)} onKeyDown={consumeHeaderEnter(5)} inputClassName="erp-field" />
              <Input ref={setHeaderRef(6)} label="Phone" value={form.phone} onChange={(event) => setField('phone', event.target.value)} onKeyDown={consumeHeaderEnter(6)} inputClassName="erp-field" />
              <Input ref={setHeaderRef(7)} label="City" value={form.city} onChange={(event) => setField('city', event.target.value)} onKeyDown={consumeHeaderEnter(7)} inputClassName="erp-field" />
              <Input ref={setHeaderRef(8)} label="GST Number" value={form.gstin} onChange={(event) => setField('gstin', event.target.value)} onKeyDown={consumeHeaderEnter(8)} inputClassName="erp-field" />
            </div>

            <div className="erp-header-actions">
              <div className="erp-shortcut-box">
                <div>Ctrl + Enter</div>
                <div>Save Invoice</div>
              </div>
              <div className="erp-shortcut-box">
                <div>Enter / Shift+Enter</div>
                <div>Header to grid to footer</div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-workspace-band erp-workspace-band--grid">
          <div className="erp-grid-shell">
            <div className="erp-grid-header" style={{ gridTemplateColumns: GRID_COLUMNS, position:'relative' }}>
              {['Sr', 'Item Name', 'HSN', 'Qty', 'Rate', 'Disc %', 'GST %', 'Amount'].map((label) => (
                <div key={label} className="erp-grid-headcell">{label}</div>
              ))}
            </div>

            <div className="erp-grid-body">
              {Array.from({ length: visibleRows }).map((_, index) => {
                const item = computedItems[index]
                const isEmptyRow = !item
                const currentRow = item ?? emptyItem()
                return (
                  <div
                    key={index}
                    className="erp-grid-row"
                    style={{ gridTemplateColumns: GRID_COLUMNS }}
                  >
                    <div className="erp-grid-cell erp-grid-cell--serial">{index + 1}</div>
                    {isEmptyRow ? (
                      <>
                        <div className="erp-grid-cell" />
                        <div className="erp-grid-cell" />
                        <div className="erp-grid-cell" />
                        <div className="erp-grid-cell" />
                        <div className="erp-grid-cell" />
                        <div className="erp-grid-cell" />
                        <div className="erp-grid-cell erp-grid-cell--amount" />
                      </>
                    ) : (
                      <>
                        <div className="erp-grid-cell">
                          <ItemAutocompleteInput
                            ref={(node) => {
                              rowRefs.current[index] = rowRefs.current[index] ?? {}
                              rowRefs.current[index].desc = node
                            }}
                            rowIndex={index}
                            value={currentRow.desc}
                            onChange={(nextValue) => updateItem(index, 'desc', nextValue)}
                            onSelect={(item) => {
                              applyItemMaster(index, item)
                              touchRecentItem(item.id, 'used')
                              clearPreviewPanel()
                              requestAnimationFrame(() => focusCell(index, 'qty'))
                            }}
                            onPreviewItem={handleItemPreview}
                            onPreviewClear={clearPreviewPanel}
                            onKeyDown={(event) => handleGridKeyDown(event, index, 'desc')}
                            onFocus={() => setActivePreview({ type: 'item', record: null, rowIndex: index })}
                          />
                        </div>
                        <div className="erp-grid-cell">
                          <input
                            ref={(node) => {
                              rowRefs.current[index] = rowRefs.current[index] ?? {}
                              rowRefs.current[index].hsn = node
                            }}
                            value={currentRow.hsn}
                            className="erp-grid-input erp-grid-input--mono"
                            onChange={(event) => updateItem(index, 'hsn', event.target.value)}
                            onKeyDown={(event) => handleGridKeyDown(event, index, 'hsn')}
                          />
                        </div>
                        <div className="erp-grid-cell">
                          <input
                            ref={(node) => {
                              rowRefs.current[index] = rowRefs.current[index] ?? {}
                              rowRefs.current[index].qty = node
                            }}
                          
                            min="0"
                            value={currentRow.qty}
                            className="erp-grid-input erp-grid-input--mono erp-grid-input--right"
                            onChange={(event) => updateItem(index, 'qty', event.target.value)}
                            onFocus={focusNumericField}
                            onKeyDown={(event) => {
                              clearZeroOnType(event)
                              handleGridKeyDown(event, index, 'qty')
                            }}
                          />
                        </div>
                        <div className="erp-grid-cell">
                          <input
                            ref={(node) => {
                              rowRefs.current[index] = rowRefs.current[index] ?? {}
                              rowRefs.current[index].rate = node
                            }}
                            
                            min="0"
                            value={currentRow.rate}
                            className="erp-grid-input erp-grid-input--mono erp-grid-input--right"
                            onChange={(event) => updateItem(index, 'rate', event.target.value)}
                            onFocus={focusNumericField}
                            onKeyDown={(event) => {
                              clearZeroOnType(event)
                              handleGridKeyDown(event, index, 'rate')
                            }}
                          />
                        </div>
                        <div className="erp-grid-cell">
                          <input
                            ref={(node) => {
                              rowRefs.current[index] = rowRefs.current[index] ?? {}
                              rowRefs.current[index].discountPct = node
                            }}
              
                            min="0"
                            value={currentRow.discountPct}
                            className="erp-grid-input erp-grid-input--mono erp-grid-input--right"
                            onChange={(event) => updateItem(index, 'discountPct', event.target.value)}
                            onFocus={focusNumericField}
                            onKeyDown={(event) => {
                              clearZeroOnType(event)
                              handleGridKeyDown(event, index, 'discountPct')
                            }}
                          />
                        </div>
                        <div className="erp-grid-cell erp-grid-cell--tax">
                          <div className="erp-tax-picker" data-open={taxPickerState?.rowIndex === index ? 'true' : 'false'}>
                            <button
                              ref={(node) => {
                                rowRefs.current[index] = rowRefs.current[index] ?? {}
                                rowRefs.current[index].taxPct = node
                              }}
                              type="button"
                              className="erp-grid-input erp-grid-input--mono erp-tax-trigger"
                              aria-haspopup="listbox"
                              aria-expanded={taxPickerState?.rowIndex === index}
                              onBlur={() => {
                                requestAnimationFrame(() => {
                                  if (document.activeElement === rowRefs.current[index]?.taxPct) return
                                  closeTaxPicker()
                                })
                              }}
                              onClick={() => {
                                setTaxPickerState((current) => (
                                  current?.rowIndex === index
                                    ? null
                                    : { rowIndex: index, highlightedIndex: Math.max(GST_OPTIONS.indexOf(Number(currentRow.taxPct)), 0) }
                                ))
                              }}
                              onKeyDown={(event) => handleGridKeyDown(event, index, 'taxPct')}
                            >
                              <span>{currentRow.taxPct}%</span>
                              <span className="erp-tax-trigger-caret">▼</span>
                            </button>
                            {taxPickerState?.rowIndex === index && (
                              <div className="erp-tax-popup" role="listbox" aria-label="GST slabs">
                                {GST_OPTIONS.map((rate, rateIndex) => (
                                  <button
                                    key={rate}
                                    type="button"
                                    className="erp-tax-option"
                                    data-highlighted={taxPickerState.highlightedIndex === rateIndex ? 'true' : 'false'}
                                    data-selected={Number(currentRow.taxPct) === rate ? 'true' : 'false'}
                                    onMouseDown={(event) => {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      commitTaxSelection(index, rate, { moveForward: true })
                                    }}
                                    onMouseEnter={() => setTaxPickerState({ rowIndex: index, highlightedIndex: rateIndex })}
                                  >
                                    <span>{rate}%</span>
                                    {Number(currentRow.taxPct) === rate && <span>Selected</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="erp-grid-cell erp-grid-cell--amount">
                          <div>{fmt(currentRow.lineTotal)}</div>
                          <div>{fmt(currentRow.baseAmount)} + {fmt(currentRow.taxAmount)}</div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {errors.items && <div className="erp-grid-error">{errors.items}</div>}
        </section>

        <section className="erp-workspace-band erp-workspace-band--footer" data-preview={activePreview.type ? 'true' : 'false'}>
          {activePreview.type ? (
            <InvoiceInfoPanel
              type={activePreview.type}
              party={partyInsight}
              item={itemInsight}
              onClose={clearPreviewPanel}
            />
          ) : (
            <div className="erp-footer-grid">
              <div className="erp-footer-panel">
                <div className="erp-footer-title">Dispatch & Payment</div>
                <div className="erp-footer-fields erp-footer-fields--three">
                  <Input ref={setFooterRef(0)} label="Vehicle No." value={transport.vehicleNo} onChange={(event) => setTransport((current) => ({ ...current, vehicleNo: event.target.value }))} onKeyDown={consumeFooterEnter(0)} inputClassName="erp-field" />
                  <Input ref={setFooterRef(1)} label="Dispatch From" value={transport.dispatchFrom} onChange={(event) => setTransport((current) => ({ ...current, dispatchFrom: event.target.value }))} onKeyDown={consumeFooterEnter(1)} inputClassName="erp-field" />
                  <Select ref={setFooterRef(2)} label="Payment Mode" value={transport.dispatchThrough} onChange={(event) => setTransport((current) => ({ ...current, dispatchThrough: event.target.value }))} options={['Cash', 'Credit', 'Bank', 'UPI']} onKeyDown={consumeFooterEnter(2)} selectClassName="erp-field" />
                </div>
                <Textarea
                  ref={setFooterRef(3)}
                  label="Invoice Notes"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                  placeholder="Narration / terms"
                  onKeyDown={consumeFooterEnter(3)}
                  textareaClassName="erp-field erp-field--textarea"
                />
              </div>

              <div className="erp-footer-panel erp-footer-panel--totals">
                <div className="erp-footer-title">Totals</div>
                <div className="erp-tax-block">
                  {taxBreakdown.length > 0 ? taxBreakdown.map((row) => (
                    <div key={row.rate} className="erp-tax-block-row">
                      <span>GST @ {row.rate}% (taxable {fmt(Math.round(row.taxable))})</span>
                      <span className="erp-tax-block-value">{fmt(Math.round(row.taxable * row.rate / 100))}</span>
                    </div>
                  )) : (
                    <div className="erp-tax-block-row erp-tax-block-row--muted">
                      <span>GST slabs appear from lines</span>
                      <span className="erp-tax-block-value">{fmt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="erp-summary-table">
                  <SummaryRow label="Taxable Value" value={fmt(subtotal)} />
                  <SummaryRow label="Total Tax" value={fmt(tax)} />
                  <SummaryRow label="Grand Total" value={fmt(total)} large />
                </div>
                <div className="erp-footer-actions">
                  <Button variant="ghost" size="sm" onClick={appendRow} style={ERP_ACTION_BUTTON}>Add Row</Button>
                  <Button variant="danger" size="sm" onClick={() => removeRow(items.length - 1)} disabled={items.length === 1} style={ERP_ACTION_BUTTON}>Delete Row</Button>
                  <Button ref={setFooterRef(4)} variant="ghost" size="sm" onClick={() => router.push('/sales')} onKeyDown={consumeFooterEnter(4)} style={ERP_ACTION_BUTTON}>Cancel</Button>
                  <Button ref={setFooterRef(5)} variant="primary" size="sm" onClick={saveInvoice} onKeyDown={consumeFooterEnter(5)} style={ERP_PRIMARY_BUTTON}>Create Invoice</Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
};

function SummaryRow({ label, value, large = false }) {
  return (
    <div className="erp-summary-row" data-large={large ? 'true' : 'false'}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

const InvoiceInfoPanel = React.memo(function InvoiceInfoPanel({ type, party, item, onClose }) {
  const isParty = type === 'party'
  const title = isParty ? 'Party Information' : 'Item Information'
  const placeholder = isParty
    ? 'Select a Party to view detailed information.'
    : 'Select an Item to view stock, pricing, expiry, batch and recent sales.'
  const record = isParty ? party : item

  return (
    <div className="erp-info-panel" data-kind={type}>
      <div className="erp-info-panel-header">
        <div>
          <span className="erp-info-title-icon">{isParty ? 'P' : 'I'}</span>
          <span>{title}</span>
        </div>
        <button type="button" className="erp-info-close" onClick={onClose} aria-label="Close information panel">x</button>
      </div>

      {!record ? (
        <div className="erp-info-placeholder">{placeholder}</div>
      ) : isParty ? (
        <PartyInfoPanel info={record} />
      ) : (
        <ItemInfoPanel info={record} />
      )}
    </div>
  )
})

const PartyInfoPanel = React.memo(function PartyInfoPanel({ info }) {
  return (
    <div className="erp-info-grid erp-info-grid--party">
      <InfoCard icon="B" title="Basic Information" rows={[
        ['Party Name', info.name],
        ['Ledger Type', info.ledgerType],
        ['GSTIN', info.gstin],
        ['Mobile Number', info.mobile],
        ['Email', info.email],
        ['Contact Person', info.contactPerson],
      ]} />
      <InfoCard icon="A" title="Address Information" rows={[
        ['Address', info.address],
        ['City', info.city],
        ['State', info.state],
        ['Pincode', info.pincode],
      ]} />
      <InfoCard icon="F" title="Financial Information" rows={[
        ['Opening Balance', info.openingBalance, 'blue'],
        ['Current Balance', info.currentBalance, 'blue'],
        ['Credit Limit', info.creditLimit, 'blue'],
        ['Outstanding Amount', info.outstandingAmount, info.outstandingRaw > 0 ? 'red' : 'green'],
        ['Last Payment Date', info.lastPaymentDate],
      ]} />
      <InfoCard icon="S" title="Business Information" rows={[
        ['Total Purchases', info.totalPurchases],
        ['Total Sales', info.totalSales],
        ['Last Invoice Date', info.lastInvoiceDate],
        ['Last Invoice Amount', info.lastInvoiceAmount],
      ]} />
      <div className="erp-info-card erp-info-card--status">
        <SectionTitle icon="T" title="Status" />
        <div className="erp-status-row">
          <span className="erp-status-pill" data-tone={info.status === 'Active' ? 'green' : 'red'}>{info.status}</span>
          {info.creditBlocked && <span className="erp-status-pill" data-tone="red">Credit Blocked</span>}
          {!info.creditBlocked && <span className="erp-status-pill" data-tone="green">Credit Clear</span>}
        </div>
      </div>
    </div>
  )
})

const ItemInfoPanel = React.memo(function ItemInfoPanel({ info }) {
  return (
    <div className="erp-info-grid erp-info-grid--item">
      <InfoCard icon="I" title="Item Information" rows={[
        ['Item Name', info.name],
        ['Generic Name', info.genericName],
        ['Company', info.company],
        ['Category', info.category],
        ['HSN Code', info.hsn],
      ]} />
      <InfoCard icon="B" title="Batch Information" rows={[
        ['Batch Number', info.batchNo],
        ['Manufacturing Date', info.mfgDate],
        ['Expiry Date', info.expiryDate, info.expiryTone],
        ['Remaining Shelf Life', info.shelfLife, info.expiryTone],
      ]} />
      <InfoCard icon="P" title="Pricing" rows={[
        ['Purchase Rate', info.purchaseRate],
        ['Sale Rate', info.saleRate],
        ['Net Rate', info.netRate],
        ['MRP', info.mrp],
        ['Discount', info.discount],
        ['GST %', info.gstPercent, 'blue'],
        ['GST Type', info.gstType, 'blue'],
      ]} />
      <InfoCard icon="Q" title="Inventory" rows={[
        ['Current Stock', info.currentStock, info.stockTone],
        ['Reserved Stock', info.reservedStock],
        ['Available Stock', info.availableStock, info.availableRaw > 0 ? 'green' : 'red'],
        ['Reorder Level', info.reorderLevel, info.lowStock ? 'red' : undefined],
      ]} />
      <div className="erp-info-card erp-info-card--sales">
        <SectionTitle icon="S" title="Sales Analytics" />
        {info.lastSales.length ? (
          <table className="erp-info-sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {info.lastSales.map((sale) => (
                <tr key={`${sale.invoiceNo}-${sale.date}-${sale.customer}`}>
                  <td>{sale.date}</td>
                  <td>{sale.invoiceNo}</td>
                  <td>{sale.customer}</td>
                  <td>{sale.qty}</td>
                  <td>{sale.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="erp-info-empty">No previous sales found.</div>
        )}
      </div>
      <InfoCard icon="L" title="Purchase Analytics" rows={[
        ['Last Purchase Date', info.lastPurchaseDate],
        ['Last Purchase Rate', info.lastPurchaseRate],
        ['Supplier Name', info.supplierName],
      ]} />
    </div>
  )
})

function InfoCard({ icon, title, rows }) {
  return (
    <div className="erp-info-card">
      <SectionTitle icon={icon} title={title} />
      <div className="erp-info-row-list">
        {rows.map(([label, value, tone]) => (
          <div key={label} className="erp-info-row">
            <span>{label}</span>
            <strong data-tone={tone || undefined}>{emptyDash(value)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ icon, title }) {
  return (
    <div className="erp-info-section-title">
      <span>{icon}</span>
      <strong>{title}</strong>
    </div>
  )
}

function initialForm() {
  const date = todayISO()
  return {
    invoiceType: 'Tax Invoice',
    party: '',
    contactPerson: '',
    phone: '',
    city: '',
    gstin: '',
    billingAddress: '',
    date,
    dueDate: addDays(date, 30),
    notes: '',
  }
}

function buildPartyInsight(party, invoices = [], purchases = []) {
  if (!party) return null
  const name = party.name || party.companyName || ''
  const sales = invoices.filter((invoice) => sameName(invoice.party, name))
  const purchaseRows = purchases.filter((purchase) => sameName(purchase.supplier, name))
  const totalSalesRaw = sumBy(sales, (invoice) => invoice.total)
  const totalPurchasesRaw = sumBy(purchaseRows, (purchase) => purchase.amount ?? purchase.total)
  const outstandingRaw = sales.reduce((sum, invoice) => (
    sum + Math.max((Number(invoice.total) || 0) - (Number(invoice.paid) || 0), 0)
  ), 0)
  const openingRaw = Number(party.openingBalance ?? party.balance) || 0
  const currentRaw = Number(party.currentBalance ?? party.balance) || outstandingRaw || 0
  const creditLimitRaw = Number(party.creditLimit) || 0
  const lastInvoice = sortByDateDesc(sales)[0]
  const lastPayment = sortByDateDesc(sales.filter((invoice) => Number(invoice.paid) > 0))[0]
  const billing = party.billingAddress || {}
  const address = party.address || billing.addressLine1 || party.billingAddressLine1 || billing.line1 || ''
  const state = party.state || billing.state || party.billingState || ''
  const pincode = party.pincode || billing.pincode || party.billingPincode || ''
  const city = party.city || billing.city || ''
  const status = party.status || (String(party.deleted).toLowerCase() === 'true' ? 'Inactive' : 'Active')

  return {
    name,
    ledgerType: party.type === 'Both' ? 'Customer / Supplier' : party.type || 'Customer',
    gstin: party.gstin || party.taxId || '',
    mobile: party.mobile || party.phone || '',
    email: party.email || '',
    contactPerson: party.contactPerson || party.primaryContactName || '',
    address,
    city,
    state,
    pincode,
    openingBalance: formatSignedAmount(openingRaw, party.drCr),
    currentBalance: formatSignedAmount(currentRaw, party.drCr),
    creditLimit: creditLimitRaw ? fmt(creditLimitRaw) : '-',
    outstandingAmount: fmt(outstandingRaw),
    outstandingRaw,
    lastPaymentDate: displayDate(lastPayment?.paymentDate || lastPayment?.date),
    totalPurchases: fmt(totalPurchasesRaw),
    totalSales: fmt(totalSalesRaw),
    lastInvoiceDate: displayDate(lastInvoice?.date),
    lastInvoiceAmount: lastInvoice ? fmt(lastInvoice.total) : '-',
    status,
    creditBlocked: Boolean(party.creditBlocked) || (creditLimitRaw > 0 && outstandingRaw > creditLimitRaw),
  }
}

function buildItemInsight(item, invoices = [], purchases = [], itemMaster = []) {
  if (!item) return null
  const master = itemMaster.find((row) => sameName(row.name, item.name)) || item
  const name = master.name || item.name || ''
  const salesRows = invoices
    .flatMap((invoice) => (invoice.items || [])
      .filter((line) => sameName(line.desc, name))
      .map((line) => ({
        date: displayDate(invoice.date),
        invoiceNo: invoice.id || '-',
        customer: invoice.party || '-',
        qty: Number(line.qty) || 0,
        rate: fmt(Number(line.rate) || 0),
        stamp: dateStamp(invoice.date),
      })))
    .sort((a, b) => b.stamp - a.stamp)
    .slice(0, 5)
  const purchaseRows = purchases
    .flatMap((purchase) => (purchase.items || [])
      .filter((line) => sameName(line.desc, name))
      .map((line) => ({
        date: purchase.date,
        supplier: purchase.supplier || '-',
        rate: Number(line.rate) || 0,
        stamp: dateStamp(purchase.date),
      })))
    .sort((a, b) => b.stamp - a.stamp)
  const lastPurchase = purchaseRows[0]
  const purchaseRate = Number(master.purchasePrice ?? master.purchaseRate) || 0
  const saleRate = Number(master.salesPrice ?? master.saleRate ?? master.lastRate) || 0
  const discountRaw = Number(master.discount) || 0
  const netRate = Math.max(saleRate - (saleRate * discountRaw / 100), 0)
  const currentStockRaw = Number(master.stockQty ?? master.currentStock) || 0
  const reservedRaw = Number(master.reservedStock) || 0
  const availableRaw = Math.max(currentStockRaw - reservedRaw, 0)
  const reorderRaw = Number(master.reorderLevel) || 10
  const shelf = shelfLife(master.expiryDate)
  const expiryTone = shelf.days !== null && shelf.days <= 90 ? 'orange' : undefined
  const lowStock = availableRaw <= reorderRaw

  return {
    name,
    genericName: master.genericName || master.notesTag || name,
    company: master.company || master.manufacturer || '-',
    category: master.category || 'Other Goods',
    hsn: master.hsn || master.hsnCode || '-',
    batchNo: master.batchNo || '-',
    mfgDate: displayDate(master.mfgDate),
    expiryDate: displayDate(master.expiryDate),
    shelfLife: shelf.label,
    expiryTone,
    purchaseRate: fmt(purchaseRate),
    saleRate: fmt(saleRate),
    netRate: fmt(netRate),
    mrp: fmt(Number(master.mrp) || saleRate),
    discount: `${discountRaw}%`,
    gstPercent: `${Number(master.gst ?? master.gstSlab) || 0}%`,
    gstType: master.gstType || master.taxType || 'Exclusive',
    currentStock: currentStockRaw,
    reservedStock: reservedRaw,
    availableStock: availableRaw,
    availableRaw,
    reorderLevel: reorderRaw,
    lowStock,
    stockTone: lowStock ? 'red' : 'green',
    lastSales: salesRows,
    lastPurchaseDate: displayDate(lastPurchase?.date),
    lastPurchaseRate: lastPurchase ? fmt(lastPurchase.rate) : '-',
    supplierName: lastPurchase?.supplier || '-',
  }
}

function sameName(left = '', right = '') {
  return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase()
}

function sumBy(rows, getValue) {
  return rows.reduce((sum, row) => sum + (Number(getValue(row)) || 0), 0)
}

function sortByDateDesc(rows) {
  return [...rows].sort((a, b) => dateStamp(b.date) - dateStamp(a.date))
}

function dateStamp(value) {
  if (!value) return 0
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime()
  const normalized = String(value).replace(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/, '$1 $2 $3')
  const fallback = new Date(normalized)
  return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime()
}

function displayDate(value) {
  if (!value) return '-'
  const stamp = dateStamp(value)
  if (!stamp) return String(value)
  return new Date(stamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function shelfLife(expiryDate) {
  if (!expiryDate) return { days: null, label: '-' }
  const stamp = dateStamp(expiryDate)
  if (!stamp) return { days: null, label: String(expiryDate) }
  const days = Math.ceil((stamp - Date.now()) / 86400000)
  if (days < 0) return { days, label: 'Expired' }
  return { days, label: `${days} days` }
}

function formatSignedAmount(value, suffix = '') {
  const label = fmt(Math.abs(Number(value) || 0))
  return suffix ? `${label} ${suffix}` : label
}

function emptyDash(value) {
  if (value === 0) return 0
  return value || '-'
}

function isZeroLikeValue(value) {
  const normalized = String(value ?? '').trim()
  return normalized !== '' && Number(normalized) === 0
}

const ERP_ACTION_BUTTON = {
  minHeight: 32,
  borderRadius: 0,
  boxShadow: 'none',
  fontWeight: 600,
}

const ERP_PRIMARY_BUTTON = {
  ...ERP_ACTION_BUTTON,
  background: '#111',
}