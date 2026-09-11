"use client"
import React, { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { UTILITY_DEFINITIONS } from '@/data/erpModules.js'
import { Card, CardBody, CardHead, FormGrid, Input, KpiCard, PageHeader, Select, Table, Textarea } from '@/components/frontendUi/index.js'
import Button from '@/components/frontendUi/Button.jsx'
import { fmt, fmtShort, todayISO } from '@/utils/helpers.js'

const PRODUCT_TYPE_OPTIONS = ['Tablet', 'Capsule', 'Softgel', 'Syrup', 'Infusion', 'Injection', 'Other Goods']

export default function UtilityModulePage() {
  const { modules: moduleId } = useParams()
  const router = useRouter()
  const toast = useToast()
  const { companies, sharedCompanies, backupSettings, saveBackupSettings, addCompany, deletedItems, itemMaster, stockLedger, reports, importFromParsedPayload } = useApp()
  const [tab, setTab] = useState('my-companies')
  const [companyForm, setCompanyForm] = useState({ companyName: '', ownerName: '', gstNumber: '', mobile: '', email: '', address: '', state: '', pincode: '', financialYear: '2026-27', businessType: '' })
  const [importAppliedAt, setImportAppliedAt] = useState(null)

  const handleImportComplete = useCallback((importResult) => {
    if (!importResult?.success) return { ok: false, errors: importResult?.errors || [] }
    const outcome = importFromParsedPayload(importResult)
    if (!outcome.ok) {
      toast(outcome.errors?.[0]?.message || 'Import validation passed but ERP sync failed.', 'error')
      return outcome
    }
    const stats = outcome.stats || {}
    setImportAppliedAt(new Date().toISOString())
    toast(
      `ERP updated: ${stats.records ?? 0} rows → ${stats.items ?? 0} items, ${stats.invoices ?? 0} sales, ${stats.purchases ?? 0} purchases`,
      'success',
    )
    return outcome
  }, [importFromParsedPayload, toast])
  const utilityModule = UTILITY_DEFINITIONS.find((entry) => entry.id === moduleId)
  if (!utilityModule) return null

  if (moduleId === 'manage-companies') {
    return (
      <div className="animate-slide">
        <PageHeader title="Manage Companies" sub="My Companies and Shared With Me in a single ERP-style management workspace." />
        <Card>
          <CardBody style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setTab('my-companies')} style={{ ...tabStyle, background: tab === 'my-companies' ? '#111' : 'var(--surface-2)', color: tab === 'my-companies' ? '#fff' : 'var(--ink)' }}>My Companies</button>
              <button type="button" onClick={() => setTab('shared-with-me')} style={{ ...tabStyle, background: tab === 'shared-with-me' ? '#111' : 'var(--surface-2)', color: tab === 'shared-with-me' ? '#fff' : 'var(--ink)' }}>Shared With Me</button>
            </div>
            {tab === 'my-companies' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <Card>
                  <CardHead title="Restore Backup" sub="PDF-based backup upload with drag-and-drop zone." />
                  <CardBody>
                    <div style={dropzoneStyle}><strong>Drop backup PDF here</strong><div style={{ fontSize: 12, color: 'var(--ink-40)' }}>Restore company data from backup file.</div></div>
                    <Table focusId="company-list" cols={[{ key: 'name', label: 'Company', bold: true }, { key: 'owner', label: 'Owner' }, { key: 'financialYear', label: 'FY' }, { key: 'businessType', label: 'Business Type' }]} rows={companies.map((company) => ({ ...company, financialYear: company.financialYear || '2024-25', businessType: company.businessType || 'Trading' }))} />
                  </CardBody>
                </Card>
                <Card>
                  <CardHead title="Add Company" sub="Clean ERP-style company form." />
                  <CardBody style={{ display: 'grid', gap: 10 }}>
                    <FormGrid cols={2}>
                      <Input label="Company Name" value={companyForm.companyName} onChange={(event) => setCompanyForm((current) => ({ ...current, companyName: event.target.value }))} />
                      <Input label="Owner Name" value={companyForm.ownerName} onChange={(event) => setCompanyForm((current) => ({ ...current, ownerName: event.target.value }))} />
                      <Input label="GST Number" value={companyForm.gstNumber} onChange={(event) => setCompanyForm((current) => ({ ...current, gstNumber: event.target.value }))} />
                      <Input label="Mobile Number" value={companyForm.mobile} onChange={(event) => setCompanyForm((current) => ({ ...current, mobile: event.target.value }))} />
                      <Input label="Email" value={companyForm.email} onChange={(event) => setCompanyForm((current) => ({ ...current, email: event.target.value }))} />
                      <Input label="State" value={companyForm.state} onChange={(event) => setCompanyForm((current) => ({ ...current, state: event.target.value }))} />
                      <Input label="Pincode" value={companyForm.pincode} onChange={(event) => setCompanyForm((current) => ({ ...current, pincode: event.target.value }))} />
                      <Input label="Financial Year" value={companyForm.financialYear} onChange={(event) => setCompanyForm((current) => ({ ...current, financialYear: event.target.value }))} />
                      <Input label="Business Type" value={companyForm.businessType} onChange={(event) => setCompanyForm((current) => ({ ...current, businessType: event.target.value }))} />
                    </FormGrid>
                    <Textarea label="Address" rows={3} value={companyForm.address} onChange={(event) => setCompanyForm((current) => ({ ...current, address: event.target.value }))} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="primary" onClick={() => { addCompany(companyForm); setCompanyForm({ companyName: '', ownerName: '', gstNumber: '', mobile: '', email: '', address: '', state: '', pincode: '', financialYear: '2026-27', businessType: '' }) }}>Add Company</Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <Table focusId="shared-companies-table" cols={[{ key: 'name', label: 'Company', bold: true }, { key: 'owner', label: 'Owner Details' }, { key: 'sharedDate', label: 'Shared Date' }, { key: 'accessType', label: 'Access Type' }, { key: '_open', label: '', sortable: false, render: () => <Button size="sm" variant="ghost">Open Company</Button> }]} rows={sharedCompanies} />
            )}
          </CardBody>
        </Card>
      </div>
    )
  }

  if (moduleId === 'backup-restore') {
    return (
      <div className="animate-slide">
        <PageHeader title="Backup & Restore" sub="Auto backup, device backup, email backup and restore controls." />
        <Card>
          <CardBody>
            <FormGrid cols={2}>
              <Select label="Enable Auto Backup" value={backupSettings.autoBackupEnabled ? 'Enabled' : 'Disabled'} options={['Enabled', 'Disabled']} onChange={(event) => saveBackupSettings({ autoBackupEnabled: event.target.value === 'Enabled' })} />
              <Input label="Backup Destination" value={backupSettings.destination} onChange={(event) => saveBackupSettings({ destination: event.target.value })} />
              <Input label="Backup Schedule" value={backupSettings.schedule} onChange={(event) => saveBackupSettings({ schedule: event.target.value })} />
              <Input label="Reminder" value={backupSettings.reminder} onChange={(event) => saveBackupSettings({ reminder: event.target.value })} />
            </FormGrid>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (moduleId === 'data-verification') {
    return (
      <AnalyticsDetailPage
        title="Data Verification"
        sub="Missing invoice detection, duplicate items, GST checks and stock mismatch alerts."
        onBack={() => router.push('/utilities')}
        focusId="verification-matrix"
        kpis={[
          { label: 'Invoices', value: reports.filteredSales.length },
          { label: 'Items', value: itemMaster.length },
          { label: 'Stock Alerts', value: stockLedger.filter((row) => row.closingQty <= 5).length },
          { label: 'Corrections', value: 6 },
        ]}
        rows={[
          { item: 'Missing invoice detection', qty: 'Ready', value: reports.filteredSales.length, note: 'Sequence verified' },
          { item: 'Duplicate item detection', qty: 'Ready', value: itemMaster.length, note: 'Review duplicates' },
          { item: 'Wrong GST entries', qty: 'Review', value: reports.filteredSales.reduce((sum, row) => sum + (row.tax || 0), 0), note: 'GST validation' },
          { item: 'Stock mismatch alerts', qty: 'Alert', value: stockLedger.filter((row) => row.closingQty <= 5).length, note: 'Low stock risk' },
        ]}
      />
    )
  }

  if (moduleId === 'item-libraries') {
    return (
      <AnalyticsDetailPage
        title="Item Libraries"
        sub="Recycle-bin style deleted-item recovery and restore history."
        onBack={() => router.push('/utilities')}
        focusId="item-library-table"
        kpis={[
          { label: 'Deleted Items', value: deletedItems.length },
          { label: 'Recoverable', value: deletedItems.length },
          { label: 'Restore Versions', value: deletedItems.reduce((sum, row) => sum + (row.version || 1), 0) },
          { label: 'Active Library', value: itemMaster.length },
        ]}
        rows={deletedItems.map((item) => ({ item: item.name, qty: item.version || 1, value: item.stockQty, note: 'Recoverable' }))}
      />
    )
  }

  if (moduleId === 'bulk-update-tax-slab') {
    return (
      <AnalyticsDetailPage
        title="Bulk Tax Update"
        sub="Filter items, preview GST changes and confirm backup before apply."
        onBack={() => router.push('/utilities')}
        focusId="bulk-tax-preview"
        kpis={[
          { label: 'Items Selected', value: itemMaster.length },
          { label: 'Categories', value: PRODUCT_TYPE_OPTIONS.length },
          { label: 'Backup Required', value: 'Yes' },
          { label: 'Preview Rows', value: Math.min(itemMaster.length, 10) },
        ]}
        rows={itemMaster.slice(0, 10).map((item) => ({ item: item.name, qty: `${item.gstSlab}%`, value: item.stockQty, note: 'Preview' }))}
      />
    )
  }

  if (moduleId === 'import-items') {
    return (
      <div className="animate-slide">
        <PageHeader
          title="Import Items"
          sub="Upload Excel or CSV exports from Marg ERP, Tally, or custom formats. Parsed data is applied to Sales, Purchase, Parties, Items, Stock, and Reports automatically."
          right={<Button variant="ghost" onClick={() => router.push('/utilities')}>Back</Button>}
        />
        {importAppliedAt && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--green-bg)', border: '1px solid var(--green-br)', color: 'var(--green)', fontSize: 13 }}>
            Last ERP sync: {new Date(importAppliedAt).toLocaleString('en-IN')} — open Sales, Purchase, Parties, Items, or Dashboard to review imported data.
          </div>
        )}
        {/* <FileImportConverter
          title="Excel / CSV to JSON Converter"
          subtitle="Supports Marg ERP fields: Item Name, Batch, Expiry, MRP, Sale Rate, Purchase Rate, HSN, GST, Stock."
          useBackend={false}
          importKind="products"
          onImportComplete={handleImportComplete}
        /> */}
      </div>
    )
  }

  if (moduleId === 'export-items') {
    return (
      <AnalyticsDetailPage
        title="Export Items"
        sub="Excel/CSV export from central item master."
        onBack={() => router.push('/utilities')}
        focusId="export-items-table"
        kpis={[
          { label: 'Master Items', value: itemMaster.length },
          { label: 'CSV Ready', value: 'Yes' },
          { label: 'Excel Ready', value: 'Yes' },
          { label: 'Sample Format', value: 'Ready' },
        ]}
        rows={itemMaster.slice(0, 10).map((item) => ({ item: item.name, qty: item.stockQty, value: item.salesPrice, note: 'Ready' }))}
      />
    )
  }

  return (
    <AnalyticsDetailPage
      title="Sync & Share"
      sub="Share company data and monitor sync queues."
      onBack={() => router.push('/utilities')}
      focusId="sync-share-table"
      kpis={[
        { label: 'Shared Companies', value: sharedCompanies.length },
        { label: 'Sync Jobs', value: 4 },
        { label: 'Pending', value: 1 },
        { label: 'Exports', value: 3 },
      ]}
      rows={[
        { item: 'Ram Kishore & Sons', qty: 'Cloud Sync', value: '15 May 2026', note: 'Active' },
        { item: 'Shree Agencies', qty: 'Shared Access', value: '15 May 2026', note: 'Pending' },
        { item: 'Northline Distributors', qty: 'Device Sync', value: '14 May 2026', note: 'Active' },
      ]}
    />
  )
}

function AnalyticsDetailPage({ title, sub, kpis, rows, onBack, focusId }) {
  return (
    <div className="animate-slide">
      <PageHeader title={title} sub={sub} right={<Button variant="ghost" onClick={onBack}>Back</Button>} />
      <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>
      <Card>
        <CardHead title="Analysis Detail" />
        <Table
          focusId={focusId}
          cols={[
            { key: 'item', label: 'Name', bold: true },
            { key: 'qty', label: 'Metric', dim: true },
            { key: 'value', label: 'Value', right: true, render: (value) => typeof value === 'number' ? fmt(value) : value },
            { key: 'note', label: 'Note', dim: true },
          ]}
          rows={rows}
        />
      </Card>
    </div>
  )
}


const tabStyle = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12.5,
  fontWeight: 700,
}

const dropzoneStyle = {
  border: '1px dashed var(--border-3)',
  borderRadius: 'var(--r-md)',
  background: 'var(--surface-2)',
  padding: '18px 16px',
  display: 'grid',
  gap: 6,
  textAlign: 'center',
  marginBottom: 14,
}
