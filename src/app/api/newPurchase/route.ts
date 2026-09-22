import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/dbconnect";
import {Purchase} from "@/models/purchaseModel";
import PurchaseCounter from "@/models/PurchaseCounter";

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

    const counter = await PurchaseCounter.findOneAndUpdate(
      {
        key: `Purchse-${year}`,
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

    const billNo =
      `PO-${year}-${String(counter.seq).padStart(4, "0")}`;

    const result = await Purchase.create({
      ...data,
      billNo,
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

    const invoices = await Purchase
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
