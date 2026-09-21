import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/dbconnect";
import Invoice from "@/models/salesModel";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await req.json();

    const paymentAmount = Number(body.paymentAmount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found",
        },
        { status: 404 }
      );
    }

    const currentPaid = Number(invoice.paid || 0);
    const total = Number(invoice.total || 0);

    const newPaid = currentPaid + paymentAmount;

    if (newPaid > total) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment amount cannot exceed invoice total",
        },
        { status: 400 }
      );
    }

    let status: "Pending" | "Partial" | "Paid";

    if (newPaid >= total) {
      status = "Paid";
    } else if (newPaid > 0) {
      status = "Partial";
    } else {
      status = "Pending";
    }

    invoice.paid = newPaid;
    invoice.status = status;

    await invoice.save();

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("PATCH /api/newInvoice/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to record payment",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const deletedInvoice = await Invoice.findByIdAndDelete(id);

    if (!deletedInvoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
      data: deletedInvoice,
    });
  } catch (error) {
    console.error("DELETE /api/newInvoice/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete invoice",
      },
      { status: 500 }
    );
  }
}