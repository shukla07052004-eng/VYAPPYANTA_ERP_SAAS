"use client"
import { useApp } from '@/context/AppContext.jsx'
import { fmt, fmtShort} from '@/utils/helpers.js'
import {
  Card,
  CardHead,
  KpiCard,
  PageHeader,
  Table,
} from '@/components/frontendUi/index.js'

export default function DuesPage() {
  const { invoices, purchases } = useApp()
  const dues = invoices.filter((invoice) => invoice.status !== 'Paid').map((invoice) => ({
    party: invoice.party,
    bill: invoice.id,
    billAmt: invoice.total,
    paid: invoice.paid,
    due: invoice.total - invoice.paid,
  }))
  const totalDue = dues.reduce((sum, row) => sum + row.due, 0)
  const totalPayable = purchases.reduce((sum, purchase) => {
    const amount = Number(purchase.amount) || 0
    const paid = Number(purchase.paid) || 0
    return sum + Math.max(amount - paid, 0)
  }, 0)

  return (
    <div className="animate-slide">
      <PageHeader title="Dues & Payments" sub="Bill-wise outstanding receivables and payables." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        <KpiCard label="Total Receivable" value={fmtShort(totalDue)} sub={`${dues.length} pending`} />
        <KpiCard label="Total Payable" value={fmtShort(totalPayable)} />
        <KpiCard label="Net Position" value={fmtShort(totalDue - totalPayable)} />
      </div>
      <Card>
        <CardHead title="Outstanding Bills" />
        <Table cols={[
          { key: 'party', label: 'Party' },
          { key: 'bill', label: 'Bill No', mono: true, dim: true },
          { key: 'billAmt', label: 'Bill Amt', right: true, render: (value) => fmt(value) },
          { key: 'paid', label: 'Paid', right: true, render: (value) => fmt(value) },
          { key: 'due', label: 'Due', right: true, render: (value) => <strong style={{ color: 'var(--red)' }}>{fmt(value)}</strong> },
        ]}
          focusId="dues-list"
          rows={dues}
        />
      </Card>
    </div>
  )
}