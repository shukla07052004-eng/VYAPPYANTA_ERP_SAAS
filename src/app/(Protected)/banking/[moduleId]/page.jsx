"use client"
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext.jsx'
import { BANKING_DEFINITIONS } from '@/data/erpModules.js'
import { Card, CardBody, CardHead, FormGrid, Input, KpiCard, Modal, PageHeader, Select, Table, Textarea } from '@/components/frontendUi/index.js'
import Button from '@/components/frontendUi/Button.jsx'
import { fmt, fmtShort, todayISO } from '@/utils/helpers.js'


export default function BankingModulePage() {
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
function SummaryStrip({ values }) {
  return (
    <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
      {values.map(([label, value]) => <KpiCard key={label} label={label} value={value} />)}
    </div>
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