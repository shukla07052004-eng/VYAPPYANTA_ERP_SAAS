
"use client"

import React, { useRef, useState } from "react"
import { useApp } from "@/context/AppContext.jsx"
import { useToast } from "@/context/ToastContext.jsx"
import { fmtShort, todayISO } from "@/utils/helpers.js"

import {
  Card,
  CardBody,
  FormGrid,
  Input,
  KpiCard,
  PageHeader,
  Avatar,
  Badge,
} from "@/components/frontendUi/index.js"

import Button from "@/components/frontendUi/Button.jsx"
import Modal from "@/components/frontendUi/Modal.jsx"
import useFocusZone from "@/hooks/useFocusZone"


export default function WorkersPage() {
  const { workers, paySalary } = useApp()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    salary: "",
    join: "",
  })
  const workersGridFocus = useFocusZone({
    count: workers.length,
    orientation: "grid",
    columns: 3,
  })
  const formRefs = useRef([])
  const focusFormField = (index) => {
    const element = formRefs.current[index]
    if (element instanceof HTMLElement) {
      requestAnimationFrame(() => {
        element.focus({ preventScroll: true })
      })
    }
  }
  const handleFormKeyDown = (index) => (event) => {
    if (event.key !== "Enter") return
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return
    }
    event.preventDefault()
    if (event.shiftKey) {
      if (index > 0) {
        focusFormField(index - 1)
      }
      return
    }
    if (index === 4) {
      handleSave()
      return
    }
    focusFormField(index + 1)
  }
  const resetForm = () => {
    setForm({
      name: "",
      role: "",
      phone: "",
      salary: "",
      join: "",
    })
  }

  const openAddWorker = () => {
    resetForm()
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      const name = form.name.trim()

      if (!name) {
        toast("Name is required", "error")
        focusFormField(0)
        return
      }

      const payload = {
        fullName: name,
        Role: form.role.trim(),
        Phone: form.phone.trim(),
        Salary: Number(form.salary) || 0,
        joinDate: form.join || todayISO(),

        paid: false,
        advance: 0,
      }
      const response = await fetch("/api/Worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      let result

      try {
        result = await response.json()
      } catch {
        throw new Error(
          `API returned an invalid response (${response.status})`
        )
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to add worker"
        )
      }

      toast(`${name} added`, "success")

      setOpen(false)
      resetForm()

    } catch (error) {
      console.error("Add worker error:", error)

      toast(
        error?.message || "Failed to add worker",
        "error"
      )
    }
  }

  /*
   * ---------------------------------------------------------
   * KPI calculations
   * ---------------------------------------------------------
   */

  const totalSalary = workers.reduce(
    (sum, worker) => sum + (Number(worker.salary) || 0),
    0
  )

  const totalAdvances = workers.reduce(
    (sum, worker) => sum + (Number(worker.advance) || 0),
    0
  )

  const pendingSalary = workers.filter(
    (worker) => !worker.paid
  ).length


  return (
    <div className="animate-slide">

      {/* -------------------------------------------------- */}
      {/* Header */}
      {/* -------------------------------------------------- */}

      <PageHeader
        title="Workers"
        sub={`${workers.length} staff members with salary tracking.`}
        right={
          <Button
            variant="primary"
            onClick={openAddWorker}
          >
            + Add Worker
          </Button>
        }
      />

      {/* -------------------------------------------------- */}
      {/* KPIs */}
      {/* -------------------------------------------------- */}

      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16,
        }}
      >
        <KpiCard label="Total Staff" value={workers.length} />
        <KpiCard label="Salary Payable" value={fmtShort(totalSalary)} />
        <KpiCard label="Total Advances" value={fmtShort(totalAdvances)} />
        <KpiCard label="Salary Pending" value={pendingSalary} sub="workers"
        />
      </div>
      <div
        id="workers-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, }}
      >
        {workers.map((worker, index) => (
          <Card
            key={worker.id}
            {...workersGridFocus.getItemProps(index)}
            role="button"
            aria-label={`${worker.name} worker card`}
            style={{
              cursor: worker.paid
                ? "default"
                : "pointer",
            }}
          >
            <CardBody>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                  }}
                >
                  <Avatar
                    name={worker.name}
                    size={38}
                  />

                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13.5,
                      }}
                    >
                      {worker.name}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-40)",
                      }}
                    >
                      {worker.role || "Staff"}
                    </div>
                  </div>
                </div>

                <Badge
                  status={
                    worker.paid
                      ? "Paid"
                      : "Pending"
                  }
                />
              </div>

              <Button
                size="sm"
                variant="primary"
                tabIndex={-1}
                style={{
                  width: "100%",
                  justifyContent: "center",
                }}
                onClick={() => {
                  if (worker.paid) return

                  paySalary(worker.id)

                  toast(
                    `Salary paid to ${worker.name}`,
                    "success"
                  )
                }}
                disabled={worker.paid}
              >
                {worker.paid
                  ? "Paid"
                  : "Pay Salary"}
              </Button>

            </CardBody>
          </Card>
        ))}
      </div>

      {/* -------------------------------------------------- */}
      {/* Add Worker Modal */}
      {/* -------------------------------------------------- */}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Worker"
        width={480}
      >

        <Input
          label="Full Name *"
          value={form.name}
          onKeyDown={handleFormKeyDown(0)}
          ref={(element) => {
            formRefs.current[0] = element
          }}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />

        <FormGrid cols={2}>

          <Input
            label="Role / Designation"
            value={form.role}
            onKeyDown={handleFormKeyDown(1)}
            ref={(element) => {
              formRefs.current[1] = element
            }}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
          />

          <Input
            label="Phone"
            value={form.phone}
            onKeyDown={handleFormKeyDown(2)}
            ref={(element) => {
              formRefs.current[2] = element
            }}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
          />

        </FormGrid>

        <FormGrid cols={2}>

          <Input
            label="Monthly Salary (₹)"
            type="number"
            value={form.salary}
            onKeyDown={handleFormKeyDown(3)}
            ref={(element) => {
              formRefs.current[3] = element
            }}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                salary: event.target.value,
              }))
            }
          />

          <Input
            label="Join Date"
            type="date"
            value={form.join}
            onKeyDown={handleFormKeyDown(4)}
            ref={(element) => {
              formRefs.current[4] = element
            }}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                join: event.target.value,
              }))
            }
          />

        </FormGrid>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 2,
          }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
          >
            Save Worker
          </Button>
        </div>

      </Modal>
    </div>
  )
}
