"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { fmtShort, todayISO } from '@/utils/helpers.js'
import {
  Card,
  CardBody,
  FormGrid,
  Input,
  KpiCard,
  PageHeader,
} from '@/components/frontendUi/index.js'
import { Avatar, Badge } from '@/components/frontendUi/index.js'
import Button from '@/components/frontendUi/Button.jsx'
import Modal from '@/components/frontendUi/Modal.jsx'
import useFocusZone from '@/hooks/useFocusZone'


export default function WorkersPage() {
  const { workers, addWorker, paySalary } = useApp()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', phone: '', salary: '', join: todayISO() })
  const totalSalary = workers.reduce((sum, worker) => sum + worker.salary, 0)
  const workersGridFocus = useFocusZone({ orientation: 'grid', columns: 3 })

  const handleSave = () => {
    if (!form.name.trim()) {
      toast('Name is required', 'error')
      return
    }
    addWorker({ ...form, salary: parseFloat(form.salary) || 0, attendance: 26, days: 26 })
    toast(`${form.name} added`, 'success')
    setOpen(false)
    setForm({ name: '', role: '', phone: '', salary: '', join: todayISO() })
  }

  return (
    <div className="animate-slide">
      <PageHeader title="Workers" sub={`${workers.length} staff members with salary tracking.`} right={<Button variant="primary" onClick={() => setOpen(true)}>+ Add Worker</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <KpiCard label="Total Staff" value={workers.length} />
        <KpiCard label="Salary Payable" value={fmtShort(totalSalary)} />
        <KpiCard label="Total Advances" value={fmtShort(workers.reduce((sum, worker) => sum + (worker.advance || 0), 0))} />
        <KpiCard label="Salary Pending" value={workers.filter((worker) => !worker.paid).length} sub="workers" />
      </div>
      <div id="workers-grid" ref={workersGridFocus.ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {workers.map((worker, index) => (
          <Card
            key={worker.id}
            data-focus-item="true"
            tabIndex={index === 0 ? 0 : -1}
            role="button"
            aria-label={`${worker.name} worker card`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (!worker.paid) {
                  paySalary(worker.id)
                  toast(`Salary paid to ${worker.name}`, 'success')
                }
              }
            }}
            style={{ cursor: worker.paid ? 'default' : 'pointer' }}
          >
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={worker.name} size={38} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{worker.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-40)' }}>{worker.role}</div>
                  </div>
                </div>
                <Badge status={worker.paid ? 'Paid' : 'Pending'} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="primary" tabIndex={-1} style={{ flex: 1, justifyContent: 'center' }} onClick={() => { paySalary(worker.id); toast(`Salary paid to ${worker.name}`, 'success') }} disabled={worker.paid}>
                  {worker.paid ? 'Paid' : 'Pay Salary'}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Worker">
        <Input label="Full Name *" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <FormGrid cols={2}>
          <Input label="Role / Designation" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        </FormGrid>
        <FormGrid cols={2}>
          <Input label="Monthly Salary (₹)" type="number" value={form.salary} onChange={(event) => setForm((current) => ({ ...current, salary: event.target.value }))} />
          <Input label="Join Date" type="date" value={form.join} onChange={(event) => setForm((current) => ({ ...current, join: event.target.value }))} />
        </FormGrid>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Worker</Button>
        </div>
      </Modal>
    </div>
  )
}