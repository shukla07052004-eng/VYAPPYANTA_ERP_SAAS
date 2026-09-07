"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext.jsx";
import { useEscapeAction } from "@/context/EscapeContext.jsx";
import { Button, Card, CardBody, CardHead, FormGrid, Input, KpiCard, PageHeader, Select } from "@/components/frontendUi/index.js";
import { ReportTableCard } from "@/components/reports/ReportLayout.jsx";
import {
  buildBillsFromErp,
  exportToCSV,
  filterBills,
  fmtDate,
  fmtPct,
  fmtRs,
  generatePDFText,
  getPartyOptions,
  processBills,
} from "@/utils/billProfitHelpers.js";

type BillItem = {
  productName: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  gstPercentage?: number;
  itemProfit: number;
  mrpVsSelling: number;
  itemMarginPct: number;
};

type EnrichedBill = {
  billNo: string;
  date: string;
  partyName: string;
  totalAmount: number;
  discount: number;
  items: BillItem[];
  grossProfit: number;
  netProfit: number;
  marginPct: number;
  taxableRevenue: number;
};

type BillSummary = {
  totalRevenue: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  totalDiscount: number;
  avgMarginPct: number;
  billCount: number;
};

type LineRow = {
  id: string;
  billNo: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  itemProfit: number;
  itemMarginPct: number;
};

const REPORTS_LAST_CARD_KEY = "reports-last-card";
const REPORTS_RESTORE_FOCUS_KEY = "reports-restore-focus";

