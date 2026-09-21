import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/dbconnect";
import Invoice from "@/models/salesModel";
import InvoiceCounter from "@/models/InvoiceCounter";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice data was not provided",
        },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();

    const counter = await InvoiceCounter.findOneAndUpdate(
      {
        key: `invoice-${year}`,
      },
      {
        $inc: {
          seq: 1,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const invoiceNumber =
      `INV-${year}-${String(counter.seq).padStart(4, "0")}`;

    const result = await Invoice.create({
      ...data,
      invoiceNumber,
    });

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully",
      data: result,
    });

  } catch (error) {
    console.error("INVOICE CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create invoice",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const invoices = await Invoice
      .find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("GET /api/newInvoice error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch invoices",
      },
      { status: 500 }
    );
  }
}
