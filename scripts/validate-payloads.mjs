import assert from "node:assert/strict"
import test from "node:test"
import {
  buildInvoicePayload,
  buildPurchasePayload,
  formatApiError,
  parseObjectId,
  purchaseMode,
  sanitizePartyPayload,
} from "../src/lib/documentPayload.js"

test("parseObjectId accepts only 24-char hex ids", () => {
  assert.equal(parseObjectId("64b1f2c3d4e5f6a7b8c9d0e1"), "64b1f2c3d4e5f6a7b8c9d0e1")
  assert.equal(parseObjectId("Supplier Name"), null)
  assert.equal(parseObjectId("abcdefghijkl"), null)
  assert.equal(parseObjectId(""), null)
  assert.equal(parseObjectId({ toHexString: () => "64b1f2c3d4e5f6a7b8c9d0e1" }), "64b1f2c3d4e5f6a7b8c9d0e1")
})

test("purchase payload does not require a legacy customer field", () => {
  const payload = buildPurchasePayload({
    supplierId: "64b1f2c3d4e5f6a7b8c9d0e1",
    supplier: "Acme Pharma",
    supplierSnapshot: { name: "Acme Pharma", phone: "999" },
    date: "2026-09-23",
    items: [{ desc: "Paracetamol", qty: 2, rate: 10, amount: 20 }],
    mode: "By Road",
  })

  assert.equal(payload.supplierIdValid, true)
  assert.equal(payload.supplierSnapshot.name, "Acme Pharma")
  assert.equal(payload.mode, "Credit")
  assert.equal("customer" in payload, false)
})

test("purchase payload can recover supplierId from legacy customer.partyId", () => {
  const payload = buildPurchasePayload({
    customer: {
      Party: "Acme Pharma",
      partyId: "64b1f2c3d4e5f6a7b8c9d0e1",
    },
    items: [{ desc: "Syrup", qty: 1, rate: 50, amount: 50 }],
  })

  assert.equal(payload.supplierId, "64b1f2c3d4e5f6a7b8c9d0e1")
  assert.equal(payload.supplierSnapshot.name, "Acme Pharma")
})

test("invoice payload requires a valid partyId", () => {
  const invalid = buildInvoicePayload({ party: "Walk-in", items: [{ desc: "Item", amount: 10 }] })
  assert.equal(invalid.partyIdValid, false)

  const valid = buildInvoicePayload({
    partyId: "64b1f2c3d4e5f6a7b8c9d0e1",
    party: "Walk-in",
    items: [{ desc: "Item", amount: 10 }],
  })
  assert.equal(valid.partyIdValid, true)
  assert.equal(valid.partySnapshot.name, "Walk-in")
})

test("party sanitizer fills required enums and drops empty ones", () => {
  const payload = sanitizePartyPayload({
    companyName: "Gupta Traders",
    partyCode: "P-1",
    partyType: "",
    accountGroup: "",
    paymentTerm: "",
  })

  assert.equal(payload.partyType, "Customer")
  assert.equal(payload.accountGroup, "Sundry Debtors")
  assert.equal(payload.currency, "INR")
  assert.equal(payload.paymentTerm, undefined)
})

test("purchaseMode falls back for unknown transport values", () => {
  assert.equal(purchaseMode("UPI"), "UPI")
  assert.equal(purchaseMode("Road"), "Credit")
})

test("formatApiError flattens mongoose validation errors", () => {
  const error = {
    name: "ValidationError",
    message: "Purchase validation failed: customer: Path `customer` is required.",
    errors: {
      customer: { path: "customer", message: "Path `customer` is required." },
    },
  }

  assert.equal(formatApiError(error), "Path `customer` is required.")
})