function downloadTextReport(enrichedBills: EnrichedBill[], summary: BillSummary) {
  const blob = new Blob([generatePDFText(enrichedBills, summary)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `BillWiseProfitReport_${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BillwiseProfitReport() {
  const router = useRouter();
  const { invoices, purchases, itemMaster } = useApp();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [party, setParty] = useState("All");
  const [product, setProduct] = useState("All");
  const [search, setSearch] = useState("");

  const bills = useMemo(
    () => buildBillsFromErp({ invoices, purchases, itemMaster }) as EnrichedBill[],
    [invoices, itemMaster, purchases],
  );

  const partyOptions = useMemo(() => getPartyOptions(bills) as string[], [bills]);
  const productOptions = useMemo(() => {
    const names = new Set<string>();
    bills.forEach((bill) => bill.items.forEach((item) => names.add(item.productName)));
    return ["All", ...Array.from(names).sort()];
  }, [bills]);

  const filteredBills = useMemo(() => {
    const datePartyBills = filterBills(bills, { fromDate, toDate, party, search }) as EnrichedBill[];
    if (product === "All") return datePartyBills;
    return datePartyBills
      .map((bill) => ({ ...bill, items: bill.items.filter((item) => item.productName === product) }))
      .filter((bill) => bill.items.length > 0);
  }, [bills, fromDate, party, product, search, toDate]);

  const { enriched, summary } = useMemo(
    () => processBills(filteredBills) as { enriched: EnrichedBill[]; summary: BillSummary },
    [filteredBills],
  );

  const lineRows = useMemo<LineRow[]>(() => (
    enriched.flatMap((bill) => bill.items.map((item, index) => ({
      id: `${bill.billNo}-${index}`,
      billNo: bill.billNo,
      productName: item.productName,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      itemProfit: item.itemProfit,
      itemMarginPct: item.itemMarginPct,
    })))
  ), [enriched]);

  const goBack = () => {
    sessionStorage.setItem(REPORTS_LAST_CARD_KEY, "billwise");
    sessionStorage.setItem(REPORTS_RESTORE_FOCUS_KEY, "true");
    router.push("/reports");
  };

  useEscapeAction({
    active: true,
    priority: 50,
    handler: () => {
      goBack();
      return true;
    },
  });

  return (
    <div className="animate-slide">
      <PageHeader
        title="Bill-wise Profit"
        sub="Invoice-level profit with product cost, discount, and margin detail."
        right={
          <>
            <Button variant="ghost" onClick={() => exportToCSV(enriched)}>Download Excel</Button>
            <Button variant="primary" onClick={() => downloadTextReport(enriched, summary)}>Download PDF</Button>
            <Button variant="ghost" onClick={goBack}>Back to Reports</Button>
          </>
        }
      />

      <Card style={{ marginBottom: 18, top: 0, zIndex: 3 }}>
        <CardHead title="Filters" sub="Filter by date, party, product, or bill number." />
        <CardBody style={{ display: "grid", gap: 14 }}>
          <FormGrid cols={5}>
            <Input label="Start Date" type="date" value={fromDate} onChange={(event: ChangeEvent<HTMLInputElement>) => setFromDate(event.target.value)} />
            <Input label="End Date" type="date" value={toDate} onChange={(event: ChangeEvent<HTMLInputElement>) => setToDate(event.target.value)} />
            <Select label="Party" value={party} onChange={(event: ChangeEvent<HTMLSelectElement>) => setParty(event.target.value)} options={partyOptions} />
            <Select label="Product" value={product} onChange={(event: ChangeEvent<HTMLSelectElement>) => setProduct(event.target.value)} options={productOptions} />
            <Input label="Bill No" value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Search invoice" />
          </FormGrid>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <Button
              variant="ghost"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setParty("All");
                setProduct("All");
                setSearch("");
              }}
            >
              Clear
            </Button>
            <Button variant="primary">Search</Button>
          </div>
        </CardBody>
      </Card>

      <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <KpiCard label="Bills" value={summary.billCount} sub="Filtered invoices" />
        <KpiCard label="Total Revenue" value={fmtRs(summary.totalRevenue)} sub="Invoice total" />
        <KpiCard label="Net Profit" value={fmtRs(summary.totalNetProfit)} sub={`Gross ${fmtRs(summary.totalGrossProfit)}`} />
        <KpiCard label="Average Margin" value={fmtPct(summary.avgMarginPct)} sub={`Discount ${fmtRs(summary.totalDiscount)}`} />
      </div>

      <ReportTableCard
        title="Bill Summary"
        sub="Profit earned on each sales invoice."
        focusId="report-billwise-profit"
        cols={[
          { key: "billNo", label: "Bill No", mono: true },
          { key: "date", label: "Date", dim: true, render: (value: string) => fmtDate(value) },
          { key: "partyName", label: "Party" },
          { key: "totalAmount", label: "Sales Amount", right: true, render: (value: number) => fmtRs(value) },
          { key: "grossProfit", label: "Gross Profit", right: true, render: (value: number) => fmtRs(value) },
          { key: "netProfit", label: "Net Profit", right: true, render: (value: number) => <strong style={{ color: value >= 0 ? "var(--green)" : "var(--red)" }}>{fmtRs(value)}</strong> },
          { key: "marginPct", label: "Profit %", right: true, render: (value: number) => fmtPct(value) },
        ]}
        rows={enriched}
        emptyMsg="No bill-wise profit rows match the current filters."
      />

      <ReportTableCard
        title="Product Cost Detail"
        sub="Line-item purchase cost, selling price and margin."
        focusId="report-billwise-profit-lines"
        cols={[
          { key: "billNo", label: "Bill No", mono: true },
          { key: "productName", label: "Product", wrap: true },
          { key: "quantity", label: "Qty", right: true },
          { key: "purchasePrice", label: "Purchase Price", right: true, render: (value: number) => fmtRs(value) },
          { key: "sellingPrice", label: "Selling Price", right: true, render: (value: number) => fmtRs(value) },
          { key: "itemProfit", label: "Profit", right: true, render: (value: number) => <strong style={{ color: value >= 0 ? "var(--green)" : "var(--red)" }}>{fmtRs(value)}</strong> },
          { key: "itemMarginPct", label: "Margin", right: true, render: (value: number) => fmtPct(value) },
        ]}
        rows={lineRows}
        emptyMsg="No product rows match the current filters."
      />
    </div>
  );
}
