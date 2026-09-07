"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { AI_REPORT_DEFINITIONS, BANKING_DEFINITIONS, UTILITY_DEFINITIONS } from '@/data/erpModules.js'
import { Card, CardBody, CardHead, FormGrid, Input, KpiCard, PageHeader, Select, Table, Textarea } from '@/components/frontendUi/index.js'
import Button from '@/components/frontendUi/Button.jsx'
import Modal from '@/components/frontendUi/Modal.jsx'
import { consumeSequentialEnter } from '@/utils/erpEnterNav.js'
import { fmt, fmtShort, todayISO } from '@/utils/helpers.js'
// import FileImportConverter from '@/modules/file-import/components/FileImportConverter.jsx'   
// import ErpImportModal from '@/components/import/ErpImportModal.jsx'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = ['Active', 'Inactive', 'Discontinued']
const PRODUCT_TYPE_OPTIONS = ['Tablet', 'Capsule', 'Softgel', 'Syrup', 'Infusion', 'Injection', 'Other Goods']
const GST_OPTIONS = [0, 5, 12, 18, 28]
const EXPIRY_ALERT_DAYS = 60
let lastSelectedProductType = 'Tablet'
let lastSelectedGstSlab = 12

export function BankingDashboardPage() {
  return (
    <DashboardCardPage
      title="Banking"
      sub="Loan accounts, checks, bank accounts and cash-in-hand flow from one clean banking dashboard."
      focusId="banking-dashboard"
      cards={BANKING_DEFINITIONS}
    />
  )
}

export function UtilitiesDashboardPage() {
  return (
    <DashboardCardPage
      title="Important Utilities"
      sub="Company management, backup, verification, item libraries and sync tools stay grouped here."
      focusId="utilities-dashboard"
      cards={UTILITY_DEFINITIONS}
    />
  )

}

