"use client"
import React, { useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import FileImportConverter from '@/components/import/FileImportConvert.jsx'
import { Button, Modal } from '@/components/frontendUi/index.js'

const IMPORT_OPTIONS = [
  { id: 'sales', label: 'Sales Data' },
  { id: 'purchases', label: 'Purchase Data' },
  { id: 'parties', label: 'Party Data' },
  { id: 'products', label: 'Product Data' },
  { id: 'expenses', label: 'Expense Data' },
  { id: 'complete', label: 'Complete ERP Data' },
]

export default function ErpImportModal({ open, onClose, defaultKind = 'complete' }) {
  const { importData, clearImportedData, importMeta } = useApp()
  const toast = useToast()
  const [importKind, setImportKind] = useState(defaultKind)
  const [lastStats, setLastStats] = useState(null)

  const handleImportComplete = (result, applyOptions = {}) => {
    const outcome = importData(result, { importKind, ...applyOptions })
    if (!outcome.ok) {
      const firstError = outcome.errors?.[0]?.message || 'Import failed. Please review the validation report.'
      toast(firstError, 'error')
      return outcome
    }

    setLastStats(outcome.stats)
    toast(applyOptions.importAnyway ? 'Business data imported with warnings' : 'Business data imported and applied across the app', 'success')
    return outcome
  }

  const handleClear = () => {
    clearImportedData()
    setLastStats(null)
    toast('Imported data cleared. Demo data is active again.', 'success')
  }

  return (
    <Modal open={open} onClose={onClose} title="Import Business Data" width={980}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {IMPORT_OPTIONS.map((option) => (
            <Button
              key={option.id}
              variant={importKind === option.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setImportKind(option.id)
                setLastStats(null)
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <FileImportConverter
          key={importKind}
          title={`Upload ${IMPORT_OPTIONS.find((option) => option.id === importKind)?.label || 'ERP Data'}`}
          subtitle="Drag a file here or use the upload button. Data is mapped automatically, reviewed, then merged into only the matching ERP modules."
          importKind={importKind}
          onImportComplete={handleImportComplete}
        />

        {(lastStats || importMeta) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-40)' }}>
              Last import: <strong style={{ color: 'var(--ink)' }}>{importMeta?.fileName || 'Current session'}</strong>
              {lastStats && ` | Records ${lastStats.records ?? 0} | Sales ${lastStats.invoices ?? 0} | Purchases ${lastStats.purchases ?? 0} | Items ${lastStats.items ?? 0}`}
            </div>
            <Button variant="danger" size="sm" onClick={handleClear}>
              Clear Imported Data
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