export function BankingModulePage() {
  const { moduleId } = useParams()
  const router = useRouter()
  const { loans, checks, bankAccounts, cashTransactions, upsertLoan, deleteLoan, upsertBankAccount, deleteBankAccount } = useApp()
  const module = BANKING_DEFINITIONS.find((entry) => entry.id === moduleId)
  const [editor, setEditor] = useState(null)
  if (!module) return null

  if (moduleId === 'loan-accounts') {
    return (
      <div className="animate-slide">
        <PageHeader title="Loan Accounts" sub="Loan master, EMI due dates, payment history and repayment summary." right={<Button variant="primary" onClick={() => setEditor({ id: '', name: '', institution: '', interestRate: 0, emiAmount: 0, dueDate: todayISO(), remainingBalance: 0, totalPaid: 0, pendingAmount: 0, status: 'Active', reminder: '' })}>+ Add Loan</Button>} />
        <SummaryStrip values={[
          ['Outstanding', fmtShort(loans.reduce((sum, loan) => sum + loan.remainingBalance, 0))],
          ['EMI Total', fmtShort(loans.reduce((sum, loan) => sum + loan.emiAmount, 0))],
          ['Active Loans', loans.length],
          ['Paid Amount', fmtShort(loans.reduce((sum, loan) => sum + loan.totalPaid, 0))],
        ]}
        />
        <Card>
          <CardHead title="Loan Register" />
          <Table
            focusId="loan-accounts-table"
            cols={[
              { key: 'name', label: 'Loan Account', bold: true },
              { key: 'institution', label: 'Bank / Company' },
              { key: 'interestRate', label: 'Interest', right: true, render: (value) => `${value}%` },
              { key: 'emiAmount', label: 'EMI', right: true, render: (value) => fmt(value) },
              { key: 'dueDate', label: 'Due Date', dim: true },
              { key: 'remainingBalance', label: 'Balance', right: true, render: (value) => fmt(value) },
              { key: 'status', label: 'Status', render: (value) => <StatusChip status={value} /> },
              { key: '_act', label: '', sortable: false, render: (_, row) => <ActionCell onEdit={() => setEditor(row)} onDelete={() => deleteLoan(row.id)} /> },
            ]}
            rows={loans}
          />
        </Card>
        <LoanEditorModal value={editor} onClose={() => setEditor(null)} onSave={(payload) => { upsertLoan(payload); setEditor(null) }} />
      </div>
    )
  }

  if (moduleId === 'checks') {
    return (
      <AnalyticsDetailPage
        title="Checks"
        sub="Search, filters, status indicators and detailed check tracking."
        onBack={() => router.push('/banking')}
        focusId="checks-table"
        kpis={[
          { label: 'Pending', value: checks.filter((row) => row.status === 'Pending').length },
          { label: 'Cleared', value: checks.filter((row) => row.status === 'Cleared').length },
          { label: 'Bounced', value: checks.filter((row) => row.status === 'Bounced').length },
          { label: 'Total Amount', value: fmtShort(checks.reduce((sum, row) => sum + row.amount, 0)) },
        ]}
        rows={checks.map((row) => ({ item: row.company, qty: row.checkNumber, value: row.amount, note: row.status }))}
      />
    )
  }

  if (moduleId === 'bank-accounts') {
    return (
      <div className="animate-slide">
        <PageHeader title="Bank Accounts" sub="Balances, IFSC, branch, transactions and transfer records." right={<Button variant="primary" onClick={() => setEditor({ id: '', bankName: '', accountHolder: '', accountNo: '', ifsc: '', branch: '', balance: 0, incomingPayments: 0, outgoingPayments: 0, pendingTransfers: 0, recentTransactions: [], transfers: [] })}>+ Add Bank Account</Button>} />
        <SummaryStrip values={[
          ['Total Bank Balance', fmtShort(bankAccounts.reduce((sum, row) => sum + row.balance, 0))],
          ['Incoming Payments', fmtShort(bankAccounts.reduce((sum, row) => sum + row.incomingPayments, 0))],
          ['Outgoing Payments', fmtShort(bankAccounts.reduce((sum, row) => sum + row.outgoingPayments, 0))],
          ['Pending Transfers', bankAccounts.reduce((sum, row) => sum + row.pendingTransfers, 0)],
        ]}
        />
        <Card>
          <CardHead title="Accounts Register" />
          <Table
            focusId="bank-accounts-table"
            cols={[
              { key: 'bankName', label: 'Bank', bold: true },
              { key: 'accountHolder', label: 'Account Holder' },
              { key: 'accountNo', label: 'Account', mono: true },
              { key: 'ifsc', label: 'IFSC', mono: true },
              { key: 'branch', label: 'Branch', dim: true },
              { key: 'balance', label: 'Current Balance', right: true, render: (value) => fmt(value) },
              { key: '_act', label: '', sortable: false, render: (_, row) => <ActionCell onEdit={() => setEditor(row)} onDelete={() => deleteBankAccount(row.id)} /> },
            ]}
            rows={bankAccounts}
          />
        </Card>
        <BankEditorModal value={editor} onClose={() => setEditor(null)} onSave={(payload) => { upsertBankAccount(payload); setEditor(null) }} />
      </div>
    )
  }

  return (
    <AnalyticsDetailPage
      title="Cash In Hand"
      sub="Daily transactions, opening balance, closing balance and cash summary."
      onBack={() => router.push('/banking')}
      focusId="cash-transactions-table"
      kpis={[
        { label: 'Opening', value: fmtShort(cashTransactions[0]?.amount || 0) },
        { label: 'Income', value: fmtShort(cashTransactions.filter((row) => row.flow === 'In').reduce((sum, row) => sum + row.amount, 0)) },
        { label: 'Expense', value: fmtShort(cashTransactions.filter((row) => row.flow === 'Out').reduce((sum, row) => sum + row.amount, 0)) },
        { label: 'Closing', value: fmtShort(cashTransactions.filter((row) => row.flow === 'In').reduce((sum, row) => sum + row.amount, 0) - cashTransactions.filter((row) => row.flow === 'Out').reduce((sum, row) => sum + row.amount, 0)) },
      ]}
      rows={cashTransactions.map((row) => ({ item: row.narration, qty: row.date, value: row.amount, note: row.flow }))}
    />
  )
}

export function UtilityModulePage() {
  const { moduleId } = useParams()
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
  const module = UTILITY_DEFINITIONS.find((entry) => entry.id === moduleId)
  if (!module) return null

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
        <FileImportConverter
          title="Excel / CSV to JSON Converter"
          subtitle="Supports Marg ERP fields: Item Name, Batch, Expiry, MRP, Sale Rate, Purchase Rate, HSN, GST, Stock."
          useBackend={false}
          importKind="products"
          onImportComplete={handleImportComplete}
        />
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

function DashboardCardPage({ title, sub, cards, focusId }) {
  const router = useRouter()
  return (
    <div className="animate-slide">
      <PageHeader title={title} sub={sub} />
      <div id={focusId} className="reports-card-grid">
        {cards.map((card, index) => {
          const isSalesPrediction = card.id === 'sales-prediction'
          const targetPath = isSalesPrediction ? '/ai-reports/sales-prediction/forecast' : card.path
          return (
            <div key={card.id} style={{ position: 'relative' }}>
              <Card
                className="focusable-card"
                data-focus-item="true"
                tabIndex={index === 0 ? 0 : -1}
                role="button"
                onClick={() => router.push(targetPath)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    router.push(targetPath)
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CardBody style={{ display: 'grid', gap: 8 }}>
                  <strong style={{ fontSize: 13.5 }}>{card.name}</strong>
                  <div style={{ fontSize: 12, color: 'var(--ink-40)' }}>{card.desc}</div>
                </CardBody>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
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

function ItemEditorModal({ value, onClose, onSave }) {
  if (!value) return null
  return (
    <Modal open={Boolean(value)} onClose={onClose} title={value.id ? 'Edit Item' : 'Add Item'} width={1120}>
      <ItemEditorForm initialValue={value} onClose={onClose} onSave={onSave} />
    </Modal>
  )
}

function LoanEditorModal({ value, onClose, onSave }) {
  if (!value) return null
  return (
    <Modal open={Boolean(value)} onClose={onClose} title={value.id ? 'Edit Loan' : 'Add Loan'}>
      <LoanEditorForm initialValue={value} onClose={onClose} onSave={onSave} />
    </Modal>
  )
}

function LoanEditorForm({ initialValue, onClose, onSave }) {
  const [form, setForm] = useState(initialValue)
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FormGrid cols={2}>
        <Input label="Loan Account Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <Input label="Bank / Company" value={form.institution} onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value }))} />
        <Input label="Interest Rate" type="number" value={form.interestRate} onChange={(event) => setForm((current) => ({ ...current, interestRate: Number(event.target.value) }))} />
        <Input label="EMI Amount" type="number" value={form.emiAmount} onChange={(event) => setForm((current) => ({ ...current, emiAmount: Number(event.target.value) }))} />
        <Input label="Due Date" type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
        <Input label="Remaining Balance" type="number" value={form.remainingBalance} onChange={(event) => setForm((current) => ({ ...current, remainingBalance: Number(event.target.value) }))} />
      </FormGrid>
      <Textarea label="Reminder" value={form.reminder} onChange={(event) => setForm((current) => ({ ...current, reminder: event.target.value }))} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave(form)}>Save Loan</Button>
      </div>
    </div>
  )
}

function BankEditorModal({ value, onClose, onSave }) {
  if (!value) return null
  return (
    <Modal open={Boolean(value)} onClose={onClose} title={value.id ? 'Edit Bank Account' : 'Add Bank Account'}>
      <BankEditorForm initialValue={value} onClose={onClose} onSave={onSave} />
    </Modal>
  )
}

function BankEditorForm({ initialValue, onClose, onSave }) {
  const [form, setForm] = useState(initialValue)
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FormGrid cols={2}>
        <Input label="Bank Name" value={form.bankName} onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))} />
        <Input label="Account Holder" value={form.accountHolder} onChange={(event) => setForm((current) => ({ ...current, accountHolder: event.target.value }))} />
        <Input label="Account Number" value={form.accountNo} onChange={(event) => setForm((current) => ({ ...current, accountNo: event.target.value }))} />
        <Input label="IFSC" value={form.ifsc} onChange={(event) => setForm((current) => ({ ...current, ifsc: event.target.value }))} />
        <Input label="Branch" value={form.branch} onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))} />
        <Input label="Current Balance" type="number" value={form.balance} onChange={(event) => setForm((current) => ({ ...current, balance: Number(event.target.value) }))} />
      </FormGrid>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave(form)}>Save Bank Account</Button>
      </div>
    </div>
  )
}

function SummaryStrip({ values }) {
  return (
    <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
      {values.map(([label, value]) => <KpiCard key={label} label={label} value={value} />)}
    </div>
  )
}

function StatusChip({ status }) {
  const background = status === 'Active'
    ? 'var(--green-bg)'
    : status === 'Deleted' || status === 'Discontinued'
      ? 'var(--red-bg)'
      : 'var(--surface-2)'

  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 999, border: '1px solid var(--border)', background, fontSize: 11.5, fontWeight: 600 }}>{status}</span>
}

function ActionCell({ onEdit, onDelete }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
      <Button size="sm" variant="ghost" tabIndex={-1} onClick={(event) => { event.stopPropagation(); onEdit() }}>Edit</Button>
      <Button size="sm" variant="ghost" tabIndex={-1} onClick={(event) => { event.stopPropagation(); onDelete() }}>Delete</Button>
    </div>
  )
}

function createEmptyItem() {
  return {
    name: '',
    category: lastSelectedProductType,
    batchNo: '',
    mfgDate: todayISO(),
    expiryDate: '',
    expiryAlert: true,
    gstSlab: lastSelectedGstSlab,
    gst: lastSelectedGstSlab,
    purchasePrice: '0',
    salesPrice: '0',
    mrp: '0',
    stockQty: '0',
    discount: '0',
    unitType: 'Nos',
    barcode: '',
    hsn: '',
    notesTag: '',
    notes: '',
    status: 'Active',
  }
}

function normalizeItemForm(value = {}) {
  const next = {
    ...createEmptyItem(),
    ...value,
  }

  return {
    ...next,
    category: PRODUCT_TYPE_OPTIONS.includes(next.category) ? next.category : (lastSelectedProductType || 'Other Goods'),
    batchNo: next.batchNo || '',
    mfgDate: next.mfgDate || todayISO(),
    expiryDate: next.expiryDate || '',
    expiryAlert: next.expiryAlert !== false,
    gstSlab: Number(next.gstSlab ?? lastSelectedGstSlab),
    gst: String(next.gst ?? next.gstSlab ?? lastSelectedGstSlab),
    purchasePrice: String(next.purchasePrice ?? 0),
    salesPrice: String(next.salesPrice ?? 0),
    mrp: String(next.mrp ?? next.salesPrice ?? 0),
    stockQty: String(next.stockQty ?? 0),
    discount: String(next.discount ?? 0),
    barcode: next.barcode || '',
    notesTag: next.notesTag || '',
    notes: next.notes || '',
  }
}

function sanitizeItemForm(form) {
  return {
    ...form,
    name: String(form.name || '').trim(),
    category: PRODUCT_TYPE_OPTIONS.includes(form.category) ? form.category : 'Other Goods',
    batchNo: String(form.batchNo || '').trim().toUpperCase(),
    mfgDate: form.mfgDate || '',
    expiryDate: form.expiryDate || '',
    expiryAlert: Boolean(form.expiryAlert),
    gstSlab: parseDecimalValue(form.gstSlab),
    gst: parseDecimalValue(form.gstSlab),
    purchasePrice: parseDecimalValue(form.purchasePrice),
    salesPrice: parseDecimalValue(form.salesPrice),
    mrp: parseDecimalValue(form.mrp),
    stockQty: parseDecimalValue(form.stockQty),
    discount: parseDecimalValue(form.discount),
    barcode: String(form.barcode || '').trim(),
    notesTag: String(form.notesTag || '').trim().toUpperCase(),
    notes: String(form.notes || '').trim(),
    status: form.status || 'Active',
  }
}

const NumericEntryInput = React.forwardRef(function NumericEntryInput({
  label,
  value,
  onValueChange,
  onKeyDown,
  error,
}, ref) {
  const displayValue = value === '' || value === null || value === undefined ? '0' : String(value)

  return (
    <Input
      ref={ref}
      label={label}
      value={displayValue}
      error={error}
      inputMode="decimal"
      onFocus={selectZeroLikeValue}
      onClick={selectZeroLikeValue}
      onKeyDown={(event) => {
        clearZeroOnType(event)
        onKeyDown?.(event)
      }}
      onChange={(event) => onValueChange(event.target.value)}
      style={itemFieldStyle}
    />
  )
})

function FormSection({ title, subtitle, children }) {
  return (
    <section style={formSectionStyle}>
      <div style={{ display: 'grid', gap: 3 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.02em' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-60)' }}>{subtitle}</div>
      </div>
      {children}
    </section>
  )
}

function ExpiryCell({ item }) {
  const status = getExpiryStatus(item.expiryDate, item.expiryAlert)
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <span>{item.expiryDate ? formatDateLabel(item.expiryDate) : '—'}</span>
      {status && <span style={expiryBadgeStyle(status.variant)}>{status.label}</span>}
    </div>
  )
}

function ExpiryPreview({ item }) {
  const status = getExpiryStatus(item.expiryDate, item.expiryAlert)
  if (!status) {
    return <div style={{ color: 'var(--ink-60)', fontSize: 12.5 }}>No expiry warning for this item yet.</div>
  }

  return (
    <div style={{ display: 'grid', gap: 5, justifyItems: 'end' }}>
      <span style={expiryBadgeStyle(status.variant)}>{status.label}</span>
      <span style={{ color: 'var(--ink-60)', fontSize: 12.5 }}>{status.detail}</span>
    </div>
  )
}

function getExpiryStatus(expiryDate, alertsEnabled = true) {
  if (!alertsEnabled || !expiryDate) return null
  const today = new Date(todayISO())
  const expiry = new Date(expiryDate)
  const diffDays = Math.ceil((expiry - today) / 86400000)

  if (Number.isNaN(diffDays)) return null
  if (diffDays < 0) return { label: 'Expired', detail: `${Math.abs(diffDays)} days overdue`, variant: 'danger' }
  if (diffDays <= EXPIRY_ALERT_DAYS) return { label: 'Near Expiry', detail: `${diffDays} days left`, variant: 'warning' }
  return { label: 'Healthy', detail: `${diffDays} days left`, variant: 'safe' }
}

function parseDecimalValue(value) {
  const parsed = Number.parseFloat(String(value ?? '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function selectZeroLikeValue(event) {
  const target = event.currentTarget
  if (!(target instanceof HTMLInputElement)) return
  if (!isZeroLikeValue(target.value)) return
  requestAnimationFrame(() => target.setSelectionRange?.(0, target.value.length))
}

function clearZeroOnType(event) {
  const target = event.currentTarget
  if (!(target instanceof HTMLInputElement)) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (!/^[0-9.]$/.test(event.key)) return
  if (!isZeroLikeValue(target.value)) return
  event.preventDefault()
  target.value = event.key === '.' ? '0.' : event.key
  target.setSelectionRange?.(target.value.length, target.value.length)
  target.dispatchEvent(new Event('input', { bubbles: true }))
}

function isZeroLikeValue(value) {
  return value === '0' || value === '0.0' || value === '0.00'
}

function previousOption(options, current) {
  const index = Math.max(options.indexOf(current), 0)
  return options[Math.max(index - 1, 0)]
}

function nextOption(options, current) {
  const index = Math.max(options.indexOf(current), 0)
  return options[Math.min(index + 1, options.length - 1)]
}

function formatDateLabel(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const itemFormHeroStyle = {
  background: 'linear-gradient(135deg, #16324f 0%, #244e73 55%, #3d7ba7 100%)',
  borderRadius: 24,
  padding: '22px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  color: '#fff',
  boxShadow: '0 18px 34px rgba(22,50,79,.18)',
}

const heroMetaChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 700,
}

const formSectionStyle = {
  display: 'grid',
  gap: 14,
  padding: '18px 18px 16px',
  border: '1px solid #dce4ea',
  borderRadius: 22,
  background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
  boxShadow: '0 8px 20px rgba(15, 23, 42, .04)',
}

const itemFieldStyle = {
  minHeight: 48,
  padding: '12px 14px',
  borderRadius: 14,
  fontSize: 14,
  borderColor: '#ccd8e4',
  background: '#fcfdff',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8)',
}

const selectorFrameStyle = {
  display: 'grid',
  gap: 12,
  padding: 12,
  borderRadius: 18,
  border: '1px solid #d5e2eb',
  background: 'linear-gradient(180deg, #f8fbfd 0%, #f3f8fb 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9)',
}

const pillButtonStyle = {
  border: '1px solid #c7d8e5',
  background: '#fff',
  color: '#20425b',
  borderRadius: 999,
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 700,
  transition: 'all .16s ease',
}

const activePillButtonStyle = {
  background: '#20425b',
  color: '#fff',
  borderColor: '#20425b',
  boxShadow: '0 8px 18px rgba(32,66,91,.22)',
}

const alertCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  padding: '14px 16px',
  borderRadius: 18,
  border: '1px solid #e5ecf1',
  background: '#f8fbfe',
}

const stickyFooterStyle = {
  position: 'sticky',
  bottom: -20,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  padding: '14px 0 2px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.96) 24%, rgba(255,255,255,1) 100%)',
}

const sectionLabelStyle = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--ink-40)',
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  display: 'block',
  marginBottom: 8,
}

const gstSelectorStyle = {
  display: 'grid',
  gridTemplateColumns: '56px 1fr 56px',
  alignItems: 'center',
  gap: 12,
}

const productTypeSelectorStyle = {
  display: 'grid',
  gridTemplateColumns: '56px 1fr 56px',
  alignItems: 'center',
  gap: 12,
}

const productTypeValueStyle = {
  display: 'grid',
  placeItems: 'center',
  minHeight: 62,
  borderRadius: 18,
  background: 'linear-gradient(135deg, #eef7ff 0%, #f9fcff 100%)',
  border: '1px solid #c9dcef',
  color: '#16324f',
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-.03em',
  textAlign: 'center',
  padding: '0 12px',
}

const productTypeHintStyle = {
  textAlign: 'center',
  fontSize: 12,
  color: 'var(--ink-60)',
  fontWeight: 600,
}

const gstArrowButtonStyle = {
  border: '1px solid #c7d8e5',
  background: '#fff',
  color: '#17344d',
  borderRadius: 16,
  minHeight: 52,
  fontSize: 28,
  lineHeight: 1,
  boxShadow: '0 6px 16px rgba(23,52,77,.08)',
}

const gstValueStyle = {
  display: 'grid',
  placeItems: 'center',
  minHeight: 62,
  borderRadius: 18,
  background: 'linear-gradient(135deg, #fef7e8 0%, #fffdfa 100%)',
  border: '1px solid #f0dcb3',
  color: '#8a4d00',
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: '-.04em',
  transition: 'transform .18s ease',
}

function expiryBadgeStyle(variant) {
  const palette = variant === 'danger'
    ? { color: '#b91c1c', bg: '#fff1f2', border: '#fecdd3' }
    : variant === 'warning'
      ? { color: '#9a5b00', bg: '#fff7e6', border: '#f7d58b' }
      : { color: '#166534', bg: '#effcf3', border: '#bbf7d0' }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    borderRadius: 999,
    padding: '3px 8px',
    fontSize: 11,
    fontWeight: 700,
    border: `1px solid ${palette.border}`,
    background: palette.bg,
    color: palette.color,
  }
}

const miniCardButtonStyle = {
  width: '100%',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  borderRadius: 'var(--r-md)',
  padding: '10px 12px',
  textAlign: 'left',
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